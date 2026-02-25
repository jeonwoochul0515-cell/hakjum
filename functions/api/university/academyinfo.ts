interface Env {
  DATA_GO_KR_API_KEY: string;
}

const ACADEMY_HOST = 'http://openapi.academyinfo.go.kr/openapi/service/rest';
const SVY_YR = '2024';

function xmlTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function xmlTagAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// GET /api/university/academyinfo?school=대학이름
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return jsonResponse({});
  }

  const url = new URL(context.request.url);
  const schoolName = url.searchParams.get('school') || '';
  if (!schoolName) {
    return jsonResponse({});
  }

  try {
    // Step 1: schlId 조회
    const basicUrl = `${ACADEMY_HOST}/BasicInformationService/getComparisonBasicInformationSchoolList?ServiceKey=${encodeURIComponent(apiKey)}&schulNm=${encodeURIComponent(schoolName)}`;
    const basicXml = await fetchXml(basicUrl);
    const schlId = xmlTag(basicXml, 'schlId');

    if (!schlId) {
      return jsonResponse({});
    }

    // Step 2: 병렬 API 호출
    const base = (service: string, operation: string) =>
      `${ACADEMY_HOST}/${service}/${operation}?ServiceKey=${encodeURIComponent(apiKey)}&schlId=${schlId}&svyYr=${SVY_YR}`;

    const [
      competitionXml,
      employmentXml,
      fillingXml,
      dropoutXml,
      foreignXml,
      facultyXml,
      eduCostXml,
      coopXml,
    ] = await Promise.all([
      fetchXml(base('StudentService', 'getComparisonFreshmanChanceBalanceSelectionRatio')).catch(() => ''),
      fetchXml(base('StudentService', 'getComparisonGraduateEmployStatus')).catch(() => ''),
      fetchXml(base('StudentService', 'getComparisonStudentFillingRate')).catch(() => ''),
      fetchXml(base('StudentService', 'getComparisonDropoutStudent')).catch(() => ''),
      fetchXml(base('StudentService', 'getComparisonForeignStudentStatus')).catch(() => ''),
      fetchXml(base('EducationResearchService', 'getComparisonStudentPerFaculty')).catch(() => ''),
      fetchXml(base('FinancesService', 'getComparisonEduCostPerStudent')).catch(() => ''),
      fetchXml(base('IndustryAcademicCooperationService', 'getCntrctmjrInstOperCstt')).catch(() => ''),
    ]);

    // Step 3: XML 파싱 → 통합 JSON
    const result: Record<string, number | undefined> = {};

    // 경쟁률: <cmpttRt> 또는 <avrgCmpttRt>
    const cmpttRt = xmlTag(competitionXml, 'avrgCmpttRt') || xmlTag(competitionXml, 'cmpttRt');
    if (cmpttRt) result.competitionRate = parseFloat(cmpttRt);

    // 취업률: <emplymRt> 또는 <emplymRat>
    const emplymRt = xmlTag(employmentXml, 'emplymRat') || xmlTag(employmentXml, 'emplymRt');
    if (emplymRt) result.employmentRate = parseFloat(emplymRt);

    // 충원율: <flngRt> 또는 <frshlFlngRt>
    const fillingRt = xmlTag(fillingXml, 'frshlFlngRt') || xmlTag(fillingXml, 'flngRt');
    if (fillingRt) result.fillingRate = parseFloat(fillingRt);

    // 중퇴율: <drstRt> 또는 <drpotRt>
    const dropoutRt = xmlTag(dropoutXml, 'drpotRt') || xmlTag(dropoutXml, 'drstRt');
    if (dropoutRt) result.dropoutRate = parseFloat(dropoutRt);

    // 외국인학생수: <frgnStdnt> 합산
    const foreignCounts = xmlTagAll(foreignXml, 'frgnStdnt');
    if (foreignCounts.length > 0) {
      const total = foreignCounts.reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
      if (total > 0) result.foreignStudents = total;
    }

    // 교원1인당학생수: <stdntPrfsrRt> 또는 <prfsStdntCnt>
    const spf = xmlTag(facultyXml, 'prfsStdntCnt') || xmlTag(facultyXml, 'stdntPrfsrRt');
    if (spf) result.studentsPerFaculty = parseFloat(spf);

    // 학생1인당교육비: <stdntCtAmt> 또는 <perStdntEdctnCst>
    const eduCost = xmlTag(eduCostXml, 'perStdntEdctnCst') || xmlTag(eduCostXml, 'stdntCtAmt');
    if (eduCost) result.eduCostPerStudent = parseInt(eduCost, 10);

    // 산학협력: <cntrctCnt> 또는 건수 합산
    const coopCounts = xmlTagAll(coopXml, 'cntrctCnt');
    if (coopCounts.length > 0) {
      const total = coopCounts.reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
      if (total > 0) result.industryCoopCount = total;
    }

    return jsonResponse(result);
  } catch (err) {
    console.error('[academyinfo] error:', err);
    return jsonResponse({});
  }
};

function jsonResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
