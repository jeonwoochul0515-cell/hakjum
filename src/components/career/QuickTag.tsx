interface QuickTagProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}

const interestCards = [
  { tag: '이공계열', icon: '🔬', label: '과학·탐구', desc: '실험하고 발견하는 게 좋아요' },
  { tag: 'IT/SW', icon: '💻', label: 'IT·코딩', desc: '컴퓨터, 프로그래밍에 관심 있어요' },
  { tag: '의약계열', icon: '💊', label: '의약·건강', desc: '사람을 치료하고 돕고 싶어요' },
  { tag: '인문계열', icon: '📚', label: '인문·언어', desc: '글 읽고 쓰는 걸 좋아해요' },
  { tag: '경영/경제', icon: '📊', label: '경영·경제', desc: '돈, 사업, 마케팅이 궁금해요' },
  { tag: '예체능계열', icon: '🎨', label: '예술·디자인', desc: '창작하고 표현하는 게 좋아요' },
  { tag: '체육/스포츠', icon: '⚽', label: '체육·스포츠', desc: '몸으로 활동하는 걸 좋아해요' },
  { tag: '교육계열', icon: '👨‍🏫', label: '교육', desc: '가르치는 일에 관심 있어요' },
  { tag: '사회계열', icon: '🏛️', label: '법·사회', desc: '사회 문제, 정의에 관심 있어요' },
  { tag: '자연과학', icon: '🌍', label: '자연·환경', desc: '자연과 환경을 탐구하고 싶어요' },
];

export function QuickTag({ selected, onToggle }: QuickTagProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-2">어떤 분야에 관심 있나요?</label>
      <p className="text-xs text-slate-400 mb-3">여러 개 선택할 수 있어요</p>
      <div className="grid grid-cols-2 gap-2">
        {interestCards.map(({ tag, icon, label, desc }) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 border-2 border-indigo-primary shadow-sm scale-[1.02]'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-primary' : 'text-slate-700'}`}>{label}</p>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
