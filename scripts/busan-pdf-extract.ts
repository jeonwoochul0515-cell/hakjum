/**
 * 부산 고교학점제 PDF → Claude AI 구조화 추출 스크립트
 *
 * 입력: data/busan/pdfs/*.pdf
 * 출력: data/busan/extracted/<basename>.json
 *
 * functions/api/curriculum/extract.ts 의 패턴(시스템 프롬프트 + JSON 강제 + 길이 트리밍 + 재시도)
 * 을 그대로 따르되, 부산 고교학점제 안내자료에서 다음 도메인을 추출하도록 프롬프트를 확장:
 *   - majors: 학과/계열별 권장 선택 과목
 *   - subjects: 부산형 미래선택과목, 일반/진로/융합 선택 등
 *   - schools: 거점학교/공동교육과정 운영교
 *   - careerGuide: 진로진학 가이드 콘텐츠 요약
 *
 * 실행:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/busan-pdf-extract.ts
 *   ANTHROPIC_API_KEY=... npx tsx scripts/busan-pdf-extract.ts --file 5240_970319_xxx.pdf
 *   ANTHROPIC_API_KEY=... npx tsx scripts/busan-pdf-extract.ts --max-files 1
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 더 큰 응답 위해 Sonnet 4.6 (32K 출력 가능). Haiku는 8K로 추출 데이터 잘림.
const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TEXT_LEN = 60_000;
const DELAY_MS = 800;

interface ExtractedContent {
  majors: Array<{
    name: string;            // 예: '자연계열-공학', '인문계열', '간호학과'
    recommendedSubjects: string[]; // 권장/필수 과목명
    note?: string;
  }>;
  subjects: Array<{
    name: string;
    area: string;            // '공통과목' | '일반선택' | '진로선택' | '융합선택' | '부산형미래선택' | '전문교과' | '기타'
    grade?: number | null;
    semester?: number | null;
    description?: string;
  }>;
  schools: Array<{
    name: string;
    role: string;            // '거점학교' | '공동교육과정 개설교' | '온라인학교' 등
    location?: string;
    note?: string;
  }>;
  careerGuide: Array<{
    topic: string;           // '진로 설계', '학업 계획서', '대학별 권장과목 매칭' 등
    summary: string;
  }>;
}

interface ExtractionResult {
  meta: {
    source: 'home.pen.go.kr/hscredit';
    extractedAt: string;
    originalUrl?: string;
    title?: string;
    fileName: string;
    rawTextLength: number;
    truncated: boolean;
    model: string;
    stopReason: string | null;
  };
  content: ExtractedContent;
}

const SYSTEM_PROMPT = `반드시 유효한 JSON만 출력하세요. 마크다운, 설명, 주석 없이 순수 JSON 객체 하나만 반환합니다.`;

function buildUserPrompt(title: string, pdfText: string): string {
  const trimmed = pdfText.length > MAX_TEXT_LEN
    ? pdfText.slice(0, MAX_TEXT_LEN) + '\n\n[... 이하 생략 ...]'
    : pdfText;
  return `당신은 부산광역시교육청 고교학점제 안내자료 PDF에서 학생 진로/과목 선택 정보를 추출하는 전문가입니다.

자료 제목: ${title}
출처: 부산광역시교육청 고교학점제 지원센터 (home.pen.go.kr/hscredit)

다음 PDF 원문 텍스트에서 4개 영역으로 정보를 구조화하여 JSON으로 반환하세요.

원문 텍스트:
"""
${trimmed}
"""

추출 규칙:
1. 결과는 반드시 다음 JSON 객체 하나만 출력합니다:
{
  "majors": [{ "name": "...", "recommendedSubjects": ["...", ...], "note": "..." }],
  "subjects": [{ "name": "...", "area": "...", "grade": <1|2|3|null>, "semester": <1|2|null>, "description": "..." }],
  "schools": [{ "name": "...", "role": "...", "location": "...", "note": "..." }],
  "careerGuide": [{ "topic": "...", "summary": "..." }]
}

2. majors: 학과/계열(자연-공학, 자연-의약, 인문-사회 등)이나 진학 희망 분야별로 권장하는 선택 과목 묶음. PDF가 학과별 권장표를 제공하면 모두 추출.
3. subjects:
   - "area" 가능 값: "공통과목", "일반선택", "진로선택", "융합선택", "부산형미래선택과목", "전문교과", "기타"
   - 부산 자체 운영 과목(부산형 미래선택 등)이 명시되면 정확히 표기.
   - 학년/학기 정보가 있으면 채우고, 없으면 null.
4. schools: 거점학교, 공동교육과정 운영교, 부산온라인학교 등. PDF에 학교명이 명시된 경우만.
5. careerGuide: 진로 설계 단계, 진로 검사 활용, 자기관리, 학업계획서 작성 등 진로진학 가이드 토픽 요약 (각 항목 1~3문장).
6. 추측 금지: PDF에서 확인되지 않으면 해당 배열은 빈 배열 [] 로 둡니다.
7. 비어 있는 영역은 빈 배열로 반환하되, 4개 키는 항상 존재해야 합니다.

JSON만 출력하세요.`;
}

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  // pdfjs-dist v3 legacy build (Node) — package version에 따라 .mjs/.js 경로가 다르므로 fallback 처리
  let pdfjsLib: typeof import('pdfjs-dist/legacy/build/pdf.js');
  try {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
  } catch {
    pdfjsLib = (await import('pdfjs-dist/legacy/build/pdf.mjs' as string)) as never;
  }
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: unknown) => (item && typeof item === 'object' && 'str' in item ? String((item as { str: unknown }).str) : ''))
      .join(' ');
    pages.push(text);
  }
  return sanitizeSurrogates(pages.join('\n\n--- PAGE BREAK ---\n\n'));
}

// PDF 추출 시 lone surrogate (UTF-16 짝 안 맞는 문자) 제거.
// JSON.stringify 단계에서 'invalid high surrogate' 에러 방지.
function sanitizeSurrogates(s: string): string {
  // Lone high surrogate (high 뒤에 low 없음)
  let cleaned = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
  // Lone low surrogate (앞에 high 없는 low)
  cleaned = cleaned.replace(/(^|[^\uD800-\uDBFF])([\uDC00-\uDFFF])/g, '$1');
  return cleaned;
}

function safeParseJson(raw: string): ExtractedContent {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const match = cleaned.match(/\{[\s\S]*\}/);
  const empty: ExtractedContent = { majors: [], subjects: [], schools: [], careerGuide: [] };
  if (!match) return empty;
  try {
    const parsed = JSON.parse(match[0]) as Partial<ExtractedContent>;
    return {
      majors: Array.isArray(parsed.majors) ? parsed.majors : [],
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      schools: Array.isArray(parsed.schools) ? parsed.schools : [],
      careerGuide: Array.isArray(parsed.careerGuide) ? parsed.careerGuide : [],
    };
  } catch {
    return empty;
  }
}

async function callClaude(apiKey: string, title: string, pdfText: string): Promise<{ content: ExtractedContent; stopReason: string | null }> {
  const body = JSON.stringify({
    model: MODEL_ID,
    max_tokens: 32000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(title, pdfText) }],
  });
  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });
    if (res.status === 529 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) {
      lastErr = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${lastErr.slice(0, 300)}`);
    }
    const data = (await res.json()) as { content?: { text?: string }[]; stop_reason?: string };
    const text = data.content?.[0]?.text ?? '';
    return { content: safeParseJson(text), stopReason: data.stop_reason ?? null };
  }
  throw new Error(`Anthropic API overloaded after retries: ${lastErr}`);
}

interface ManifestEntry {
  title: string;
  postUrl: string;
  savedAs: string;
  originalFileName: string;
  source: string;
  category?: string;
}

function loadManifest(metaPath: string): Map<string, ManifestEntry> {
  const map = new Map<string, ManifestEntry>();
  if (!fs.existsSync(metaPath)) return map;
  try {
    const arr = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ManifestEntry[];
    for (const r of arr) {
      const base = path.basename(r.savedAs);
      map.set(base, r);
    }
  } catch { /* ignore */ }
  return map;
}

