// NEIS 학사일정(SchoolSchedule) 프록시
// GET /api/neis/schedule?atptOfcdcSCCode=B10&schulCode=7010536&fromYmd=20260301&toYmd=20260831
//
// NEIS 공식 hub: https://open.neis.go.kr/hub/SchoolSchedule
// 응답 스펙:
//   { events: [{ date, name, type, raw }], _meta }
//
// 주요 NEIS 응답 컬럼:
//   AA_YMD          : 학사일자 (YYYYMMDD)
//   EVENT_NM        : 행사명
//   EVENT_CNTNT     : 행사내용
//   SBTR_DD_SC_NM   : 수업공제일명 (휴업일/방학/공휴일 등)
//   ONE_GRADE_EVENT_YN ~ SIX_GRADE_EVENT_YN : 학년별 해당 여부

interface Env {
  NEIS_API_KEY?: string;
}

interface ScheduleEvent {
  /** YYYY-MM-DD */
  date: string;
  /** 행사명 (EVENT_NM) */
  name: string;
  /**
   * 분류:
   *   - holiday : 휴업일/공휴일/방학 (SBTR_DD_SC_NM 존재)
   *   - exam    : 시험 관련 (중간/기말/모의)
   *   - vacation: 방학 관련
   *   - ceremony: 입학식/졸업식/개교기념일
   *   - event   : 그 외 학사 일정
   */
  type: 'holiday' | 'exam' | 'vacation' | 'ceremony' | 'event';
  /** 행사 상세 내용 (있으면) */
  content?: string;
  /** 학년별 해당 여부 (1~6) */
  grades?: number[];
}

function fmtDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function classifyEvent(name: string, sbtr: string): ScheduleEvent['type'] {
  if (sbtr && /방학/.test(sbtr)) return 'vacation';
  if (sbtr) return 'holiday';
  if (/시험|평가|모의|학력/.test(name)) return 'exam';
  if (/방학/.test(name)) return 'vacation';
  if (/입학|졸업|개교/.test(name)) return 'ceremony';
  return 'event';
}

function pickGrades(row: any): number[] {
  const map: Array<[string, number]> = [
    ['ONE_GRADE_EVENT_YN', 1],
    ['TW_GRADE_EVENT_YN', 2],
    ['THREE_GRADE_EVENT_YN', 3],
    ['FR_GRADE_EVENT_YN', 4],
    ['FIV_GRADE_EVENT_YN', 5],
    ['SIX_GRADE_EVENT_YN', 6],
  ];
  const grades: number[] = [];
  for (const [key, g] of map) {
    if ((row[key] || '').toUpperCase() === 'Y') grades.push(g);
  }
  return grades;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const atptOfcdcSCCode = url.searchParams.get('atptOfcdcSCCode') || url.searchParams.get('regionCode') || '';
  const schulCode = url.searchParams.get('schulCode') || url.searchParams.get('schoolCode') || '';
  const fromYmd = (url.searchParams.get('fromYmd') || '').replace(/-/g, '');
  const toYmd = (url.searchParams.get('toYmd') || '').replace(/-/g, '');

  if (!atptOfcdcSCCode || !schulCode) {
    return new Response(
      JSON.stringify({ error: 'atptOfcdcSCCode and schulCode are required', events: [] }),
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
  if (fromYmd) params.set('AA_FROM_YMD', fromYmd);
  if (toYmd) params.set('AA_TO_YMD', toYmd);

  const apiUrl = `https://open.neis.go.kr/hub/SchoolSchedule?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `NEIS API error: ${response.status}`, events: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = (await response.json()) as any;

    if (data?.RESULT) {
      // INFO-200(데이터없음) 등은 빈 결과로 정상 응답
      return new Response(
        JSON.stringify({
          events: [],
          totalCount: 0,
          message: data.RESULT.MESSAGE,
          code: data.RESULT.CODE,
          _meta: buildMeta({ atptOfcdcSCCode, schulCode, fromYmd, toYmd, totalCount: 0 }),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const ss = data?.SchoolSchedule;
    if (!ss || ss.length < 2) {
      return new Response(
        JSON.stringify({
          events: [],
          totalCount: 0,
          _meta: buildMeta({ atptOfcdcSCCode, schulCode, fromYmd, toYmd, totalCount: 0 }),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    const totalCount: number = ss[0]?.head?.[0]?.list_total_count || 0;
    const rows: any[] = ss[1]?.row || [];

    const events: ScheduleEvent[] = rows
      .map((r) => {
        const ymd = (r.AA_YMD || '').toString();
        const name = (r.EVENT_NM || r.SBTR_DD_SC_NM || '').toString().trim();
        const sbtr = (r.SBTR_DD_SC_NM || '').toString().trim();
        const content = (r.EVENT_CNTNT || '').toString().trim();
        if (!ymd || !name) return null;
        const ev: ScheduleEvent = {
          date: fmtDate(ymd),
          name,
          type: classifyEvent(name, sbtr),
        };
        if (content) ev.content = content;
        const grades = pickGrades(r);
        if (grades.length) ev.grades = grades;
        return ev;
      })
      .filter((e): e is ScheduleEvent => e !== null)
      .sort((a, b) => a.date.localeCompare(b.date));

    const body = {
      events,
      totalCount,
      _meta: buildMeta({ atptOfcdcSCCode, schulCode, fromYmd, toYmd, totalCount }),
    };

    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 학사일정은 잘 변경되지 않음 → 1시간 캐시
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err), events: [] }),
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
    apiId: 'open.neis.go.kr/hub/SchoolSchedule',
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
