// NEIS 고등학교 개설과목 실시간 파이프라인 (최적화 버전)
// GET /api/neis/subjects?regionCode=C10&schoolCode=7150119&year=2025&semester=1
//
// 최적화 전략:
// 1. TI_FROM_YMD/TI_TO_YMD로 4주 날짜 범위만 조회 (7000행 → ~1000행, 85% 감소)
// 2. 12개 요청(3학년 × 2학기 × 2연도) 동시 발사 (Promise.all)
// 3. Cloudflare Cache API로 반복 요청 즉시 응답
// 선택과목은 격주/순환 편성이 흔하므로 4주 필요

interface Env {
  NEIS_API_KEY?: string;
}

interface SubjectsByGrade {
  [grade: string]: string[];
}

interface GradeDataYear {
  [grade: string]: string;
}

interface SchoolSubjectsResult {
  schoolName: string;
  schoolCode: string;
  regionCode: string;
  year: string;
  semester: string;
  subjectsByGrade: SubjectsByGrade;
  allSubjects: string[];
  totalRecords: number;
  gradeDataYear: GradeDataYear;
}

// 2022 개정 교육과정 보통교과 기본 선택과목 (NEIS에 없어도 모든 고등학교에서 편성 가능)
const CURRICULUM_2022_SUBJECTS = [
  // 국어
  '화법과 언어', '독서와 작문', '문학',
  '주제 탐구 독서', '문학과 영상', '직무 의사소통',
  '독서 토론과 글쓰기', '매체 의사소통',
  // 수학
  '대수', '미적분Ⅰ', '확률과 통계',
  '기하', '미적분Ⅱ', '경제 수학', '인공지능 수학',
  '실용 통계', '수학과제 탐구', '수학과 문화',
  // 영어
  '영어Ⅰ', '영어Ⅱ', '영어 독해와 작문',
  '영미 문학 읽기', '영어 발표와 토론', '심화 영어',
  '실생활 영어 회화', '미디어 영어', '세계 문화와 영어',
  // 사회
  '세계시민과 지리', '세계사', '사회와 문화', '현대사회와 윤리',
  '한국지리 탐구', '도시의 미래 탐구', '동아시아 역사 기행',
  '정치', '법과 사회', '경제', '윤리와 사상', '인문학과 윤리', '국제 관계의 이해',
  '여행지리', '역사로 탐구하는 현대 세계', '사회문제 탐구', '금융과 경제생활',
  // 과학
  '물리학', '화학', '생명과학', '지구과학',
  '역학과 에너지', '전자기와 양자', '물질과 에너지', '화학 반응의 세계',
  '세포와 물질대사', '생물의 유전', '지구시스템과학', '행성우주과학',
  '과학의 역사와 문화', '기후변화와 환경생태', '융합과학 탐구',
  // 체육
  '운동과 건강', '스포츠 문화', '스포츠 과학',
  // 예술
  '음악', '미술', '연극',
  '음악 연주와 창작', '음악 감상과 비평', '미술 창작', '미술 감상과 비평',
  // 기술·가정 / 정보
  '정보', '인공지능 기초', '데이터 과학',
  '로봇과 공학세계', '창의 공학 설계',
  // 제2외국어 (주요)
  '일본어', '중국어', '프랑스어', '독일어', '스페인어', '러시아어', '한문',
  // 교양
  '진로와 직업', '생태와 환경', '보건', '논술',
];

// NEIS 시간표에서 과목이 아닌 항목 필터링
const EXCLUDED_PATTERNS = /^(대체공휴일|공휴일|재량활동|자습|보충학습|방학|휴업일|개교기념일|졸업식|입학식|중간고사|기말고사|시험|수련활동|현장체험|수학여행|체험학습|학교행사|행사|방과후|야간자율학습|석식|조회|종례|청소|어린이날|추석|설날|설|부처님오신날|석가탄신일|광복절|개천절|한글날|성탄절|크리스마스|현충일|삼일절|3\.1절|신정|임시공휴일|대통령선거|국회의원선거|지방선거|재보궐선거|선거일|보강|재량휴업일|학교장재량|\.+|-)$/;

function isValidSubject(name: string): boolean {
  if (!name || name.length < 2) return false;
  if (EXCLUDED_PATTERNS.test(name)) return false;
  if (/^[\d\s.·\-_]+$/.test(name)) return false;
  return true;
}

// NEIS 분반 기호 정규화: "지구과학A 지구과학" → "지구과학"
function normalizeSubjectName(raw: string): string {
  let name = raw.replace(/^\d+\.\s*/, '').trim();
  name = name.replace(/([가-힣\u2160-\u217F])[A-Z]\s+.+$/, '$1').trim();
  name = name.replace(/([가-힣\u2160-\u217F])[A-H]$/, '$1').trim();
  return name;
}

