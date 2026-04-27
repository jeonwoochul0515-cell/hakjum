// NEIS 방과후학교 시간표(afsclTimetable) 프록시
// GET /api/neis/after-school?atptOfcdcSCCode=B10&schulCode=7010536&ay=2026&sem=1&grade=1
//
// NEIS 공식 hub: https://open.neis.go.kr/hub/afsclTimetable  (고/중/초 공통 사용)
//   ※ NEIS Open API 데이터셋 목록상 "방과후학교 시간표 정보" 서비스로 등록되어 있음.
//   ※ 일부 학교/학기는 비공개이거나 미입력일 수 있음 → INFO-200으로 빈 결과 반환됨.
//
// TODO: 만약 NEIS가 향후 별도의 "방과후학교 운영(개설) 정보" 데이터셋을 신설하면
//       그 hub 명칭으로 교체하거나 신규 endpoint를 추가하기. 현재 공개된 NEIS 서비스
//       카탈로그(2026년 04월 기준)에는 "운영" 데이터셋이 없고 시간표 데이터만 제공됨.
//
// 응답 스펙:
//   { lessons: [{ date, period, subject, teacher, grade, classNm }], _meta }

interface Env {
  NEIS_API_KEY?: string;
}

interface AfterSchoolLesson {
  /** YYYY-MM-DD */
  date: string;
  /** 교시 */
  period: number;
  /** 강좌명 (ITRT_CNTNT) */
  subject: string;
  /** 학년 (DGHT_CRSE_SC_NM 또는 GRADE) */
  grade?: string;
  /** 학급/반 (CLASS_NM) */
  classNm?: string;
  /** 강좌실 등 부가 정보 */
  raw?: Record<string, string>;
}

function fmtDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const atptOfcdcSCCode = url.searchParams.get('atptOfcdcSCCode') || url.searchParams.get('regionCode') || '';
  const schulCode = url.searchParams.get('schulCode') || url.searchParams.get('schoolCode') || '';
  const ay = url.searchParams.get('ay') || url.searchParams.get('year') || '';
  const sem = url.searchParams.get('sem') || url.searchParams.get('semester') || '';
  const grade = url.searchParams.get('grade') || '';
  const fromYmd = (url.searchParams.get('fromYmd') || '').replace(/-/g, '');
  const toYmd = (url.searchParams.get('toYmd') || '').replace(/-/g, '');

  if (!atptOfcdcSCCode || !schulCode) {
    return new Response(
      JSON.stringify({ error: 'atptOfcdcSCCode and schulCode are required', lessons: [] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const apiKey = context.env.NEIS_API_KEY || '';

  const params = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '1000',
    ATPT_OFCDC_SC_CODE: atptOfcdcSCCode,
    SD_SCHUL_CODE: schulCode,
  });
  if (apiKey) params.set('KEY', apiKey);
  if (ay) params.set('AY', ay);
  if (sem) params.set('SEM', sem);
  if (grade) params.set('GRADE', grade);
  if (fromYmd) params.set('TI_FROM_YMD', fromYmd);
  if (toYmd) params.set('TI_TO_YMD', toYmd);

  const apiUrl = `https://open.neis.go.kr/hub/afsclTimetable?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `NEIS API error: ${response.status}`, lessons: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = (await response.json()) as any;

    if (data?.RESULT) {
      return new Response(
        JSON.stringify({
          lessons: [],
          totalCount: 0,
          message: data.RESULT.MESSAGE,
          code: data.RESULT.CODE,
          _meta: buildMeta({ atptOfcdcSCCode, schulCode, ay, sem, grade, totalCount: 0 }),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const tt = data?.afsclTimetable;
    if (!tt || tt.length < 2) {
      return new Response(
        JSON.stringify({
          lessons: [],
          totalCount: 0,
          _meta: buildMeta({ atptOfcdcSCCode, schulCode, ay, sem, grade, totalCount: 0 }),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    const totalCount: number = tt[0]?.head?.[0]?.list_total_count || 0;
    const rows: any[] = tt[1]?.row || [];

    const lessons: AfterSchoolLesson[] = rows
      .map((r) => {
        const ymd = (r.ALL_TI_YMD || r.TI_YMD || '').toString();
        const period = Number(r.PERIO || r.PERIOD || 0);
        const subject = (r.ITRT_CNTNT || '').toString().trim();
        if (!ymd || !subject) return null;
        const lesson: AfterSchoolLesson = {
          date: fmtDate(ymd),
          period,
          subject,
        };
        const g = (r.GRADE || r.DGHT_CRSE_SC_NM || '').toString().trim();
        if (g) lesson.grade = g;
        const cls = (r.CLASS_NM || '').toString().trim();
        if (cls) lesson.classNm = cls;
        return lesson;
      })
      .filter((l): l is AfterSchoolLesson => l !== null)
      .sort((a, b) => (a.date === b.date ? a.period - b.period : a.date.localeCompare(b.date)));

    const body = {
      lessons,
      totalCount,
      _meta: buildMeta({ atptOfcdcSCCode, schulCode, ay, sem, grade, totalCount }),
    };

    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err), lessons: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

function buildMeta(opts: {
  atptOfcdcSCCode: string;
  schulCode: string;
  ay: string;
  sem: string;
  grade: string;
  totalCount: number;
}) {
  return {
    source: 'NEIS_OpenAPI',
    apiId: 'open.neis.go.kr/hub/afsclTimetable',
    license: '교육부 NEIS Open API 이용약관',
    organization: '한국교육학술정보원(KERIS) / 교육부',
    upstreamUrl: 'https://open.neis.go.kr/portal/data/dataset/searchDatasetPage.do',
    syncedAt: new Date().toISOString(),
    request: {
      atptOfcdcSCCode: opts.atptOfcdcSCCode,
      schulCode: opts.schulCode,
      ay: opts.ay || null,
      sem: opts.sem || null,
      grade: opts.grade || null,
    },
    totalCount: opts.totalCount,
  };
}
