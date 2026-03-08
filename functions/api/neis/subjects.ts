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

async function fetchTimetableSubjects(
  regionCode: string,
  schoolCode: string,
  year: string,
  semester: string,
  apiKey: string,
): Promise<{ subjectsByGrade: SubjectsByGrade; allSubjects: Set<string>; totalRecords: number; schoolName: string }> {
  const allSubjectsByGrade: SubjectsByGrade = {};
  const allSubjectsSet = new Set<string>();
  let totalRecords = 0;
  let schoolName = '';
  let page = 1;
  const pageSize = 1000;

  while (true) {
    const params = new URLSearchParams({
      Type: 'json',
      pIndex: String(page),
      pSize: String(pageSize),
      ATPT_OFCDC_SC_CODE: regionCode,
      SD_SCHUL_CODE: schoolCode,
      AY: year,
      SEM: semester,
    });

    if (apiKey) params.set('KEY', apiKey);

    const apiUrl = `https://open.neis.go.kr/hub/hisTimetable?${params}`;
    const response = await fetch(apiUrl);

    if (!response.ok) break;

    const data = await response.json() as any;

    // NEIS 에러 (데이터 없음 등)
    if (data?.RESULT) break;

    const timetable = data?.hisTimetable;
    if (!timetable || timetable.length < 2) break;

    if (page === 1) {
      totalRecords = timetable[0]?.head?.[0]?.list_total_count || 0;
    }

    const rows = timetable[1]?.row || [];
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!schoolName) schoolName = row.SCHUL_NM || '';

      const grade = `${row.GRADE || '?'}학년`;
      const subject = (row.ITRT_CNTNT || '').trim();

      if (!subject) continue;

      const normalized = subject
        .replace(/^\d+\.\s*/, '')
        .trim();

      if (!normalized) continue;

      if (!allSubjectsByGrade[grade]) {
        allSubjectsByGrade[grade] = [];
      }

      allSubjectsSet.add(normalized);

      if (!allSubjectsByGrade[grade].includes(normalized)) {
        allSubjectsByGrade[grade].push(normalized);
      }
    }

    if (page * pageSize >= totalRecords) break;
    page++;

    if (page > 20) break;
  }

  return { subjectsByGrade: allSubjectsByGrade, allSubjects: allSubjectsSet, totalRecords, schoolName };
}

