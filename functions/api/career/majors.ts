interface Env {
  CAREER_API_KEY: string;
}

// 커리어넷 대학학과정보 API 프록시
// GET /api/career/majors?q=컴퓨터&category=공학계열
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.CAREER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Career API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(context.request.url);
  const query = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || '';

  const params = new URLSearchParams({
    apiKey,
    svcType: 'api',
    svcCode: 'MAJOR',
    contentType: 'json',
    gubun: 'univ_list',
    subject: category || '전체',
    searchTitle: query,
    perPage: '20',
  });

  const careerUrl = `https://www.career.go.kr/cnet/openapi/getOpenApi.json?${params}`;

  try {
    const response = await fetch(careerUrl);
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
        'Cache-Control': 'public, max-age=604800', // 7일 캐시
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch from CareerNet' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
