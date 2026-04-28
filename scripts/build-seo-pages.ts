/**
 * scripts/build-seo-pages.ts
 *
 * 정적 SEO 자산 생성:
 *   1) public/sitemap.xml    — 정적 페이지 + 학과별 URL 자동 생성
 *   2) dist/seo/{slug}.html  — (선택) 학과별 정적 HTML 스니펫
 *
 * 실행:
 *   npx tsx scripts/build-seo-pages.ts
 *   npx tsx scripts/build-seo-pages.ts --html   # HTML 스니펫까지 생성
 *
 * 입력:
 *   - data/kcue/major-stats.json
 *
 * 빌드 통합:
 *   package.json scripts.build 앞에 `npx tsx scripts/build-seo-pages.ts &&` 를 추가하면
 *   배포마다 자동으로 sitemap이 갱신된다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SITE_URL = 'https://hakjum.school';
const TODAY = new Date().toISOString().slice(0, 10);

interface MajorStat {
  majorName: string;
  category?: string;
  schoolCount?: number;
  relatedJobs?: string[];
}

interface MajorStatsFile {
  byMajor: Record<string, MajorStat>;
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

const STATIC_PAGES: Array<Pick<SitemapEntry, 'loc' | 'changefreq' | 'priority'>> = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/flow', changefreq: 'weekly', priority: '0.9' },
  { loc: '/report', changefreq: 'weekly', priority: '0.9' },
  { loc: '/subscription', changefreq: 'monthly', priority: '0.7' },
  { loc: '/refund-policy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
];

function slugify(name: string, category?: string): string {
  const clean = (s: string) => s.replace(/\s+/g, '-').replace(/[^\p{L}\p{N}\-]/gu, '');
  return category ? `${clean(name)}-${clean(category)}` : clean(name);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function loadMajorStats(): Promise<MajorStat[]> {
  const file = path.join(ROOT, 'data', 'kcue', 'major-stats.json');
  if (!existsSync(file)) {
    console.warn('[seo] major-stats.json not found, skipping major URLs');
    return [];
  }
  const raw = await readFile(file, 'utf-8');
  const parsed = JSON.parse(raw) as MajorStatsFile;
  const list = Object.values(parsed.byMajor ?? {});
  // 최소 학교 수 1 이상, 학과명 너무 짧은 건 제외
  return list.filter(
    (m) => m.majorName && m.majorName.length >= 2 && (m.schoolCount ?? 0) >= 1,
  );
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildMajorHtml(major: MajorStat): string {
  const slug = slugify(major.majorName, major.category);
  const url = `${SITE_URL}/majors/${encodeURIComponent(slug)}`;
  const desc = `${major.majorName} 추천 학과 정보. ${
    major.category ? `${major.category} 계열 · ` : ''
  }${major.schoolCount ? `전국 ${major.schoolCount}개 대학 개설 · ` : ''}고교학점제 시대 ${
    major.majorName
  } 진학을 위한 추천 과목, 학기별 이수 로드맵을 학점나비 AI가 안내합니다.`;
  const jobs = (major.relatedJobs ?? []).slice(0, 8);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: major.majorName,
    description: desc,
    url,
    inLanguage: 'ko-KR',
    educationalLevel: '고등교육',
    programType: major.category ?? '학사학위과정',
    occupationalCategory: jobs,
    provider: {
      '@type': 'Organization',
      name: '학점나비',
      url: SITE_URL,
    },
  };
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeXml(major.majorName)} 추천 - 학점나비</title>
    <meta name="description" content="${escapeXml(desc)}" />
    <meta name="keywords" content="${escapeXml(major.majorName)} 추천, ${escapeXml(major.majorName)} 진로, ${escapeXml(major.category ?? '')}, 고교학점제, 학과 추천" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeXml(major.majorName)} 추천 - 학점나비" />
    <meta property="og:description" content="${escapeXml(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE_URL}/og-image.svg" />
    <meta property="og:site_name" content="학점나비" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <meta http-equiv="refresh" content="0; url=/flow?major=${encodeURIComponent(major.majorName)}" />
  </head>
  <body>
    <h1>${escapeXml(major.majorName)} 추천</h1>
    <p>${escapeXml(desc)}</p>
    <p><a href="/flow?major=${encodeURIComponent(major.majorName)}">학점나비에서 ${escapeXml(major.majorName)} 추천 받기</a></p>
  </body>
</html>
`;
}

async function main() {
  const writeHtml = process.argv.includes('--html');

  const majors = await loadMajorStats();
  console.log(`[seo] loaded ${majors.length} majors from major-stats.json`);

  // 1) sitemap entries
  const entries: SitemapEntry[] = [];
  for (const p of STATIC_PAGES) {
    entries.push({
      loc: `${SITE_URL}${p.loc}`,
      lastmod: TODAY,
      changefreq: p.changefreq,
      priority: p.priority,
    });
  }

  for (const m of majors) {
    const slug = slugify(m.majorName, m.category);
    entries.push({
      loc: `${SITE_URL}/majors/${encodeURIComponent(slug)}`,
      lastmod: TODAY,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  // 2) write sitemap.xml to public/
  const sitemap = buildSitemapXml(entries);
  const sitemapPath = path.join(ROOT, 'public', 'sitemap.xml');
  await writeFile(sitemapPath, sitemap, 'utf-8');
  console.log(`[seo] wrote ${entries.length} URLs to ${sitemapPath}`);

  // 3) (optional) emit HTML snippets to dist/seo/
  if (writeHtml) {
    const seoDir = path.join(ROOT, 'dist', 'seo');
    await mkdir(seoDir, { recursive: true });
    let count = 0;
    for (const m of majors) {
      const slug = slugify(m.majorName, m.category);
      const file = path.join(seoDir, `${slug}.html`);
      await writeFile(file, buildMajorHtml(m), 'utf-8');
      count++;
    }
    console.log(`[seo] wrote ${count} HTML snippets to ${seoDir}`);
  }
}

main().catch((err) => {
  console.error('[seo] build failed:', err);
  process.exit(1);
});
