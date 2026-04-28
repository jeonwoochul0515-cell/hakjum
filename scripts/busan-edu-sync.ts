/**
 * 부산광역시교육청 공공데이터 동기화 시도 스크립트
 *
 * 실행: npx tsx scripts/busan-edu-sync.ts [--dataset 15095154|3036285|all]
 *
 * 후보 데이터셋 (모두 data.go.kr fileData 형 — 파일 직배포):
 * - 15095154 부산교육청 학교별 학년별 학생수·교원수 (XLS, KOGL 제3유형 — 변경금지)
 * - 3036285  부산교육청 교육기본통계 (PDF 1개 파일, KOGL 제4유형 — 상업이용·변경 금지)
 *
 * ⚠️ 사용 사전 확인 (필독):
 *
 * 1) 두 데이터셋 모두 odcloud.kr OpenAPI 미등록 — 자동 sync 불가.
 *    │  curl https://api.odcloud.kr/api/15095154/v1/uddi:... → -3 "등록되지 않은 서비스 입니다."
 *    │  curl https://api.odcloud.kr/api/3036285/v1/uddi:... → 동일
 *
 * 2) data.go.kr fileDownload endpoint 는 로그인 세션 + 활용신청 승인 후에만 동작.
 *    │  익명 GET 시 /tcs/dss/selectFileDataDownload.do → HTML 페이지 반환 (파일 X)
 *
 * 3) 라이선스 차단:
 *    │  15095154 (제3유형): 변경금지 → 가공 저장 자체가 약관 위반 가능성
 *    │  3036285  (제4유형): 상업이용금지 + 변경금지 → 학점나비 같은 상업적 SaaS에 부적합
 *
 * 4) 데이터 중복도 매우 높음:
 *    │  hakjum 은 이미 학교알리미(KERIS) sync 로 부산 141개 고교의
 *    │   - 학교 메타 (학교코드/주소/설립구분/주야)
 *    │   - 주당 총 수업시수 (WEEK_TOT_ITRT_HR_FGR)
 *    │   - 학년별 학생수 (COL_1, COL_2, COL_3)
 *    │   - 교원 총 인원 (ITRT_TCR_TOT_FGR)
 *    │   - 학교일자별 평균수업일수 (PER_STUDAY_DAY)
 *    │  를 이미 보유하고 있음 (api08-04-2025.json, api24-04-2025-d20.json).
 *    │  KOGL 제1유형(자유 이용) 라이선스라 가공·재배포도 안전.
 *
 * → **결론: 추가 sync 불필요. 본 스크립트는 evidence trail 용도로만 보존.**
 *   향후 부산교육청이 오로지 부산만 가진 항목(예: 학교별 진학률 세부)을 별도 dataset 으로
 *   공개하면 그때 다시 검토.
 *
 * 필요 시 수동 절차:
 *   1) https://www.data.go.kr/data/15095154/fileData.do 에서 활용신청 → 승인
 *   2) 다운로드 파일을 data/busan/raw/ 에 배치 (.xls/.csv)
 *   3) 본 스크립트의 parseManualFile() 호출 — 현재는 기본 파싱만 제공
 */

import * as fs from 'fs';
import * as path from 'path';

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
  console.error('❌ DATA_GO_KR_API_KEY 미설정.');
  process.exit(1);
}

interface DatasetCandidate {
  id: string;
  name: string;
  uddi: string;
  license: string;
  format: string;
  detailUrl: string;
}

const DATASETS: Record<string, DatasetCandidate> = {
  '15095154': {
    id: '15095154',
    name: '부산교육청 학교별 학년별 학생수·교원수',
    uddi: 'uddi:c4395da8-8a75-4718-8167-e90d80f52b32',
    license: 'KOGL 제3유형 (출처표시·변경금지)',
    format: 'XLS',
    detailUrl: 'https://www.data.go.kr/data/15095154/fileData.do',
  },
  '3036285': {
    id: '3036285',
    name: '부산교육청 교육기본통계',
    uddi: 'uddi:696d5484-93e1-486a-9d14-b37b4b40eec6',
    license: 'KOGL 제4유형 (출처표시·상업금지·변경금지)',
    format: 'PDF',
    detailUrl: 'https://www.data.go.kr/data/3036285/fileData.do',
  },
};

interface ProbeResult {
  url: string;
  status: number | string;
  contentType?: string;
  bodySnippet?: string;
  ok: boolean;
}

async function probe(url: string): Promise<ProbeResult> {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    let snippet = '';
    if (ct.includes('json') || ct.includes('text') || ct.includes('html')) {
      const txt = await res.text();
      snippet = txt.slice(0, 200).replace(/\s+/g, ' ');
    }
    return {
      url,
      status: res.status,
      contentType: ct,
      bodySnippet: snippet,
      ok: res.ok && !ct.includes('html'),
    };
  } catch (e: any) {
    return { url, status: 'ERR', bodySnippet: e.message, ok: false };
  }
}

