/**
 * 학교 × 과목 매핑 인덱스 빌드
 * 입력: data/schoolinfo/api24-04-2025-d20-2022only.json (필터링된 2022 개정 only)
 * 출력: data/schoolinfo/school-subject-index.json
 *
 * 용도:
 *   학생이 본인 학교 코드(SCHUL_CODE)로 즉시 "이 학교에 ◯◯ 과목 개설됐나?" 답.
 *   RequiredSubjectsView 또는 새 컴포넌트가 이 인덱스 사용.
 */

import * as fs from 'fs';
import * as path from 'path';

const INPUT_FILE = path.resolve(
  process.cwd(),
  'data/schoolinfo/api24-04-2025-d20-2022only.json'
);
const OUTPUT_FILE = path.resolve(
  process.cwd(),
  'data/schoolinfo/school-subject-index.json'
);

interface SchoolSubject {
  subjectCount: number; // 운영 중인 과목 수
  totalTeachers: number; // 전체 교사 수 합 (api24 SUM_CNT)
  // 과목명 → 교사 수
  subjects: Record<string, number>;
  // 메타
  schoolName: string;
  schoolType: string;
  region: string;
  sigungu: string;
  // 학교 규모 (api10 학생수 + api08 수업교원수 + api09 학급)
  studentCount?: number;
  studentByGrade?: { grade1: number; grade2: number; grade3: number };
  teacherCountTotal?: number; // api08 ITRT_TCR_TOT_FGR
  weeklyHours?: number; // api08 WEEK_TOT_ITRT_HR_FGR
  classCount?: number; // api09 COL_C_SUM
  avgStudentsPerClass?: number; // api09 COL_SUM
  teacherCount?: number; // api09 TEACH_CNT
}

// 2015 명칭이 fully filter된 후에도 한 학교에 2015·2022 명칭 둘 다 있을 수 있음
// (예: 학교가 일부 학년 데이터를 2015 명칭 그대로 등록). renameMap으로 합산.
const LEGACY_FILE = path.resolve(process.cwd(), 'src/data/curriculum-2015-legacy.json');
const RENAME_MAP: Record<string, string> = (() => {
  try {
    const j = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf-8'));
    return j.renameMap ?? {};
  } catch {
    return {};
  }
})();

function normalizeSubject(s: string): string {
  return RENAME_MAP[s] ?? s;
}

// 학생수 (api10) + 수업·교원 통계 (api08) 보강 인덱스
function loadAuxIndex(file: string): Record<string, Record<string, any>> {
  try {
    const f = path.resolve(process.cwd(), file);
    if (!fs.existsSync(f)) return {};
    const j = JSON.parse(fs.readFileSync(f, 'utf-8'));
    const idx: Record<string, Record<string, any>> = {};
    for (const r of j.records as Array<Record<string, any>>) {
      const code = r['SCHUL_CODE'] as string;
      if (code) idx[code] = r;
    }
    return idx;
  } catch {
    return {};
  }
}
const STUDENT_IDX = loadAuxIndex('data/schoolinfo/api10-04-2025.json');
const HOURS_IDX = loadAuxIndex('data/schoolinfo/api08-04-2025.json');
const CLASS_IDX = loadAuxIndex('data/schoolinfo/api09-04-2025.json');

