/**
 * src/lib/seo.ts
 *
 * SEO 헬퍼 — react-helmet 없이 useEffect로 동적 메타 태그 관리.
 *
 * 사용 예:
 *   usePageMeta({
 *     title: '컴퓨터공학과 추천 - 학점나비',
 *     description: '...',
 *     image: '/og/computer.png',
 *   });
 *
 * 한국 SEO 핵심:
 *   - 네이버는 description 텍스트를 그대로 검색 결과에 노출
 *   - 학과명·계열명을 description 앞부분에 명시
 *   - 학생/학부모가 검색하는 키워드를 자연스럽게 포함
 */

import { useEffect } from 'react';

const SITE = {
  name: '학점나비',
  url: 'https://hakjum.school',
  defaultTitle: '학점나비 - 고교학점제 AI 맞춤 과목 추천',
  defaultDescription:
    '고교학점제 시대, 내 꿈에 맞는 학과와 과목을 AI가 30초 만에 추천합니다. 전국 고등학교 NEIS 연동, 대교협 데이터 기반 학과 분석, 학기별 과목 로드맵까지.',
  defaultImage: '/og-image.svg',
  twitter: '@hakjum_school',
  locale: 'ko_KR',
} as const;

export const SITE_SEO = SITE;

interface PageMetaInput {
  title: string;
  description?: string;
  image?: string;
  /** 표준 URL (canonical). 미지정 시 현재 location.pathname 기준 자동 생성. */
  canonicalPath?: string;
  /** og:type 기본 'website' */
  type?: 'website' | 'article';
  /** 추가 키워드 (네이버 검색에 영향) */
  keywords?: string[];
  /** 페이지별 JSON-LD 구조화 데이터 */
  jsonLd?: object | object[];
}

/**
 * 페이지 진입 시 document.title + meta 태그를 동적으로 갱신한다.
 * 컴포넌트 unmount 시 기본값으로 복원한다.
 */
