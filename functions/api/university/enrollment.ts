interface Env {
  DATA_GO_KR_API_KEY: string;
}

// data.go.kr 응답에서 items 배열 추출 (두 가지 형식 모두 처리)
// 형식1: response.body.items = [ ... ]
// 형식2: response.body.items = { item: [ ... ] } 또는 { item: { ... } }
function extractItems(data: unknown): Record<string, unknown>[] {
  const body = (data as any)?.response?.body;
  if (!body) return [];

  const items = body.items;
  if (!items) return [];

  // 형식1: items가 배열
  if (Array.isArray(items)) return items;

  // 형식2: items.item이 배열
  if (items.item) {
    return Array.isArray(items.item) ? items.item : [items.item];
  }

  return [];
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
  const numOfRows = url.searchParams.get('limit') || '500';

  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: '1',
    numOfRows,
    type: 'json',
  });

  if (majorName) params.set('scsbjtNm', majorName);
  if (schoolName) params.set('schlNm', schoolName);

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
    const items = extractItems(data);

    return new Response(JSON.stringify({ items, totalCount: (data as any)?.response?.body?.totalCount }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch enrollment data', details: String(err), items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
