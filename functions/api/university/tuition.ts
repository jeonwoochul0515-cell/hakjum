interface Env {
  DATA_GO_KR_API_KEY: string;
}

function extractItems(data: unknown): Record<string, unknown>[] {
  const body = (data as any)?.response?.body;
  if (!body) return [];
  const items = body.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (items.item) return Array.isArray(items.item) ? items.item : [items.item];
  return [];
}

// 공공데이터 표준 #158 대학별평균등록금정보
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

  const apiUrl = `http://api.data.go.kr/openapi/tn_pubr_public_univ_reg_amt_api?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `data.go.kr API error: ${response.status}`, items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: 'Non-JSON response', rawSnippet: raw.slice(0, 300), items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const header = (data as any)?.response?.header;
    if (header?.resultCode && header.resultCode !== '00') {
      return new Response(JSON.stringify({ error: header.resultMsg || 'API error', resultCode: header.resultCode, items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const items = extractItems(data);

    return new Response(JSON.stringify({ items }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tuition data', details: String(err), items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
