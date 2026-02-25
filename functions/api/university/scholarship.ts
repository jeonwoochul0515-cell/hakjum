interface Env {
  DATA_GO_KR_API_KEY: string;
}

// 공공데이터 표준 #159 대학별장학금정보
// GET /api/university/scholarship?school=학교명
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DATA_GO_KR_API_KEY not configured', items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(context.request.url);
  const schoolName = url.searchParams.get('school') || '';

  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: '1',
    numOfRows: '1000',
    type: 'json',
  });

  if (schoolName) params.set('univNm', schoolName);

  const apiUrl = `http://api.data.go.kr/openapi/tn_pubr_public_univ_schlship_amt_api?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `data.go.kr API error: ${response.status}`, items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const items = data?.response?.body?.items || [];

    return new Response(JSON.stringify({ items }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch scholarship data', items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