// 특정 연도의 양 학기를 합쳐서 학년별 과목을 조회
async function fetchYearSubjects(
  regionCode: string,
  schoolCode: string,
  year: string,
  apiKey: string,
): Promise<{ subjectsByGrade: SubjectsByGrade; allSubjects: Set<string>; totalRecords: number; schoolName: string }> {
  const merged: SubjectsByGrade = {};
  const allSubjects = new Set<string>();
  let totalRecords = 0;
  let schoolName = '';

  for (const sem of ['1', '2']) {
    const result = await fetchTimetableSubjects(regionCode, schoolCode, year, sem, apiKey);
    if (!schoolName && result.schoolName) schoolName = result.schoolName;
    totalRecords += result.totalRecords;

    for (const [grade, subjects] of Object.entries(result.subjectsByGrade)) {
      if (!merged[grade]) merged[grade] = [];
      for (const subj of subjects) {
        if (!merged[grade].includes(subj)) {
          merged[grade].push(subj);
        }
      }
    }

    for (const subj of result.allSubjects) {
      allSubjects.add(subj);
    }
  }

  return { subjectsByGrade: merged, allSubjects, totalRecords, schoolName };
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
      const result = await fetchTimetableSubjects(regionCode, schoolCode, requestedYear, requestedSemester, apiKey);

      for (const grade in result.subjectsByGrade) {
        result.subjectsByGrade[grade].sort((a, b) => a.localeCompare(b, 'ko'));
      }

      const resp: SchoolSubjectsResult = {
        schoolName: result.schoolName,
        schoolCode,
        regionCode,
        year: requestedYear,
        semester: requestedSemester,
        subjectsByGrade: result.subjectsByGrade,
        allSubjects: [...result.allSubjects].sort((a, b) => a.localeCompare(b, 'ko')),
        totalRecords: result.totalRecords,
        gradeDataYear: {},
      };

      return new Response(JSON.stringify(resp), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // ── 자동 모드: 학년별로 독립 조회 ──

    // Step 1: 현재 연도(2026) 양 학기 데이터 조회
    const currentData = await fetchYearSubjects(regionCode, schoolCode, currentYearStr, apiKey);

    // Step 2: 2학년/3학년 과목이 부족하면 이전 연도(2025) 조회
    const grade2Current = currentData.subjectsByGrade['2학년'] || [];
    const grade3Current = currentData.subjectsByGrade['3학년'] || [];
    const needsFallback = grade2Current.length < 3 || grade3Current.length < 3;

    let prevData: Awaited<ReturnType<typeof fetchYearSubjects>> | null = null;
    if (needsFallback) {
      prevData = await fetchYearSubjects(regionCode, schoolCode, prevYearStr, apiKey);
    }

    // Step 3: 학년별 최종 데이터 조립 + 기준 연도 추적
    const finalByGrade: SubjectsByGrade = {};
    const gradeDataYear: GradeDataYear = {};
    const finalAllSubjects = new Set<string>();
    let schoolName = currentData.schoolName || prevData?.schoolName || '';
    let totalRecords = currentData.totalRecords;

    const targetGrades = ['1학년', '2학년', '3학년'];

    for (const grade of targetGrades) {
      const currentSubjects = currentData.subjectsByGrade[grade] || [];

      if (currentSubjects.length >= 3) {
        // 현재 연도 데이터 사용
        finalByGrade[grade] = currentSubjects;
        gradeDataYear[grade] = currentYearStr;
      } else if (prevData) {
        // 이전 연도 데이터로 대체
        const prevSubjects = prevData.subjectsByGrade[grade] || [];
        if (prevSubjects.length > currentSubjects.length) {
          // 이전 연도가 더 많으면 이전 연도 기반 + 현재 연도 병합
          const merged = [...prevSubjects];
          for (const subj of currentSubjects) {
            if (!merged.includes(subj)) merged.push(subj);
          }
          finalByGrade[grade] = merged;
          gradeDataYear[grade] = prevYearStr;
          totalRecords += prevData.totalRecords;
        } else {
          finalByGrade[grade] = currentSubjects;
          gradeDataYear[grade] = currentYearStr;
        }
      } else {
        finalByGrade[grade] = currentSubjects;
        gradeDataYear[grade] = currentYearStr;
      }

      // 전체 과목에 추가
      for (const subj of finalByGrade[grade]) {
        finalAllSubjects.add(subj);
      }
    }

    // 기타 학년 (혹시 있다면)
    const allGradeKeys = new Set([
      ...Object.keys(currentData.subjectsByGrade),
      ...(prevData ? Object.keys(prevData.subjectsByGrade) : []),
    ]);
    for (const grade of allGradeKeys) {
      if (!finalByGrade[grade]) {
        finalByGrade[grade] = currentData.subjectsByGrade[grade] || prevData?.subjectsByGrade[grade] || [];
        gradeDataYear[grade] = currentData.subjectsByGrade[grade]?.length ? currentYearStr : prevYearStr;
        for (const subj of finalByGrade[grade]) {
          finalAllSubjects.add(subj);
        }
      }
    }

    // 학년별 과목 정렬
    for (const grade in finalByGrade) {
      finalByGrade[grade].sort((a, b) => a.localeCompare(b, 'ko'));
    }

    const result: SchoolSubjectsResult = {
      schoolName,
      schoolCode,
      regionCode,
      year: currentYearStr,
      semester: 'all',
      subjectsByGrade: finalByGrade,
      allSubjects: [...finalAllSubjects].sort((a, b) => a.localeCompare(b, 'ko')),
      totalRecords,
      gradeDataYear,
    };

    return new Response(JSON.stringify(result), {
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
