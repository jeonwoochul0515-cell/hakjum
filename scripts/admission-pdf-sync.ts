/**
 * 대학 입시결과 PDF 파싱 + JSON 생성 스크립트
 * 실행: npx tsx scripts/admission-pdf-sync.ts [--university 서울대]
 *
 * 각 대학 입학처의 공개 입시결과 PDF를 다운로드하여
 * pdfjs-dist로 텍스트 추출 → Claude API로 구조화 → JSON 저장
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY 환경변수를 설정해주세요.');
  process.exit(1);
}

const DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── 대학 PDF 소스 목록 ──
// TODO: 각 대학 입학처에서 실제 PDF URL을 수동 수집하여 채워야 합니다
interface PdfSource {
  name: string;
  pdfUrl: string;
  year: number;
  period: 'susi' | 'jeongsi';
}

const UNIVERSITY_PDF_SOURCES: PdfSource[] = [
  // 아래는 예시 템플릿입니다. 실제 URL로 교체해야 합니다.
  // { name: '서울대학교', pdfUrl: 'https://admission.snu.ac.kr/...pdf', year: 2025, period: 'susi' },
  // { name: '연세대학교', pdfUrl: 'https://admission.yonsei.ac.kr/...pdf', year: 2025, period: 'susi' },
  // { name: '고려대학교', pdfUrl: 'https://oku.korea.ac.kr/...pdf', year: 2025, period: 'susi' },
];

// ── zod 스키마 ──
const CutlineSchema = z.object({
  avg: z.number().min(0).max(500),
  percentile70: z.number().min(0).max(500),
  min: z.number().min(0).max(500),
});

const AdmissionResultSchema = z.object({
  university: z.string().min(1),
  major: z.string().min(1),
  year: z.number().int().min(2020).max(2030),
  admissionType: z.string().min(1),
  period: z.enum(['susi', 'jeongsi']),
  recruited: z.number().int().min(0),
  applied: z.number().int().min(0),
  competitionRate: z.number().min(0).max(200),
  cutline: CutlineSchema,
  supplementaryOrder: z.number().int().min(0).nullable(),
});

type AdmissionResult = z.infer<typeof AdmissionResultSchema>;

// ── PDF 텍스트 추출 ──
async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  // pdfjs-dist Node.js용 legacy 빌드 사용
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n\n--- PAGE BREAK ---\n\n');
}

// ── Claude API로 구조화 ──
async function structureWithClaude(
  rawText: string,
  universityName: string,
  year: number,
  period: 'susi' | 'jeongsi',
): Promise<AdmissionResult[]> {
  const systemPrompt = `당신은 대학 입시결과 PDF에서 데이터를 추출하는 전문가입니다.
주어진 텍스트에서 학과별 입시결과를 추출하여 JSON 배열로 반환하세요.

각 항목의 형식:
{
  "university": "${universityName}",
  "major": "학과명",
  "year": ${year},
  "admissionType": "학생부교과" | "학생부종합" | "논술" | "정시" | "실기",
  "period": "${period}",
  "recruited": 모집인원(숫자),
  "applied": 지원자수(숫자),
  "competitionRate": 경쟁률(숫자),
  "cutline": {
    "avg": 평균 등급 또는 점수(숫자, 없으면 0),
    "percentile70": 70%컷(숫자, 없으면 0),
    "min": 최저(숫자, 없으면 0)
  },
  "supplementaryOrder": 충원순번(숫자 또는 null)
}

규칙:
1. 반드시 JSON 배열만 출력하세요. 설명 없이 순수 JSON만.
2. 데이터가 없는 필드는 숫자 0 또는 null로 설정하세요.
3. 내신 등급은 소수점 첫째자리까지 (예: 2.3)
4. 수능 점수는 그대로 사용 (예: 285.5)
5. PDF에서 확인할 수 없는 데이터는 추측하지 마세요.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `다음은 ${universityName}의 ${year}학년도 ${period === 'susi' ? '수시' : '정시'} 입시결과 PDF에서 추출한 텍스트입니다:\n\n${rawText}` },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json() as any;
  const text = data.content?.[0]?.text || '';

  // JSON 추출 (마크다운 코드블록 제거)
  const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonStr);
}

// ── 메인 ──
async function main() {
  const args = process.argv.slice(2);
  const targetUniv = args.includes('--university')
    ? args[args.indexOf('--university') + 1]
    : null;

  const sources = targetUniv
    ? UNIVERSITY_PDF_SOURCES.filter((s) => s.name.includes(targetUniv))
    : UNIVERSITY_PDF_SOURCES;

  if (sources.length === 0) {
    console.log('처리할 대학이 없습니다. UNIVERSITY_PDF_SOURCES에 대학 PDF URL을 추가해주세요.');
    console.log('\n사용법:');
    console.log('  1. 각 대학 입학처에서 입시결과 PDF URL을 수집합니다.');
    console.log('  2. 이 파일의 UNIVERSITY_PDF_SOURCES 배열에 추가합니다.');
    console.log('  3. ANTHROPIC_API_KEY 환경변수를 설정합니다.');
    console.log('  4. npx tsx scripts/admission-pdf-sync.ts 를 실행합니다.');
    return;
  }

  console.log(`\n=== 대학 입시결과 PDF 동기화 시작 ===`);
  console.log(`대상: ${sources.length}개 대학\n`);

  const allResults: AdmissionResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    process.stdout.write(`[${i + 1}/${sources.length}] ${src.name} ... `);

    try {
      // 1. PDF 다운로드
      const pdfRes = await fetch(src.pdfUrl);
      if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
      const buffer = await pdfRes.arrayBuffer();

      // 2. 텍스트 추출
      const rawText = await extractTextFromPdf(buffer);
      if (rawText.trim().length < 50) {
        console.log('텍스트 부족 (스캔 PDF?)');
        errorCount++;
        continue;
      }

      // 3. Claude API로 구조화
      const results = await structureWithClaude(rawText, src.name, src.year, src.period);

      // 4. 스키마 검증
      const validated: AdmissionResult[] = [];
      for (const r of results) {
        const parsed = AdmissionResultSchema.safeParse(r);
        if (parsed.success) {
          validated.push(parsed.data);
        } else {
          console.warn(`  경고: ${r.major || '?'} 검증 실패 — ${parsed.error.issues[0]?.message}`);
        }
      }

      allResults.push(...validated);
      successCount++;
      console.log(`${validated.length}개 학과 추출`);
    } catch (err) {
      console.log(`실패: ${err instanceof Error ? err.message : err}`);
      errorCount++;
    }

    await sleep(DELAY_MS);
  }

  // 5. JSON 저장
  const outDir = path.resolve('data/admission-results');
  const publicDir = path.resolve('public/data/admission-results');
  for (const dir of [outDir, publicDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const output = {
    syncDate: new Date().toISOString(),
    totalUniversities: successCount,
    totalResults: allResults.length,
    results: allResults,
  };

  const latestPath = path.join(outDir, 'latest.json');
  const publicPath = path.join(publicDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(output, null, 2), 'utf-8');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2), 'utf-8');

  // 메타 파일
  const meta = {
    lastSync: output.syncDate,
    universities: successCount,
    totalResults: allResults.length,
    errors: errorCount,
  };
  fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

  console.log(`\n=== 완료 ===`);
  console.log(`성공: ${successCount}개 대학, ${allResults.length}개 학과`);
  console.log(`실패: ${errorCount}개 대학`);
  console.log(`저장: ${latestPath}`);
  console.log(`공개: ${publicPath}`);
}

main().catch((err) => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
