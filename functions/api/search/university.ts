/**
 * /api/search/university
 *
 * KCUE(한국대학교육협의회) 표준 학과 데이터 기반 학교 검색 API
 *
 * GET /api/search/university?q={쿼리}&limit={개수}&region={시도}&page={페이지}
 *
 * 데이터 출처:
 *  - data.go.kr 공공데이터 ID 15116892 (전국 대학별 학과정보 표준데이터)
 *  - 이용허락범위: 제한없음 (KCUE 표준데이터)
 *  - 동기화 결과 파일: data/kcue/major-2025.json (학과 row에 학교 메타가 함께 포함)
 *
 * 데이터 로딩 전략:
 *  1) 빌드 타임에 동적 import 시도 (try/catch)
 *  2) 파일이 아직 없으면(키 활성화 대기 중) 빈 배열로 폴백 → 빌드/런타임 에러 없음
 *  3) sync 스크립트가 data/kcue/major-2025.json 을 채우면 자동으로 검색 가능
 */

interface Env {
  KCUE_CACHE?: KVNamespace;
}

interface UniversityRecord {
  schoolName: string;       // 학교명
  region?: string;          // 시도(소재지)
  schoolType?: string;      // 학교종류 (4년제/전문대학 등)
  establishment?: string;   // 설립구분 (국립/사립 등)
  majorCount: number;       // 보유 학과 수 (폐과/정원0 제외)
}

interface KcueRow {
  학교명?: string;
  대학명?: string;
  소재지도로명주소?: string;
  소재지지번주소?: string;
  시도?: string;
  학교종류?: string;
  학교종류명?: string;
  설립구분?: string;
  설립구분명?: string;
  학과상태명?: string;
  입학정원수?: number | string;
  [key: string]: unknown;
}

interface KcueMajorFile {
  syncedAt?: string;
  totalCount?: number;
  data?: KcueRow[];
}

const SOURCE_META = {
  source: 'KCUE_표준데이터',
  apiId: 'data.go.kr/15116892',
  license: '이용허락범위 제한없음',
};

/**
 * 시도(서울/경기/...) 추출
 */
function extractRegion(row: KcueRow): string {
  if (row.시도) return String(row.시도).trim();
  const addr = String(row.소재지도로명주소 || row.소재지지번주소 || '').trim();
  if (!addr) return '';
  // 주소 첫 토큰이 시도명
  const first = addr.split(/\s+/)[0] || '';
  return first;
}

/**
 * KCUE 학과 행을 학교 단위로 집계
 * 폐과/정원0 학과는 majorCount에서 제외
 */
function aggregateUniversities(rows: KcueRow[]): UniversityRecord[] {
  const map = new Map<string, UniversityRecord>();

  for (const row of rows) {
    const name = String(row.학교명 || row.대학명 || '').trim();
    if (!name) continue;

    const status = String(row.학과상태명 || '정상').trim();
    const quotaRaw = row.입학정원수;
    const quota =
      typeof quotaRaw === 'number'
        ? quotaRaw
        : parseInt(String(quotaRaw ?? '0'), 10) || 0;

    const isActiveMajor = status !== '폐과' && quota > 0;

    const existing = map.get(name);
    if (existing) {
      if (isActiveMajor) existing.majorCount += 1;
    } else {
      map.set(name, {
        schoolName: name,
        region: extractRegion(row) || undefined,
        schoolType: String(row.학교종류명 || row.학교종류 || '').trim() || undefined,
        establishment: String(row.설립구분명 || row.설립구분 || '').trim() || undefined,
        majorCount: isActiveMajor ? 1 : 0,
      });
    }
  }

  // 활성 학과가 0인 학교는 폐교 가능성 → 제외
  return Array.from(map.values()).filter((u) => u.majorCount > 0);
}

/**
 * KCUE 데이터 동적 로드
 * 데이터 파일이 없으면 빈 배열 반환 (빌드 깨지지 않음)
 */
async function loadUniversityData(): Promise<{
  records: UniversityRecord[];
  syncedAt: string;
  total: number;
}> {
  try {
    // @ts-expect-error - 데이터 파일은 sync 스크립트가 생성하므로 빌드 시 없을 수 있음
    const mod: { default: KcueMajorFile } = await import('../../../data/kcue/major-2025.json', {
      with: { type: 'json' },
    });
    const file = mod.default || {};
    const rows = Array.isArray(file.data) ? file.data : [];
    const records = aggregateUniversities(rows);
    return {
      records,
      syncedAt: file.syncedAt || '',
      total: records.length,
    };
  } catch {
    // 파일 없음(아직 sync 미실행) → 빈 데이터로 동작
    return { records: [], syncedAt: '', total: 0 };
  }
}

/**
 * 정확 일치(0) > 시작 일치(1) > 부분 일치(2) 우선순위 점수
 */
function matchScore(name: string, q: string): number {
  if (!q) return 2;
  const n = name.toLowerCase();
  const query = q.toLowerCase();
  if (n === query) return 0;
  if (n.startsWith(query)) return 1;
  if (n.includes(query)) return 2;
  return 3;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const region = (url.searchParams.get('region') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const rawLimit = parseInt(url.searchParams.get('limit') || '20', 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit));

  const { records, syncedAt, total } = await loadUniversityData();

  // 필터
  const queryLower = q.toLowerCase();
  let filtered = records.filter((r) => {
    if (region && !(r.region || '').includes(region)) return false;
    if (q && !r.schoolName.toLowerCase().includes(queryLower)) return false;
    return true;
  });

  // 정렬: 정확일치 → 시작일치 → 부분일치, 동률은 학교명 가나다순
  if (q) {
    filtered = filtered.sort((a, b) => {
      const sa = matchScore(a.schoolName, q);
      const sb = matchScore(b.schoolName, q);
      if (sa !== sb) return sa - sb;
      return a.schoolName.localeCompare(b.schoolName, 'ko');
    });
  } else {
    filtered = filtered.sort((a, b) => a.schoolName.localeCompare(b.schoolName, 'ko'));
  }

  const matchedCount = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  const body = {
    data: paged,
    _meta: {
      ...SOURCE_META,
      syncedAt: syncedAt || new Date().toISOString(),
      totalCount: total,
      matchedCount,
      page,
      limit,
    },
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