interface CliOptions {
  fileFilter: string | null;
  maxFiles: number;
  force: boolean;
  dryRun: boolean;       // PDF 텍스트 추출만 하고 Claude 호출 생략 (API 키 없을 때 파이프라인 검증용)
}

function parseArgs(): CliOptions {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : null;
  };
  return {
    fileFilter: get('--file'),
    maxFiles: parseInt(get('--max-files') ?? '999', 10),
    force: argv.includes('--force'),
    dryRun: argv.includes('--dry-run'),
  };
}

async function main() {
  const opts = parseArgs();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !opts.dryRun) {
    console.error('ANTHROPIC_API_KEY 환경변수를 설정해주세요. (.dev.vars 가 아닌 셸 환경변수)');
    console.error('파이프라인만 검증하려면 --dry-run 플래그를 사용하세요.');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const pdfDir = path.join(projectRoot, 'data', 'busan', 'pdfs');
  const outDir = path.join(projectRoot, 'data', 'busan', 'extracted');
  const manifestPath = path.join(projectRoot, 'data', 'busan', '_meta', 'manifest.json');
  fs.mkdirSync(outDir, { recursive: true });

  if (!fs.existsSync(pdfDir)) {
    console.error(`PDF 디렉터리가 없습니다: ${pdfDir}\n먼저 npx tsx scripts/busan-pdf-collect.ts 를 실행해 주세요.`);
    process.exit(1);
  }

  const manifest = loadManifest(manifestPath);
  let pdfs = fs.readdirSync(pdfDir).filter((f) => /\.pdf$/i.test(f)).sort();
  if (opts.fileFilter) pdfs = pdfs.filter((f) => f === opts.fileFilter || f.includes(opts.fileFilter!));
  pdfs = pdfs.slice(0, opts.maxFiles);

  if (pdfs.length === 0) {
    console.error('처리할 PDF가 없습니다.');
    process.exit(1);
  }

  console.log(`\n=== 부산 PDF AI 추출 시작 ===`);
  console.log(`대상: ${pdfs.length}개 PDF, 모델: ${MODEL_ID}\n`);

  let ok = 0, fail = 0, skip = 0;
  for (const fname of pdfs) {
    const pdfPath = path.join(pdfDir, fname);
    const outPath = path.join(outDir, fname.replace(/\.pdf$/i, '.json'));
    if (!opts.force && fs.existsSync(outPath)) {
      console.log(`[SKIP] ${fname} (이미 추출됨, --force 로 재실행)`);
      skip++;
      continue;
    }
    process.stdout.write(`[..] ${fname}  `);
    try {
      const buffer = fs.readFileSync(pdfPath);
      const text = await extractTextFromPdf(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
      if (text.trim().length < 50) {
        console.log(`텍스트 부족 (스캔 PDF로 추정)`);
        fail++;
        continue;
      }
      const meta = manifest.get(fname);
      const title = meta?.title ?? fname.replace(/\.pdf$/i, '');
      let content: ExtractedContent;
      let stopReason: string | null = null;
      if (opts.dryRun) {
        // 파이프라인 검증: 텍스트 미리보기를 별도 .txt 로 덤프
        const preview = text.slice(0, 4000);
        const previewPath = outPath.replace(/\.json$/, '.preview.txt');
        fs.writeFileSync(previewPath, preview, 'utf-8');
        content = { majors: [], subjects: [], schools: [], careerGuide: [] };
        console.log(`DRY  textLen=${text.length}  preview→${path.basename(previewPath)}`);
      } else {
        await new Promise((r) => setTimeout(r, DELAY_MS));
        const claudeResp = await callClaude(apiKey!, title, text);
        content = claudeResp.content;
        stopReason = claudeResp.stopReason;
      }
      const result: ExtractionResult = {
        meta: {
          source: 'home.pen.go.kr/hscredit',
          extractedAt: new Date().toISOString(),
          originalUrl: meta?.postUrl,
          title,
          fileName: fname,
          rawTextLength: text.length,
          truncated: text.length > MAX_TEXT_LEN,
          model: MODEL_ID,
          stopReason,
        },
        content,
      };
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
      if (!opts.dryRun) {
        const counts = `majors=${content.majors.length} subjects=${content.subjects.length} schools=${content.schools.length} guides=${content.careerGuide.length}`;
        console.log(`OK  ${counts}`);
      }
      ok++;
    } catch (e) {
      console.log(`FAIL  ${(e as Error).message}`);
      fail++;
    }
  }

  console.log(`\n=== 완료 === 성공 ${ok}, 실패 ${fail}, 건너뜀 ${skip}`);
  console.log(`출력: ${outDir}`);
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
