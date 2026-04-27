/**
 * 학교알리미(KERIS) 공시정보 OpenAPI 동기화
 * 실행: npx tsx scripts/schoolinfo-sync.ts [--year 2026] [--level 04]
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 데이터 소스
 *   - 공공데이터포털 ID: 15098092
 *   - 데이터셋명: 한국교육학술정보원_학교알리미 공시정보
 *   - 활용신청 URL: https://www.data.go.kr/data/15098092/openapi.do
 *   - 운영기관: 한국교육학술정보원(KERIS)
 *   - 법적 근거: 「교육관련기관 정보공개에 관한 특별법」
 *   - 갱신 주기: 매년 1회 이상 (보통 4월·10월)
 *   - 이용허락범위: 제한없음 (영리 사용 가능)
 *
 * 활용신청 (5분, 자동승인)
 *   https://www.data.go.kr/data/15098092/openapi.do
 *
 * 갱신 cron 권장
 *   매년 4월 25일 + 10월 25일 자동 sync
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 학점나비(hakjum) 활용 시나리오
 *   - 전국 고등학교의 "교육과정 편성·운영" 항목 자동 수집
 *   - 학생 학교에 개설된/예정된 과목 추출 (선택과목 다양성, 진로집중과정 등)
 *   - NEIS 시간표 데이터의 보완재
 *       · NEIS    = 현재 학기 실시간 시간표 (수업·교사·교실 단위)
 *       · 학교알리미 = 연간 교육과정 편성 (학교가 제공하는 과목 카탈로그)
 *     두 소스를 결합해 "내 학교에서 들을 수 있는 과목"의 완전한 그림을 만든다.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Endpoint / 파라미터 (KERIS 학교알리미 OpenAPI 명세)
 *   Base: https://www.schoolinfo.go.kr/openApi.do
 *
 *   필수 파라미터 (KERIS 응답 'apiKey는 필수 정보입니다.' 메시지로 키명 확인):
 *     apiKey       : 인증키 (data.go.kr에서 발급, KCUE와 동일 키 재사용)
 *     apiType      : 'json' 또는 'xml' (응답 포맷)
 *     pbanYr       : 공시년도 (예: 2026)
 *     schulKndCode : 학교급 코드
 *                      02 = 초등학교
 *                      03 = 중학교
 *                      04 = 고등학교  ← hakjum 기본값
 *                      05 = 특수학교
 *
 *   선택 파라미터:
 *     svcCode      : 공시항목 서비스 코드 (예: 교육과정 편성·운영)
 *     pageNo       : 페이지 번호
 *     numOfRows    : 페이지당 건수
 *
 * 주의: 정확한 파라미터 스펙은 공공데이터포털 페이지의
 *       "참고문서 [Open API 설명.zip]"에 포함된 명세서를 따른다.
 *       위 파라미터명은 응답 메시지·관행상 추정치이며,
 *       활용신청 후 명세서로 1차 확정해야 한다.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── .dev.vars 로드 (KCUE sync와 동일 패턴) ──────────────────────────────
function loadDevVars() {
  const file = path.resolve(process.cwd(), '.dev.vars');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadDevVars();

const API_KEY = process.env.DATA_GO_KR_API_KEY;
if (!API_KEY) {
  console.error('❌ DATA_GO_KR_API_KEY 미설정 (.dev.vars 확인).');
  console.error('   활용신청: https://www.data.go.kr/data/15098092/openapi.do');
  process.exit(1);
}

// ─── 상수 ────────────────────────────────────────────────────────────────
const ENDPOINT = 'https://www.schoolinfo.go.kr/openApi.do';
const APPLY_URL = 'https://www.data.go.kr/data/15098092/openapi.do';
const NUM_ROWS = 200;
const DELAY_MS = 200;
const MAX_PAGE_RETRIES = 3;

// ─── CLI 파싱 ────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let year = String(new Date().getFullYear());
  let level = '04'; // 고등학교 기본값
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year' && args[i + 1]) year = args[++i];
    else if (args[i] === '--level' && args[i + 1]) level = args[++i];
  }
  return { year, level };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── JSON 정제 (KCUE sync 동일 로직) ─────────────────────────────────────
function cleanControlChars(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
}
function fixInvalidEscapes(s: string): string {
  return s.replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
}
function sanitizeApiJsonResponse(s: string): string {
  return fixInvalidEscapes(cleanControlChars(s));
}
function safeJsonParse(rawText: string): unknown {
  try {
    return JSON.parse(cleanControlChars(rawText));
  } catch {
    return JSON.parse(sanitizeApiJsonResponse(rawText));
  }
}

// ─── 인증키 활성화 안내 ──────────────────────────────────────────────────
function printActivationGuide(detail?: string) {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(' 학교알리미(KERIS) OpenAPI 인증키가 활성화되지 않았습니다.');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (detail) console.error(` 응답: ${detail}`);
  console.error('');
  console.error(' 1) 활용신청 (5분, 자동승인):');
  console.error(`    ${APPLY_URL}`);
  console.error('');
  console.error(' 2) 신청 시 동일한 data.go.kr 계정 사용 (KCUE 키 재사용 가능)');
  console.error(' 3) 승인 후 1~2시간 내 키 활성화 → 본 스크립트 재실행');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ─── 응답 형식 ───────────────────────────────────────────────────────────
interface FetchedPage {
  items: Record<string, unknown>[];
  totalCount: number;
}

interface ApiEnvelope {
  resultCode?: string;
  resultMsg?: string;
  totalCount?: number | string;
  pageNo?: number | string;
  numOfRows?: number | string;
  list?: unknown;
  items?: unknown;
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: {
      items?: unknown;
      totalCount?: number | string;
    };
  };
}

function extractItems(json: ApiEnvelope): FetchedPage {
  // KERIS 학교알리미는 응답 envelope이 두 가지 형태 중 하나로 알려져 있음:
  //   (a) { resultCode, resultMsg, totalCount, list: [...] }
  //   (b) data.go.kr 표준 형식 { response: { header, body: { items, totalCount } } }
  // 둘 다 처리한다.
  const body = json.response?.body;
  const rawItems = body?.items ?? json.list ?? json.items ?? [];
  const total = body?.totalCount ?? json.totalCount ?? 0;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return {
    items: items as Record<string, unknown>[],
    totalCount: typeof total === 'string' ? parseInt(total, 10) || 0 : total,
  };
}

// ─── 페이지 fetch ────────────────────────────────────────────────────────
async function fetchPage(year: string, level: string, page: number): Promise<FetchedPage> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('apiKey', API_KEY!);
  url.searchParams.set('apiType', 'json');
  url.searchParams.set('pbanYr', year);
  url.searchParams.set('schulKndCode', level);
  url.searchParams.set('pageNo', String(page));
  url.searchParams.set('numOfRows', String(NUM_ROWS));

  let res: Response | undefined;
  for (let i = 0; i < 4; i++) {
    try {
      res = await fetch(url.toString(), { redirect: 'follow' });
      break;
    } catch (e) {
      if (i === 3) throw e;
      await sleep(1000 * (i + 1));
    }
  }
  if (!res) throw new Error('fetch never resolved');
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const rawText = await res.text();

  // HTML 응답 = 인증 실패 페이지로 redirect 된 경우
  if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
    throw new Error('AUTH_HTML: API key not activated (HTML returned)');
  }

  // 키 미인증 텍스트 응답
  if (/apiKey.*필수|인증.?키|SERVICE.?KEY/i.test(rawText) && rawText.length < 400) {
    throw new Error(`AUTH_TEXT: ${rawText.trim()}`);
  }

  // XML 에러 envelope
  if (rawText.startsWith('<')) {
    const code = rawText.match(/<resultCode>(\d+)<\/resultCode>/)?.[1];
    const msg = rawText.match(/<resultMsg>([^<]+)<\/resultMsg>/)?.[1];
    throw new Error(`API ERROR ${code}: ${msg}`);
  }

  const json = safeJsonParse(rawText) as ApiEnvelope;

  // 헤더 레벨 에러 체크 (data.go.kr 표준 envelope)
  const headerCode = json.response?.header?.resultCode;
  if (headerCode && headerCode !== '00') {
    throw new Error(`API ${headerCode}: ${json.response?.header?.resultMsg}`);
  }
  // KERIS envelope 에러 체크
  if (json.resultCode && json.resultCode !== '00' && json.resultCode !== 'success') {
    throw new Error(`KERIS ${json.resultCode}: ${json.resultMsg}`);
  }

  return extractItems(json);
}

// ─── 메인 동기화 루틴 ────────────────────────────────────────────────────
async function syncSchoolInfo(year: string, level: string) {
  const levelName =
    { '02': '초등학교', '03': '중학교', '04': '고등학교', '05': '특수학교' }[level] ?? level;
  console.log(`[schoolinfo] 동기화 시작 — pbanYr=${year}, schulKndCode=${level} (${levelName})`);
  console.log(`[schoolinfo] endpoint: ${ENDPOINT}`);

  let first: FetchedPage;
  try {
    first = await fetchPage(year, level, 1);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.startsWith('AUTH_')) {
      printActivationGuide(msg);
      process.exit(2);
    }
    throw err;
  }

  const totalPages = Math.max(1, Math.ceil(first.totalCount / NUM_ROWS));
  console.log(
    `[schoolinfo] totalCount=${first.totalCount.toLocaleString()}, ${totalPages}페이지`
  );

  const allRecords: Record<string, unknown>[] = [...first.items];
  let failedPages = 0;

  for (let p = 2; p <= totalPages; p++) {
    await sleep(DELAY_MS);
    let attempt = 0;
    let success = false;
    let lastErr: Error | undefined;
    while (attempt < MAX_PAGE_RETRIES) {
      try {
        const page = await fetchPage(year, level, p);
        allRecords.push(...page.items);
        if (p % 10 === 0 || p === totalPages) {
          console.log(
            `[schoolinfo] ${p}/${totalPages} 페이지 (${allRecords.length.toLocaleString()}건 누적)`
          );
        }
        success = true;
        break;
      } catch (err) {
        lastErr = err as Error;
        attempt++;
        if (attempt < MAX_PAGE_RETRIES) await sleep(500 * attempt);
      }
    }
    if (!success) {
      failedPages++;
      console.error(`[schoolinfo] 페이지 ${p} 실패:`, lastErr?.message);
    }
  }

  if (failedPages > 0) {
    console.warn(`[schoolinfo] 총 ${failedPages}개 페이지 실패 (스킵됨)`);
  }

  // baseDataDate: 응답 안의 흔한 필드명 후보들에서 추출
  const firstRec = (allRecords[0] ?? {}) as Record<string, unknown>;
  const baseDataDate =
    (firstRec['crtrYmd'] as string) ||
    (firstRec['mdfcnYmd'] as string) ||
    (firstRec['baseDate'] as string) ||
    (firstRec['kbaseYmd'] as string) ||
    '';

  const output = {
    _meta: {
      source: '학교알리미_KERIS',
      apiId: 'data.go.kr/15098092',
      license: '이용허락범위 제한없음',
      organization: '한국교육학술정보원',
      legalBasis: '「교육관련기관 정보공개에 관한 특별법」',
      endpoint: ENDPOINT,
      params: { pbanYr: year, schulKndCode: level, schulKndName: levelName },
      syncedAt: new Date().toISOString(),
      baseDataDate,
      upstreamUrl: APPLY_URL,
      totalCount: allRecords.length,
      failedPages,
    },
    records: allRecords,
  };

  const outRel = `data/schoolinfo/curriculum-${year}-${level}.json`;
  const outPath = path.resolve(process.cwd(), outRel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmp = outPath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(output, null, 0), 'utf-8');
  fs.renameSync(tmp, outPath);
  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(
    `[schoolinfo] 저장 완료: ${outRel} (${sizeMB} MB, ${allRecords.length.toLocaleString()}건)`
  );
}

// ─── entry ──────────────────────────────────────────────────────────────
async function main() {
  const { year, level } = parseArgs();
  try {
    await syncSchoolInfo(year, level);
    console.log('\n✓ 동기화 완료');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.startsWith('AUTH_')) {
      printActivationGuide(msg);
      process.exit(2);
    }
    console.error('치명적 오류:', err);
    process.exit(1);
  }
}

main();
