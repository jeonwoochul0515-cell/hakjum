/**
 * /api/admission/results
 *
 * 대학별 입시결과(경쟁률, 커트라인, 충원순번) 조회 API
 * 정적 JSON 데이터에서 조회하여 반환
 *
 * GET ?university=서울대&major=컴퓨터공학과&year=2025
 */

interface Env {
  ADMISSION_CACHE?: KVNamespace;
}

interface AdmissionResult {
  university: string;
  major: string;
  year: number;
  admissionType: string;
  period: 'susi' | 'jeongsi';
  recruited: number;
  applied: number;
  competitionRate: number;
  cutline: {
    avg: number;
    percentile70: number;
    min: number;
  };
  supplementaryOrder: number | null;
}

const CACHE_KEY = 'admission-results-v1';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const university = url.searchParams.get('university') || '';
  const major = url.searchParams.get('major') || '';
  const year = url.searchParams.get('year');

  if (!university) {
    return new Response(JSON.stringify({ error: 'university parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let allResults: AdmissionResult[] = [];
  let source = 'static';

  // 1. KV 캐시 시도
  if (context.env.ADMISSION_CACHE) {
    try {
      const cached = await context.env.ADMISSION_CACHE.get(CACHE_KEY, 'json');
      if (cached && Array.isArray(cached)) {
        allResults = cached as AdmissionResult[];
        source = 'cache';
      }
    } catch { /* fall through to static */ }
  }

  // 2. 정적 JSON 폴백
  if (allResults.length === 0) {
    try {
      const baseUrl = url.origin;
      const res = await fetch(`${baseUrl}/data/admission-results/latest.json`);
      if (res.ok) {
        const data = await res.json() as { results?: AdmissionResult[] };
        allResults = data.results || [];
        source = 'static';
      }
    } catch { /* no data available */ }
  }

  // 3. 필터링
  let filtered = allResults.filter((r) =>
    r.university.includes(university) || university.includes(r.university)
  );

  if (major) {
    filtered = filtered.filter((r) =>
      r.major.includes(major) || major.includes(r.major)
    );
  }

  if (year) {
    const y = parseInt(year, 10);
    if (!isNaN(y)) {
      filtered = filtered.filter((r) => r.year === y);
    }
  }

  return new Response(JSON.stringify({ results: filtered, source }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
      'X-Data-Source': source,
    },
  });
};
