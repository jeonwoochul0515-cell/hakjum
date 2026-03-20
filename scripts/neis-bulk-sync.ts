/**
 * NEIS 전국 고등학교 데이터 벌크 동기화 스크립트
 * 실행: npx tsx scripts/neis-bulk-sync.ts [--region C10]
 *
 * 전국 17개 시도교육청의 고등학교 목록 + 개설과목을 수집하여
 * data/regions/{regionCode}.json 에 저장합니다.
 */

const NEIS_BASE = 'https://open.neis.go.kr/hub';
const API_KEY = process.env.NEIS_API_KEY;
if (!API_KEY) {
  console.error('❌ NEIS_API_KEY 환경변수를 설정해주세요.');
  process.exit(1);
}
const DELAY_MS = 200;

const REGION_CODES: Record<string, string> = {
  B10: '서울', C10: '부산', D10: '대구', E10: '인천',
  F10: '광주', G10: '대전', H10: '울산', I10: '세종',
  J10: '경기', K10: '강원', M10: '충북', N10: '충남',
  P10: '전북', Q10: '전남', R10: '경북', S10: '경남', T10: '제주',
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface SchoolInfo {
  code: string;
  name: string;
  type: string;
  address: string;
}

async function fetchSchools(regionCode: string): Promise<SchoolInfo[]> {
  const schools: SchoolInfo[] = [];
  let page = 1;
  const size = 100;

  while (true) {
    const params = new URLSearchParams({
      KEY: API_KEY,
      Type: 'json',
      pIndex: String(page),
      pSize: String(size),
      ATPT_OFCDC_SC_CODE: regionCode,
      SCHUL_KND_SC_NM: '고등학교',
    });

    try {
      const data = await fetchJSON(`${NEIS_BASE}/schoolInfo?${params}`);
      const rows = data?.schoolInfo?.[1]?.row;
      if (!rows || rows.length === 0) break;

      for (const r of rows) {
        schools.push({
          code: r.SD_SCHUL_CODE,
          name: r.SCHUL_NM,
          type: r.HS_SC_NM || '일반고',
          address: r.ORG_RDNMA || '',
        });
      }

      if (rows.length < size) break;
      page++;
    } catch (e) {
      console.warn(`  ⚠️ fetchSchools(${regionCode}) page ${page} 실패:`, e);
      break;
    }

    await sleep(DELAY_MS);
  }

  return schools;
}

async function fetchSubjects(regionCode: string, schoolCode: string): Promise<string[]> {
  const now = new Date();
  const year = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  const subjects = new Set<string>();

  // 1학기 4월 1주차 4주간
  const fromDate = `${year}0407`;
  const toDate = `${year}0502`;

  const params = new URLSearchParams({
    KEY: API_KEY,
    Type: 'json',
    pIndex: '1',
    pSize: '1000',
    ATPT_OFCDC_SC_CODE: regionCode,
    SD_SCHUL_CODE: schoolCode,
    AY: String(year),
    TI_FROM_YMD: fromDate,
    TI_TO_YMD: toDate,
  });

  try {
    const data = await fetchJSON(`${NEIS_BASE}/hisTimetable?${params}`);
    const rows = data?.hisTimetable?.[1]?.row;
    if (rows) {
      for (const r of rows) {
        const subj = (r.ITRT_CNTNT || '').trim();
        if (subj && subj.length > 0 && !isNonSubject(subj)) {
          subjects.add(normalizeSubject(subj));
        }
      }
    }
  } catch { /* ignore */ }

  return Array.from(subjects).sort();
}

function isNonSubject(name: string): boolean {
  const skip = ['자율', '창체', '방과후', '보충', '자습', '재량', '특활', '행사', '수련',
    '대체공휴', '공휴', '어린이날', '석가탄신', '현충일', '광복절', '개천절', '한글날',
    '추석', '설날', '대통령', '선거', '개교기념', '졸업', '입학', '종업', '중간고사', '기말고사',
    '시험', '고사'];
  return skip.some((kw) => name.includes(kw));
}

function normalizeSubject(name: string): string {
  return name.replace(/\s*\([^)]*\)$/, '').replace(/\s*[A-Z]반$/, '').trim();
}

async function syncRegion(regionCode: string, regionName: string) {
  console.log(`\n📍 [${regionCode}] ${regionName} 시작...`);

  const schools = await fetchSchools(regionCode);
  console.log(`  학교 ${schools.length}개 발견`);

  const results: Record<string, any> = {};
  let done = 0;

  for (const school of schools) {
    const subjects = await fetchSubjects(regionCode, school.code);
    results[school.code] = {
      name: school.name,
      type: school.type,
      address: school.address,
      subjectCount: subjects.length,
      subjects,
    };

    done++;
    if (done % 10 === 0 || done === schools.length) {
      process.stdout.write(`\r  진행: ${done}/${schools.length} (${Math.round(done / schools.length * 100)}%)`);
    }

    await sleep(DELAY_MS);
  }

  console.log('');

  // 파일 저장
  const fs = await import('fs');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'data', 'regions');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${regionCode}.json`);
  fs.writeFileSync(filePath, JSON.stringify({
    regionCode,
    regionName,
    syncDate: new Date().toISOString(),
    schoolCount: schools.length,
    schools: results,
  }, null, 2));

  console.log(`  ✅ 저장: ${filePath} (${schools.length}개교)`);
  return schools.length;
}

async function main() {
  const args = process.argv.slice(2);
  const regionArg = args.indexOf('--region');
  const targetRegion = regionArg >= 0 ? args[regionArg + 1] : null;

  console.log('🦋 NEIS 전국 고등학교 벌크 동기화');
  console.log(`📅 ${new Date().toISOString()}`);

  if (targetRegion && !REGION_CODES[targetRegion]) {
    console.error(`❌ 유효하지 않은 지역 코드: ${targetRegion}`);
    console.error(`   사용 가능한 코드: ${Object.keys(REGION_CODES).join(', ')}`);
    process.exit(1);
  }

  const regions = targetRegion
    ? [[targetRegion, REGION_CODES[targetRegion]]] as const
    : Object.entries(REGION_CODES);

  let totalSchools = 0;
  let regionDone = 0;

  for (const [code, name] of regions) {
    const count = await syncRegion(code, name);
    totalSchools += count;
    regionDone++;
    console.log(`  [${regionDone}/${regions.length}] 지역 완료`);
  }

  // 메타 저장
  const fs = await import('fs');
  const path = await import('path');
  const metaPath = path.join(process.cwd(), 'data', 'regions', '_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify({
    lastSync: new Date().toISOString(),
    regionCount: regions.length,
    totalSchools,
  }, null, 2));

  console.log(`\n🎉 완료! ${regions.length}개 지역, 총 ${totalSchools}개교 동기화`);
}

main().catch(console.error);
