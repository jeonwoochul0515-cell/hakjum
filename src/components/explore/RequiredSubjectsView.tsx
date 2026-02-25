import { BookMarked } from 'lucide-react';
import type { MajorFull } from '@/types';

interface Props {
  major: MajorFull;
  onCTAClick: () => void;
}

const SUBJECT_CATEGORIES = [
  { key: 'common' as const, label: '공통과목', color: 'bg-sky-100 text-sky-700', dotColor: 'bg-sky-primary' },
  { key: 'general' as const, label: '일반선택', color: 'bg-indigo-100 text-indigo-700', dotColor: 'bg-indigo-primary' },
  { key: 'career' as const, label: '진로선택', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-primary' },
  { key: 'professional' as const, label: '전문교과', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
];

export function RequiredSubjectsView({ major, onCTAClick }: Props) {
  const hasAny = Object.values(major.relateSubject).some((v) => v.trim());

  if (!hasAny) {
    return (
      <div className="text-center py-8 animate-fade-in-up">
        <p className="text-sm text-slate-500">관련 고교과목 정보가 아직 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <p className="text-xs text-slate-500">
        이 학과에 진학하려면 고등학교에서 이런 과목을 들으면 좋아요
      </p>

      {SUBJECT_CATEGORIES.map(({ key, label, color, dotColor }) => {
        const subjects = major.relateSubject[key];
        if (!subjects.trim()) return null;

        const list = subjects.split(',').map((s) => s.trim()).filter(Boolean);

        return (
          <div key={key} className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              <h3 className="font-semibold text-slate-800 text-sm">{label}</h3>
              <span className="text-xs text-slate-400">({list.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((subj, i) => (
                <span
                  key={i}
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
                >
                  {subj}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {/* CTA */}
      <button
        onClick={onCTAClick}
        className="w-full mt-4 py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <BookMarked size={16} />
        내 학교에 이 과목이 있는지 확인하기 →
      </button>
    </div>
  );
}
