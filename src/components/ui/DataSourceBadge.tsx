// DataSourceBadge.tsx
// KCUE OpenAPI 등 외부 데이터의 출처를 자동 표시하는 재사용 컴포넌트.
// 학과/대학 카드 하단이나 상세 페이지 푸터에 부착하여 사용한다.
//
// 사용 예시:
// ```tsx
// import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
// import { makeMeta } from '@/lib/data-meta';
//
// const meta = makeMeta({
//   source: 'KCUE_대학알리미',
//   apiId: 'data.go.kr/15116892',
//   baseDataDate: '2026-03-31',
//   upstreamUrl: 'https://www.academyinfo.go.kr',
// });
//
// // 카드 하단 (compact, 기본)
// <DataSourceBadge meta={meta} />
//
// // 상세 페이지 푸터 (detailed)
// <DataSourceBadge meta={meta} variant="detailed" />
// ```

import type { CSSProperties } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { C } from '../../lib/design-tokens';
import {
  type DataMeta,
  formatSyncedAt,
  formatSourceLabel,
} from '../../lib/data-meta';

interface DataSourceBadgeProps {
  meta: DataMeta;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function DataSourceBadge({
  meta,
  variant = 'compact',
  className = '',
}: DataSourceBadgeProps) {
  const sourceLabel = formatSourceLabel(meta.source);
  const orgLabel = meta.organization ?? '한국대학교육협의회';
  const syncedDate = formatSyncedAt(meta.syncedAt);

  if (variant === 'detailed') {
    return (
      <div
        className={className}
        style={{
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: '14px 16px',
          fontSize: 12,
          color: C.sub,
          letterSpacing: '-0.01em',
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            color: C.ink,
            fontWeight: 600,
            fontSize: 12.5,
          }}
        >
          <BookOpen size={14} color={C.brand} aria-hidden="true" />
          <span>출처 정보</span>
        </div>

        <dl style={dlStyle}>
          <Row label="제공 기관" value={orgLabel} />
          <Row label="데이터셋" value={sourceLabel} />
          <Row label="API ID" value={meta.apiId} mono />
          <Row label="라이선스" value={meta.license} />
          <Row label="마지막 업데이트" value={syncedDate} />
          {meta.baseDataDate && (
            <Row label="데이터기준일자" value={meta.baseDataDate} />
          )}
        </dl>

        {meta.upstreamUrl && (
          <a
            href={meta.upstreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 10,
              padding: '6px 10px',
              borderRadius: 8,
              background: C.brandSoft,
              color: C.brand,
              fontSize: 11.5,
              fontWeight: 600,
              textDecoration: 'none',
              border: `1px solid ${C.line}`,
            }}
          >
            공식 자료
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </div>
    );
  }

  // compact (기본)
  return (
    <div
      className={className}
      style={{
        background: C.bg,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 11.5,
        color: C.sub,
        letterSpacing: '-0.01em',
        lineHeight: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <BookOpen size={12} color={C.brand} aria-hidden="true" />
        <span>
          출처: <span style={{ color: C.ink, fontWeight: 600 }}>{orgLabel}</span>
          {' · '}
          {sourceLabel}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span>마지막 업데이트 {syncedDate}</span>
        {meta.upstreamUrl && (
          <a
            href={meta.upstreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: C.brand,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            공식 자료
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}

const dlStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(80px, auto) 1fr',
  rowGap: 4,
  columnGap: 12,
  margin: 0,
};

interface RowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function Row({ label, value, mono }: RowProps) {
  return (
    <>
      <dt style={{ color: C.sub, fontWeight: 500 }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          color: C.ink,
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
            : undefined,
          fontSize: mono ? 11.5 : 12,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </dd>
    </>
  );
}
