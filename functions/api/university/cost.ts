/**
 * /api/university/cost
 *
 * 대학별 비용 정보 (등록금 + 장학금 + 학자금대출 + 입학정원) 통합 API.
 *
 * GET /api/university/cost?university={학교명}
 *
 * 데이터 출처 (KCUE 표준데이터, 이용허락범위: 제한없음):
 *  - data/kcue/tuition-2024.json       — data.go.kr/15107738 (대학 평균등록금)
 *  - data/kcue/scholarship-2024.json   — data.go.kr/15107739 (대학 장학금)
 *  - data/kcue/loan-2024.json          — data.go.kr/15107740 (학자금대출)
 *  - data/kcue/admission-quota-2024.json — data.go.kr/15107731 (입학정원/계열별)
 *
 * 매칭 전략:
 *   1) 정확 매칭(완전 동일 학교명)
 *   2) 정규화 매칭(괄호/캠퍼스 표기 제거 + 약칭 동의어 치환 — 카이스트, 한국외대 등)
 *   3) 부분 매칭(앞쪽 prefix 일치)
 *
 * 응답:
 *   {
 *     data: {
 *       tuition:        { average, byCategory } | null,
 *       scholarship:    { internal: { count, amount }, external: { count, amount } } | null,
 *       loan:           { tuitionLoan: { count, amount }, lifeLoan: { count, amount } } | null,
 *       admissionQuota: number | null,
 *     },
 *     _meta: { source, syncedAt, matchedName, ... }
 *   }
 *
 * 데이터 파일이 누락된 경우(빌드 시 sync 미실행) 모든 필드를 null 로 채워 graceful 폴백한다.
 */

interface Env {
  KCUE_CACHE?: KVNamespace;
}

// ────────────────────────────────────────────────────────────────────────────
// 원본 레코드 타입
// ────────────────────────────────────────────────────────────────────────────

interface TuitionRecord {
  univNm?: string;
  univSeNm?: string; // '대학' | '전문대학' | '특수대학원' | '일반대학원' | '전문대학원' | '원격대학'
  평균등록금?: string | number;
  avgMtcltnAmt?: string | number;
}

interface ScholarshipRecord {
  univNm?: string;
  univSeNm?: string;
  schlioSeNm?: string; // '교내' | '교외'
  schlshipTypeSeNm?: string;
  schlship?: string | number; // 금액(원)
}

interface LoanRecord {
  univNm?: string; // 예: '서울대학교(본교) 학부'
  univSeNm?: string;
  학교구분명?: string;
  // 일반상환 — 등록금/생활비
  genrlrpmtWholloanNopeCnt?: string | number;
  genrlrpmtWholloanAmt?: string | number;
  genrlrpmtRegloanNopeCnt?: string | number;
  genrlrpmtRegloanAmt?: string | number;
  genrlrpmtLvngloanNopeCnt?: string | number;
  genrlrpmtLvngloanAmt?: string | number;
  // 취업후상환
  emplymtRpmtWholloanNopeCnt?: string | number;
  emplymtRpmtWholloanAmt?: string | number;
  emplymtRpmtRegLoanNopeCnt?: string | number;
  emplymtRpmtRegLoanAmt?: string | number;
  emplymtRpmtLvngloanNopeCnt?: string | number;
  emplymtRpmtLvngLoanAmt?: string | number;
}

interface AdmissionRecord {
  학교명?: string;
  학교구분명?: string;
  본분교구분명?: string;
  입학정원합계?: string | number;
  인문계열정원?: string | number;
  사회계열정원?: string | number;
  교육계열정원?: string | number;
  공학계열정원?: string | number;
  자연계열정원?: string | number;
  의약계열정원?: string | number;
  예체능계열정원?: string | number;
}

interface KcueFile<T> {
  _meta?: {
    source?: string;
    apiId?: string;
    license?: string;
    syncedAt?: string;
    baseDataDate?: string;
    upstreamUrl?: string;
    organization?: string;
  };
  records?: T[];
}

// ────────────────────────────────────────────────────────────────────────────
// 응답 타입
// ────────────────────────────────────────────────────────────────────────────

interface TuitionAggregate {
  average: number; // 학부('대학') 평균. 없으면 0
  byCategory: Record<string, number>; // univSeNm 별 평균
}

interface ScholarshipBucket {
  count: number; // 항목 수(레코드 수)
  amount: number; // 합계 금액(원)
}

interface ScholarshipAggregate {
  internal: ScholarshipBucket;
  external: ScholarshipBucket;
}

