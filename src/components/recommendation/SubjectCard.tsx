import { useState } from 'react';
import type { SubjectRecommendation } from '@/types';

interface SubjectCardProps {
  subject: SubjectRecommendation;
  tierColor: string;
}

export function SubjectCard({ subject, tierColor }: SubjectCardProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className={`p-3 rounded-xl bg-white border ${tierColor} transition-all hover:shadow-sm ${isChecked ? 'ring-2 ring-sky-primary/30' : ''}`}>
      <div className="flex items-start gap-2.5">
        <label className="flex items-center mt-0.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
            className="w-4 h-4 rounded border-slate-300 text-sky-primary focus:ring-sky-primary/30 cursor-pointer"
          />
        </label>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${isChecked ? 'text-sky-primary' : 'text-slate-800'}`}>
            {subject.name}
          </h4>
          <p className="text-xs text-slate-500 mt-1">{subject.reason}</p>
        </div>
      </div>
      {isChecked && (
        <p className="text-[11px] text-sky-primary mt-1.5 ml-6.5">✓ 수강 예정에 추가됨</p>
      )}
    </div>
  );
}
