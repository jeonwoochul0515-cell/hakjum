// NEIS 고등학교 개설과목 실시간 파이프라인
// GET /api/neis/subjects?regionCode=C10&schoolCode=7150119&year=2025&semester=1

interface Env {
  NEIS_API_KEY?: string;
}

interface SubjectsByGrade {
  [grade: string]: string[];  // "1학년": ["국어", "수학", ...]
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

  try {
    let mergedByGrade: SubjectsByGrade = {};
    let mergedSubjects = new Set<string>();
    let totalRecords = 0;
    let schoolName = '';

    // 특정 연도/학기가 지정된 경우 해당 데이터만 조회
    if (requestedYear && requestedSemester) {
      const result = await fetchTimetableSubjects(regionCode, schoolCode, requestedYear, requestedSemester, apiKey);
      mergedByGrade = result.subjectsByGrade;
      mergedSubjects = result.allSubjects;
      totalRecords = result.totalRecords;
      schoolName = result.schoolName;
    } else {
      // 자동 모드: 현재 연도 양 학기 + 부족하면 이전 연도까지 조회
      const yearsToTry = [String(currentYear), String(currentYear - 1)];
      const semesters = ['1', '2'];

      for (const year of yearsToTry) {
        for (const sem of semesters) {
          const result = await fetchTimetableSubjects(regionCode, schoolCode, year, sem, apiKey);

          if (!schoolName && result.schoolName) schoolName = result.schoolName;
          totalRecords += result.totalRecords;

          // 학년별 과목 병합
          for (const [grade, subjects] of Object.entries(result.subjectsByGrade)) {
            if (!mergedByGrade[grade]) mergedByGrade[grade] = [];
            for (const subj of subjects) {
              if (!mergedByGrade[grade].includes(subj)) {
                mergedByGrade[grade].push(subj);
              }
            }
          }

          // 전체 과목 병합
          for (const subj of result.allSubjects) {
            mergedSubjects.add(subj);
          }
        }

        // 충분한 과목을 가져왔으면 이전 연도 조회 생략
        if (mergedSubjects.size >= 10) break;
      }
    }

    // 학년별 과목 정렬
    for (const grade in mergedByGrade) {
      mergedByGrade[grade].sort((a, b) => a.localeCompare(b, 'ko'));
    }

    const allSubjects = [...mergedSubjects].sort((a, b) => a.localeCompare(b, 'ko'));

    const result: SchoolSubjectsResult = {
      schoolName,
      schoolCode,
      regionCode,
      year: requestedYear || String(currentYear),
      semester: requestedSemester || 'all',
      subjectsByGrade: mergedByGrade,
      allSubjects,
      totalRecords,
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
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
