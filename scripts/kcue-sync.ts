/**
 * KCUE / academyinfo.go.kr OpenAPI 동기화 스크립트
 * 실행: npx tsx scripts/kcue-sync.ts [--dataset major|category|university|student|industry|all] [--filter-active]
 *
 * 한국대학교육협의회(KCUE) / 대학알리미(academyinfo.go.kr)에서 제공하는
 * 공공데이터(이용허락범위 제한없음 / 무료) 5종을 페이지네이션으로 수집하여
 * data/kcue/{dataset}-{year}.json 에 저장합니다.
 *
 * 인증키: .dev.vars 의 DATA_GO_KR_API_KEY (data.go.kr 일반 인증키)
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// 환경변수 로드 (.dev.vars 직접 파싱 — dotenv 없이도 동작)
// ─────────────────────────────────────────────────────────────────────────────
function loadDevVars() {
  const candidates = [
    path.resolve(process.cwd(), '.dev.vars'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf-8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2];
      }
    }
  }
}
loadDevVars();

const API_KEY = process.env.DATA_GO_KR_API_KEY;
if (!API_KEY) {
  console.error('❌ DATA_GO_KR_API_KEY 환경변수가 설정되지 않았습니다.');
  console.error('');
  console.error('   해결 방법:');
  console.error('   1. https://www.data.go.kr 회원가입 후 로그인');
  console.error('   2. "대학알리미 OpenAPI" 5종 활용신청 (이용허락범위 제한없음)');
  console.error('      - 대학별 학과정보 (SchoolMajorInfoService)');
  console.error('      - 학과 표준분류 / 대학 기본정보 (BasicInformationService)');
  console.error('      - 학생 현황 (StudentService)');
  console.error('      - 산학협력 (IndustryAcademicCooperationService)');
  console.error('   3. 발급받은 일반 인증키를 .dev.vars 에 DATA_GO_KR_API_KEY=... 로 추가');
  console.error('   4. 키 활성화 약 1~2시간 대기 후 재시도');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 설정
// ─────────────────────────────────────────────────────────────────────────────
const NUM_OF_ROWS = 1000;
const DELAY_MS = 200;
const BASE_DATA_YEAR = new Date().getFullYear() - 1; // 대학알리미 공시 기준연도(전년도)

const ENDPOINTS = {
  major:
    'http://openapi.academyinfo.go.kr/openapi/service/rest/SchoolMajorInfoService/getSchoolMajorInfo',
  category:
    'http://openapi.academyinfo.go.kr/openapi/service/rest/BasicInformationService/getCodeByLargeSeries',
  university:
    'http://openapi.academyinfo.go.kr/openapi/service/rest/BasicInformationService/getComparisonPubYear',
  student:
    'http://openapi.academyinfo.go.kr/openapi/service/rest/StudentService/getComparisonFreshmanChanceBalanceSelectionRatio',
  // TODO: 산학협력 정확한 메서드명 확인 후 교체 필요
  industry:
    'http://openapi.academyinfo.go.kr/openapi/service/rest/IndustryAcademicCooperationService/getComparisonPubYear',
} as const;

type Dataset = keyof typeof ENDPOINTS;

const API_IDS: Record<Dataset, string> = {
  major: 'KCUE-001-SchoolMajorInfo',
  category: 'KCUE-002-CodeByLargeSeries',
  university: 'KCUE-003-BasicInfoByPubYear',
  student: 'KCUE-005-FreshmanChanceBalanceSelectionRatio',
  industry: 'KCUE-006-IndustryAcademicCooperation',
};

// ─────────────────────────────────────────────────────────────────────────────
// zod 스키마 (대학알리미 응답 필드 기반 — 실제 응답 확인 후 보강 필요)
// ─────────────────────────────────────────────────────────────────────────────
const MajorRecordSchema = z
  .object({
    schlKindNm: z.string().optional(),       // 학교종류명
    schlNm: z.string().optional(),            // 학교명
    schlCd: z.string().optional(),            // 학교코드
    facDvsNm: z.string().optional(),          // 본분교구분
    campusNm: z.string().optional(),          // 캠퍼스명
    deptCd: z.string().optional(),            // 학과코드
    deptNm: z.string().optional(),            // 학과명
    deptStusNm: z.string().optional(),        // 학과상태명 (운영중/폐과/통합 등)
    estbYr: z.string().optional(),            // 설치연도
    admsCpcty: z.coerce.number().optional(),  // 입학정원수
    largeSeriesNm: z.string().optional(),     // 대계열명
    middleSeriesNm: z.string().optional(),    // 중계열명
    smallSeriesNm: z.string().optional(),     // 소계열명
    degCrsNm: z.string().optional(),          // 학위과정명
  })
  .passthrough();

const CategoryRecordSchema = z
  .object({
    largeSeriesCd: z.string().optional(),
    largeSeriesNm: z.string().optional(),
    middleSeriesCd: z.string().optional(),
    middleSeriesNm: z.string().optional(),
    smallSeriesCd: z.string().optional(),
    smallSeriesNm: z.string().optional(),
  })
  .passthrough();

const UniversityRecordSchema = z
  .object({
    schlCd: z.string().optional(),
    schlNm: z.string().optional(),
    schlKindNm: z.string().optional(),
    estbDvsNm: z.string().optional(),         // 설립구분 (국립/사립/공립)
    addr: z.string().optional(),
    sidoNm: z.string().optional(),
    foundYr: z.string().optional(),
    presidentNm: z.string().optional(),
  })
  .passthrough();

const StudentRecordSchema = z
  .object({
    schlCd: z.string().optional(),
    schlNm: z.string().optional(),
    deptNm: z.string().optional(),
    fresAdmsCpcty: z.coerce.number().optional(),  // 신입생 모집정원
    fresAplcCnt: z.coerce.number().optional(),    // 지원자수
    cmpttRt: z.coerce.number().optional(),        // 경쟁률
    selectionRatio: z.coerce.number().optional(), // 충원율
  })
  .passthrough();

const IndustryRecordSchema = z.object({}).passthrough();

const SCHEMAS: Record<Dataset, z.ZodTypeAny> = {
  major: MajorRecordSchema,
  category: CategoryRecordSchema,
  university: UniversityRecordSchema,
  student: StudentRecordSchema,
  industry: IndustryRecordSchema,
};

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 매우 단순한 XML → JSON 파서. 대학알리미 응답 구조는
 * <response><header><resultCode>00</resultCode>...</header>
 *  <body><items><item><...></item></items><totalCount>N</totalCount>...</body></response>
 * 정도로 평탄하므로 정규식 기반으로 충분하다.
 */
