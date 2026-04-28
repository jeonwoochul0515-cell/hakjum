/**
 * /api/search/major
 *
 * KCUE(한국대학교육협의회) 표준 학과 데이터 검색 API
 *
 * GET /api/search/major?q={쿼리}&limit={개수}&category={계열}&page={페이지}
 *
 * 데이터 출처:
 *  - data.go.kr 공공데이터 ID 15116892 (전국 대학별 학과정보 표준데이터)
 *  - 이용허락범위: 제한없음 (KCUE 표준데이터)
 *  - 동기화 결과 파일: data/kcue/major-2025.json
 *
 * 데이터 로딩 전략:
 *  1) 빌드 타임에 동적 import 시도 (try/catch)
 *  2) 파일이 아직 없으면(키 활성화 대기 중) 빈 배열로 폴백 → 빌드/런타임 에러 없음
 *  3) sync 스크립트가 data/kcue/major-2025.json 을 채우면 자동으로 검색 가능
 */

interface Env {
  // 향후 KV에 캐싱하려면 여기에 바인딩 추가
  KCUE_CACHE?: KVNamespace;
}

interface MajorRecord {
  majorName: string;        // 학과명
  category: string;         // 계열 (공학계열/인문계열/...)
  schools: string[];        // 개설 학교 목록
  majorCode?: string;       // 학과 코드(있을 경우)
  status?: string;          // 학과상태명 (정상/폐과 등)
  quota?: number;           // 입학정원수
  // ── 통계 인덱스(major-stats.json)에서 부착되는 필드 (선택) ──
  schoolCount?: number;             // 운영 대학 수
  quotaStats?: { min: number; avg: number; max: number; total: number };
  tuitionAvgWon?: number | null;    // 학부 평균등록금(원)
  scholarshipAvgPerUniv?: number | null;
  relatedJobs?: string[];
  mainSubjects?: string[];
}