interface LoanBucket {
  count: number;
  amount: number;
}

interface LoanAggregate {
  tuitionLoan: LoanBucket; // 등록금 (취업후상환 + 일반상환 합산)
  lifeLoan: LoanBucket; // 생활비 (취업후상환 + 일반상환 합산)
}

interface CostData {
  tuition: TuitionAggregate | null;
  scholarship: ScholarshipAggregate | null;
  loan: LoanAggregate | null;
  admissionQuota: number | null;
  admissionByCategory: Record<string, number> | null;
}

// ────────────────────────────────────────────────────────────────────────────
// 학교명 정규화 / 매칭 유틸
// ────────────────────────────────────────────────────────────────────────────

/** 약칭 → 정식 학교명 동의어 사전 (양방향으로 활용) */
const ALIAS_MAP: Record<string, string> = {
  카이스트: '한국과학기술원',
  KAIST: '한국과학기술원',
  포스텍: '포항공과대학교',
  POSTECH: '포항공과대학교',
  유니스트: '울산과학기술원',
  UNIST: '울산과학기술원',
  지스트: '광주과학기술원',
  GIST: '광주과학기술원',
  디지스트: '대구경북과학기술원',
  DGIST: '대구경북과학기술원',
  서울대: '서울대학교',
  연대: '연세대학교',
  고대: '고려대학교',
  성대: '성균관대학교',
  한대: '한양대학교',
  이대: '이화여자대학교',
  외대: '한국외국어대학교',
  한국외대: '한국외국어대학교',
  서강대: '서강대학교',
  중대: '중앙대학교',
  시립대: '서울시립대학교',
  부산대: '부산대학교',
  경북대: '경북대학교',
  전남대: '전남대학교',
  전북대: '전북대학교',
  충남대: '충남대학교',
  충북대: '충북대학교',
};

/**
 * 정규화: 공백 제거, 괄호 내용 제거('(본교)' 등), 캠퍼스/학부/대학원 접미 제거,
 * 약칭은 정식명으로 치환.
 */
function normalize(name: string): string {
  if (!name) return '';
  let v = name.trim();

  // 약칭 치환 (정확한 토큰일 때만)
  if (ALIAS_MAP[v]) v = ALIAS_MAP[v];

  // '(본교)', '(분교)', '(국제캠퍼스)' 등 괄호 내용 제거
  v = v.replace(/\([^)]*\)/g, '');

  // ' 학부', ' 대학원', '캠퍼스' 등 접미 제거
  v = v.replace(/\s+(학부|대학원|국제캠퍼스|캠퍼스|본교|분교)$/g, '');

  // 모든 공백 제거
  v = v.replace(/\s+/g, '');

  return v.trim();
}

/** 두 학교명이 동등한 것으로 간주되는지 (정확/정규화/약칭) */
function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const na = normalize(a);
  const nb = normalize(b);
  if (na && nb && na === nb) return true;
  return false;
}

/** 부분 일치 (정규화된 한쪽이 다른 쪽의 prefix) */
function namesPartialMatch(target: string, candidate: string): boolean {
  const nt = normalize(target);
  const nc = normalize(candidate);
  if (!nt || !nc) return false;
  if (nt === nc) return true;
  // 적어도 3자 이상 일치 시점에서 prefix 매칭 허용
  if (nt.length >= 3 && nc.startsWith(nt)) return true;
  if (nc.length >= 3 && nt.startsWith(nc)) return true;
  return false;
}

/**
 * 레코드 배열에서 학교명으로 일치하는 레코드만 추림.
 * 1) 정확/정규화 일치 → 있으면 그 결과만 반환
 * 2) 그래도 비면 부분 일치 폴백
 */
function pickByUniversity<T>(
  records: T[],
  getName: (r: T) => string,
  target: string,
): { rows: T[]; matchedName: string | null } {
  if (!records.length || !target) return { rows: [], matchedName: null };

  const exact: T[] = [];
  const partial: T[] = [];

  for (const r of records) {
    const n = getName(r);
    if (!n) continue;
    if (namesMatch(target, n)) exact.push(r);
    else if (namesPartialMatch(target, n)) partial.push(r);
  }

  if (exact.length > 0) {
    return { rows: exact, matchedName: getName(exact[0]) };
  }
  if (partial.length > 0) {
    return { rows: partial, matchedName: getName(partial[0]) };
  }
  return { rows: [], matchedName: null };
}

