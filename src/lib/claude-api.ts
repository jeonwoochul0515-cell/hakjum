import type { RecommendationResult } from '@/types';

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
  const text = data.content?.[0]?.text || '';

  if (!text) {
    console.error('[callClaudeAPI] Empty response text:', JSON.stringify(data));
    throw new Error('Empty response');
  }

  // Extract JSON — handle markdown code blocks (```json ... ```)
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[callClaudeAPI] No JSON found in response:', text.slice(0, 500));
    throw new Error('Invalid response format');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, source: 'ai' as const };
  } catch (e) {
    console.error('[callClaudeAPI] JSON parse error:', e, '\nRaw:', jsonMatch[0].slice(0, 500));
    throw new Error('JSON parse failed');
  }
}
