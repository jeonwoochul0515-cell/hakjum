/**
 * 서울 고교학점제지원센터 자료 인덱싱 스크립트 (PDF 자동 다운로드 비활성)
 *
 * 사이트: https://seoulhsc.sen.go.kr  (서울특별시교육청 고교학점제지원센터)
 *
 * ── robots.txt 정책 (확인일자: 본 스크립트 작성 시점) ─────────────────────
 *   User-agent: *
 *   Allow: /
 *   Disallow: /*.pdf$
 *   Disallow: /*.hwp$
 *   Disallow: /*.zip$  (그 외 .ppt/.doc/.xls/.jpg 등 첨부 확장자 전반 금지)
 *
 *   ⇒ 게시판/메뉴 HTML 크롤은 허용되지만, **PDF/HWP 등 첨부 파일을 자동 다운로드하는 행위는
 *      robots.txt 로 명시적 차단** 되어 있습니다. 부산(home.pen.go.kr)과 달리 자동 수집을
 *      수행하면 정책 위반이 됩니다.
 *
 * 따라서 본 스크립트는 **PDF 를 다운로드하지 않습니다.** 대신,
 *   1) 게시판 목록 페이지(공개 HTML)만 GET 으로 인덱싱하고
 *   2) 게시물 상세 URL + 제목 + (있다면) 첨부 파일명 만을 manifest 에 기록하여
 *   3) 운영자가 수동으로 다운로드해 data/seoul/pdfs/ 에 배치할 수 있도록 가이드합니다.
 *
 * 게시판 위치 (메인 메뉴 분석 결과):
 *   - MI000000000000000167 / BO00000064  : 최소성취수준보장지도 - 지원 자료
 *   - MI000000000000000120 / (게시판)    : 학습자료실
 *   - MI000000000000001041 / (게시판)    : 정책연구/안내자료
 *   - MI000000000000000168 / (게시판)    : 운영지원자료
 *   - MI000000000000000166 / (게시판)    : 일반자료
 *
 * Seoul 사이트는 eGovFrame 기반이지만, 게시판 행은 SSR + JS 동적 라우팅
 * (acynMenuMovePage) 으로 노출됩니다. 본 스크립트는 정적 SSR HTML 만 파싱하며
 * 자바스크립트 실행은 하지 않습니다.
 *
 * 산출물:
 *   data/seoul/_meta/manifest.json   ── { source, listUrl, postUrl?, title, note }
 *   data/seoul/_meta/skipped.json
 *
 * 실행:
 *   npx tsx scripts/seoul-pdf-collect.ts
 *   npx tsx scripts/seoul-pdf-collect.ts --board MI000000000000000167
 *
 * 사용자 액션:
 *   - data/seoul/_meta/manifest.json 의 listUrl 을 브라우저로 직접 열어
 *     필요한 첨부파일을 수동 다운로드한 뒤 data/seoul/pdfs/ 에 저장하세요.
 *   - 다운로드 후 동일한 디렉토리에서 npx tsx scripts/seoul-pdf-extract.ts 로 추출 가능.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = 'https://seoulhsc.sen.go.kr';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Hakjum-Seoul-Indexer/1.0)';
const DELAY_MS = 800;

interface BoardConfig {
  miId: string;        // 메뉴 ID (MI...)
  boardPath: string;   // 게시판 list URL 의 path 부분 (BO.../list0011v.do 등)
  category: string;
  description: string;
}

const BOARDS: BoardConfig[] = [
  {
    miId: 'MI000000000000000167',
    boardPath: '/fus/MI000000000000000167/board/BO00000064/list0011v.do',
    category: '최소성취수준보장지도-지원자료',
    description: '최소 성취수준 보장 지도 - 지원 자료',
  },
  {
    miId: 'MI000000000000000120',
    boardPath: '/fus/MI000000000000000120/board/BO00000040/list0011v.do',
    category: '학습자료실',
    description: '학습자료실',
  },
  {
    miId: 'MI000000000000001041',
    boardPath: '/fus/MI000000000000001041/board/BO00001020/list0011v.do',
    category: '정책연구안내자료',
    description: '정책연구·안내자료',
  },
  {
    miId: 'MI000000000000000168',
    boardPath: '/fus/MI000000000000000168/board/BO00000065/list0011v.do',
    category: '운영지원자료',
    description: '운영지원자료',
  },
  {
    miId: 'MI000000000000000166',
    boardPath: '/fus/MI000000000000000166/board/BO00000063/list0011v.do',
    category: '일반자료',
    description: '일반자료',
  },
];

interface IndexRecord {
  source: 'seoulhsc.sen.go.kr';
  category: string;
  miId: string;
  listUrl: string;
  rowIndex: number;
  title: string;
  postUrl: string | null;     // SSR 에서 추출 가능한 경우만
  attachmentHints: string[];  // 행 텍스트에서 추정한 첨부 파일명 (있을 때만)
  indexedAt: string;
  note: string;
  license: '공공누리 제1유형(출처표시) 추정 — 게시물별 확인 필요';
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url: string, referer?: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      ...(referer ? { Referer: referer } : {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

/**
 * 서울 게시판 목록 SSR 파싱.
 *  - <tbody> 내부의 각 <tr> → 제목/링크/첨부 힌트 추출
 *  - 게시물 상세 진입은 보통 fnPostView(...) JS 로 처리되므로, postUrl 은
 *    SSR href 에 list0021v / view0011v 등 정적 링크가 있는 경우만 채워짐.
 *  - 텍스트 안에 .pdf / .hwp / .zip 등이 보이면 attachmentHints 에 추가.
 */
