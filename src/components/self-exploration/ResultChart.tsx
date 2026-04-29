/**
 * 자가탐색 결과 시각화 — 자체 SVG 도넛/막대.
 * 외부 차트 라이브러리(Recharts 등) 미사용.
 */
import { C } from '@/lib/design-tokens';

interface DonutSlice {
  key: string;
  label: string;
  value: number; // 0~100
  color: string;
}

interface DonutProps {
  slices: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

/**
 * 도넛 차트 — 각 슬라이스 비율은 value 합 대비 비율.
 * RIASEC 6유형처럼 합산 비교에 적합.
 */
export function DonutChart({ slices, size = 200, centerLabel, centerSubLabel }: DonutProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = size / 2;
  const innerRadius = radius * 0.62;
  const cx = radius;
  const cy = radius;

  // 누적 합을 reduce로 계산해 인덱스별 시작·끝 각도를 미리 결정 (mutable 상태 회피)
  const cumulatives = slices.reduce<number[]>((acc, s) => {
    const last = acc.length === 0 ? 0 : acc[acc.length - 1];
    acc.push(last + s.value);
    return acc;
  }, []);

  const arcs = slices.map((s, i) => {
    const cumStart = i === 0 ? 0 : cumulatives[i - 1];
    const cumEnd = cumulatives[i];
    const startAngle = (cumStart / total) * Math.PI * 2 - Math.PI / 2;
    const endAngle = (cumEnd / total) * Math.PI * 2 - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(endAngle);
    const iy2 = cy + innerRadius * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(startAngle);
    const iy1 = cy + innerRadius * Math.sin(startAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    return { path, color: s.color, key: s.key };
  });

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a) => (
          <path key={a.key} d={a.path} fill={a.color} stroke="#fff" strokeWidth={1.5} />
        ))}
      </svg>
      {(centerLabel || centerSubLabel) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerLabel && (
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.03em' }}>
              {centerLabel}
            </div>
          )}
          {centerSubLabel && (
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2, letterSpacing: '-0.01em' }}>
              {centerSubLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BarProps {
  bars: { label: string; value: number; color: string }[];
  /** 0~100 가정 */
  max?: number;
}

/** 가로 막대 — 강점 영역, 가치관 6축에 적합 */
export function HorizontalBars({ bars, max = 100 }: BarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bars.map((b) => {
        const pct = Math.max(0, Math.min(100, (b.value / max) * 100));
        return (
          <div key={b.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12.5,
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              <span style={{ color: C.ink, fontWeight: 600 }}>{b.label}</span>
              <span style={{ color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{b.value}</span>
            </div>
            <div
              style={{
                height: 8,
                background: C.bg,
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: b.color,
                  borderRadius: 999,
                  transition: 'width 400ms ease-out',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
