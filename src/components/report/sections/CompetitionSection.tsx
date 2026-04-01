import { BarChart3, TrendingUp } from 'lucide-react';
import type { CompetitionSection as CompetitionSectionType } from '@/types/report';

interface Props {
  data: CompetitionSectionType;
  isPaid: boolean;
}

export function CompetitionSection({ data, isPaid }: Props) {
  const maxRate = Math.max(...data.data.map((d) => d.competitionRate), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart3 size={14} className="text-rose-500" />
        <h3 className="text-sm font-bold text-slate-700">경쟁률 / 커트라인</h3>
      </div>

      <div className={!isPaid ? 'relative' : ''}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="space-y-3">
            {data.data.map((item, idx) => {
              const pct = Math.min((item.competitionRate / maxRate) * 100, 100);

              return (
                <div key={idx} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.university}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.major} · {item.admissionType}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={11} className="text-slate-400" />
                      <span className="text-[11px] text-slate-400">{item.trend}</span>
                    </div>
                  </div>

                  {/* 경쟁률 바 */}
                  <div className="mt-2 mb-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-slate-400">경쟁률</span>
                      <span className="text-xs font-bold text-slate-700">
                        {item.competitionRate}:1
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* 커트라인 */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">평균 커트라인</span>
                    <span className="text-xs font-bold text-slate-700">
                      {item.cutlineAvg}등급
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isPaid && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
            <p className="text-sm font-medium text-slate-500">전체 보고서에서 확인하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
