/**
 * scripts/build-stats-index.ts
 *
 * KCUE 표준데이터(학과/등록금/장학금/입학정원)를 사전 집계하여
 * 학과명·계열·트렌드 키워드 단위 통계 인덱스를 생성한다.
 *
 * 실행:
 *   npx tsx scripts/build-stats-index.ts
 *
 * 입력:
 *   - data/kcue/major-2025.json
 *   - data/kcue/admission-quota-2024.json
 *   - data/kcue/tuition-2024.json
 *   - data/kcue/scholarship-2024.json
 *   - data/kcue/loan-2024.json
 *
 * 출력:
 *   - data/kcue/major-stats.json
 *
 * 출력 스키마:
 *   {
 *     _meta: { source, syncedAt, sourceFiles[], totalMajors, totalUniversities },
 *     byMajor: {
 *       [majorName]: {
 *         majorName,
 *         category,
 *         schoolCount,            // 운영 대학 수
 *         schools: string[],      // 상위 10개 (UI hint용)
 *         quota: { min, avg, max, total }, // 입학정원 통계 (학과 단위)
 *         tuitionAvgWon: number | null,    // 운영 대학들의 학부 평균등록금 평균(원)
 *         scholarshipAvgPerUniv: number | null, // 평균 장학 수혜건수/대학
 *         relatedJobs: string[],   // 학과들에 등장한 관련 직업 상위 8개
 *         mainSubjects: string[],  // 주요 교과목 상위 8개
 *       }
 *     },
 *     byCategory: {
 *       [category]: { majorCount, totalQuota }
 *     },
 *     trending: Array<{
 *       keyword: string,
 *       majorName: string,
 *       category: string,
 *       schoolCount: number,
 *       totalQuota: number,
 *       tuitionAvgWon: number | null,
 *       summary: string,
 *     }>
 *   }
 */

import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// 입력 타입 (실제 sync 결과 파일 구조)
// ─────────────────────────────────────────────────────────────────────────────

interface KcueFile<T> {
  _meta?: {
    source?: string;
    apiId?: string;
    license?: string;
    syncedAt?: string;
    baseDataDate?: string;
    organization?: string;
    upstreamUrl?: string;
    totalCount?: number;
  };
  records?: T[];
}

interface MajorRow {
  연도?: string;
  시도명?: string;
  학교명?: string;
  학교구분명?: string;
  학과상태명?: string;
  학과명?: string;
  표준학과명?: string;
  대학자체계열명?: string;
  표준분류계열코드?: string;
  단과대학명?: string;
  주요교과목명?: string;
  관련직업명?: string;
  입학정원수?: string | number;
  졸업자수?: string | number;
  [k: string]: unknown;
}

interface AdmissionRow {
  학교명?: string;
  본분교구분명?: string;
  입학정원합계?: string | number;
  인문계열정원?: string | number;
  사회계열정원?: string | number;
  교육계열정원?: string | number;
  공학계열정원?: string | number;
  자연계열정원?: string | number;
  의약계열정원?: string | number;
  예체능계열정원?: string | number;
}

interface TuitionRow {
  univNm?: string;
  univSeNm?: string;
  평균등록금?: string | number;
}

