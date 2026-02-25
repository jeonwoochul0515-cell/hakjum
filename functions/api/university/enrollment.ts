interface Env {
  DATA_GO_KR_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DATA_GO_KR_API_KEY not configured', items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(context.request.url);
  const majorName = url.searchParams.get('major') || '';
  const schoolName = url.searchParams.get('school') || '';
  const numOfRows = url.searchParams.get('limit') || '100';

  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: '1',
    numOfRows,
    type: 'json',
  });

  if (majorName) params.set('SBJT_NM', majorName);
  if (schoolName) params.set('SCHL_NM', schoolName);

  const apiUrl = `http://api.data.go.kr/openapi/tn_pubr_public_univ_major_api?${params}`;

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
        'Cache-Control': 'public, max-age=86400', // 1 day cache
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch enrollment data', items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
