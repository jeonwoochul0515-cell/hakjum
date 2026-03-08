// 커리어넷 심리검사 문항 조회 API 프록시
// GET /api/career/aptitude-questions?q=31

interface Env {
  CAREER_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.CAREER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Career API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(context.request.url);
  const testCode = url.searchParams.get('q') || '31'; // 기본값: 직업흥미검사 K형 (고등학생)

  const apiUrl = `https://www.career.go.kr/inspct/openapi/test/questions?apikey=${apiKey}&q=${testCode}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `CareerNet API error: ${response.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // 1일 캐시 (문항은 고정)
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch from CareerNet' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
