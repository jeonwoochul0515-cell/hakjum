interface Env {
  CAREER_API_KEY: string;
}

// 커리어넷 학과 상세정보 API 프록시
// GET /api/career/major-detail?id=학과코드
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.CAREER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Career API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(context.request.url);
  const majorId = url.searchParams.get('id') || '';

  if (!majorId) {
    return new Response(JSON.stringify({ error: 'id parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const params = new URLSearchParams({
    apiKey,
    svcType: 'api',
    svcCode: 'MAJOR_VIEW',
    contentType: 'json',
    majorSeq: majorId,
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
        'Cache-Control': 'public, max-age=604800',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch from CareerNet' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
