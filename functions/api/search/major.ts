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
async function loadMajorData(): Promise<{ records: MajorRecord[]; syncedAt: string; total: number }> {
  try {
    // @ts-expect-error - 데이터 파일은 sync 스크립트가 생성하므로 빌드 시 없을 수 있음
    const mod: { default: KcueMajorFile } = await import('../../../data/kcue/major-2025.json', {
      with: { type: 'json' },
    });
    const file = mod.default || {};
    const rows = Array.isArray(file.data) ? file.data : [];
    const records = normalizeMajors(rows);
    return {
      records,
      syncedAt: file.syncedAt || '',
      total: file.totalCount ?? rows.length,
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
  const category = (url.searchParams.get('category') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const rawLimit = parseInt(url.searchParams.get('limit') || '20', 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit));

  const { records, syncedAt, total } = await loadMajorData();

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
