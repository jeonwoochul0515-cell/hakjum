interface Env {
  CAREER_API_KEY: string;
}

// 커리어넷 학과 종합정보 API 프록시
// GET /api/career/major-full?id=학과코드
// gubun=univ_list + gubun=job_list 를 병렬 호출하여 병합 반환
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

  const baseParams = {
    apiKey,
    svcType: 'api',
    svcCode: 'MAJOR_VIEW',
    contentType: 'json',
    majorSeq: majorId,
  };

  const univUrl = `https://www.career.go.kr/cnet/openapi/getOpenApi.json?${new URLSearchParams({ ...baseParams, gubun: 'univ_list' })}`;
  const jobUrl = `https://www.career.go.kr/cnet/openapi/getOpenApi.json?${new URLSearchParams({ ...baseParams, gubun: 'job_list' })}`;

  try {
    const [univRes, jobRes] = await Promise.all([fetch(univUrl), fetch(jobUrl)]);

    if (!univRes.ok || !jobRes.ok) {
      return new Response(JSON.stringify({ error: `CareerNet API error: univ=${univRes.status}, job=${jobRes.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [univData, jobData] = await Promise.all([univRes.json(), jobRes.json()]);

    return new Response(JSON.stringify({ univ: univData, job: jobData }), {
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
