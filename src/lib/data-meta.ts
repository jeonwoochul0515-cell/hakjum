// data-meta.ts
// KCUE OpenAPI(이용허락범위 제한없음, 영리 가능) 등 외부 데이터 출처를
// 자동 표시하기 위한 메타데이터 타입 및 헬퍼 정의
//
// 사용 예시:
// ```ts
// import { makeMeta, formatSyncedAt, type ApiResponse } from '@/lib/data-meta';
//
// const meta = makeMeta({
//   source: 'KCUE_대학알리미',
//   apiId: 'data.go.kr/15116892',
//   baseDataDate: '2026-03-31',
//   upstreamUrl: 'https://www.academyinfo.go.kr',
// });
//
// const response: ApiResponse<Department[]> = {
//   data: departments,
//   _meta: meta,
// };
//
// // 화면 표시
// <DataSourceBadge meta={response._meta} />
// // → "마지막 업데이트 " + formatSyncedAt(meta.syncedAt) === "2026-04-27"
// ```

export interface DataMeta {
  /** 데이터 출처. KCUE 산하 서비스의 경우 enum, 그 외 임의 문자열 허용 */
  source: 'KCUE_표준데이터' | 'KCUE_대학알리미' | 'KCUE_입시포털' | string;
  /** API 식별자 (예: 'data.go.kr/15116892') */
  apiId: string;
  /** 라이선스/이용허락범위 (예: '이용허락범위 제한없음') */
  license: string;
  /** 동기화 일시 (ISO 8601, 예: '2026-04-27T03:21:00.000Z') */
  syncedAt: string;
  /** 데이터기준일자 (있으면, 예: '2026-03-31') */
  baseDataDate?: string;
  /** 원본 페이지 URL (있으면) */
  upstreamUrl?: string;
  /** 제공 기관명 (예: '한국대학교육협의회') */
  organization?: string;
}

export interface ApiResponse<T> {
  data: T;
  _meta: DataMeta;
}

/**
 * ISO 8601 문자열을 'YYYY-MM-DD' 형식으로 변환.
 * 잘못된 입력일 경우 원본 문자열을 그대로 반환.
 */
export function formatSyncedAt(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 부분 메타데이터로부터 기본값을 채워 완성된 DataMeta를 생성.
 * - source: 'KCUE_표준데이터' (기본)
 * - apiId: 'data.go.kr' (기본)
 * - license: '이용허락범위 제한없음' (기본)
 * - syncedAt: 현재 시각 (기본)
 * - organization: '한국대학교육협의회' (기본, KCUE 계열 가정)
 */
export function makeMeta(partial: Partial<DataMeta>): DataMeta {
  return {
    source: partial.source ?? 'KCUE_표준데이터',
    apiId: partial.apiId ?? 'data.go.kr',
    license: partial.license ?? '이용허락범위 제한없음',
    syncedAt: partial.syncedAt ?? new Date().toISOString(),
    baseDataDate: partial.baseDataDate,
    upstreamUrl: partial.upstreamUrl,
    organization: partial.organization ?? '한국대학교육협의회',
  };
}

/**
 * source enum을 사람이 읽기 좋은 라벨로 변환.
 * 알 수 없는 source는 그대로 반환.
 */
export function formatSourceLabel(source: DataMeta['source']): string {
  switch (source) {
    case 'KCUE_표준데이터':
      return '대교협 표준데이터';
    case 'KCUE_대학알리미':
      return '대학알리미';
    case 'KCUE_입시포털':
      return '대입정보포털 어디가';
    default:
      return source;
  }
}
