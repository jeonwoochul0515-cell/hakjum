import { Trophy, Star } from 'lucide-react';
import type { MajorTop10Section as MajorTop10SectionType } from '@/types/report';

interface Props {
  data: MajorTop10SectionType;
  isPaid: boolean;
}

export function MajorTop10Section({ data, isPaid }: Props) {
  const FREE_LIMIT = 3;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Trophy size={14} className="text-amber-500" />
        <h3 className="text-sm font-bold text-slate-700">추천 학과 TOP 10</h3>
      </div>

      <div className="space-y-3">
        {data.recommendations.map((rec, idx) => {
          const isBlurred = !isPaid && idx >= FREE_LIMIT;

          return (
            <div key={rec.rank} className={isBlurred ? 'relative' : ''}>
              <div
                className={`bg-slate-50 rounded-lg p-3 ${
                  isBlurred ? 'blur-sm pointer-events-none select-none' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      rec.rank <= 3
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-slate-400'
                    }`}
                  >
                    {rec.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{rec.name}</p>
                    <p className="text-[11px] text-slate-400">{rec.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" />
                    <span className="text-xs font-bold text-slate-700">{rec.matchScore}%</span>
                  </div>
                </div>

                {/* matchScore 프로그레스 바 */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      rec.matchScore >= 80
                        ? 'bg-emerald-400'
                        : rec.matchScore >= 60
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                    }`}
                    style={{ width: `${rec.matchScore}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500">{rec.reason}</p>

                {rec.relatedJobs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.relatedJobs.map((job) => (
                      <span
                        key={job}
                        className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px]"
                      >
                        {job}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                  <p className="text-sm font-medium text-slate-500">
                    전체 보고서에서 확인하세요
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
