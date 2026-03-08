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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const regionCode = url.searchParams.get('regionCode') || '';
  const schoolCode = url.searchParams.get('schoolCode') || '';
  const year = url.searchParams.get('year') || String(new Date().getFullYear());
  const semester = url.searchParams.get('semester') || '1';

  if (!regionCode || !schoolCode) {
    return new Response(
      JSON.stringify({ error: 'regionCode and schoolCode are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = context.env.NEIS_API_KEY || '';

  // 시간표에서 과목 추출 - 페이지네이션으로 전체 데이터 수집
  const allSubjectsByGrade: SubjectsByGrade = {};
  const allSubjectsSet = new Set<string>();
  let totalRecords = 0;
  let schoolName = '';
  let page = 1;
  const pageSize = 1000;

  try {
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
      if (data?.RESULT) {
        if (page === 1) {
          return new Response(JSON.stringify({
            error: data.RESULT.MESSAGE,
            code: data.RESULT.CODE,
            subjectsByGrade: {},
            allSubjects: [],
            totalRecords: 0,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        break;
      }

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

        // 과목명 정규화: 불필요한 문자 제거
        const normalized = subject
          .replace(/^\d+\.\s*/, '')  // 앞의 숫자. 제거
          .trim();

        if (!normalized) continue;

        if (!allSubjectsByGrade[grade]) {
          allSubjectsByGrade[grade] = [];
        }

        // 중복 제거를 위해 Set 사용
        allSubjectsSet.add(normalized);

        if (!allSubjectsByGrade[grade].includes(normalized)) {
          allSubjectsByGrade[grade].push(normalized);
        }
      }

      // 모든 페이지 가져왔으면 종료
      if (page * pageSize >= totalRecords) break;
      page++;

      // 안전장치: 최대 20페이지 (20,000건)
      if (page > 20) break;
    }

    // 학년별 과목 정렬
    for (const grade in allSubjectsByGrade) {
      allSubjectsByGrade[grade].sort((a, b) => a.localeCompare(b, 'ko'));
    }

    const allSubjects = [...allSubjectsSet].sort((a, b) => a.localeCompare(b, 'ko'));

    const result: SchoolSubjectsResult = {
      schoolName,
      schoolCode,
      regionCode,
      year,
      semester,
      subjectsByGrade: allSubjectsByGrade,
      allSubjects,
      totalRecords,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
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