function main() {
  const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const records = input.records as Array<Record<string, any>>;
  console.log(`입력: ${records.length.toLocaleString()}건`);
  console.log(`renameMap: ${Object.keys(RENAME_MAP).length}개 매핑 적용`);
  console.log(`학생수 인덱스 (api10): ${Object.keys(STUDENT_IDX).length}개 학교`);
  console.log(`수업통계 인덱스 (api08): ${Object.keys(HOURS_IDX).length}개 학교`);

  const bySchool: Record<string, SchoolSubject> = {};
  const bySubject: Record<string, { schoolCount: number; totalTeachers: number }> = {};

  for (const r of records) {
    const code = r['SCHUL_CODE'] as string;
    const rawSbj = r['SBJT_NM'] as string;
    const sbj = rawSbj ? normalizeSubject(rawSbj) : '';
    const teachers = (r['SUM_CNT'] as number) || 0;
    if (!code || !sbj) continue;

    if (!bySchool[code]) {
      bySchool[code] = {
        subjectCount: 0,
        totalTeachers: 0,
        subjects: {},
        schoolName: r['SCHUL_NM'] as string,
        schoolType: (r['HS_KND_SC_NM'] as string) || '',
        region: (r['ATPT_OFCDC_ORG_NM'] as string) || '',
        sigungu: (r['ADRCD_NM'] as string) || '',
      };
    }
    const school = bySchool[code];
    school.subjects[sbj] = (school.subjects[sbj] || 0) + teachers;
    school.totalTeachers += teachers;

    if (!bySubject[sbj]) {
      bySubject[sbj] = { schoolCount: 0, totalTeachers: 0 };
    }
  }

  // subjectCount + 학생수·수업통계 후처리
  for (const code in bySchool) {
    const school = bySchool[code];
    school.subjectCount = Object.keys(school.subjects).length;

    // api10 학생수
    const stu = STUDENT_IDX[code];
    if (stu) {
      school.studentCount = stu['STDNT_SUM'] || 0;
      school.studentByGrade = {
        grade1: stu['STDNT_SUM_41'] || 0,
        grade2: stu['STDNT_SUM_42'] || 0,
        grade3: stu['STDNT_SUM_43'] || 0,
      };
    }
    // api08 수업·교원 통계
    const hrs = HOURS_IDX[code];
    if (hrs) {
      school.teacherCountTotal = hrs['ITRT_TCR_TOT_FGR'] || 0;
      school.weeklyHours = hrs['WEEK_TOT_ITRT_HR_FGR'] || 0;
    }
    // api09 학급 통계
    const cls = CLASS_IDX[code];
    if (cls) {
      school.classCount = cls['COL_C_SUM'] || 0;
      school.avgStudentsPerClass = cls['COL_SUM'] || 0;
      school.teacherCount = cls['TEACH_CNT'] || 0;
    }
  }
  // bySubject 보강 (학교 수)
  for (const code in bySchool) {
    const school = bySchool[code];
    for (const sbj in school.subjects) {
      bySubject[sbj].schoolCount++;
      bySubject[sbj].totalTeachers += school.subjects[sbj];
    }
  }

  const output = {
    _meta: {
      source: '학교알리미_KERIS_apiType=24_depthNo=20',
      apiId: 'schoolinfo.go.kr/openApi.do',
      curriculum: '2022 개정 (2015 개정 명칭 과목 제거됨)',
      license: '공공누리 출처표시',
      organization: '한국교육학술정보원(KERIS)',
      syncedAt: input._meta.syncedAt,
      filteredAt: input._meta.filterAppliedAt,
      builtAt: new Date().toISOString(),
      schoolCount: Object.keys(bySchool).length,
      subjectCount: Object.keys(bySubject).length,
      totalRecords: records.length,
    },
    bySchool,
    bySubject,
  };

  const tmp = OUTPUT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(output, null, 0), 'utf-8');
  fs.renameSync(tmp, OUTPUT_FILE);
  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  console.log(`저장: ${OUTPUT_FILE} (${sizeMB} MB)`);
  console.log(`  학교 수: ${output._meta.schoolCount.toLocaleString()}`);
  console.log(`  유니크 과목: ${output._meta.subjectCount.toLocaleString()}`);

  // 샘플
  const sampleCode = 'S010000379'; // 경복고
  const sample = bySchool[sampleCode];
  if (sample) {
    console.log(`\n샘플 — ${sampleCode} ${sample.schoolName}`);
    console.log(`  과목 수: ${sample.subjectCount}, 교사 수: ${sample.totalTeachers}`);
    console.log(`  주요 과목 5:`);
    Object.entries(sample.subjects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([sbj, cnt]) => console.log(`    ${sbj}: ${cnt}명`));
  }
}

main();