interface MajorStatsEntry {
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

interface TrendingMajor {
  keyword: string;
  majorName: string;
  category: string;
  schoolCount: number;
  totalQuota: number;
  tuitionAvgWon: number | null;
  summary: string;
}

interface MajorStatsFile {
  _meta?: {
    syncedAt?: string;
    totalMajors?: number;
    totalUniversities?: number;
  };
  byMajor?: Record<string, MajorStatsEntry>;
  byCategory?: Record<string, { majorCount: number; totalQuota: number }>;
  trending?: TrendingMajor[];
}

interface KcueMajorRow {
  학과명?: string;
  표준학과명?: string;
  계열명?: string;
  표준계열명?: string;
  학교명?: string;
  대학명?: string;
  학과코드?: string;
  표준학과코드?: string;
  학과상태명?: string;
  입학정원수?: number | string;
  // 다양한 필드명 대응
  [key: string]: unknown;
}

interface KcueMajorFile {
  syncedAt?: string;
  totalCount?: number;
  data?: KcueMajorRow[];
}

const SOURCE_META = {
  source: 'KCUE_표준데이터',
  apiId: 'data.go.kr/15116892',
  license: '이용허락범위 제한없음',
};

/**
 * KCUE 원본 행 → 정규화된 MajorRecord 그룹으로 변환
 * 동일 학과명을 학교 목록으로 묶음
 */
function normalizeMajors(rows: KcueMajorRow[]): MajorRecord[] {
  const map = new Map<string, MajorRecord>();

  for (const row of rows) {
    const name = String(row.표준학과명 || row.학과명 || '').trim();
    if (!name) continue;

    const status = String(row.학과상태명 || '정상').trim();
    const quotaRaw = row.입학정원수;
    const quota =
      typeof quotaRaw === 'number'
        ? quotaRaw
        : parseInt(String(quotaRaw ?? '0'), 10) || 0;

    // 폐과/정원0 필터
    if (status === '폐과') continue;
    if (quota <= 0) continue;

    const category = String(row.표준계열명 || row.계열명 || '').trim();
    const school = String(row.학교명 || row.대학명 || '').trim();
    const code = String(row.표준학과코드 || row.학과코드 || '').trim();

    const key = `${name}__${category}`;
    const existing = map.get(key);
    if (existing) {
      if (school && !existing.schools.includes(school)) {
        existing.schools.push(school);
      }
    } else {
      map.set(key, {
        majorName: name,
        category,
        schools: school ? [school] : [],
        majorCode: code || undefined,
        status,
        quota,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * KCUE 데이터 동적 로드
 * 데이터 파일이 없으면 빈 배열 반환 (빌드 깨지지 않음)
 */
async function loadMajorData(req: Request): Promise<{ records: MajorRecord[]; syncedAt: string; total: number }> {
  try {
    const url = new URL('/data/major-2025.json', req.url);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('not ok');
    const file = (await res.json()) as KcueMajorFile;
    // 실제 sync 결과는 { _meta, records } 또는 { syncedAt, data, totalCount } 둘 다 가능
    const fileAny = file as KcueMajorFile & { records?: KcueMajorRow[]; _meta?: { syncedAt?: string; totalCount?: number } };
    const rows = Array.isArray(file.data)
      ? file.data
      : Array.isArray(fileAny.records)
        ? fileAny.records
        : [];
    const records = normalizeMajors(rows);
    const syncedAt = file.syncedAt || fileAny._meta?.syncedAt || '';
    const total = file.totalCount ?? fileAny._meta?.totalCount ?? rows.length;
    return { records, syncedAt, total };
  } catch {
    // 파일 없음(아직 sync 미실행) → 빈 데이터로 동작
    return { records: [], syncedAt: '', total: 0 };
  }
}

/**
 * 사전 계산된 통계 인덱스 로드 (scripts/build-stats-index.ts 산출)
 * 없으면 null 반환 — 검색 결과 보강이 빠질 뿐 동작에는 영향 없음
 */
async function loadStatsIndex(req: Request): Promise<MajorStatsFile | null> {
  try {
    const url = new URL('/data/major-stats.json', req.url);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return (await res.json()) as MajorStatsFile;
  } catch {
    return null;
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
  const category = (url.searchParams.get('category') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const rawLimit = parseInt(url.searchParams.get('limit') || '20', 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const mode = (url.searchParams.get('mode') || '').trim();
  const includeStats = url.searchParams.get('stats') !== '0'; // 기본 ON

  // ── 트렌드 모드: ?mode=trending → 사전 계산된 trending 5개 반환 ─────────
  if (mode === 'trending') {
    const stats = await loadStatsIndex(context.request);
    const trending = stats?.trending ?? [];
    return new Response(
      JSON.stringify({
        data: trending,
        _meta: {
          ...SOURCE_META,
          syncedAt: stats?._meta?.syncedAt ?? new Date().toISOString(),
          totalMajors: stats?._meta?.totalMajors ?? 0,
          totalUniversities: stats?._meta?.totalUniversities ?? 0,
          mode: 'trending',
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }

  const [{ records, syncedAt, total }, stats] = await Promise.all([
    loadMajorData(context.request),
    includeStats ? loadStatsIndex(context.request) : Promise.resolve(null),
  ]);

  // 필터
  const queryLower = q.toLowerCase();
  let filtered = records.filter((r) => {
    if (category && r.category !== category) return false;
    if (q && !r.majorName.toLowerCase().includes(queryLower)) return false;
    return true;
  });

  // 정렬: 정확일치 → 시작일치 → 부분일치, 동률은 학과명 가나다순
  if (q) {
    filtered = filtered.sort((a, b) => {
      const sa = matchScore(a.majorName, q);
      const sb = matchScore(b.majorName, q);
      if (sa !== sb) return sa - sb;
      return a.majorName.localeCompare(b.majorName, 'ko');
    });
  } else {
    filtered = filtered.sort((a, b) => a.majorName.localeCompare(b.majorName, 'ko'));
  }

  const matchedCount = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  // 통계 인덱스로 페이지 결과 보강
  const enriched: MajorRecord[] = stats?.byMajor
    ? paged.map((r) => {
        const s = stats.byMajor![r.majorName];
        if (!s) return r;
        return {
          ...r,
          schoolCount: s.schoolCount,
          quotaStats: s.quota,
          tuitionAvgWon: s.tuitionAvgWon,
          scholarshipAvgPerUniv: s.scholarshipAvgPerUniv,
          relatedJobs: s.relatedJobs,
          mainSubjects: s.mainSubjects,
        };
      })
    : paged;

  const body = {
    data: enriched,
    _meta: {
      ...SOURCE_META,
      syncedAt: syncedAt || stats?._meta?.syncedAt || new Date().toISOString(),
      totalCount: total,
      matchedCount,
      page,
      limit,
      hasStats: !!stats?.byMajor,
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
