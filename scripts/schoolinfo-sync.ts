/**
 * 학교알리미(KERIS) OPEN API 동기화
 * 실행 예시:
 *   npx tsx scripts/schoolinfo-sync.ts --apiType 0 --level 04
 *   npx tsx scripts/schoolinfo-sync.ts --apiType 0 --level 04 --sido 11
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PDF 명세 (학교알리미 OPEN API 개발자 가이드, 2024) 기반
 *
 *   Endpoint: https://www.schoolinfo.go.kr/openApi.do
 *   방식    : REST · GET
 *   응답    : JSON
 *   라이선스: 공공누리 출처표시 (영리·변경·2차 저작물 자유)
 *   트래픽 : 제한없음
 *   보존    : 최근 3년 (이전은 EDSS)
 *
 *   필수 파라미터 5개:
 *     apiKey       — 학교알리미 OPEN API 인증키 (소셜로그인 발급)
 *     apiType      — API 종류 코드 (0 = 학교기본정보, 그 외 항목별 상이)
 *     sidoCode     — 시도코드 (2자리, 예: 11=서울)
 *     sggCode      — 시군구코드 (5자리, 예: 11110=종로구)
 *     schulKndCode — 학교급 (02 초/03 중/04 고/05 특수/06 그외/07 각종)
 *
 *   응답 형식:
 *     { resultCode: "success", resultMsg: "성공", list: [ {...}, ... ] }
 *
 *   페이지네이션 없음. 호출 단위 = (시도, 시군구, 학교급) 1회.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 인증키
 *   .dev.vars 의 SCHOOLINFO_API_KEY (학교알리미 자체 키)
 *   data.go.kr/15098092 활용신청 시에도 별도 키이지만, KCUE 키 재사용 가능 사례 보고됨.
 *   여기서는 SCHOOLINFO_API_KEY 우선, fallback DATA_GO_KR_API_KEY.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * apiType 매핑 (확정 1건, 나머지는 학교알리미 사이트에서 확인 필요)
 *   0 = 학교기본정보  ✓ 검증완료
 *   ?? = 교육과정 편성·운영 및 평가에 관한 사항 ← hakjum 핵심 (사용자 확인 필요)
 *   ?? = 자유학기제 운영
 *   ?? = 학년별·학급별 학생수
 *   기타 카테고리는 schoolinfo.go.kr/ng/go/pnnggo_a01_l0.do (API 제공목록) 클릭 시 확인
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── .dev.vars 로드 ───────────────────────────────────────────────────────
function loadDevVars() {
  const file = path.resolve(process.cwd(), '.dev.vars');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadDevVars();

const API_KEY = process.env.SCHOOLINFO_API_KEY || process.env.DATA_GO_KR_API_KEY;
if (!API_KEY) {
  console.error('❌ SCHOOLINFO_API_KEY (또는 DATA_GO_KR_API_KEY) 미설정.');
  console.error('   학교알리미 → 로그인(Kakao 등) → 마이페이지 인증키');
  console.error('   또는 활용신청: https://www.data.go.kr/data/15098092/openapi.do');
  process.exit(1);
}

// ─── 상수 ────────────────────────────────────────────────────────────────
const ENDPOINT = 'https://www.schoolinfo.go.kr/openApi.do';
const DELAY_MS = 200;
const MAX_PAGE_RETRIES = 3;

// ─── 시도·시군구 매트릭스 (17개 시도 × 대표 시군구 — 점진 확장) ─────────
// 검증 단계: 각 시도 1~2개 시군구만. 풀 매트릭스는 후속 PR에서 학교알리미
// "시도시군구코드.xlsx" 다운로드 후 sido-sgg-codes.json 으로 분리 예정.
interface RegionEntry {
  sido: string;
  sidoCode: string;
  sggList: { sggCode: string; sggName: string }[];
}

const REGIONS: RegionEntry[] = [
  {
    sido: '서울특별시',
    sidoCode: '11',
    sggList: [
      { sggCode: '11110', sggName: '종로구' },
      { sggCode: '11140', sggName: '중구' },
      { sggCode: '11170', sggName: '용산구' },
      { sggCode: '11200', sggName: '성동구' },
      { sggCode: '11215', sggName: '광진구' },
      { sggCode: '11230', sggName: '동대문구' },
      { sggCode: '11260', sggName: '중랑구' },
      { sggCode: '11290', sggName: '성북구' },
      { sggCode: '11305', sggName: '강북구' },
      { sggCode: '11320', sggName: '도봉구' },
      { sggCode: '11350', sggName: '노원구' },
      { sggCode: '11380', sggName: '은평구' },
      { sggCode: '11410', sggName: '서대문구' },
      { sggCode: '11440', sggName: '마포구' },
      { sggCode: '11470', sggName: '양천구' },
      { sggCode: '11500', sggName: '강서구' },
      { sggCode: '11530', sggName: '구로구' },
      { sggCode: '11545', sggName: '금천구' },
      { sggCode: '11560', sggName: '영등포구' },
      { sggCode: '11590', sggName: '동작구' },
      { sggCode: '11620', sggName: '관악구' },
      { sggCode: '11650', sggName: '서초구' },
      { sggCode: '11680', sggName: '강남구' },
      { sggCode: '11710', sggName: '송파구' },
      { sggCode: '11740', sggName: '강동구' },
    ],
  },
  // 검증 단계의 다른 시도 — 대표 시군구 1개씩
  { sido: '부산광역시', sidoCode: '26', sggList: [{ sggCode: '26110', sggName: '중구' }] },
  { sido: '대구광역시', sidoCode: '27', sggList: [{ sggCode: '27110', sggName: '중구' }] },
  { sido: '인천광역시', sidoCode: '28', sggList: [{ sggCode: '28110', sggName: '중구' }] },
  { sido: '광주광역시', sidoCode: '29', sggList: [{ sggCode: '29110', sggName: '동구' }] },
  { sido: '대전광역시', sidoCode: '30', sggList: [{ sggCode: '30110', sggName: '동구' }] },
  { sido: '울산광역시', sidoCode: '31', sggList: [{ sggCode: '31110', sggName: '중구' }] },
  { sido: '세종특별자치시', sidoCode: '36', sggList: [{ sggCode: '36110', sggName: '세종시' }] },
  { sido: '경기도', sidoCode: '41', sggList: [{ sggCode: '41110', sggName: '수원시' }] },
  { sido: '강원특별자치도', sidoCode: '42', sggList: [{ sggCode: '42110', sggName: '춘천시' }] },
  { sido: '충청북도', sidoCode: '43', sggList: [{ sggCode: '43110', sggName: '청주시' }] },
  { sido: '충청남도', sidoCode: '44', sggList: [{ sggCode: '44130', sggName: '천안시' }] },
  { sido: '전북특별자치도', sidoCode: '45', sggList: [{ sggCode: '45110', sggName: '전주시' }] },
  { sido: '전라남도', sidoCode: '46', sggList: [{ sggCode: '46110', sggName: '목포시' }] },
  { sido: '경상북도', sidoCode: '47', sggList: [{ sggCode: '47110', sggName: '포항시' }] },
  { sido: '경상남도', sidoCode: '48', sggList: [{ sggCode: '48121', sggName: '창원시' }] },
  { sido: '제주특별자치도', sidoCode: '50', sggList: [{ sggCode: '50110', sggName: '제주시' }] },
];

const LEVEL_NAMES: Record<string, string> = {
  '02': '초등학교',
  '03': '중학교',
  '04': '고등학교',
  '05': '특수학교',
  '06': '그외',
  '07': '각종학교',
};

// ─── CLI ─────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let apiType = '0';
  let level = '04'; // 고등학교 기본
  let sidoFilter: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apiType' && args[i + 1]) apiType = args[++i];
    else if (args[i] === '--level' && args[i + 1]) level = args[++i];
    else if (args[i] === '--sido' && args[i + 1]) sidoFilter = args[++i];
  }
  return { apiType, level, sidoFilter };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── JSON 정제 ───────────────────────────────────────────────────────────
function cleanControlChars(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
}
function fixInvalidEscapes(s: string): string {
  return s.replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
}
function safeJsonParse(rawText: string): any {
  try {
    return JSON.parse(cleanControlChars(rawText));
  } catch {
    return JSON.parse(fixInvalidEscapes(cleanControlChars(rawText)));
  }
}

// ─── 단일 호출 (시도, 시군구, 학교급, apiType) ────────────────────────────
async function fetchOne(
  apiType: string,
  sidoCode: string,
  sggCode: string,
  schulKndCode: string
): Promise<any[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('apiKey', API_KEY!);
  url.searchParams.set('apiType', apiType);
  url.searchParams.set('sidoCode', sidoCode);
  url.searchParams.set('sggCode', sggCode);
  url.searchParams.set('schulKndCode', schulKndCode);

  let lastErr: Error | undefined;
  for (let attempt = 1; attempt <= MAX_PAGE_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString(), { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawText = await res.text();

      if (rawText.trim().startsWith('<')) {
        throw new Error('HTML/XML 응답 (인증 또는 잘못된 파라미터)');
      }

      const json = safeJsonParse(rawText);
      if (json.resultCode && json.resultCode !== 'success' && json.resultCode !== '00') {
        throw new Error(`API ${json.resultCode}: ${json.resultMsg}`);
      }
      const list = Array.isArray(json.list) ? json.list : [];
      return list;
    } catch (e) {
      lastErr = e as Error;
      if (attempt < MAX_PAGE_RETRIES) await sleep(500 * attempt);
    }
  }
  throw lastErr ?? new Error('unknown fetch error');
}

// ─── 메인 ────────────────────────────────────────────────────────────────
async function main() {
  const { apiType, level, sidoFilter } = parseArgs();
  const levelName = LEVEL_NAMES[level] ?? level;
  console.log(`[schoolinfo] apiType=${apiType}, schulKndCode=${level} (${levelName})`);
  console.log(`[schoolinfo] endpoint: ${ENDPOINT}`);

  const targets = sidoFilter
    ? REGIONS.filter((r) => r.sidoCode === sidoFilter)
    : REGIONS;

  const allRecords: any[] = [];
  let totalCalls = 0;
  let failedCalls = 0;

  for (const region of targets) {
    for (const sgg of region.sggList) {
      totalCalls++;
      try {
        const items = await fetchOne(apiType, region.sidoCode, sgg.sggCode, level);
        allRecords.push(...items);
        console.log(
          `  ✓ ${region.sido} ${sgg.sggName}: ${items.length}건 (누적 ${allRecords.length})`
        );
      } catch (e) {
        failedCalls++;
        console.error(`  ✗ ${region.sido} ${sgg.sggName}:`, (e as Error).message);
      }
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n[schoolinfo] 호출 ${totalCalls}회 (실패 ${failedCalls})`);
  console.log(`[schoolinfo] 총 수집 ${allRecords.length.toLocaleString()}건`);

  const output = {
    _meta: {
      source: '학교알리미_KERIS',
      apiId: 'schoolinfo.go.kr/openApi.do',
      apiType,
      apiTypeName: apiType === '0' ? '학교기본정보' : `apiType=${apiType}`,
      schulKndCode: level,
      schulKndName: levelName,
      license: '공공누리 출처표시 (영리·변경·2차저작물 자유)',
      organization: '한국교육학술정보원(KERIS)',
      legalBasis: '「교육관련기관 정보공개에 관한 특별법」',
      endpoint: ENDPOINT,
      syncedAt: new Date().toISOString(),
      totalCount: allRecords.length,
      totalCalls,
      failedCalls,
      sidoFilter,
    },
    records: allRecords,
  };

  const outRel = `data/schoolinfo/api${apiType}-${level}.json`;
  const outPath = path.resolve(process.cwd(), outRel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmp = outPath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(output, null, 0), 'utf-8');
  fs.renameSync(tmp, outPath);
  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`[schoolinfo] 저장 완료: ${outRel} (${sizeMB} MB)`);
}

main().catch((e) => {
  console.error('치명적 오류:', e);
  process.exit(1);
});
