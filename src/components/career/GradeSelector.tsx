interface GradeSelectorProps {
  value: string;
  onChange: (grade: string) => void;
}

const grades = ['2학년', '3학년'];

export function GradeSelector({ value, onChange }: GradeSelectorProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-2">수강 학년</label>
      <div className="flex gap-3">
        {grades.map((g) => (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              value === g
                ? 'bg-gradient-to-r from-sky-primary to-indigo-primary text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
