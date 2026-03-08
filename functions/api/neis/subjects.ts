// NEIS 고등학교 개설과목 실시간 파이프라인
// GET /api/neis/subjects?regionCode=C10&schoolCode=7150119&year=2025&semester=1

interface Env {
  NEIS_API_KEY?: string;
}

interface SubjectsByGrade {
  [grade: string]: string[];  // "2학년": ["국어", "수학", ...]
}

// 학년별 데이터 출처 연도 ("2026" 또는 "2025")
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
  gradeDataYear: GradeDataYear;  // 학년별 데이터 기준 연도
}

// NEIS 시간표에서 과목이 아닌 항목 필터링
const EXCLUDED_PATTERNS = /^(대체공휴일|공휴일|재량활동|자습|보충학습|방학|휴업일|개교기념일|졸업식|입학식|중간고사|기말고사|시험|수련활동|현장체험|수학여행|체험학습|학교행사|행사|방과후|야간자율학습|석식|조회|종례|청소|\.+|-)$/;

function isValidSubject(name: string): boolean {
  if (!name || name.length < 2) return false;
  if (EXCLUDED_PATTERNS.test(name)) return false;
  // 숫자/특수문자만으로 이루어진 경우 제외
  if (/^[\d\s.·\-_]+$/.test(name)) return false;
  return true;
}

// NEIS 분반 기호 정규화: "지구과학A 지구과학" → "지구과학", "사회·문화B 사회 문화" → "사회·문화"
function normalizeSubjectName(raw: string): string {
  let name = raw.replace(/^\d+\.\s*/, '').trim();
  // 분반 패턴: 한글/로마숫자 뒤에 영대문자 + 공백 + 기본 과목명 → 분반 이전 이름 사용
  name = name.replace(/([가-힣\u2160-\u217F])[A-Z]\s+.+$/, '$1').trim();
  // 단독 분반 기호 (뒤에 기본명 없는 경우): "미적분A" → "미적분"
  name = name.replace(/([가-힣\u2160-\u217F])[A-H]$/, '$1').trim();
  return name;
}

// 특정 학년+학기의 고유 과목명만 추출 (GRADE 파라미터로 학년별 개별 조회)
async function fetchGradeSubjects(
  regionCode: string,
  schoolCode: string,
  year: string,
  semester: string,
  grade: string,
  apiKey: string,
): Promise<{ subjects: string[]; schoolName: string; totalRecords: number }> {
  const subjects = new Set<string>();
  let schoolName = '';
  let totalRecords = 0;
  let page = 1;
  const pageSize = 1000;  // NEIS 실제 최대 반환 수

  while (true) {
    const params = new URLSearchParams({
      Type: 'json',
      pIndex: String(page),
      pSize: String(pageSize),
      ATPT_OFCDC_SC_CODE: regionCode,
      SD_SCHUL_CODE: schoolCode,
      AY: year,
      SEM: semester,
      GRADE: grade,
    });

    if (apiKey) params.set('KEY', apiKey);

    const response = await fetch(`https://open.neis.go.kr/hub/hisTimetable?${params}`);
    if (!response.ok) break;

    const data = await response.json() as any;
    if (data?.RESULT) break;  // 데이터 없음

    const timetable = data?.hisTimetable;
    if (!timetable || timetable.length < 2) break;

    if (page === 1) {
      totalRecords = timetable[0]?.head?.[0]?.list_total_count || 0;
    }

    const rows = timetable[1]?.row || [];
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!schoolName) schoolName = row.SCHUL_NM || '';

      const raw = (row.ITRT_CNTNT || '').trim();
      if (!raw) continue;

      const normalized = normalizeSubjectName(raw);
      if (normalized && isValidSubject(normalized)) {
        subjects.add(normalized);
      }
    }

    if (page * pageSize >= totalRecords) break;
    page++;
    if (page > 10) break;  // 안전장치
  }

  return { subjects: [...subjects], schoolName, totalRecords };
}

