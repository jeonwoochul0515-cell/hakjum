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

// ─── 시도·시군구 매트릭스 (학교알리미 sido_sggCode.xlsx → JSON) ────────
// 17개 시도 × 260개 시군구. 학교알리미 자체 코드 (강원=51, 전북=52 등 행자부와 다름)
interface RegionEntry {
  sido: string;
  sidoCode: string;
  sggList: { sggCode: string; sggName: string }[];
}

const REGIONS_JSON_PATH = path.resolve(process.cwd(), 'src/data/schoolinfo-sido-sgg.json');
const REGIONS: RegionEntry[] = JSON.parse(fs.readFileSync(REGIONS_JSON_PATH, 'utf-8'));

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