interface ScholarshipRow {
  univNm?: string;
  schlioSeNm?: string;
  schlship?: string | number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 출력 타입
// ─────────────────────────────────────────────────────────────────────────────

export interface MajorStats {
  majorName: string;
  category: string;
  schoolCount: number;
  schools: string[];
  quota: { min: number; avg: number; max: number; total: number };
  tuitionAvgWon: number | null;
  scholarshipAvgPerUniv: number | null;
  relatedJobs: string[];
  mainSubjects: string[];
}

export interface CategoryStats {
  majorCount: number;
  totalQuota: number;
}

export interface TrendingMajor {
  keyword: string;
  majorName: string;
  category: string;
  schoolCount: number;
  totalQuota: number;
  tuitionAvgWon: number | null;
  summary: string;
}

export interface MajorStatsIndex {
  _meta: {
    source: string;
    syncedAt: string;
    sourceFiles: string[];
    totalMajors: number;
    totalUniversities: number;
    license: string;
    organization: string;
  };
  byMajor: Record<string, MajorStats>;
  byCategory: Record<string, CategoryStats>;
  trending: TrendingMajor[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function readJson<T>(file: string): KcueFile<T> | null {
  if (!fs.existsSync(file)) return null;
  try {
    const text = fs.readFileSync(file, 'utf-8');
    return JSON.parse(text) as KcueFile<T>;
  } catch (e) {
    console.warn(`⚠️ ${file} 파싱 실패:`, (e as Error).message);
    return null;
  }
}

/** 학교명 정규화 (괄호 제거 / 공백 제거 — 등록금·장학금 매칭용) */
function normUniv(name: string): string {
  if (!name) return '';
  return name
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+(학부|대학원|국제캠퍼스|캠퍼스|본교|분교)$/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/** 트렌드 키워드 (학과명/표준학과명에 포함되면 매칭) */
const TRENDING_KEYWORDS = ['AI', '인공지능', '반도체', '데이터', '바이오', '의예'];

const ROOT = path.resolve(process.cwd());
const KCUE_DIR = path.join(ROOT, 'data', 'kcue');

// ─────────────────────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log('▶ build-stats-index 시작');

  const majorFile = readJson<MajorRow>(path.join(KCUE_DIR, 'major-2025.json'));
  const admissionFile = readJson<AdmissionRow>(path.join(KCUE_DIR, 'admission-quota-2024.json'));
  const tuitionFile = readJson<TuitionRow>(path.join(KCUE_DIR, 'tuition-2024.json'));
  const scholarshipFile = readJson<ScholarshipRow>(path.join(KCUE_DIR, 'scholarship-2024.json'));

  if (!majorFile?.records || majorFile.records.length === 0) {
    console.error('❌ data/kcue/major-2025.json 이 비어있거나 존재하지 않습니다.');
    process.exit(1);
  }

  const majorRows = majorFile.records;
  const admissionRows = admissionFile?.records ?? [];
  const tuitionRows = tuitionFile?.records ?? [];
  const scholarshipRows = scholarshipFile?.records ?? [];

  console.log(`  · 학과 행: ${majorRows.length}`);
  console.log(`  · 입학정원 행: ${admissionRows.length}`);
  console.log(`  · 등록금 행: ${tuitionRows.length}`);
  console.log(`  · 장학금 행: ${scholarshipRows.length}`);

  // ─── 1) 학교명 → 학부 평균등록금(원) 인덱스 ─────────────────────────────
  // tuitionRows 중 univSeNm === '대학' 또는 '전문대학' 만 사용
  const undergradTuitionByUniv = new Map<string, number[]>();
  for (const r of tuitionRows) {
    const seNm = String(r.univSeNm || '').trim();
    if (seNm !== '대학' && seNm !== '전문대학') continue;
    const v = num(r.평균등록금);
    if (v <= 0) continue;
    const key = normUniv(String(r.univNm || ''));
    if (!key) continue;
    if (!undergradTuitionByUniv.has(key)) undergradTuitionByUniv.set(key, []);
    undergradTuitionByUniv.get(key)!.push(v);
  }

  function tuitionForUniv(univ: string): number | null {
    const key = normUniv(univ);
    const list = undergradTuitionByUniv.get(key);
    if (!list || list.length === 0) return null;
    return Math.round(list.reduce((s, x) => s + x, 0) / list.length);
  }

  // ─── 2) 학교명 → 장학금 건수 ──────────────────────────────────────────
  const scholarshipCountByUniv = new Map<string, number>();
  for (const r of scholarshipRows) {
    const amount = num(r.schlship);
    if (amount <= 0) continue;
    const key = normUniv(String(r.univNm || ''));
    if (!key) continue;
    scholarshipCountByUniv.set(key, (scholarshipCountByUniv.get(key) ?? 0) + 1);
  }

  // ─── 3) 학교명 → 입학정원 합계 (참고용 / 미활용 가능) ─────────────────
  const totalQuotaByUniv = new Map<string, number>();
  for (const r of admissionRows) {
    if (r.본분교구분명 && r.본분교구분명 !== '본교') continue;
    const key = normUniv(String(r.학교명 || ''));
    if (!key) continue;
    const total = num(r.입학정원합계);
    if (total <= 0) continue;
    totalQuotaByUniv.set(key, (totalQuotaByUniv.get(key) ?? 0) + total);
  }

  // ─── 4) 학과명 단위 집계 ──────────────────────────────────────────────
  interface Acc {
    majorName: string;
    category: string;
    schools: Set<string>;
    quotas: number[];
    relatedJobs: Map<string, number>; // job → freq
    mainSubjects: Map<string, number>; // subj → freq
  }

  const accMap = new Map<string, Acc>();

  for (const r of majorRows) {
    const status = String(r.학과상태명 || '정상').trim();
    if (status === '폐과') continue;
    const quota = num(r.입학정원수);
    if (quota <= 0) continue;

    const name = String(r.표준학과명 || r.학과명 || '').trim();
    if (!name) continue;
    const category = String(r.대학자체계열명 || '').trim() || '미분류';
    const school = String(r.학교명 || '').trim();

    const key = name;
    let a = accMap.get(key);
    if (!a) {
      a = {
        majorName: name,
        category,
        schools: new Set(),
        quotas: [],
        relatedJobs: new Map(),
        mainSubjects: new Map(),
      };
      accMap.set(key, a);
    }

    if (school) a.schools.add(school);
    a.quotas.push(quota);

    // 관련직업명 (+로 구분)
    const jobs = String(r.관련직업명 || '')
      .split(/[+,·]/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const j of jobs) {
      a.relatedJobs.set(j, (a.relatedJobs.get(j) ?? 0) + 1);
    }
    // 주요교과목명
    const subs = String(r.주요교과목명 || '')
      .split(/[+,·]/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const s of subs) {
      a.mainSubjects.set(s, (a.mainSubjects.get(s) ?? 0) + 1);
    }
  }

  // ─── 5) MajorStats 생성 ─────────────────────────────────────────────
  const byMajor: Record<string, MajorStats> = {};
  const allSchools = new Set<string>();

  for (const a of accMap.values()) {
    const quotas = a.quotas;
    const total = quotas.reduce((s, x) => s + x, 0);
    const min = quotas.length ? Math.min(...quotas) : 0;
    const max = quotas.length ? Math.max(...quotas) : 0;
    const avg = quotas.length ? Math.round(total / quotas.length) : 0;

    // 운영 대학들의 학부 평균등록금 평균
    const tuitions: number[] = [];
    for (const sch of a.schools) {
      allSchools.add(sch);
      const t = tuitionForUniv(sch);
      if (t != null) tuitions.push(t);
    }
    const tuitionAvgWon = tuitions.length
      ? Math.round(tuitions.reduce((s, x) => s + x, 0) / tuitions.length)
      : null;

    // 학과 운영 대학별 평균 장학 항목 수
    const scholarshipCounts: number[] = [];
    for (const sch of a.schools) {
      const cnt = scholarshipCountByUniv.get(normUniv(sch));
      if (cnt != null) scholarshipCounts.push(cnt);
    }
    const scholarshipAvgPerUniv = scholarshipCounts.length
      ? Math.round(scholarshipCounts.reduce((s, x) => s + x, 0) / scholarshipCounts.length)
      : null;

    // 상위 빈도 정렬
    const topJobs = Array.from(a.relatedJobs.entries())
      .sort((x, y) => y[1] - x[1])
      .slice(0, 8)
      .map(([k]) => k);
    const topSubs = Array.from(a.mainSubjects.entries())
      .sort((x, y) => y[1] - x[1])
      .slice(0, 8)
      .map(([k]) => k);

    byMajor[a.majorName] = {
      majorName: a.majorName,
      category: a.category,
      schoolCount: a.schools.size,
      schools: Array.from(a.schools).slice(0, 10),
      quota: { min, avg, max, total },
      tuitionAvgWon,
      scholarshipAvgPerUniv,
      relatedJobs: topJobs,
      mainSubjects: topSubs,
    };
  }

  // ─── 6) 카테고리별 집계 ───────────────────────────────────────────
  const byCategory: Record<string, CategoryStats> = {};
  for (const m of Object.values(byMajor)) {
    const cat = m.category || '미분류';
    if (!byCategory[cat]) byCategory[cat] = { majorCount: 0, totalQuota: 0 };
    byCategory[cat].majorCount += 1;
    byCategory[cat].totalQuota += m.quota.total;
  }

  // ─── 7) 트렌드 키워드 매칭 ────────────────────────────────────────
  const trending: TrendingMajor[] = [];
  const seen = new Set<string>();
  for (const kw of TRENDING_KEYWORDS) {
    const lowered = kw.toLowerCase();
    // schoolCount 내림차순으로 매칭되는 학과 중 가장 큰 1개 채택
    const candidates = Object.values(byMajor)
      .filter((m) => m.majorName.toLowerCase().includes(lowered))
      .sort((a, b) => b.schoolCount - a.schoolCount);
    const top = candidates[0];
    if (!top || seen.has(top.majorName)) continue;
    seen.add(top.majorName);
    trending.push({
      keyword: kw,
      majorName: top.majorName,
      category: top.category,
      schoolCount: top.schoolCount,
      totalQuota: top.quota.total,
      tuitionAvgWon: top.tuitionAvgWon,
      summary: buildTrendingSummary(kw, top),
    });
  }
  // 5개로 제한
  while (trending.length > 5) trending.pop();

  // ─── 8) 기본 보조: 트렌드 5개 미달 시 가장 많이 운영되는 학과 fill ─
  if (trending.length < 5) {
    const fillers = Object.values(byMajor)
      .filter((m) => !seen.has(m.majorName))
      .sort((a, b) => b.schoolCount - a.schoolCount)
      .slice(0, 5 - trending.length);
    for (const f of fillers) {
      trending.push({
        keyword: '주요',
        majorName: f.majorName,
        category: f.category,
        schoolCount: f.schoolCount,
        totalQuota: f.quota.total,
        tuitionAvgWon: f.tuitionAvgWon,
        summary: `전국 ${f.schoolCount}개 대학에서 운영 · 총 ${f.quota.total.toLocaleString()}명 모집`,
      });
    }
  }

  // ─── 9) 출력 ────────────────────────────────────────────────────
  const out: MajorStatsIndex = {
    _meta: {
      source: 'KCUE_표준데이터',
      syncedAt: new Date().toISOString(),
      sourceFiles: [
        'data/kcue/major-2025.json',
        'data/kcue/admission-quota-2024.json',
        'data/kcue/tuition-2024.json',
        'data/kcue/scholarship-2024.json',
      ],
      totalMajors: Object.keys(byMajor).length,
      totalUniversities: allSchools.size,
      license: '이용허락범위 제한없음',
      organization: '한국대학교육협의회',
    },
    byMajor,
    byCategory,
    trending,
  };

  const outPath = path.join(KCUE_DIR, 'major-stats.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`✓ ${path.relative(ROOT, outPath)} 작성 완료`);
  console.log(`  · 학과 ${out._meta.totalMajors}개, 대학 ${out._meta.totalUniversities}개`);
  console.log(`  · 트렌드 카드 ${trending.length}개:`);
  for (const t of trending) {
    console.log(`     - [${t.keyword}] ${t.majorName} (${t.schoolCount}교, ${t.totalQuota}명)`);
  }
}

function buildTrendingSummary(keyword: string, m: MajorStats): string {
  const tuitionPart =
    m.tuitionAvgWon != null
      ? ` · 등록금 평균 ${Math.round(m.tuitionAvgWon / 10_000).toLocaleString()}만원`
      : '';
  return `전국 ${m.schoolCount}개 대학 · 총 ${m.quota.total.toLocaleString()}명 모집${tuitionPart}`;
  // keyword 는 매칭 디버깅용으로만 보존 (필드는 trending.keyword)
  void keyword;
}

main();
