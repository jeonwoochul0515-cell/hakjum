import { BookOpen, Lightbulb, Heart } from 'lucide-react';
import type { MajorFull } from '@/types';

interface Props {
  major: MajorFull;
}

export function MajorOverviewCard({ major }: Props) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* 학과 소개 */}
      {major.summary && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-sky-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">이 학과는 이런 걸 배워요</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{major.summary}</p>
        </div>
      )}

      {/* 학과 특성 */}
      {major.property && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-amber-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">학과의 특성</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{major.property}</p>
        </div>
      )}

      {/* 적성과 흥미 */}
      {major.interest && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-red-400" />
            <h3 className="font-semibold text-slate-800 text-sm">이런 학생에게 잘 맞아요</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{major.interest}</p>
        </div>
      )}

      {/* 대학 핵심과목 */}
      {major.mainSubjects.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">대학에서 배우는 핵심과목</h3>
          <div className="space-y-2">
            {major.mainSubjects.map((subj, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-primary mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-slate-700">{subj.name}</span>
                  {subj.desc && (
                    <p className="text-xs text-slate-400 mt-0.5">{subj.desc}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
