interface Env {
  DATA_GO_KR_API_KEY: string;
}

// data.go.kr 응답에서 items 배열 추출 (두 가지 형식 모두 처리)
function extractItems(data: unknown): Record<string, unknown>[] {
  const body = (data as any)?.response?.body;
  if (!body) return [];

  const items = body.items;
  if (!items) return [];

  if (Array.isArray(items)) return items;
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

  // serviceKey는 URLSearchParams에 넣으면 이중 인코딩됨 → 직접 URL에 붙임
  const params = new URLSearchParams({
    pageNo: '1',
    numOfRows,
    type: 'json',
  });

  if (majorName) params.set('scsbjtNm', majorName);
  if (schoolName) params.set('schlNm', schoolName);

  // apiKey가 이미 URL-encoded 형태일 수 있으므로 그대로 전달
  const apiUrl = `http://api.data.go.kr/openapi/tn_pubr_public_univ_major_api?serviceKey=${apiKey}&${params}`;

  try {
    // data.go.kr HTTP API는 간헐적 520/522 오류 발생 → 최대 2회 재시도
    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(apiUrl);
      if (response.ok) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
    if (!response || !response.ok) {
      return new Response(JSON.stringify({ error: `data.go.kr API error: ${response?.status}`, items: [] }), {
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