function parsePostRows(html: string, board: BoardConfig, listUrl: string): IndexRecord[] {
  const records: IndexRecord[] = [];
  // <tbody> ... </tbody> 의 첫 블록만
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) return records;
  const tbodyHtml = tbodyMatch[1];

  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let row: RegExpExecArray | null;
  let idx = 0;
  while ((row = rowRe.exec(tbodyHtml)) !== null) {
    idx += 1;
    const cellHtml = row[1];
    const text = cellHtml.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || /등록된\s*게시물이\s*없습니다/.test(text)) continue;

    // 제목 후보: a 태그 안의 가장 긴 텍스트
    let title = '';
    const aRe = /<a[^>]*>([\s\S]*?)<\/a>/g;
    let a: RegExpExecArray | null;
    while ((a = aRe.exec(cellHtml)) !== null) {
      const t = a[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (t.length > title.length) title = t;
    }
    if (!title) {
      // 폴백: 행 텍스트의 첫 5단어
      title = text.split(/\s+/).slice(0, 12).join(' ');
    }
    if (!title) continue;

    // postUrl 후보: list0021v.do / view0011v.do / detail.do 등 정적 href
    let postUrl: string | null = null;
    const hrefRe = /href="([^"]+(?:view0011v|list0021v|detail|info)[^"]*)"/i;
    const h = hrefRe.exec(cellHtml);
    if (h) postUrl = h[1].startsWith('http') ? h[1] : `${BASE}${h[1]}`;

    // 첨부 힌트: 텍스트에서 .pdf|.hwp|.zip|.docx|.pptx|.xlsx 단어 추출
    const attachmentHints = Array.from(text.matchAll(/[\w가-힣\-_().]+\.(pdf|hwp|hwpx|zip|docx?|pptx?|xlsx?)/gi)).map((m) => m[0]);

    records.push({
      source: 'seoulhsc.sen.go.kr',
      category: board.category,
      miId: board.miId,
      listUrl,
      rowIndex: idx,
      title,
      postUrl,
      attachmentHints,
      indexedAt: new Date().toISOString(),
      note: 'robots.txt 가 *.pdf/*.hwp/*.zip 등 자동 다운로드를 금지하므로, 수동 다운로드 필요.',
      license: '공공누리 제1유형(출처표시) 추정 — 게시물별 확인 필요',
    });
  }
  return records;
}

interface CliOptions {
  boardFilter: string | null;
  maxPerBoard: number;
}

function parseArgs(): CliOptions {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : null;
  };
  return {
    boardFilter: get('--board'),
    maxPerBoard: parseInt(get('--max-per-board') ?? '20', 10),
  };
}

async function main() {
  const opts = parseArgs();
  const projectRoot = path.resolve(__dirname, '..');
  const metaDir = path.join(projectRoot, 'data', 'seoul', '_meta');
  fs.mkdirSync(metaDir, { recursive: true });

  const targets = opts.boardFilter ? BOARDS.filter((b) => b.miId === opts.boardFilter) : BOARDS;
  if (targets.length === 0) {
    console.error(`보드 ${opts.boardFilter} 를 찾을 수 없습니다.`);
    process.exit(1);
  }

  console.log('\n=== 서울 고교학점제지원센터 인덱싱 시작 (PDF 자동 수집 비활성, robots.txt 준수) ===');
  console.log(`대상 보드: ${targets.length}개\n`);

  const records: IndexRecord[] = [];
  const skipped: { reason: string; listUrl?: string }[] = [];

  for (const board of targets) {
    const listUrl = `${BASE}${board.boardPath}`;
    console.log(`\n[BOARD] ${board.description}  (${listUrl})`);
    try {
      await sleep(DELAY_MS);
      const html = await fetchText(listUrl, BASE);
      const rows = parsePostRows(html, board, listUrl).slice(0, opts.maxPerBoard);
      console.log(`  → ${rows.length}건 행 인덱싱`);
      for (const r of rows) console.log(`    · ${r.title}${r.attachmentHints.length ? `  [${r.attachmentHints.join(', ')}]` : ''}`);
      records.push(...rows);
    } catch (e) {
      const msg = (e as Error).message;
      console.warn(`  목록 조회 실패: ${msg}`);
      skipped.push({ reason: msg, listUrl });
    }
  }

  const manifestPath = path.join(metaDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(records, null, 2), 'utf-8');
  fs.writeFileSync(path.join(metaDir, 'skipped.json'), JSON.stringify(skipped, null, 2), 'utf-8');

  console.log('\n=== 완료 ===');
  console.log(`인덱싱: ${records.length}건`);
  console.log(`스킵: ${skipped.length}건`);
  console.log(`매니페스트: ${manifestPath}`);
  console.log('\n[안내] robots.txt 가 PDF/HWP 자동 다운로드를 금지하므로, 위 listUrl 을 브라우저로 열어 ');
  console.log('       필요한 첨부파일을 수동 다운로드한 뒤 data/seoul/pdfs/ 에 저장하세요.');
  console.log('       이후 npx tsx scripts/seoul-pdf-extract.ts 로 추출 가능합니다.');
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