async function probeDataset(d: DatasetCandidate): Promise<ProbeResult[]> {
  const encKey = encodeURIComponent(API_KEY!);
  const candidates = [
    // 패턴 A: odcloud 표준 OpenAPI (CSV 변환된 데이터셋만 동작)
    `https://api.odcloud.kr/api/${d.id}/v1/${d.uddi}?serviceKey=${encKey}&page=1&perPage=5`,
    // 패턴 B: data.go.kr 익명 fileDownload (정상 동작 시 파일 stream)
    `https://www.data.go.kr/tcs/dss/selectFileDataDownload.do?publicDataDetailPk=${d.uddi}`,
    // 패턴 C: 인증키 포함 fileDownload
    `https://www.data.go.kr/tcs/dss/selectFileDataDownload.do?publicDataDetailPk=${d.uddi}&serviceKey=${encKey}`,
  ];
  console.log(`\n[${d.id}] ${d.name}`);
  console.log(`  license: ${d.license}, format: ${d.format}`);
  const results: ProbeResult[] = [];
  for (const url of candidates) {
    const r = await probe(url);
    results.push(r);
    const tag = r.ok ? '✓' : '✗';
    console.log(`  ${tag} ${r.status} [${r.contentType?.slice(0, 40)}] ${url.slice(0, 90)}`);
    if (r.bodySnippet) console.log(`      ${r.bodySnippet.slice(0, 160)}`);
  }
  return results;
}

/**
 * 수동 다운로드 후 파일 파싱 (XLS는 SheetJS 등 별도 의존성 필요 — 현재 미설치).
 * CSV 만 표준 라이브러리로 파싱. 사용자가 XLS → CSV 변환 후 raw/에 배치 권장.
 */
function parseManualFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ 파일 없음: ${filePath}`);
    return [];
  }
  if (!filePath.endsWith('.csv')) {
    console.warn(`  ⚠️  CSV 만 지원. XLS/PDF 는 수동 변환 필요: ${filePath}`);
    return [];
  }
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => (rec[h] = cells[i] || ''));
    return rec;
  });
}

async function main() {
  const args = process.argv.slice(2);
  let target = 'all';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dataset' && args[i + 1]) target = args[++i];
  }

  console.log('='.repeat(70));
  console.log('부산교육청 공공데이터 endpoint 탐사 (자동 sync 가능 여부 평가)');
  console.log('='.repeat(70));

  const targets =
    target === 'all'
      ? Object.values(DATASETS)
      : Object.values(DATASETS).filter((d) => d.id === target);

  const allProbes: Record<string, ProbeResult[]> = {};
  for (const d of targets) {
    allProbes[d.id] = await probeDataset(d);
  }

  // 수동 raw 디렉토리 검사
  const rawDir = path.resolve(process.cwd(), 'data/busan/raw');
  if (fs.existsSync(rawDir)) {
    const files = fs.readdirSync(rawDir);
    if (files.length > 0) {
      console.log(`\n[manual] data/busan/raw/ 내 파일 ${files.length}개 — 파싱 시도`);
      for (const f of files) {
        const full = path.join(rawDir, f);
        const records = parseManualFile(full);
        if (records.length > 0) {
          const out = {
            _meta: {
              source: '부산광역시교육청 (data.go.kr 수동 다운로드)',
              license: '공공누리 — 데이터셋별 상이 (제3·제4유형 가능성, 활용신청 약관 확인 필수)',
              syncedAt: new Date().toISOString(),
              originalFile: f,
              totalCount: records.length,
              note: '수동 다운로드된 raw 파일 — 가공·재배포 전 라이선스 재확인 필수.',
            },
            records,
          };
          const outPath = path.resolve(process.cwd(), 'data/busan', f.replace(/\.csv$/i, '.json'));
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, JSON.stringify(out, null, 0), 'utf-8');
          console.log(`  ✓ ${f} → ${outPath} (${records.length}건)`);
        }
      }
    } else {
      console.log(`\n[manual] data/busan/raw/ 비어있음 — 수동 다운로드 파일 배치 후 재실행`);
    }
  }

  // 최종 리포트
  console.log('\n' + '='.repeat(70));
  console.log('결과 요약');
  console.log('='.repeat(70));
  let anySuccess = false;
  for (const [id, results] of Object.entries(allProbes)) {
    const ok = results.some((r) => r.ok);
    anySuccess = anySuccess || ok;
    console.log(`  ${ok ? '✓' : '✗'} ${id}: ${ok ? '자동 sync 가능' : '자동 sync 불가 — 수동 다운로드 필요'}`);
  }

  if (!anySuccess) {
    console.log('\n📋 사용자 액션 필요:');
    console.log('  1) https://www.data.go.kr 로그인 후 각 데이터셋 페이지에서 [활용신청]');
    console.log('  2) 승인 완료 시 수동 다운로드 → data/busan/raw/ 에 배치 (CSV 권장)');
    console.log('  3) 본 스크립트 재실행 → data/busan/*.json 자동 생성');
    console.log('\n💡 단, hakjum 은 이미 학교알리미 sync 로 부산 141개 고교의');
    console.log('   학생수·교원수·수업시수 보유 → 추가 sync 의 ROI 낮음.');
    console.log('   데이터셋 15095154/3036285 의 라이선스(제3·제4유형, 변경금지/상업금지)는');
    console.log('   학점나비 SaaS 에 부적합할 수 있으니 도입 전 약관 재확인 필수.');
  }
}

main().catch((e) => {
  console.error('치명적 오류:', e);
  process.exit(1);
});
