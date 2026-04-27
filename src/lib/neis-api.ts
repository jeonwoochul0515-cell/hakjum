// NEIS API 클라이언트 - 전국 고등학교 목록 + 실시간 개설과목 조회

export interface NEISSchool {
  code: string;
  regionCode: string;
  name: string;
  engName: string;
  region: string;
  regionFull: string;
  address: string;
  type: string;
  foundation: string;
  coedu: string;
  homepage: string;
  tel: string;
}

export interface Region {
  code: string;
  name: string;
  fullName: string;
}

export interface SchoolSubjects {
  schoolName: string;
  schoolCode: string;
  regionCode: string;
  year: string;
  semester: string;
  subjectsByGrade: Record<string, string[]>;
  allSubjects: string[];
  totalRecords: number;
  gradeDataYear?: Record<string, string>;  // 학년별 데이터 기준 연도
}

// 시도교육청 코드 (프론트에서 셀렉트박스용)
export const REGION_CODES: { code: string; name: string }[] = [
  { code: 'B10', name: '서울' },
  { code: 'C10', name: '부산' },
  { code: 'D10', name: '대구' },
  { code: 'E10', name: '인천' },
  { code: 'F10', name: '광주' },
  { code: 'G10', name: '대전' },
  { code: 'H10', name: '울산' },
  { code: 'I10', name: '세종' },
  { code: 'J10', name: '경기' },
  { code: 'K10', name: '강원' },
  { code: 'M10', name: '충북' },
  { code: 'N10', name: '충남' },
  { code: 'P10', name: '전북' },
  { code: 'Q10', name: '전남' },
  { code: 'R10', name: '경북' },
  { code: 'S10', name: '경남' },
  { code: 'T10', name: '제주' },
];

// 전국 고등학교 목록 조회
export async function fetchSchoolList(options: {
  region?: string;
  name?: string;
  page?: number;
  size?: number;
}): Promise<{ schools: NEISSchool[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.region) params.set('region', options.region);
  if (options.name) params.set('name', options.name);
  if (options.page) params.set('page', String(options.page));
  if (options.size) params.set('size', String(options.size));

  const res = await fetch(`/api/neis/schools?${params}`);
  if (!res.ok) throw new Error('Failed to fetch school list');

  const data = await res.json();
  return {
    schools: data.schools || [],
    totalCount: data.totalCount || 0,
  };
}

// 특정 학교의 개설과목 실시간 조회
export async function fetchSchoolSubjects(
  regionCode: string,
  schoolCode: string,
  year?: string,
  semester?: string,
): Promise<SchoolSubjects> {
  const params = new URLSearchParams({
    regionCode,
    schoolCode,
  });
  if (year) params.set('year', year);
  if (semester) params.set('semester', semester);

  const res = await fetch(`/api/neis/subjects?${params}`);
  if (!res.ok) throw new Error('Failed to fetch subjects');

  return await res.json();
}

// ────────────────────────────────────────────────────────────────────────
// 학사일정(SchoolSchedule) / 방과후학교(afsclTimetable) / 학교급식(mealServiceDietInfo)
// 전부 NEIS Open API hub 프록시 (functions/api/neis/{schedule,after-school,meal}.ts)
// ────────────────────────────────────────────────────────────────────────

export interface NEISMeta {
  source: string;
  apiId: string;
  license: string;
  organization?: string;
  upstreamUrl?: string;
  syncedAt: string;
  totalCount?: number;
  request?: Record<string, string | null>;
}

export interface ScheduleEvent {
  /** YYYY-MM-DD */
  date: string;
  name: string;
  type: 'holiday' | 'exam' | 'vacation' | 'ceremony' | 'event';
  content?: string;
  grades?: number[];
}

export interface ScheduleResponse {
  events: ScheduleEvent[];
  totalCount: number;
  _meta: NEISMeta;
}

export interface AfterSchoolLesson {
  /** YYYY-MM-DD */
  date: string;
  period: number;
  subject: string;
  grade?: string;
  classNm?: string;
}

