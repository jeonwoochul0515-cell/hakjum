// 옵션 A · 토스풍 차분 블루 — 디자인 시스템 토큰
export const C = {
  bg: '#f4f6fa',
  line: '#e5e9f0',
  ink: '#15181f',
  sub: '#5b6573',
  brand: '#1657d6',
  brandSoft: '#eaf1ff',
  brandShadow: 'rgba(22, 87, 214, 0.22)',
} as const;

export function chipBtn(): React.CSSProperties {
  return {
    padding: '8px 14px',
    fontSize: 12.5,
    fontWeight: 600,
    background: C.bg,
    color: C.ink,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    cursor: 'pointer',
    letterSpacing: '-0.02em',
  };
}

export function iconBtn(): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: C.bg,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