export function usePageMeta(input: PageMetaInput): void {
  const { title, description, image, canonicalPath, type, keywords, jsonLd } = input;

  useEffect(() => {
    const fullTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;
    const desc = description ?? SITE.defaultDescription;
    const img = image ?? SITE.defaultImage;
    const canonical = canonicalPath
      ? `${SITE.url}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
      : `${SITE.url}${typeof window !== 'undefined' ? window.location.pathname : '/'}`;
    const ogType = type ?? 'website';
    const imgAbs = img.startsWith('http') ? img : `${SITE.url}${img}`;

    const prevTitle = document.title;
    document.title = fullTitle;

    const metaUpdates: Array<[string, string, string]> = [
      ['name', 'description', desc],
      ['property', 'og:title', fullTitle],
      ['property', 'og:description', desc],
      ['property', 'og:image', imgAbs],
      ['property', 'og:type', ogType],
      ['property', 'og:url', canonical],
      ['property', 'og:site_name', SITE.name],
      ['property', 'og:locale', SITE.locale],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', fullTitle],
      ['name', 'twitter:description', desc],
      ['name', 'twitter:image', imgAbs],
    ];

    if (keywords && keywords.length > 0) {
      metaUpdates.push(['name', 'keywords', keywords.join(', ')]);
    }

    const previousValues = new Map<string, string | null>();

    metaUpdates.forEach(([attr, key, value]) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      const existing = el ? el.getAttribute('content') : null;
      previousValues.set(`${attr}|${key}`, existing);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    });

    // canonical
    let canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = canonicalEl ? canonicalEl.href : null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical;

    // JSON-LD
    const jsonLdEls: HTMLScriptElement[] = [];
    if (jsonLd) {
      const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      arr.forEach((data) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.dynamic = 'page-meta';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
        jsonLdEls.push(script);
      });
    }

    return () => {
      document.title = prevTitle;
      previousValues.forEach((value, compoundKey) => {
        const sep = compoundKey.indexOf('|');
        const attr = compoundKey.slice(0, sep);
        const key = compoundKey.slice(sep + 1);
        const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
        if (!el) return;
        if (value === null) {
          el.parentElement?.removeChild(el);
        } else {
          el.setAttribute('content', value);
        }
      });
      if (canonicalEl) {
        if (prevCanonical) canonicalEl.href = prevCanonical;
        else canonicalEl.parentElement?.removeChild(canonicalEl);
      }
      jsonLdEls.forEach((s) => s.parentElement?.removeChild(s));
    };
  }, [title, description, image, canonicalPath, type, keywords, jsonLd]);
}

/**
 * 학과별 메타 description 자동 생성.
 * 네이버/구글 검색 결과 스니펫에 그대로 노출되므로 키워드를 자연스럽게 배치.
 */
export function buildMajorDescription(input: {
  majorName: string;
  category?: string;
  schoolCount?: number;
  relatedJobs?: string[];
}): string {
  const { majorName, category, schoolCount, relatedJobs } = input;
  const parts: string[] = [];
  parts.push(`${majorName} 추천 학과 정보`);
  if (category) parts.push(`${category} 계열`);
  if (schoolCount && schoolCount > 0) {
    parts.push(`전국 ${schoolCount}개 대학 개설`);
  }
  if (relatedJobs && relatedJobs.length > 0) {
    parts.push(`주요 진로: ${relatedJobs.slice(0, 5).join(', ')}`);
  }
  parts.push(
    `고교학점제 시대 ${majorName} 진학을 위한 추천 과목, 학기별 이수 로드맵, 입시 정보까지 학점나비 AI가 안내합니다.`,
  );
  return parts.join(' · ').slice(0, 300);
}

/**
 * 학과 슬러그 생성 (URL 안전).
 * 한글은 유지하되 공백·특수문자만 하이픈으로 변환 — 한국어 검색엔진은 한글 URL을 잘 처리.
 */
export function majorSlug(majorName: string, category?: string): string {
  const clean = (s: string) => s.replace(/\s+/g, '-').replace(/[^\p{L}\p{N}\-]/gu, '');
  const m = clean(majorName);
  return category ? `${m}-${clean(category)}` : m;
}

/* ------------------------------------------------------------------ */
/* JSON-LD 구조화 데이터 빌더                                           */
/* ------------------------------------------------------------------ */

/** Organization — 사이트 전체 (index.html에 정적 삽입) */
export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    alternateName: 'hakjum',
    url: SITE.url,
    logo: `${SITE.url}/butterfly.svg`,
    description: SITE.defaultDescription,
    sameAs: [],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
    },
  };
}

/** WebSite + SearchAction — 홈페이지 */
export function jsonLdWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'ko-KR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/flow?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** EducationalOccupationalProgram — 학과 상세 페이지 */
export function jsonLdMajor(input: {
  majorName: string;
  category?: string;
  description: string;
  url: string;
  relatedJobs?: string[];
  schoolCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: input.majorName,
    description: input.description,
    url: input.url.startsWith('http') ? input.url : `${SITE.url}${input.url}`,
    inLanguage: 'ko-KR',
    educationalLevel: '고등교육',
    programType: input.category ?? '학사학위과정',
    occupationalCategory: input.relatedJobs?.slice(0, 8) ?? [],
    numberOfCredits: undefined,
    provider: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    ...(typeof input.schoolCount === 'number'
      ? {
          offers: {
            '@type': 'AggregateOffer',
            offerCount: input.schoolCount,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}

/** Service — 보고서(유료) 페이지 */
export function jsonLdReportService() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '학점나비 AI 진로·과목 보고서',
    serviceType: '진로 진학 컨설팅',
    provider: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: {
      '@type': 'Country',
      name: '대한민국',
    },
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    },
    description:
      '고1~고3 학생 맞춤형 AI 진로 분석 보고서. 적성검사, 학과 추천, 대학별 입시 기준, 학기별 과목 로드맵을 PDF로 제공합니다.',
    offers: [
      {
        '@type': 'Offer',
        name: 'AI 진로 진단 보고서',
        price: '4900',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
        url: `${SITE.url}/report`,
      },
      {
        '@type': 'Offer',
        name: 'AI 진로 진단 보고서 + 1:1 상담',
        price: '7900',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
        url: `${SITE.url}/report`,
      },
    ],
  };
}

/** BreadcrumbList — 학과 상세 등 깊은 페이지에 부가 */
export function jsonLdBreadcrumb(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };
}
