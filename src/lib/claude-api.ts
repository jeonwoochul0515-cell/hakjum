import type { RecommendationResult } from '@/types';

/**
 * Fix common JSON issues from LLM output:
 * - trailing commas before } or ]
 * - truncated response → attempt to close open brackets
 */
function repairJSON(raw: string): string {
  // Remove trailing commas before closing brackets
  let s = raw.replace(/,\s*([}\]])/g, '$1');

  // Check if brackets are balanced; if not, try to close them
  const opens: string[] = [];
  for (const ch of s) {
    if (ch === '{' || ch === '[') opens.push(ch);
    else if (ch === '}' || ch === ']') opens.pop();
  }
  // Close any unclosed brackets in reverse order
  while (opens.length > 0) {
    const o = opens.pop();
    s += o === '{' ? '}' : ']';
  }

  return s;
}

export async function callClaudeAPI(prompt: string): Promise<RecommendationResult> {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('[callClaudeAPI] API error:', response.status, errorText);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text || '';
  const stopReason: string = data.stop_reason || '';

  if (!text) {
    console.error('[callClaudeAPI] Empty response text:', JSON.stringify(data));
    throw new Error('Empty response');
  }

  if (stopReason === 'max_tokens') {
    console.warn('[callClaudeAPI] Response was truncated (max_tokens reached)');
  }

  // Extract JSON — handle markdown code blocks (```json ... ```)
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[callClaudeAPI] No JSON found in response:', text.slice(0, 500));
    throw new Error('Invalid response format');
  }

  // Try direct parse first, then repaired parse
  let raw = jsonMatch[0];
  try {
    const parsed = JSON.parse(raw);
    return { ...parsed, source: 'ai' as const };
  } catch {
    // Try repair
  }

  try {
    raw = repairJSON(raw);
    const parsed = JSON.parse(raw);
    console.warn('[callClaudeAPI] JSON was repaired before parsing');
    return { ...parsed, source: 'ai' as const };
  } catch (e) {
    console.error('[callClaudeAPI] JSON parse error after repair:', e, '\nRaw (first 800):', raw.slice(0, 800));
    throw new Error('JSON parse failed');
  }
}
