// NEIS 학교급식 식단(mealServiceDietInfo) 프록시
// GET /api/neis/meal?atptOfcdcSCCode=B10&schulCode=7010536&fromYmd=20260427&toYmd=20260503
//
// NEIS 공식 hub: https://open.neis.go.kr/hub/mealServiceDietInfo
// 응답 스펙:
//   { meals: [{ date, type, dishes, calorie, nutrients, origin }], _meta }
//
// MMEAL_SC_CODE: 1=조식, 2=중식, 3=석식

interface Env {
  NEIS_API_KEY?: string;
}

interface Meal {
  /** YYYY-MM-DD */
  date: string;
  /** 식사 종류: 조식/중식/석식 */
  type: '조식' | '중식' | '석식' | string;
  /** 식단 (HTML <br/> 제거 후 줄단위 배열) */
  dishes: string[];
  /** 칼로리 정보 (예: '885.4 Kcal') */
  calorie?: string;
  /** 영양정보 원문 */
  nutrients?: string;
  /** 원산지 정보 원문 */
  origin?: string;
}

const MEAL_TYPES: Record<string, Meal['type']> = { '1': '조식', '2': '중식', '3': '석식' };

function fmtDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// NEIS DDISH_NM 형식: "찰현미밥<br/>들깨미역국<br/>..." + 알레르기 마커 (예: "1.5.")
function parseDishes(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/<br\s*\/?>/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const atptOfcdcSCCode = url.searchParams.get('atptOfcdcSCCode') || url.searchParams.get('regionCode') || '';
  const schulCode = url.searchParams.get('schulCode') || url.searchParams.get('schoolCode') || '';
  const fromYmd = (url.searchParams.get('fromYmd') || '').replace(/-/g, '');
  const toYmd = (url.searchParams.get('toYmd') || '').replace(/-/g, '');
  const ymd = (url.searchParams.get('ymd') || '').replace(/-/g, '');
  const mealCode = url.searchParams.get('mealCode') || '';

  if (!atptOfcdcSCCode || !schulCode) {
    return new Response(
      JSON.stringify({ error: 'atptOfcdcSCCode and schulCode are required', meals: [] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const apiKey = context.env.NEIS_API_KEY || '';

  const params = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '500',
    ATPT_OFCDC_SC_CODE: atptOfcdcSCCode,
    SD_SCHUL_CODE: schulCode,
  });
  if (apiKey) params.set('KEY', apiKey);
  if (ymd) params.set('MLSV_YMD', ymd);
  if (fromYmd) params.set('MLSV_FROM_YMD', fromYmd);
  if (toYmd) params.set('MLSV_TO_YMD', toYmd);
  if (mealCode) params.set('MMEAL_SC_CODE', mealCode);

  const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `NEIS API error: ${response.status}`, meals: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = (await response.json()) as any;

    if (data?.RESULT) {
      return new Response(
        JSON.stringify({
          meals: [],
          totalCount: 0,
          message: data.RESULT.MESSAGE,
          code: data.RESULT.CODE,
          _meta: buildMeta({ atptOfcdcSCCode, schulCode, fromYmd, toYmd, totalCount: 0 }),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const ms = data?.mealServiceDietInfo;
    if (!ms || ms.length < 2) {
      return new Response(
        JSON.stringify({
          meals: [],
          totalCount: 0,
          _meta: buildMeta({ atptOfcdcSCCode, schulCode, fromYmd, toYmd, totalCount: 0 }),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    const totalCount: number = ms[0]?.head?.[0]?.list_total_count || 0;
    const rows: any[] = ms[1]?.row || [];

    const meals: Meal[] = rows
      .map((r) => {
        const ymdStr = (r.MLSV_YMD || '').toString();
        if (!ymdStr) return null;
        const meal: Meal = {
          date: fmtDate(ymdStr),
          type: MEAL_TYPES[(r.MMEAL_SC_CODE || '').toString()] || (r.MMEAL_SC_NM || '식사'),
          dishes: parseDishes((r.DDISH_NM || '').toString()),
        };
        if (r.CAL_INFO) meal.calorie = r.CAL_INFO;
        if (r.NTR_INFO) meal.nutrients = r.NTR_INFO;
        if (r.ORPLC_INFO) meal.origin = r.ORPLC_INFO;
        return meal;
      })
      .filter((m): m is Meal => m !== null)
      .sort((a, b) => (a.date === b.date ? a.type.localeCompare(b.type) : a.date.localeCompare(b.date)));

    const body = {
      meals,
      totalCount,
      _meta: buildMeta({ atptOfcdcSCCode, schulCode, fromYmd, toYmd, totalCount }),
    };

    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err), meals: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

function buildMeta(opts: {
  atptOfcdcSCCode: string;
  schulCode: string;
  fromYmd: string;
  toYmd: string;
  totalCount: number;
}) {
  return {
    source: 'NEIS_OpenAPI',
    apiId: 'open.neis.go.kr/hub/mealServiceDietInfo',
    license: '교육부 NEIS Open API 이용약관',
    organization: '한국교육학술정보원(KERIS) / 교육부',
    upstreamUrl: 'https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN17220190722180924242823',
    syncedAt: new Date().toISOString(),
    request: {
      atptOfcdcSCCode: opts.atptOfcdcSCCode,
      schulCode: opts.schulCode,
      fromYmd: opts.fromYmd || null,
      toYmd: opts.toYmd || null,
    },
    totalCount: opts.totalCount,
  };
}
