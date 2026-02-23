import { BookOpen } from 'lucide-react';
import type { School } from '@/types';

interface SubjectPreviewProps {
  school: School;
}

export function SubjectPreview({ school }: SubjectPreviewProps) {
  const grades = Object.entries(school.subjectsByGrade);

  return (
    <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={16} className="text-sky-primary" />
        <h4 className="text-sm font-semibold text-slate-700">{school.name} 개설과목</h4>
      </div>
      <div className="space-y-3">
        {grades.map(([grade, subjects]) => (
          <div key={grade}>
            <p className="text-xs font-medium text-slate-500 mb-1.5">{grade}</p>
            <div className="flex flex-wrap gap-1.5">
              {subjects.slice(0, 8).map((s) => (
                <span key={s} className="px-2 py-0.5 bg-white rounded-md text-xs text-slate-600 border border-slate-100">
                  {s}
                </span>
              ))}
              {subjects.length > 8 && (
                <span className="px-2 py-0.5 text-xs text-slate-400">+{subjects.length - 8}개</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