interface ParsedXml {
  resultCode: string;
  resultMsg: string;
  totalCount: number;
  numOfRows: number;
  pageNo: number;
  items: Record<string, string>[];
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseXml(xml: string): ParsedXml {
  const pickTag = (tag: string, src = xml): string => {
    const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = src.match(re);
    return m ? decodeXmlEntities(m[1].trim()) : '';
  };
  const resultCode = pickTag('resultCode');
  const resultMsg = pickTag('resultMsg');
  const totalCount = Number(pickTag('totalCount') || '0') || 0;
  const numOfRows = Number(pickTag('numOfRows') || '0') || 0;
  const pageNo = Number(pickTag('pageNo') || '1') || 1;

  const items: Record<string, string>[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const fieldRe = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g;
    const obj: Record<string, string> = {};
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(block)) !== null) {
      obj[f[1]] = decodeXmlEntities(f[2].trim());
    }
    items.push(obj);
  }
  return { resultCode, resultMsg, totalCount, numOfRows, pageNo, items };
}

function buildUrl(
  base: string,
  params: Record<string, string | number>,
): string {
  const usp = new URLSearchParams();
  // serviceKey 는 이미 URL 인코딩된 값일 수 있음 — 안전하게 디코딩 후 재인코딩
  for (const [k, v] of Object.entries(params)) usp.append(k, String(v));
  return `${base}?${usp.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 한 페이지 fetch
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPage(
  dataset: Dataset,
  pageNo: number,
  year: number,
): Promise<ParsedXml> {
  const base = ENDPOINTS[dataset];
  const params: Record<string, string | number> = {
    serviceKey: API_KEY!,
    numOfRows: NUM_OF_ROWS,
    pageNo,
    // 일부 엔드포인트는 _type=json 을 지원 (academyinfo는 미지원이므로 XML 파서 사용)
    // _type: 'json',
  };
  // 기준연도 필요한 데이터셋
  if (dataset === 'university' || dataset === 'student' || dataset === 'industry') {
    params.svyYr = year;
  }
  if (dataset === 'major') {
    params.svyYr = year;
  }

  const url = buildUrl(base, params);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url.replace(API_KEY!, '***')}`);
  }
  const text = await res.text();

  // 키 미활성화 / 등록 안 됨 등 SOAP-FAULT
  if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
    throw new Error(
      'SERVICE_KEY_IS_NOT_REGISTERED_ERROR — 인증키가 활성화되지 않았습니다. data.go.kr 활용신청 승인 및 1~2시간 대기 후 재시도하세요.',
    );
  }
  if (text.includes('LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR')) {
    throw new Error('LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR — 일일 요청 한도 초과.');
  }

  const parsed = parseXml(text);
  if (parsed.resultCode && parsed.resultCode !== '00' && parsed.resultCode !== '0') {
    throw new Error(`API resultCode=${parsed.resultCode} resultMsg=${parsed.resultMsg}`);
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// 데이터셋 단위 sync
// ─────────────────────────────────────────────────────────────────────────────
async function syncDataset(
  dataset: Dataset,
  year: number,
  filterActive: boolean,
): Promise<void> {
  console.log(`\n=== [${dataset}] 동기화 시작 (svyYr=${year}) ===`);

  const schema = SCHEMAS[dataset];
  const allRecords: unknown[] = [];

  // 1페이지로 totalCount 파악
  const first = await fetchPage(dataset, 1, year);
  const totalPages = Math.max(1, Math.ceil(first.totalCount / NUM_OF_ROWS));
  console.log(
    `[${dataset}] totalCount=${first.totalCount} numOfRows=${first.numOfRows || NUM_OF_ROWS} pages=${totalPages}`,
  );

  const pushPage = (items: Record<string, string>[], pageNo: number) => {
    let validated = 0;
    let dropped = 0;
    for (const raw of items) {
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        dropped++;
        continue;
      }
      const rec = parsed.data as Record<string, unknown>;
      // 폐과 필터
      if (filterActive && dataset === 'major') {
        const status = String(rec.deptStusNm || '').trim();
        const cap = Number(rec.admsCpcty ?? 0);
        if (status === '폐과' || cap <= 0) {
          dropped++;
          continue;
        }
      }
      allRecords.push(rec);
      validated++;
    }
    console.log(
      `[${dataset}] page ${pageNo}/${totalPages} fetched ${items.length} (validated=${validated} dropped=${dropped})`,
    );
  };

  pushPage(first.items, 1);

  for (let pageNo = 2; pageNo <= totalPages; pageNo++) {
    await sleep(DELAY_MS);
    try {
      const page = await fetchPage(dataset, pageNo, year);
      pushPage(page.items, pageNo);
    } catch (err) {
      console.warn(
        `[${dataset}] page ${pageNo} 실패 — ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // 출력
  const outDir = path.resolve('data/kcue');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${dataset}-${year}.json`);

  const output = {
    _meta: {
      source: 'academyinfo.go.kr (KCUE / 대학알리미)',
      apiId: API_IDS[dataset],
      license: '이용허락범위 제한없음',
      syncedAt: new Date().toISOString(),
      baseDataDate: `${year}`,
      totalCount: first.totalCount,
      collectedCount: allRecords.length,
      filterActive: dataset === 'major' ? filterActive : false,
    },
    records: allRecords,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(
    `[${dataset}] ✅ 저장: ${outPath} (records=${allRecords.length}/${first.totalCount})`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────
function parseArgs(argv: string[]): { dataset: Dataset | 'all'; filterActive: boolean; year: number } {
  let dataset: Dataset | 'all' = 'all';
  let filterActive = false;
  let year = BASE_DATA_YEAR;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') {
      const v = argv[++i] as Dataset | 'all';
      const valid: (Dataset | 'all')[] = ['major', 'category', 'university', 'student', 'industry', 'all'];
      if (!valid.includes(v)) {
        console.error(`❌ --dataset 값이 잘못되었습니다: ${v} (허용: ${valid.join('|')})`);
        process.exit(1);
      }
      dataset = v;
    } else if (a === '--filter-active') {
      filterActive = true;
    } else if (a === '--year') {
      year = Number(argv[++i]) || BASE_DATA_YEAR;
    }
  }
  return { dataset, filterActive, year };
}

async function main() {
  const { dataset, filterActive, year } = parseArgs(process.argv.slice(2));

  console.log('🎓 KCUE / 대학알리미 OpenAPI 동기화');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`📦 dataset=${dataset} year=${year} filterActive=${filterActive}`);

  const targets: Dataset[] =
    dataset === 'all'
      ? (['major', 'category', 'university', 'student', 'industry'] as Dataset[])
      : [dataset];

  for (const ds of targets) {
    try {
      await syncDataset(ds, year, filterActive);
    } catch (err) {
      console.error(
        `❌ [${ds}] 실패: ${err instanceof Error ? err.message : err}`,
      );
    }
    await sleep(DELAY_MS);
  }

  console.log('\n🎉 완료!');
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
