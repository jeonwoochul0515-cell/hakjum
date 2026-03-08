// 커리어넷 심리검사 결과 제출 API 프록시
// POST /api/career/aptitude-report

interface Env {
  CAREER_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.CAREER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Career API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.json() as Record<string, unknown>;

    // apikey를 서버에서 주입
    const payload = {
      ...body,
      apikey: apiKey,
    };

    const response = await fetch('https://www.career.go.kr/inspct/openapi/test/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `CareerNet API error: ${response.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to submit to CareerNet' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
