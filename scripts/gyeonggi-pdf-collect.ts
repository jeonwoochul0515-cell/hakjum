/**
 * 경기 고교학점제 가이드 PDF 자동 수집 스크립트 (안성교육지원청 운영)
 *
 * 출처: https://hscredit.goean.kr  (경기도안성교육지원청 고교학점제지원센터)
 *   - robots.txt: 특정 검색봇(Yeti/Googlebot/Daumoa/NaverBot)에 한해
 *     /editor/, /kcase/, /upload/, /dext5editordata/, /search/ 만 차단
 *     ⇒ 일반 User-Agent 의 /hscredit/ 게시판 접근은 허용 (부산과 동일 정책 수준)
 *
 * 게시판 (홈 화면 분석 결과 — eGovFrame, 부산과 동일 패턴):
 *   - 공지사항            mi=5131 bbsId=3112
 *   - 갤러리              mi=5132 bbsId=3113
 *   - 자료(일반)          mi=5145 bbsId=3114
 *   - 교육과정 자료(1)    mi=5151 bbsId=3115
 *   - 교육과정 자료(2)    mi=5155 bbsId=3116
 *   - 교육과정 자료(3)    mi=5159 bbsId=3117
 *   - 교육과정 자료(4)    mi=5163 bbsId=3118
 *   - 교육과정 자료(5)    mi=5167 bbsId=3119
 *   - 교육과정 자료(6)    mi=5171 bbsId=3120
 *   - 교육과정 자료(7)    mi=5175 bbsId=3121
 *   - 교육과정 자료(8)    mi=5179 bbsId=3122
 *   - 교육과정 자료(9)    mi=5183 bbsId=3123
 *   - 교육과정 자료(10)   mi=5187 bbsId=3124
 *   - 자료(추가)          mi=6180 bbsId=3650
 *
 * 자동 발견 흐름 (부산과 동일):
 *   1) GET selectNttList.do?mi=...&bbsId=...&pageIndex=N
 *      → <a data-id="<nttSn>" class="nttInfoBtn"> 로 (nttSn, 제목) 추출
 *   2) POST selectNttInfo.do  (sysId=hscredit, mi, bbsId, nttSn 등) + 동일 JSESSIONID
 *      → RAONKUPLOAD.AddUploadedFile('seq','파일명','경로','size','fileKey',...) 파싱
 *   3) GET /common/nttFileDownload.do?fileKey=<fileKey>
 *
 * 주의 — 안성 hscredit 은 부산 home.pen.go.kr 보다 게시물 상세 접근이 엄격합니다.
 *   - GET 으로 selectNttInfo.do 직접 호출 시 "잘못된 접속 정보입니다" 응답
 *   - 동일 JSESSIONID 로 list 페이지를 먼저 GET 한 뒤, srchForm 의 hidden 필드를
 *     POST 로 재현하면 일부 보드에서 통과 (부산과 달리 모든 보드에서 보장 X)
 *   - 차단 시 해당 게시물은 skipped.json 에 기록되며 PDF 다운로드는 생략됩니다.
 *
 * 산출물:
 *   data/gyeonggi/pdfs/<bbsId>_<nttSn>_<safeTitle>.<ext>
 *   data/gyeonggi/_meta/manifest.json
 *   data/gyeonggi/_meta/skipped.json
 *
 * 실행:
 *   npx tsx scripts/gyeonggi-pdf-collect.ts                       # 전체 보드
 *   npx tsx scripts/gyeonggi-pdf-collect.ts --board 3115          # 특정 보드만
 *   npx tsx scripts/gyeonggi-pdf-collect.ts --max-per-board 3
 *   npx tsx scripts/gyeonggi-pdf-collect.ts --dry-run             # 다운로드 없이 목록만
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = 'https://hscredit.goean.kr';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Hakjum-Gyeonggi-Collector/1.0)';
const DELAY_MS = 700;

interface BoardConfig {
  bbsId: string;
  mi: string;
  category: string;
  description: string;
}

const BOARDS: BoardConfig[] = [
  { bbsId: '3112', mi: '5131', category: '공지사항',          description: '공지사항' },
  { bbsId: '3114', mi: '5145', category: '자료-일반',          description: '자료(일반)' },
  { bbsId: '3115', mi: '5151', category: '교육과정자료-1',     description: '교육과정 자료 (1)' },
  { bbsId: '3116', mi: '5155', category: '교육과정자료-2',     description: '교육과정 자료 (2)' },
  { bbsId: '3117', mi: '5159', category: '교육과정자료-3',     description: '교육과정 자료 (3)' },
  { bbsId: '3118', mi: '5163', category: '교육과정자료-4',     description: '교육과정 자료 (4)' },
  { bbsId: '3119', mi: '5167', category: '교육과정자료-5',     description: '교육과정 자료 (5)' },
  { bbsId: '3120', mi: '5171', category: '교육과정자료-6',     description: '교육과정 자료 (6)' },
  { bbsId: '3121', mi: '5175', category: '교육과정자료-7',     description: '교육과정 자료 (7)' },
  { bbsId: '3122', mi: '5179', category: '교육과정자료-8',     description: '교육과정 자료 (8)' },
  { bbsId: '3123', mi: '5183', category: '교육과정자료-9',     description: '교육과정 자료 (9)' },
  { bbsId: '3124', mi: '5187', category: '교육과정자료-10',    description: '교육과정 자료 (10)' },
  { bbsId: '3650', mi: '6180', category: '자료-추가',          description: '자료(추가)' },
];

interface PostMeta {
  bbsId: string;
  mi: string;
  category: string;
  nttSn: string;
  title: string;
  postUrl: string;
}

interface FileMeta {
  fileSeq: string;
  originalFileName: string;
  internalPath: string;
  sizeBytes: number;
  fileKey: string;
  downloadUrl: string;
}

interface DownloadRecord {
  source: 'hscredit.goean.kr';
  category: string;
  bbsId: string;
  nttSn: string;
  title: string;
  postUrl: string;
  fileKey: string;
  originalFileName: string;
  savedAs: string;
  sizeBytes: number;
  sha1: string;
  contentType: string | null;
  downloadedAt: string;
  license: '공공누리 제1유형(출처표시) 추정 — 게시물별 확인 필요';
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// 단순 cookie jar — 첫 응답의 Set-Cookie 를 보관하다가 이후 요청에 Cookie 헤더로 전달
class CookieJar {
  private jar = new Map<string, string>();
  ingest(setCookie: string | null) {
    if (!setCookie) return;
    // node fetch 는 multi Set-Cookie 를 단일 헤더로 반환 — 보수적으로 split
    for (const part of setCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/)) {
      const m = part.split(';')[0]?.trim();
      if (!m) continue;
      const eq = m.indexOf('=');
      if (eq <= 0) continue;
      this.jar.set(m.slice(0, eq), m.slice(eq + 1));
    }
  }
  header(): string {
    return Array.from(this.jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

async function fetchText(url: string, jar: CookieJar, referer?: string): Promise<string> {
  const cookie = jar.header();
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      ...(referer ? { Referer: referer } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
  jar.ingest(res.headers.get('set-cookie'));
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function postForm(
  url: string,
  form: Record<string, string>,
  jar: CookieJar,
  referer?: string,
): Promise<string> {
  const body = new URLSearchParams(form).toString();
  const cookie = jar.header();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(referer ? { Referer: referer } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body,
  });
  jar.ingest(res.headers.get('set-cookie'));
  if (!res.ok) throw new Error(`HTTP ${res.status} for POST ${url}`);
  return await res.text();
}

async function fetchBuffer(
  url: string,
  jar: CookieJar,
  referer?: string,
): Promise<{ buffer: ArrayBuffer; contentType: string | null }> {
  const cookie = jar.header();
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      ...(referer ? { Referer: referer } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
  jar.ingest(res.headers.get('set-cookie'));
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return { buffer: await res.arrayBuffer(), contentType: res.headers.get('content-type') };
}

function parsePostList(html: string, board: BoardConfig): PostMeta[] {
  const posts: PostMeta[] = [];
  const re = /<a[^>]*data-id="(\d+)"[^>]*class="nttInfoBtn"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const nttSn = m[1];
    const titleRaw = m[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ');
    const title = titleRaw.trim().replace(/\s+/g, ' ');
    if (!title) continue;
    const postUrl = `${BASE}/hscredit/na/ntt/selectNttInfo.do?mi=${board.mi}&bbsId=${board.bbsId}&nttSn=${nttSn}`;
    posts.push({ bbsId: board.bbsId, mi: board.mi, category: board.category, nttSn, title, postUrl });
  }
  return posts;
}

function parseHiddenInputs(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  // <input type="hidden" id="..." name="X" value="Y" />  (속성 순서 변동 허용)
  const re = /<input[^>]+(?:type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"|name="([^"]+)"[^>]*type="hidden"[^>]*value="([^"]*)"|name="([^"]+)"[^>]*value="([^"]*)"[^>]*type="hidden")/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const name = m[1] ?? m[3] ?? m[5];
    const value = m[2] ?? m[4] ?? m[6] ?? '';
    if (name && !(name in out)) out[name] = value;
  }
  return out;
}

function parseAttachments(html: string): FileMeta[] {
  const files: FileMeta[] = [];
  const re = /RAONKUPLOAD\.AddUploadedFile\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'(\d+)'\s*,\s*'([0-9a-f]+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    files.push({
      fileSeq: m[1],
      originalFileName: m[2],
      internalPath: m[3],
      sizeBytes: parseInt(m[4], 10),
      fileKey: m[5],
      downloadUrl: `${BASE}/common/nttFileDownload.do?fileKey=${m[5]}`,
    });
  }
  return files;
}

function safeFileName(s: string): string {
  return s.replace(/[<>:"/\\|?* -]/g, '_').replace(/\s+/g, '_').slice(0, 80);
}

function sha1(buf: ArrayBuffer): string {
  return crypto.createHash('sha1').update(Buffer.from(buf)).digest('hex');
}

interface CliOptions {
  boardFilter: string | null;
  maxPerBoard: number;
  dryRun: boolean;
  pdfOnly: boolean;
}

function parseArgs(): CliOptions {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : null;
  };
  return {
    boardFilter: get('--board'),
    maxPerBoard: parseInt(get('--max-per-board') ?? '5', 10),
    dryRun: argv.includes('--dry-run'),
    pdfOnly: !argv.includes('--include-hwp'),
  };
}

async function main() {
  const opts = parseArgs();
  const projectRoot = path.resolve(__dirname, '..');
  const pdfDir = path.join(projectRoot, 'data', 'gyeonggi', 'pdfs');
  const metaDir = path.join(projectRoot, 'data', 'gyeonggi', '_meta');
  fs.mkdirSync(pdfDir, { recursive: true });
  fs.mkdirSync(metaDir, { recursive: true });

  const targets = opts.boardFilter ? BOARDS.filter((b) => b.bbsId === opts.boardFilter) : BOARDS;
  if (targets.length === 0) {
    console.error(`보드 ${opts.boardFilter} 를 찾을 수 없습니다.`);
    process.exit(1);
  }

  console.log('\n=== 경기(안성) 고교학점제 PDF 수집 시작 ===');
  console.log(`대상 보드: ${targets.length}개, 보드당 최대 ${opts.maxPerBoard}건${opts.dryRun ? ' [DRY-RUN]' : ''}\n`);

  const records: DownloadRecord[] = [];
  const skipped: { reason: string; title?: string; postUrl?: string }[] = [];

  for (const board of targets) {
    const listUrl = `${BASE}/hscredit/na/ntt/selectNttList.do?mi=${board.mi}&bbsId=${board.bbsId}&pageIndex=1`;
    const jar = new CookieJar();
    console.log(`\n[BOARD] ${board.description}  (${listUrl})`);
    let listHtml: string;
    try {
      listHtml = await fetchText(listUrl, jar, `${BASE}/hscredit/main.do`);
    } catch (e) {
      console.warn(`  목록 조회 실패: ${(e as Error).message}`);
      skipped.push({ reason: `list fetch: ${(e as Error).message}`, postUrl: listUrl });
      continue;
    }

    const hidden = parseHiddenInputs(listHtml);
    const posts = parsePostList(listHtml, board).slice(0, opts.maxPerBoard);
    console.log(`  → ${posts.length}건 게시물 발견  (hidden form keys: ${Object.keys(hidden).slice(0, 6).join(', ')})`);

    for (const post of posts) {
      try {
        await sleep(DELAY_MS);
        // POST selectNttInfo.do 로 srchForm 동작을 모사
        const form: Record<string, string> = {
          ...hidden,
          sysId: hidden.sysId ?? 'hscredit',
          mi: board.mi,
          bbsId: board.bbsId,
          nttSn: post.nttSn,
          currPage: '1',
          chckTy: hidden.chckTy ?? 'B',
          listUseAt: 'Y',
        };
        const detail = await postForm(
          `${BASE}/hscredit/na/ntt/selectNttInfo.do?mi=${board.mi}&bbsId=${board.bbsId}&nttSn=${post.nttSn}`,
          form,
          jar,
          listUrl,
        );

        // 차단 페이지 ("잘못된 접속 정보" / "홈페이지 오류 알림") 감지
        if (/잘못된\s*접속\s*정보|홈페이지\s*오류\s*알림|시스템안내/.test(detail)) {
          skipped.push({ reason: '상세 접근 차단 (세션/CSRF 검증 실패 추정)', title: post.title, postUrl: post.postUrl });
          console.log(`  · [BLK] ${post.title}  (상세 페이지 접근 차단)`);
          continue;
        }

        const files = parseAttachments(detail);
        const targets2 = opts.pdfOnly ? files.filter((f) => /\.pdf$/i.test(f.originalFileName)) : files;
        if (targets2.length === 0) {
          skipped.push({ reason: opts.pdfOnly ? '첨부 PDF 없음' : '첨부 없음', title: post.title, postUrl: post.postUrl });
          console.log(`  · [SKIP] ${post.title}  (PDF 첨부 없음)`);
          continue;
        }

        for (const f of targets2) {
          const ext = path.extname(f.originalFileName).toLowerCase() || '.bin';
          const seqSuffix = targets2.length > 1 ? `_${f.fileSeq}` : '';
          const safeName = `${board.bbsId}_${post.nttSn}${seqSuffix}_${safeFileName(post.title)}${ext}`;
          const savePath = path.join(pdfDir, safeName);

          if (opts.dryRun) {
            console.log(`  · [DRY] ${post.title} → ${safeName}  (${(f.sizeBytes / 1024).toFixed(0)} KB)`);
            continue;
          }
          if (fs.existsSync(savePath) && fs.statSync(savePath).size === f.sizeBytes) {
            console.log(`  · [HIT] ${safeName} (이미 존재, 동일 크기)`);
            continue;
          }
          await sleep(DELAY_MS);
          const { buffer, contentType } = await fetchBuffer(f.downloadUrl, jar, post.postUrl);
          fs.writeFileSync(savePath, Buffer.from(buffer));
          const hash = sha1(buffer);
          records.push({
            source: 'hscredit.goean.kr',
            category: board.category,
            bbsId: board.bbsId,
            nttSn: post.nttSn,
            title: post.title,
            postUrl: post.postUrl,
            fileKey: f.fileKey,
            originalFileName: f.originalFileName,
            savedAs: path.relative(projectRoot, savePath).replace(/\\/g, '/'),
            sizeBytes: buffer.byteLength,
            sha1: hash,
            contentType,
            downloadedAt: new Date().toISOString(),
            license: '공공누리 제1유형(출처표시) 추정 — 게시물별 확인 필요',
          });
          console.log(`  · [OK]  ${safeName}  (${(buffer.byteLength / 1024).toFixed(0)} KB, sha1=${hash.slice(0, 12)}…)`);
        }
      } catch (e) {
        const msg = (e as Error).message;
        skipped.push({ reason: msg, title: post.title, postUrl: post.postUrl });
        console.warn(`  · [ERR] ${post.title}: ${msg}`);
      }
    }
  }

  const manifestPath = path.join(metaDir, 'manifest.json');
  let prev: DownloadRecord[] = [];
  if (fs.existsSync(manifestPath)) {
    try {
      prev = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as DownloadRecord[];
    } catch {
      /* ignore */
    }
  }
  const merged = new Map<string, DownloadRecord>();
  for (const r of prev) merged.set(r.savedAs, r);
  for (const r of records) merged.set(r.savedAs, r);
  const all = Array.from(merged.values()).sort((a, b) => a.savedAs.localeCompare(b.savedAs));
  fs.writeFileSync(manifestPath, JSON.stringify(all, null, 2), 'utf-8');
  fs.writeFileSync(path.join(metaDir, 'skipped.json'), JSON.stringify(skipped, null, 2), 'utf-8');

  console.log('\n=== 완료 ===');
  console.log(`다운로드: ${records.length}건 (총 매니페스트 ${all.length}건)`);
  console.log(`스킵/오류/차단: ${skipped.length}건`);
  console.log(`매니페스트: ${manifestPath}`);
  console.log('\n[안내] 안성 hscredit 은 상세 페이지 접근에 세션/CSRF 검증이 있어 일부 게시물이 차단될 수 있습니다.');
  console.log('       skipped.json 의 postUrl 을 브라우저로 직접 열어 수동 다운로드 후 data/gyeonggi/pdfs/ 에 저장 가능합니다.');
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