// 학기별 대표 4주 날짜 반환 (YYYYMMDD 형식)
// 선택과목은 격주/순환 편성이 흔하므로 1주로는 부족 → 4주(20일)로 확보
// 공휴일이 포함되어도 EXCLUDED_PATTERNS로 필터링됨
function getDateRange(year: string, semester: string): { from: string; to: string } {
  const y = Number(year);
  const now = new Date();
  const isCurrentYear = y === now.getFullYear();

  if (semester === '1') {
    if (isCurrentYear && now.getMonth() < 3) {
      // 현재 연도 3월 → 3월 초부터 현재까지 (데이터 누적 중)
      const end = new Date(now);
      end.setDate(end.getDate() - 1);
      const start = new Date(y, 2, 4);
      return { from: fmt(start), to: fmt(end) };
    }
    // 4월 이후 → 4월~5월 초 (4주, 충분한 데이터)
    return { from: `${year}0407`, to: `${year}0502` };
  } else {
    if (isCurrentYear && now.getMonth() < 9) {
      return { from: `${year}0901`, to: `${year}0901` };
    }
    // 10월 말~11월 중순 (4주)
    return { from: `${year}1020`, to: `${year}1114` };
  }
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// 과목 추출 (날짜 범위 사용 → 보통 1페이지로 충분)
async function fetchSubjects(
  regionCode: string,
  schoolCode: string,
  year: string,
  semester: string,
  grade: string,
  apiKey: string,
  dateRange?: { from: string; to: string },
): Promise<{ subjects: Set<string>; schoolName: string; totalRecords: number }> {
  const params = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '1000',
    ATPT_OFCDC_SC_CODE: regionCode,
    SD_SCHUL_CODE: schoolCode,
    AY: year,
    SEM: semester,
    GRADE: grade,
  });

  if (dateRange) {
    params.set('TI_FROM_YMD', dateRange.from);
    params.set('TI_TO_YMD', dateRange.to);
  }
  if (apiKey) params.set('KEY', apiKey);

  const subjects = new Set<string>();
  let schoolName = '';
  let totalRecords = 0;

  try {
    const response = await fetch(`https://open.neis.go.kr/hub/hisTimetable?${params}`);
    if (!response.ok) return { subjects, schoolName, totalRecords };

    const data = await response.json() as any;
    if (data?.RESULT) return { subjects, schoolName, totalRecords };

    const timetable = data?.hisTimetable;
    if (!timetable || timetable.length < 2) return { subjects, schoolName, totalRecords };

    totalRecords = timetable[0]?.head?.[0]?.list_total_count || 0;
    const rows = timetable[1]?.row || [];

    for (const row of rows) {
      if (!schoolName) schoolName = row.SCHUL_NM || '';
      const raw = (row.ITRT_CNTNT || '').trim();
      if (!raw) continue;
      const normalized = normalizeSubjectName(raw);
      if (normalized && isValidSubject(normalized)) {
        subjects.add(normalized);
      }
    }

    // 날짜 범위 사용 시 보통 1000건 이내지만, 초과 시 추가 페이지
    if (totalRecords > 1000) {
      const pageCount = Math.min(Math.ceil(totalRecords / 1000), 5);
      const pagePromises = [];
      for (let page = 2; page <= pageCount; page++) {
        const p = new URLSearchParams(params);
        p.set('pIndex', String(page));
        pagePromises.push(
          fetch(`https://open.neis.go.kr/hub/hisTimetable?${p}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        );
      }
      const results = await Promise.all(pagePromises);
      for (const d of results) {
        if (!d) continue;
        for (const row of (d?.hisTimetable?.[1]?.row || [])) {
          const raw = (row.ITRT_CNTNT || '').trim();
          if (!raw) continue;
          const normalized = normalizeSubjectName(raw);
          if (normalized && isValidSubject(normalized)) subjects.add(normalized);
        }
      }
    }
  } catch {
    // 네트워크 에러 → 빈 결과
  }

  return { subjects, schoolName, totalRecords };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const regionCode = url.searchParams.get('regionCode') || '';
  const schoolCode = url.searchParams.get('schoolCode') || '';
  const requestedYear = url.searchParams.get('year');
  const requestedSemester = url.searchParams.get('semester');

  if (!regionCode || !schoolCode) {
    return new Response(
      JSON.stringify({ error: 'regionCode and schoolCode are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Cloudflare Cache API ──
  const cacheUrl = new URL(url.toString());
  // 캐시 키 정규화 (regionCode, schoolCode만으로 캐시 구분)
  if (!requestedYear && !requestedSemester) {
    cacheUrl.search = `?regionCode=${regionCode}&schoolCode=${schoolCode}`;
  }
  const cacheKey = new Request(cacheUrl.toString());
  const cache = (caches as any).default as Cache;
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) return cachedResponse;

  const apiKey = context.env.NEIS_API_KEY || '';
  const currentYear = new Date().getFullYear();
  const currentYearStr = String(currentYear);
  const prevYearStr = String(currentYear - 1);

  try {
    // 특정 연도/학기가 지정된 경우
    if (requestedYear && requestedSemester) {
      const grades = ['1', '2', '3'];
      const dateRange = getDateRange(requestedYear, requestedSemester);

      const results = await Promise.all(
        grades.map(g => fetchSubjects(regionCode, schoolCode, requestedYear, requestedSemester, g, apiKey, dateRange))
      );

      const subjectsByGrade: SubjectsByGrade = {};
      const allSubjects = new Set<string>();
      let schoolName = '';
      let totalRecords = 0;

      for (let i = 0; i < grades.length; i++) {
        const key = `${grades[i]}학년`;
        subjectsByGrade[key] = [...results[i].subjects].sort((a, b) => a.localeCompare(b, 'ko'));
        for (const s of results[i].subjects) allSubjects.add(s);
        if (!schoolName) schoolName = results[i].schoolName;
        totalRecords += results[i].totalRecords;
      }

      // 2022 개정 교육과정 기본 과목 병합
      for (const s of CURRICULUM_2022_SUBJECTS) {
        allSubjects.add(s);
      }

      const response = new Response(JSON.stringify({
        schoolName, schoolCode, regionCode,
        year: requestedYear, semester: requestedSemester,
        subjectsByGrade,
        allSubjects: [...allSubjects].sort((a, b) => a.localeCompare(b, 'ko')),
        totalRecords,
        gradeDataYear: {},
      } as SchoolSubjectsResult), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      });

      context.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    // ── 자동 모드: 12개 요청 동시 발사 (3학년 × 2학기 × 2연도) ──
    // 각 요청에 4주 날짜 범위 적용 → 학년당 ~1000행 (1페이지)
    const grades = ['1', '2', '3'];
    const semesters = ['1', '2'];
    const years = [currentYearStr, prevYearStr];

    type FetchKey = { grade: string; semester: string; year: string };
    const fetchKeys: FetchKey[] = [];
    const fetchPromises: Promise<{ subjects: Set<string>; schoolName: string; totalRecords: number }>[] = [];

    for (const grade of grades) {
      for (const sem of semesters) {
        for (const year of years) {
          fetchKeys.push({ grade, semester: sem, year });
          const dateRange = getDateRange(year, sem);
          fetchPromises.push(fetchSubjects(regionCode, schoolCode, year, sem, grade, apiKey, dateRange));
        }
      }
    }

    // 12개 동시 발사 → 가장 느린 1개의 응답 시간으로 수렴 (~200-500ms)
    const allResults = await Promise.all(fetchPromises);

    // grade → year → subjects 구조로 정리
    const resultMap = new Map<string, Map<string, Set<string>>>();
    let schoolName = '';
    let totalRecords = 0;

    for (let i = 0; i < fetchKeys.length; i++) {
      const { grade, year } = fetchKeys[i];
      if (!schoolName) schoolName = allResults[i].schoolName;
      totalRecords += allResults[i].totalRecords;

      if (!resultMap.has(grade)) resultMap.set(grade, new Map());
      const yearMap = resultMap.get(grade)!;

      if (!yearMap.has(year)) yearMap.set(year, new Set());
      const existing = yearMap.get(year)!;
      for (const s of allResults[i].subjects) existing.add(s);
    }

    // 학년별 최종 조립
    const finalByGrade: SubjectsByGrade = {};
    const gradeDataYear: GradeDataYear = {};
    const finalAllSubjects = new Set<string>();

    for (const grade of grades) {
      const gradeKey = `${grade}학년`;
      const yearMap = resultMap.get(grade);
      if (!yearMap) {
        finalByGrade[gradeKey] = [];
        gradeDataYear[gradeKey] = currentYearStr;
        continue;
      }

      const currentSubjects = yearMap.get(currentYearStr) || new Set<string>();
      const prevSubjects = yearMap.get(prevYearStr) || new Set<string>();

      if (currentSubjects.size >= 10) {
        finalByGrade[gradeKey] = [...currentSubjects];
        gradeDataYear[gradeKey] = currentYearStr;
      } else if (prevSubjects.size > 0) {
        const merged = new Set([...prevSubjects, ...currentSubjects]);
        finalByGrade[gradeKey] = [...merged];
        gradeDataYear[gradeKey] = prevYearStr;
      } else {
        finalByGrade[gradeKey] = [...currentSubjects];
        gradeDataYear[gradeKey] = currentYearStr;
      }

      for (const s of finalByGrade[gradeKey]) finalAllSubjects.add(s);
      finalByGrade[gradeKey].sort((a, b) => a.localeCompare(b, 'ko'));
    }

    // 2022 개정 교육과정 기본 과목 병합 (NEIS에 없어도 편성 가능한 과목)
    for (const s of CURRICULUM_2022_SUBJECTS) {
      finalAllSubjects.add(s);
    }

    const response = new Response(JSON.stringify({
      schoolName, schoolCode, regionCode,
      year: currentYearStr, semester: 'all',
      subjectsByGrade: finalByGrade,
      allSubjects: [...finalAllSubjects].sort((a, b) => a.localeCompare(b, 'ko')),
      totalRecords,
      gradeDataYear,
    } as SchoolSubjectsResult), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',  // 24시간 (과목 데이터는 학기 중 거의 불변)
      },
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return new Response(JSON.stringify({
      error: String(err),
      subjectsByGrade: {},
      allSubjects: [],
      totalRecords: 0,
      gradeDataYear: {},
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