// 특정 학년의 양 학기를 병렬 조회하여 과목 병합
async function fetchGradeYearSubjects(
  regionCode: string,
  schoolCode: string,
  year: string,
  grade: string,
  apiKey: string,
): Promise<{ subjects: string[]; schoolName: string; totalRecords: number }> {
  const [sem1, sem2] = await Promise.all([
    fetchGradeSubjects(regionCode, schoolCode, year, '1', grade, apiKey),
    fetchGradeSubjects(regionCode, schoolCode, year, '2', grade, apiKey),
  ]);

  const merged = new Set<string>([...sem1.subjects, ...sem2.subjects]);
  return {
    subjects: [...merged],
    schoolName: sem1.schoolName || sem2.schoolName,
    totalRecords: sem1.totalRecords + sem2.totalRecords,
  };
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

  const apiKey = context.env.NEIS_API_KEY || '';
  const currentYear = new Date().getFullYear();
  const currentYearStr = String(currentYear);
  const prevYearStr = String(currentYear - 1);

  try {
    // 특정 연도/학기가 지정된 경우 해당 데이터만 조회
    if (requestedYear && requestedSemester) {
      // 3개 학년 병렬 조회
      const grades = ['1', '2', '3'];
      const results = await Promise.all(
        grades.map((g) => fetchGradeSubjects(regionCode, schoolCode, requestedYear, requestedSemester, g, apiKey))
      );

      const subjectsByGrade: SubjectsByGrade = {};
      const allSubjects = new Set<string>();
      let schoolName = '';
      let totalRecords = 0;

      for (let i = 0; i < grades.length; i++) {
        const key = `${grades[i]}학년`;
        subjectsByGrade[key] = results[i].subjects.sort((a, b) => a.localeCompare(b, 'ko'));
        for (const s of results[i].subjects) allSubjects.add(s);
        if (!schoolName) schoolName = results[i].schoolName;
        totalRecords += results[i].totalRecords;
      }

      return new Response(JSON.stringify({
        schoolName, schoolCode, regionCode,
        year: requestedYear, semester: requestedSemester,
        subjectsByGrade,
        allSubjects: [...allSubjects].sort((a, b) => a.localeCompare(b, 'ko')),
        totalRecords,
        gradeDataYear: {},
      } as SchoolSubjectsResult), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // ── 자동 모드: 학년별 독립 조회 ──
    // 3개 학년 × 현재연도 양 학기를 병렬 조회
    const grades = ['1', '2', '3'];
    const currentResults = await Promise.all(
      grades.map((g) => fetchGradeYearSubjects(regionCode, schoolCode, currentYearStr, g, apiKey))
    );

    // 부족한 학년은 이전 연도 조회
    // 10과목 미만이면 불충분 (학기 초 일부 데이터만 있는 경우 이전 연도 보강)
    const needsPrevYear = grades.filter((_, i) => currentResults[i].subjects.length < 10);
    let prevResults: Map<string, Awaited<ReturnType<typeof fetchGradeYearSubjects>>> | null = null;

    if (needsPrevYear.length > 0) {
      const prevFetches = await Promise.all(
        needsPrevYear.map((g) => fetchGradeYearSubjects(regionCode, schoolCode, prevYearStr, g, apiKey))
      );
      prevResults = new Map();
      for (let i = 0; i < needsPrevYear.length; i++) {
        prevResults.set(needsPrevYear[i], prevFetches[i]);
      }
    }

    // 최종 조립
    const finalByGrade: SubjectsByGrade = {};
    const gradeDataYear: GradeDataYear = {};
    const finalAllSubjects = new Set<string>();
    let schoolName = '';
    let totalRecords = 0;

    for (let i = 0; i < grades.length; i++) {
      const gradeKey = `${grades[i]}학년`;
      const current = currentResults[i];
      if (!schoolName) schoolName = current.schoolName;
      totalRecords += current.totalRecords;

      if (current.subjects.length >= 10) {
        // 현재 연도 데이터 충분
        finalByGrade[gradeKey] = current.subjects;
        gradeDataYear[gradeKey] = currentYearStr;
      } else if (prevResults?.has(grades[i])) {
        // 이전 연도 데이터로 보강
        const prev = prevResults.get(grades[i])!;
        if (!schoolName) schoolName = prev.schoolName;
        totalRecords += prev.totalRecords;

        if (prev.subjects.length > 0) {
          const merged = new Set<string>([...prev.subjects, ...current.subjects]);
          finalByGrade[gradeKey] = [...merged];
          gradeDataYear[gradeKey] = prevYearStr;
        } else {
          finalByGrade[gradeKey] = current.subjects;
          gradeDataYear[gradeKey] = currentYearStr;
        }
      } else {
        finalByGrade[gradeKey] = current.subjects;
        gradeDataYear[gradeKey] = currentYearStr;
      }

      for (const s of finalByGrade[gradeKey]) finalAllSubjects.add(s);
      finalByGrade[gradeKey].sort((a, b) => a.localeCompare(b, 'ko'));
    }

    return new Response(JSON.stringify({
      schoolName, schoolCode, regionCode,
      year: currentYearStr, semester: 'all',
      subjectsByGrade: finalByGrade,
      allSubjects: [...finalAllSubjects].sort((a, b) => a.localeCompare(b, 'ko')),
      totalRecords,
      gradeDataYear,
    } as SchoolSubjectsResult), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
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
