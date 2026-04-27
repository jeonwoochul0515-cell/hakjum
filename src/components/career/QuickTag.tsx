import { Beaker, Code2, Pill, BookText, BarChart3, Palette, Activity, GraduationCap, Scale, Leaf } from 'lucide-react';
import { C } from '@/lib/design-tokens';

interface QuickTagProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
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

export function QuickTag({ selected, onToggle }: QuickTagProps) {
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
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 12 }}>여러 개 선택할 수 있어요</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {interestCards.map(({ tag, Icon, label, desc }) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className="cursor-pointer transition-colors text-left"
              style={{
                padding: 14,
                background: isSelected ? C.brandSoft : '#fff',
                border: `1.5px solid ${isSelected ? C.brand : C.line}`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: isSelected ? C.brand : C.bg,
                  color: isSelected ? '#fff' : C.brand,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} color={isSelected ? '#fff' : C.brand} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink }}>{label}</div>
                <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
