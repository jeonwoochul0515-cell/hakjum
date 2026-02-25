interface Env {
  ACADEMYINFO_API_KEY: string;
}

// 대학알리미 API 프록시
// GET /api/university/info?type=employment|tuition|scholarship|competition&school=학교명
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.ACADEMYINFO_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ACADEMYINFO_API_KEY not configured', items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'employment';
  const schoolName = url.searchParams.get('school') || '';

  const BASE = 'http://openapi.academyinfo.go.kr/openapi/service/rest';

  const operationMap: Record<string, { service: string; operation: string }> = {
    employment: {
      service: 'StudentService',
      operation: 'getComparisonGraduateEmployment',
    },
    competition: {
      service: 'StudentService',
      operation: 'getComparisonFreshmanCompetitionRatio',
    },
    dropout: {
      service: 'StudentService',
      operation: 'getComparisonDropoutRate',
    },
    tuition: {
      service: 'FinancesService',
      operation: 'getComparisonTuitionCrntSt',
    },
    scholarship: {
      service: 'FinancesService',
      operation: 'getComparisonScholarshipStatus',
    },
    educost: {
      service: 'FinancesService',
      operation: 'getComparisonPerStudentEducationCost',
    },
  };

  const op = operationMap[type];
  if (!op) {
    return new Response(JSON.stringify({ error: `Unknown type: ${type}`, items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const params = new URLSearchParams({
    serviceKey: apiKey,
    svyYr: String(new Date().getFullYear() - 1),
    numOfRows: '100',
    pageNo: '1',
    type: 'json',
  });

  if (schoolName) params.set('schlKrnNm', schoolName);

  const apiUrl = `${BASE}/${op.service}/${op.operation}?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `academyinfo API error: ${response.status}`, items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const body = data?.response?.body;
    const rawItems = body?.items?.item;

    // API 응답이 단건이면 배열로 래핑
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return new Response(JSON.stringify({ items, totalCount: body?.totalCount || 0 }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch from academyinfo', items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