export interface AfterSchoolResponse {
  lessons: AfterSchoolLesson[];
  totalCount: number;
  _meta: NEISMeta;
}

export interface SchoolMeal {
  /** YYYY-MM-DD */
  date: string;
  type: string; // 조식/중식/석식
  dishes: string[];
  calorie?: string;
  nutrients?: string;
  origin?: string;
}

export interface MealResponse {
  meals: SchoolMeal[];
  totalCount: number;
  _meta: NEISMeta;
}

/**
 * 학사일정 조회.
 * @param regionCode  ATPT_OFCDC_SC_CODE (시도교육청 코드, 예: 'B10')
 * @param schoolCode  SD_SCHUL_CODE (학교코드)
 * @param fromYmd     YYYYMMDD 또는 YYYY-MM-DD
 * @param toYmd       YYYYMMDD 또는 YYYY-MM-DD
 *
 * @example
 *   const { events } = await getSchoolSchedule('B10', '7010536', '20260301', '20260831');
 */
export async function getSchoolSchedule(
  regionCode: string,
  schoolCode: string,
  fromYmd?: string,
  toYmd?: string,
): Promise<ScheduleResponse> {
  const params = new URLSearchParams({
    atptOfcdcSCCode: regionCode,
    schulCode: schoolCode,
  });
  if (fromYmd) params.set('fromYmd', fromYmd.replace(/-/g, ''));
  if (toYmd) params.set('toYmd', toYmd.replace(/-/g, ''));

  const res = await fetch(`/api/neis/schedule?${params}`);
  if (!res.ok) throw new Error('Failed to fetch school schedule');
  return (await res.json()) as ScheduleResponse;
}

/**
 * 방과후학교 시간표 조회.
 * @param regionCode  ATPT_OFCDC_SC_CODE
 * @param schoolCode  SD_SCHUL_CODE
 * @param options     학년도/학기/학년 (전부 옵션)
 *
 * @example
 *   const { lessons } = await getAfterSchool('B10', '7010536', { year: '2026', semester: '1' });
 */
export async function getAfterSchool(
  regionCode: string,
  schoolCode: string,
  options: { year?: string; semester?: string; grade?: string; fromYmd?: string; toYmd?: string } = {},
): Promise<AfterSchoolResponse> {
  const params = new URLSearchParams({
    atptOfcdcSCCode: regionCode,
    schulCode: schoolCode,
  });
  if (options.year) params.set('ay', options.year);
  if (options.semester) params.set('sem', options.semester);
  if (options.grade) params.set('grade', options.grade);
  if (options.fromYmd) params.set('fromYmd', options.fromYmd.replace(/-/g, ''));
  if (options.toYmd) params.set('toYmd', options.toYmd.replace(/-/g, ''));

  const res = await fetch(`/api/neis/after-school?${params}`);
  if (!res.ok) throw new Error('Failed to fetch after-school timetable');
  return (await res.json()) as AfterSchoolResponse;
}

/**
 * 학교급식 식단 조회.
 *
 * @example
 *   const { meals } = await getSchoolMeals('B10', '7010536', { fromYmd: '20260427', toYmd: '20260503' });
 */
export async function getSchoolMeals(
  regionCode: string,
  schoolCode: string,
  options: { ymd?: string; fromYmd?: string; toYmd?: string; mealCode?: '1' | '2' | '3' } = {},
): Promise<MealResponse> {
  const params = new URLSearchParams({
    atptOfcdcSCCode: regionCode,
    schulCode: schoolCode,
  });
  if (options.ymd) params.set('ymd', options.ymd.replace(/-/g, ''));
  if (options.fromYmd) params.set('fromYmd', options.fromYmd.replace(/-/g, ''));
  if (options.toYmd) params.set('toYmd', options.toYmd.replace(/-/g, ''));
  if (options.mealCode) params.set('mealCode', options.mealCode);

  const res = await fetch(`/api/neis/meal?${params}`);
  if (!res.ok) throw new Error('Failed to fetch school meals');
  return (await res.json()) as MealResponse;
}
