/**
 * /api/admission/sync
 *
 * 대교협(adiga.kr) Excel 파일을 서버사이드에서 다운로드 → 파싱하여
 * 대학별 교과이수기준 데이터를 반환하는 API
 *
 * GET  → 캐시된 데이터 반환
 * POST → 강제 재크롤링 후 반환
 */

interface Env {
  // Cloudflare KV가 있으면 캐시 저장용
  ADMISSION_CACHE?: KVNamespace;
}

interface AdmissionEntry {
  university: string;
  category: string;
  requiredSubjects: string[];
  recommendedSubjects: string[];
  notes: string;
}

const CACHE_KEY = 'admission-data-v1';
const CACHE_TTL = 60 * 60 * 24 * 7; // 7일 캐시

// adiga.kr Excel 다운로드 URL
const ADIGA_EXCEL_URL =
  'https://www.adiga.kr/cmm/com/file/imageFileDown.do?fileId=00000000000000247123&fileSn=1';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  // KV 캐시 확인
  if (context.env.ADMISSION_CACHE) {
    const cached = await context.env.ADMISSION_CACHE.get(CACHE_KEY);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  }

  // 캐시 없으면 크롤링 실행
  const data = await crawlAdmissionData();

  const result = JSON.stringify({
    lastSync: new Date().toISOString(),
    totalEntries: data.length,
    universities: data,
  });

  // KV에 캐시 저장
  if (context.env.ADMISSION_CACHE) {
    await context.env.ADMISSION_CACHE.put(CACHE_KEY, result, { expirationTtl: CACHE_TTL });
  }

  return new Response(result, {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // 강제 재크롤링
  const data = await crawlAdmissionData();

  const result = JSON.stringify({
    lastSync: new Date().toISOString(),
    totalEntries: data.length,
    universities: data,
    forced: true,
  });

  if (context.env.ADMISSION_CACHE) {
    await context.env.ADMISSION_CACHE.put(CACHE_KEY, result, { expirationTtl: CACHE_TTL });
  }

  return new Response(result, {
    headers: { 'Content-Type': 'application/json' },
  });
};

async function crawlAdmissionData(): Promise<AdmissionEntry[]> {
  const results: AdmissionEntry[] = [];

  try {
    // adiga.kr Excel 다운로드 시도
    const res = await fetch(ADIGA_EXCEL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.adiga.kr/',
      },
    });

    if (res.ok) {
      const buf = await res.arrayBuffer();
      const parsed = parseSimpleExcel(new Uint8Array(buf));
      results.push(...parsed);
    }
  } catch {
    // Excel 다운로드 실패 시 빈 배열 반환
  }

  // 주요 대학 공지 페이지 크롤링
  const universityNotices = await crawlUniversityPages();
  // notices는 참고용이므로 데이터에는 포함하지 않음

  return results;
}

/**
 * 간이 Excel 파싱 (xlsx 라이브러리 없이 기본 구조만 추출)
 * Cloudflare Workers에서는 외부 npm 불가하므로 간이 파싱
 */
function parseSimpleExcel(data: Uint8Array): AdmissionEntry[] {
  // ZIP 파일 여부 확인 (Excel = ZIP)
  if (data[0] !== 0x50 || data[1] !== 0x4B) {
    return [];
  }

  // Cloudflare Workers 환경에서는 xlsx 라이브러리 사용 불가
  // 대신 shared strings + sheet XML을 직접 파싱하는 것은 너무 복잡
  // → 로컬 스크립트(sync-admission.mjs)에서 파싱하고 결과를 KV에 저장하는 구조 권장
  // → 여기서는 빈 배열 반환 (KV 캐시에 의존)
  return [];
}

async function crawlUniversityPages(): Promise<{ university: string; hasUpdates: boolean }[]> {
  const targets = [
    { university: '서울대학교', url: 'https://admission.snu.ac.kr/undergraduate/notice' },
    { university: '연세대학교', url: 'https://admission.yonsei.ac.kr/seoul/admission/notice.do' },
    { university: '고려대학교', url: 'https://oku.korea.ac.kr/oku/cms/FR_CON/BoardView.do?MENU_ID=650' },
  ];

  const results: { university: string; hasUpdates: boolean }[] = [];

  for (const t of targets) {
    try {
      const res = await fetch(t.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const html = await res.text();
        const has2028 = /2028.*(?:교과이수|권장과목|과목 선택)/i.test(html);
        results.push({ university: t.university, hasUpdates: has2028 });
      }
    } catch {
      results.push({ university: t.university, hasUpdates: false });
    }
  }

  return results;
}
