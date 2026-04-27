/**
 * 학교 교육과정 운영계획서 PDF 텍스트 → 개설 과목 JSON 추출
 *
 * 입력: { schoolName: string, pdfText: string }
 * 출력: { subjects: ExtractedSubject[], _meta: { source, syncedAt, schoolName, model } }
 *
 * Claude Haiku 4.5로 PDF 원문 텍스트에서 학과별 개설/미개설 과목을 구조화하여 추출.
 * 기존 functions/api/recommend.ts 패턴을 그대로 따름.
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ExtractedSubject {
  name: string;
  area: string; // 교과 영역 (공통/일반선택/진로선택/전문교과 또는 자유 문자열)
  grade: number | null; // 1, 2, 3 또는 null(미정)
  semester: number | null; // 1, 2 또는 null
  status: '개설' | '미개설';
}

const MODEL_ID = 'claude-haiku-4-5-20251001';
const MAX_TEXT_LEN = 60_000; // Claude 입력 컨텍스트 보호용 상한 (원문 너무 길 때 잘라냄)

const SYSTEM_PROMPT = `반드시 유효한 JSON만 출력하세요. 마크다운, 설명, 주석 없이 순수 JSON 객체 하나만 반환합니다.`;

function buildUserPrompt(schoolName: string, pdfText: string): string {
  const trimmed =
    pdfText.length > MAX_TEXT_LEN
      ? pdfText.slice(0, MAX_TEXT_LEN) + '\n\n[... 이하 생략 ...]'
      : pdfText;

  return `당신은 한국 고등학교의 "교육과정 운영계획서" PDF에서 개설 과목을 추출하는 전문가입니다.

학교명: ${schoolName}

다음은 해당 학교가 학생/학부모에게 배포한 교육과정 운영계획서 PDF에서 추출한 원문 텍스트입니다.
이 텍스트에서 학교가 실제로 개설(또는 미개설)한 과목 목록을 정확하게 추출하여 JSON으로 반환하세요.

원문 텍스트:
"""
${trimmed}
"""

추출 규칙:
1. 결과는 반드시 다음 형태의 JSON 객체 하나만 출력합니다:
   { "subjects": [ { "name": "...", "area": "...", "grade": <1|2|3|null>, "semester": <1|2|null>, "status": "개설"|"미개설" } ] }
2. "name"은 과목 정식 명칭(예: "미적분Ⅰ", "물리학", "사회·문화"). 띄어쓰기/로마숫자 표기는 PDF에 적힌 그대로 유지.
3. "area"는 교과 영역. 가능한 값: "공통과목", "일반선택", "진로선택", "융합선택", "전문교과", "기타". 표 헤더/문맥에서 판단하고 모호하면 "기타".
4. "grade"는 1·2·3학년 중 해당 학년(숫자). 학년이 명시되지 않았으면 null.
5. "semester"는 1·2학기 중 해당 학기(숫자). 학기 정보가 없으면 null.
6. "status"는 "개설"이 기본값. PDF에서 명시적으로 "미개설", "폐강", "운영하지 않음" 등으로 표시된 과목만 "미개설".
7. 동일 과목이 여러 학년/학기에 걸쳐 운영되면 각 행을 별도 항목으로 분리합니다.
8. 체육·예술·창의적 체험활동/자율활동은 제외하지 않되, 일반 교과로 명시되지 않은 진로활동·동아리활동은 제외합니다.
9. PDF에서 추출되지 않거나 추측이 필요한 정보는 만들어내지 마세요. 확실한 항목만 포함합니다.
10. 결과 배열이 비어 있으면 { "subjects": [] }로 반환합니다.

JSON만 출력하세요.`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let body: { schoolName?: string; pdfText?: string };
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const schoolName = (body.schoolName ?? '').trim();
  const pdfText = (body.pdfText ?? '').trim();

  if (!schoolName) {
    return new Response(JSON.stringify({ error: 'Missing schoolName' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  if (!pdfText || pdfText.length < 50) {
    return new Response(
      JSON.stringify({ error: 'pdfText is empty or too short to analyze' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  const requestBody = JSON.stringify({
    model: MODEL_ID,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(schoolName, pdfText) }],
  });

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  // 529 과부하 시 최대 2회 재시도 (recommend.ts 와 동일 패턴)
  let lastError = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: requestBody,
    });

    if (response.status === 529 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }

    if (!response.ok) {
      lastError = await response.text();
      return new Response(
        JSON.stringify({
          error: `Anthropic API error: ${response.status}`,
          details: lastError,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const data = (await response.json()) as {
      content?: { text?: string }[];
      stop_reason?: string;
    };
    const text = data.content?.[0]?.text ?? '';

    // ── JSON 파싱 (마크다운 코드블록 제거 + 객체 1개 추출) ──
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    let subjects: ExtractedSubject[] = [];
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { subjects?: unknown };
        if (Array.isArray(parsed.subjects)) {
          subjects = parsed.subjects
            .map((s) => normalizeSubject(s))
            .filter((s): s is ExtractedSubject => s !== null);
        }
      } catch {
        // 파싱 실패 시 빈 배열 유지
      }
    }

    const responseBody = {
      subjects,
      _meta: {
        source: 'hakjum-ai-pdf-extract',
        syncedAt: new Date().toISOString(),
        schoolName,
        model: MODEL_ID,
        rawTextLength: pdfText.length,
        truncated: pdfText.length > MAX_TEXT_LEN,
        stopReason: data.stop_reason ?? null,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response(
    JSON.stringify({ error: 'API overloaded after retries', details: lastError }),
    { status: 529, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
  );
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

// ── Helpers ──
function normalizeSubject(raw: unknown): ExtractedSubject | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (!name) return null;
  const area = typeof obj.area === 'string' && obj.area.trim() ? obj.area.trim() : '기타';
  const grade = toIntOrNull(obj.grade);
  const semester = toIntOrNull(obj.semester);
  const status: '개설' | '미개설' = obj.status === '미개설' ? '미개설' : '개설';
  return { name, area, grade, semester, status };
}

function toIntOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
