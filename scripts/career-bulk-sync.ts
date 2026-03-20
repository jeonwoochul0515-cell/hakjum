/**
 * 커리어넷 학과 데이터 벌크 동기화 스크립트
 * 실행: npx tsx scripts/career-bulk-sync.ts
 *
 * 커리어넷 API에서 주요 학과 목록 + 상세정보를 수집하여
 * data/career-cache.json 에 저장합니다.
 */

const API_KEY = process.env.CAREER_API_KEY;
if (!API_KEY) {
  console.error('❌ CAREER_API_KEY 환경변수를 설정해주세요.');
  process.exit(1);
}
const BASE_URL = 'https://www.career.go.kr/cnet/openapi/getOpenApi.json';
const DELAY_MS = 300;
const MAX_MAJORS = 200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const CATEGORIES = [
  '인문계열', '사회계열', '교육계열', '공학계열',
  '자연계열', '의약계열', '예체능계열',
];

interface MajorBrief {
  majorSeq: string;
  name: string;
  category: string;
}

interface MajorDetail {
  majorSeq: string;
  name: string;
  category: string;
  relatedSubjects: {
    common?: string;
    general?: string;
    career?: string;
    specialized?: string;
  };
  universities: { name: string; area: string }[];
  jobs: string;
  qualifications: string;
}

async function fetchMajorList(category: string): Promise<MajorBrief[]> {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    svcType: 'api',
    svcCode: 'MAJOR',
    contentType: 'json',
    gubun: 'univ_list',
    subject: category,
    perPage: '50',
  });

  try {
    const data = await fetchJSON(`${BASE_URL}?${params}`);
    const items = data?.dataSearch?.content || [];
    return items.map((item: any) => ({
      majorSeq: item.majorSeq || '',
      name: item.mClass || '',
      category: item.lClass || category,
    }));
  } catch {
    return [];
  }
}

async function fetchMajorDetail(majorSeq: string): Promise<any | null> {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    svcType: 'api',
    svcCode: 'MAJOR_VIEW',
    contentType: 'json',
    gubun: 'univ_list',
    majorSeq,
  });

  try {
    const data = await fetchJSON(`${BASE_URL}?${params}`);
    const item = data?.dataSearch?.content?.[0];
    if (!item) return null;

    const cleanHtml = (s: string) => (s || '').replace(/<br\s*\/?>/gi, ', ').replace(/<[^>]+>/g, '').trim();

    const universities: { name: string; area: string }[] = [];
    const seen = new Set<string>();
    for (const u of item.facility || []) {
      const name = (u.facilName || '').trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        universities.push({ name, area: (u.totalArea || '').trim() });
      }
    }

    return {
      majorSeq,
      name: item.mClass || '',
      category: item.lClass || '',
      summary: cleanHtml(item.summary || ''),
      relatedSubjects: {
        common: cleanHtml(item.relate_subject?.공통과목 || ''),
        general: cleanHtml(item.relate_subject?.일반선택과목 || ''),
        career: cleanHtml(item.relate_subject?.진로선택과목 || ''),
        specialized: cleanHtml(item.relate_subject?.['전문교과Ⅰ'] || ''),
      },
      universities: universities.slice(0, 30),
      jobs: cleanHtml(item.job || ''),
      qualifications: cleanHtml(item.qualification || ''),
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log('🦋 커리어넷 학과 데이터 벌크 동기화');
  console.log(`📅 ${new Date().toISOString()}\n`);

  // 1. 카테고리별 학과 목록 수집
  const allMajors: MajorBrief[] = [];

  for (const category of CATEGORIES) {
    console.log(`📚 ${category} 학과 목록 조회...`);
    const majors = await fetchMajorList(category);
    allMajors.push(...majors);
    console.log(`  → ${majors.length}개 학과`);
    await sleep(DELAY_MS);
  }

  // 중복 제거
  const uniqueMap = new Map<string, MajorBrief>();
  for (const m of allMajors) {
    if (m.majorSeq && !uniqueMap.has(m.majorSeq)) {
      uniqueMap.set(m.majorSeq, m);
    }
  }
  const uniqueMajors = Array.from(uniqueMap.values()).slice(0, MAX_MAJORS);
  console.log(`\n📊 총 ${uniqueMajors.length}개 고유 학과 (최대 ${MAX_MAJORS}개 상세 조회)\n`);

  // 2. 상세 정보 수집
  const details: MajorDetail[] = [];
  let done = 0;

  for (const major of uniqueMajors) {
    const detail = await fetchMajorDetail(major.majorSeq);
    if (detail) {
      details.push(detail);
    }
    done++;
    if (done % 10 === 0 || done === uniqueMajors.length) {
      process.stdout.write(`\r  상세 조회: ${done}/${uniqueMajors.length} (${Math.round(done / uniqueMajors.length * 100)}%)`);
    }
    await sleep(DELAY_MS);
  }

  console.log('\n');

  // 3. 변경 감지
  const fs = await import('fs');
  const path = await import('path');
  const cachePath = path.join(process.cwd(), 'data', 'career-cache.json');

  let previousCount = 0;
  let newMajors: string[] = [];
  try {
    const existing = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    previousCount = existing.majors?.length || 0;
    const existingNames = new Set((existing.majors || []).map((m: any) => m.name));
    newMajors = details.filter((d) => !existingNames.has(d.name)).map((d) => d.name);
  } catch { /* no previous file */ }

  // 4. 저장
  const output = {
    syncDate: new Date().toISOString(),
    totalMajors: details.length,
    categories: Object.fromEntries(
      CATEGORIES.map((c) => [c, details.filter((d) => d.category === c).length])
    ),
    changes: {
      previousCount,
      currentCount: details.length,
      newMajors,
    },
    majors: details,
  };

  fs.writeFileSync(cachePath, JSON.stringify(output, null, 2));
  console.log(`✅ 저장: ${cachePath}`);
  console.log(`   이전: ${previousCount}개 → 현재: ${details.length}개`);
  if (newMajors.length > 0) {
    console.log(`   신규 학과: ${newMajors.join(', ')}`);
  }
  console.log('\n🎉 완료!');
}

main().catch(console.error);
