/**
 * 부산 고교학점제 통합 인덱스 빌드
 *
 * 입력: data/busan/extracted/*.json (6개 PDF 추출 산출물)
 * 출력: data/busan/busan-curriculum-index.json
 *
 * 6개 부산교육청 고교학점제 안내자료 PDF에서 이미 추출된 구조화 데이터를
 * 단일 인덱스로 합쳐 functions/api/busan/curriculum-info.ts 가 즉시 조회할 수 있도록 한다.
 *
 * 중복 학교/과목/계열은 합치고 referencedIn 으로 출처 추적.
 *
 * 실행: npx tsx scripts/build-busan-index.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.resolve(__dirname, '../data/busan/extracted');
const OUTPUT_FILE = path.resolve(__dirname, '../data/busan/busan-curriculum-index.json');

// ── 입력 스키마 ──────────────────────────────────────────────────────
interface ExtractedFile {
  meta: {
    source: string;
    extractedAt: string;
    originalUrl: string;
    title: string;
    fileName: string;
    rawTextLength?: number;
    truncated?: boolean;
    model?: string;
    stopReason?: string;
  };
  content: {
    majors: Array<{
      name: string;
      recommendedSubjects?: string[];
      note?: string;
    }>;
    subjects: Array<{
      name: string;
      area: string;
      grade?: number | null;
      semester?: number | null;
      description?: string;
    }>;
    schools: Array<{
      name: string;
      role: string;
      location?: string;
      note?: string;
    }>;
    careerGuide: Array<{
      topic: string;
      summary?: string;
      content?: string;
    }>;
  };
}

// ── 출력 스키마 ──────────────────────────────────────────────────────
interface SubjectEntry {
  name: string;
  area: string;
  descriptions: string[];
  referencedIn: string[]; // 출처 PDF 제목
}

interface MajorEntry {
  name: string;
  recommendedSubjects: string[];
  notes: string[];
  referencedIn: string[];
}

interface SchoolEntry {
  name: string;
  location?: string;
  roles: string[];
  descriptions: string[];
  referencedIn: string[];
}

interface CareerGuideEntry {
  topic: string;
  content: string;
  source: string; // 출처 PDF 제목
}

interface BusanIndex {
  _meta: {
    source: string;
    license: string;
    organization: string;
    upstreamUrl: string;
    extractedAt: string;
    syncedAt: string;
    files: Array<{ fileName: string; title: string; counts: { majors: number; subjects: number; schools: number; guides: number } }>;
    totals: {
      uniqueSubjects: number;
      uniqueMajors: number;
      uniqueSchools: number;
      careerGuides: number;
    };
  };
  subjects: Record<string, SubjectEntry>;
  majors: Record<string, MajorEntry>;
  schools: Record<string, SchoolEntry>;
  careerGuides: CareerGuideEntry[];
}

// 부산 학교 판별 (location 또는 name 기반)
// 안내서(2024) 의 schools 는 location 이 권역명(남부Ⅰ/북부/해운대/강서구/...)
// 추출 데이터의 모든 school 은 부산 PEN 의 자료에서 추출되었으므로,
// 비부산 location("경기도", "대구광역시" 등)이 명시된 경우만 제외한다.
const NON_BUSAN_LOCATIONS = [
  '서울특별시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원도', '강원특별자치도', '충청북도', '충청남도', '전라북도', '전북특별자치도',
  '전라남도', '경상북도', '경상남도', '제주특별자치도', '제주특별자치도',
  '서울', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

function isBusanSchool(loc?: string): boolean {
  if (!loc) return true; // location 미지정 → 부산 자료에서 추출되었으므로 부산으로 간주
  const trimmed = loc.trim();
  if (!trimmed) return true;
  if (trimmed.includes('부산')) return true;
  for (const non of NON_BUSAN_LOCATIONS) {
    if (trimmed === non || trimmed.startsWith(non)) return false;
  }
  // 부산 권역명/구 단위 (남부Ⅰ, 북부, 해운대, 강서구, 북구, 기장군 등) → 부산
  return true;
}

function pushUnique(arr: string[], v: string | undefined | null): void {
  if (!v) return;
  const t = v.trim();
  if (!t) return;
  if (!arr.includes(t)) arr.push(t);
}

function main(): void {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`[busan-index] input dir not found: ${INPUT_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.preview.txt'))
    .sort();

  console.log(`[busan-index] found ${files.length} extracted JSON files`);

  const subjects: Record<string, SubjectEntry> = {};
  const majors: Record<string, MajorEntry> = {};
  const schools: Record<string, SchoolEntry> = {};
  const careerGuides: CareerGuideEntry[] = [];
  const fileSummaries: BusanIndex['_meta']['files'] = [];

  let earliestExtracted = '';

  for (const file of files) {
    const fullPath = path.join(INPUT_DIR, file);
    let raw: ExtractedFile;
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as ExtractedFile;
    } catch (e) {
      console.warn(`[busan-index] skip invalid JSON: ${file}`, e);
      continue;
    }

    const title = raw.meta?.title ?? file.replace(/\.json$/, '');
    const fileName = raw.meta?.fileName ?? file;

    if (raw.meta?.extractedAt) {
      if (!earliestExtracted || raw.meta.extractedAt < earliestExtracted) {
        earliestExtracted = raw.meta.extractedAt;
      }
    }

    const c = raw.content ?? { majors: [], subjects: [], schools: [], careerGuide: [] };

    // subjects
    for (const s of c.subjects ?? []) {
      const key = s.name.trim();
      if (!key) continue;
      if (!subjects[key]) {
        subjects[key] = { name: key, area: s.area || '기타', descriptions: [], referencedIn: [] };
      }
      // area 가 '기타'였는데 더 구체적인 area 가 들어오면 업그레이드
      if (subjects[key].area === '기타' && s.area && s.area !== '기타') {
        subjects[key].area = s.area;
      }
      pushUnique(subjects[key].descriptions, s.description);
      pushUnique(subjects[key].referencedIn, title);
    }

    // majors
    for (const m of c.majors ?? []) {
      const key = m.name.trim();
      if (!key) continue;
      if (!majors[key]) {
        majors[key] = { name: key, recommendedSubjects: [], notes: [], referencedIn: [] };
      }
      for (const rs of m.recommendedSubjects ?? []) pushUnique(majors[key].recommendedSubjects, rs);
      pushUnique(majors[key].notes, m.note);
      pushUnique(majors[key].referencedIn, title);
    }

    // schools (부산만)
    let busanSchoolCountInFile = 0;
    for (const sc of c.schools ?? []) {
      if (!isBusanSchool(sc.location)) continue;
      const key = sc.name.trim();
      if (!key) continue;
      busanSchoolCountInFile += 1;
      if (!schools[key]) {
        schools[key] = {
          name: key,
          location: sc.location,
          roles: [],
          descriptions: [],
          referencedIn: [],
        };
      }
      // location 보강 (더 구체적인 location 우선)
      if (!schools[key].location && sc.location) schools[key].location = sc.location;
      pushUnique(schools[key].roles, sc.role);
      pushUnique(schools[key].descriptions, sc.note);
      pushUnique(schools[key].referencedIn, title);
    }

    // careerGuide
    for (const g of c.careerGuide ?? []) {
      const topic = g.topic?.trim();
      if (!topic) continue;
      const content = (g.summary ?? g.content ?? '').trim();
      if (!content) continue;
      careerGuides.push({ topic, content, source: title });
    }

    fileSummaries.push({
      fileName,
      title,
      counts: {
        majors: (c.majors ?? []).length,
        subjects: (c.subjects ?? []).length,
        schools: busanSchoolCountInFile,
        guides: (c.careerGuide ?? []).length,
      },
    });

    console.log(
      `[busan-index]  · ${title}  →  majors ${(c.majors ?? []).length} · subjects ${(c.subjects ?? []).length} · schools(부산) ${busanSchoolCountInFile} · guides ${(c.careerGuide ?? []).length}`,
    );
  }

  const out: BusanIndex = {
    _meta: {
      source: 'home.pen.go.kr/hscredit',
      license: '공공누리 출처표시 (KOGL Type 1)',
      organization: '부산광역시교육청 고교학점제 지원센터',
      upstreamUrl: 'https://home.pen.go.kr/hscredit',
      extractedAt: earliestExtracted || new Date().toISOString(),
      syncedAt: new Date().toISOString(),
      files: fileSummaries,
      totals: {
        uniqueSubjects: Object.keys(subjects).length,
        uniqueMajors: Object.keys(majors).length,
        uniqueSchools: Object.keys(schools).length,
        careerGuides: careerGuides.length,
      },
    },
    subjects,
    majors,
    schools,
    careerGuides,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2), 'utf-8');

  console.log('');
  console.log(`[busan-index] wrote → ${OUTPUT_FILE}`);
  console.log(`  · uniqueSubjects: ${out._meta.totals.uniqueSubjects}`);
  console.log(`  · uniqueMajors:   ${out._meta.totals.uniqueMajors}`);
  console.log(`  · uniqueSchools:  ${out._meta.totals.uniqueSchools} (부산만)`);
  console.log(`  · careerGuides:   ${out._meta.totals.careerGuides}`);
}

main();