// ────────────────────────────────────────────────────────────────────────────
// 숫자 파싱 유틸
// ────────────────────────────────────────────────────────────────────────────

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

// ────────────────────────────────────────────────────────────────────────────
// 데이터 로드 (빌드 시 동적 import)
// ────────────────────────────────────────────────────────────────────────────

async function loadJson<T>(path: string): Promise<KcueFile<T> | null> {
  try {
    // @ts-expect-error - sync 스크립트가 생성, 빌드 시 없을 수 있음
    const mod = await import(path, { with: { type: 'json' } });
    return (mod as { default?: KcueFile<T> }).default ?? null;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 집계 함수
// ────────────────────────────────────────────────────────────────────────────

function aggregateTuition(rows: TuitionRecord[]): TuitionAggregate | null {
  if (!rows.length) return null;
  const buckets = new Map<string, number[]>();
  const allValues: number[] = [];

  for (const r of rows) {
    const v = num(r.평균등록금);
    if (v <= 0) continue;
    allValues.push(v);
    const key = String(r.univSeNm || '대학').trim();
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(v);
  }

  if (allValues.length === 0) return null;

  const byCategory: Record<string, number> = {};
  for (const [k, vs] of buckets.entries()) {
    if (vs.length === 0) continue;
    byCategory[k] = Math.round(vs.reduce((s, x) => s + x, 0) / vs.length);
  }

  // 학부 평균 우선, 없으면 전체 평균
  const undergrad = byCategory['대학'] ?? byCategory['전문대학'];
  const overall = Math.round(allValues.reduce((s, x) => s + x, 0) / allValues.length);

  return {
    average: undergrad ?? overall,
    byCategory,
  };
}

function aggregateScholarship(rows: ScholarshipRecord[]): ScholarshipAggregate | null {
  if (!rows.length) return null;
  const internal: ScholarshipBucket = { count: 0, amount: 0 };
  const external: ScholarshipBucket = { count: 0, amount: 0 };

  for (const r of rows) {
    const amount = num(r.schlship);
    if (amount <= 0) continue;
    if (r.schlioSeNm === '교내') {
      internal.count += 1;
      internal.amount += amount;
    } else if (r.schlioSeNm === '교외') {
      external.count += 1;
      external.amount += amount;
    }
  }

  if (internal.count === 0 && external.count === 0) return null;
  return { internal, external };
}

function aggregateLoan(rows: LoanRecord[]): LoanAggregate | null {
  if (!rows.length) return null;
  const tuitionLoan: LoanBucket = { count: 0, amount: 0 };
  const lifeLoan: LoanBucket = { count: 0, amount: 0 };

  for (const r of rows) {
    // 등록금 = 일반상환 등록금 + 취업후상환 등록금
    tuitionLoan.count += num(r.genrlrpmtRegloanNopeCnt) + num(r.emplymtRpmtRegLoanNopeCnt);
    tuitionLoan.amount += num(r.genrlrpmtRegloanAmt) + num(r.emplymtRpmtRegLoanAmt);

    // 생활비 = 일반상환 생활비 + 취업후상환 생활비
    lifeLoan.count += num(r.genrlrpmtLvngloanNopeCnt) + num(r.emplymtRpmtLvngloanNopeCnt);
    lifeLoan.amount += num(r.genrlrpmtLvngloanAmt) + num(r.emplymtRpmtLvngLoanAmt);
  }

  if (tuitionLoan.count === 0 && lifeLoan.count === 0) return null;
  return { tuitionLoan, lifeLoan };
}

function aggregateAdmission(rows: AdmissionRecord[]): {
  total: number | null;
  byCategory: Record<string, number> | null;
} {
  if (!rows.length) return { total: null, byCategory: null };

  // 본교만 우선 사용. 본교가 없으면 전체.
  const main = rows.filter((r) => r.본분교구분명 === '본교');
  const target = main.length > 0 ? main : rows;

  let total = 0;
  const cat: Record<string, number> = {
    인문계열: 0,
    사회계열: 0,
    교육계열: 0,
    공학계열: 0,
    자연계열: 0,
    의약계열: 0,
    예체능계열: 0,
  };

  for (const r of target) {
    total += num(r.입학정원합계);
    cat['인문계열'] += num(r.인문계열정원);
    cat['사회계열'] += num(r.사회계열정원);
    cat['교육계열'] += num(r.교육계열정원);
    cat['공학계열'] += num(r.공학계열정원);
    cat['자연계열'] += num(r.자연계열정원);
    cat['의약계열'] += num(r.의약계열정원);
    cat['예체능계열'] += num(r.예체능계열정원);
  }

  if (total === 0) return { total: null, byCategory: null };

  // 0인 계열은 제거
  const cleaned: Record<string, number> = {};
  for (const [k, v] of Object.entries(cat)) {
    if (v > 0) cleaned[k] = v;
  }

  return { total, byCategory: Object.keys(cleaned).length > 0 ? cleaned : null };
}

// ────────────────────────────────────────────────────────────────────────────
// 핸들러
// ────────────────────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const universityName = (url.searchParams.get('university') || '').trim();

  if (!universityName) {
    return jsonResponse(
      {
        error: 'university 파라미터가 필요합니다.',
        data: emptyData(),
        _meta: emptyMeta(),
      },
      400,
    );
  }

  // 4개 데이터 파일 병렬 로드
  const [tuitionFile, scholarshipFile, loanFile, admissionFile] = await Promise.all([
    loadJson<TuitionRecord>('../../../data/kcue/tuition-2024.json'),
    loadJson<ScholarshipRecord>('../../../data/kcue/scholarship-2024.json'),
    loadJson<LoanRecord>('../../../data/kcue/loan-2024.json'),
    loadJson<AdmissionRecord>('../../../data/kcue/admission-quota-2024.json'),
  ]);

  // 학교명으로 각 데이터에서 row 추출
  const tuitionPick = pickByUniversity(
    tuitionFile?.records ?? [],
    (r) => String(r.univNm ?? ''),
    universityName,
  );
  const scholarshipPick = pickByUniversity(
    scholarshipFile?.records ?? [],
    (r) => String(r.univNm ?? ''),
    universityName,
  );
  const loanPick = pickByUniversity(
    loanFile?.records ?? [],
    (r) => String(r.univNm ?? ''),
    universityName,
  );
  const admissionPick = pickByUniversity(
    admissionFile?.records ?? [],
    (r) => String(r.학교명 ?? ''),
    universityName,
  );

  // 집계
  const tuition = aggregateTuition(tuitionPick.rows);
  const scholarship = aggregateScholarship(scholarshipPick.rows);
  const loan = aggregateLoan(loanPick.rows);
  const adm = aggregateAdmission(admissionPick.rows);

  const data: CostData = {
    tuition,
    scholarship,
    loan,
    admissionQuota: adm.total,
    admissionByCategory: adm.byCategory,
  };

  // 모든 필드가 null 이면 hasData=false 로 클라이언트가 카드 자체를 숨김
  const hasData =
    !!tuition || !!scholarship || !!loan || data.admissionQuota != null;

  // _meta — 가장 최근 syncedAt 사용
  const allMeta = [
    tuitionFile?._meta,
    scholarshipFile?._meta,
    loanFile?._meta,
    admissionFile?._meta,
  ].filter(Boolean);
  const latestSync = allMeta
    .map((m) => m?.syncedAt || '')
    .filter(Boolean)
    .sort()
    .pop();

  const matchedName =
    tuitionPick.matchedName ||
    scholarshipPick.matchedName ||
    loanPick.matchedName ||
    admissionPick.matchedName;

  const body = {
    data,
    hasData,
    _meta: {
      source: 'KCUE_표준데이터',
      organization: '한국대학교육협의회',
      license: '이용허락범위 제한없음',
      syncedAt: latestSync || new Date().toISOString(),
      datasets: {
        tuition: tuitionFile?._meta?.apiId ?? 'data.go.kr/15107738',
        scholarship: scholarshipFile?._meta?.apiId ?? 'data.go.kr/15107739',
        loan: loanFile?._meta?.apiId ?? 'data.go.kr/15107740',
        admissionQuota: admissionFile?._meta?.apiId ?? 'data.go.kr/15107731',
      },
      query: universityName,
      matchedName,
      matchType: matchedName === universityName ? 'exact' : matchedName ? 'normalized' : 'none',
    },
  };

  return jsonResponse(body, 200);
};

function emptyData(): CostData {
  return {
    tuition: null,
    scholarship: null,
    loan: null,
    admissionQuota: null,
    admissionByCategory: null,
  };
}

function emptyMeta() {
  return {
    source: 'KCUE_표준데이터',
    organization: '한국대학교육협의회',
    license: '이용허락범위 제한없음',
    syncedAt: new Date().toISOString(),
    matchedName: null,
    matchType: 'none' as const,
  };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
