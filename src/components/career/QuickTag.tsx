interface QuickTagProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}

const quickTags = [
  '이공계열', '의약계열', '인문계열', '사회계열', '예체능계열',
  '교육계열', '경영/경제', 'IT/SW', '자연과학', '공학/기술',
];

export function QuickTag({ selected, onToggle }: QuickTagProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-2">빠른 선택</label>
      <div className="flex flex-wrap gap-2">
        {quickTags.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
