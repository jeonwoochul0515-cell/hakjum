import { Beaker, Code2, Pill, BookText, BarChart3, Palette, Activity, GraduationCap, Scale, Leaf } from 'lucide-react';
import { C } from '@/lib/design-tokens';

interface QuickTagProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  /** 분야별 관심도 (0~100). 없으면 기존 토글 동작과 동일. */
  tagInterests?: Record<string, number>;
  /** 3단계 관심도 사이클(30 → 60 → 100 → 해제). 미제공 시 onToggle 사용. */
  onCycleLevel?: (tag: string, nextLevel: number) => void;
}

const interestCards = [
  { tag: '이공계열', Icon: Beaker, label: '과학·탐구', desc: '실험하고 발견하는 게 좋아요' },
  { tag: 'IT/SW', Icon: Code2, label: 'IT·코딩', desc: '컴퓨터, 프로그래밍에 관심 있어요' },
  { tag: '의약계열', Icon: Pill, label: '의약·건강', desc: '사람을 치료하고 돕고 싶어요' },
  { tag: '인문계열', Icon: BookText, label: '인문·언어', desc: '글 읽고 쓰는 걸 좋아해요' },
  { tag: '경영/경제', Icon: BarChart3, label: '경영·경제', desc: '돈, 사업, 마케팅이 궁금해요' },
  { tag: '예체능계열', Icon: Palette, label: '예술·디자인', desc: '창작하고 표현하는 게 좋아요' },
  { tag: '체육/스포츠', Icon: Activity, label: '체육·스포츠', desc: '몸으로 활동하는 걸 좋아해요' },
  { tag: '교육계열', Icon: GraduationCap, label: '교육', desc: '가르치는 일에 관심 있어요' },
  { tag: '사회계열', Icon: Scale, label: '법·사회', desc: '사회 문제, 정의에 관심 있어요' },
  { tag: '자연과학', Icon: Leaf, label: '자연·환경', desc: '자연과 환경을 탐구하고 싶어요' },
];

// 3단계 관심도 사이클: 미선택 → 30(조금) → 60(관심) → 100(매우) → 해제
function nextLevel(current: number): number {
  if (current <= 0) return 30;
  if (current < 60) return 60;
  if (current < 100) return 100;
  return 0;
}

function levelLabel(level: number): string {
  if (level >= 100) return '매우 관심';
  if (level >= 60) return '관심';
  if (level >= 30) return '조금 관심';
  return '';
}

// brand(#1657d6) 톤 변형 — 디자인 토큰 기반 (rgba)
function levelBg(level: number): string {
  if (level >= 100) return C.brand;
  if (level >= 60) return 'rgba(22, 87, 214, 0.55)';
  if (level >= 30) return 'rgba(22, 87, 214, 0.28)';
  return C.bg;
}

function levelSurface(level: number): string {
  if (level >= 100) return C.brandSoft;
  if (level >= 60) return 'rgba(234, 241, 255, 0.85)';
  if (level >= 30) return 'rgba(234, 241, 255, 0.5)';
  return '#fff';
}

export function QuickTag({ selected, onToggle, tagInterests, onCycleLevel }: QuickTagProps) {
  const useLevels = !!onCycleLevel && !!tagInterests;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink }}>
          어떤 분야에 관심 있나요?
        </div>
        <span style={{ fontSize: 11, color: C.brand, fontWeight: 600 }}>
          {selected.length} / {interestCards.length}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 12 }}>
        {useLevels ? '여러 번 누르면 관심도가 올라가요 (조금 → 관심 → 매우)' : '여러 개 선택할 수 있어요'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {interestCards.map(({ tag, Icon, label, desc }) => {
          const level = tagInterests?.[tag] ?? (selected.includes(tag) ? 60 : 0);
          const isSelected = selected.includes(tag) || level > 0;
          const lvLabel = levelLabel(level);

          const handleClick = () => {
            if (useLevels) {
              onCycleLevel!(tag, nextLevel(level));
            } else {
              onToggle(tag);
            }
          };

          const bg = useLevels ? levelSurface(level) : (isSelected ? C.brandSoft : '#fff');
          const iconBg = useLevels ? levelBg(level) : (isSelected ? C.brand : C.bg);
          const borderColor = useLevels
            ? (level >= 100 ? C.brand : level >= 30 ? 'rgba(22, 87, 214, 0.45)' : C.line)
            : (isSelected ? C.brand : C.line);

          return (
            <button
              key={tag}
              onClick={handleClick}
              className="cursor-pointer transition-colors text-left"
              aria-label={lvLabel ? `${label} (${lvLabel})` : label}
              style={{
                padding: 14,
                background: bg,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: iconBg,
                  color: level > 0 || isSelected ? '#fff' : C.brand,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} color={level > 0 || isSelected ? '#fff' : C.brand} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink }}>{label}</div>
                  {useLevels && lvLabel && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: level >= 100 ? C.brand : C.sub,
                        background: level >= 100 ? '#fff' : 'transparent',
                        padding: level >= 100 ? '2px 6px' : 0,
                        borderRadius: 6,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {lvLabel}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
