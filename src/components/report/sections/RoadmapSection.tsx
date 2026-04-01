import { Calendar } from 'lucide-react';
import type { RoadmapSection as RoadmapSectionType } from '@/types/report';

interface Props {
  data: RoadmapSectionType;
  isPaid: boolean;
}

export function RoadmapSection({ data, isPaid }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Calendar size={14} className="text-sky-500" />
        <h3 className="text-sm font-bold text-slate-700">학년별 이수 로드맵</h3>
      </div>

      <div className={!isPaid ? 'relative' : ''}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          {/* 요약 */}
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">{data.summary}</p>

          {/* 타임라인 */}
          <div className="relative pl-6">
            {/* 세로 라인 */}
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-slate-200" />

            <div className="space-y-5">
              {data.roadmap.map((year, idx) => (
                <div key={year.year} className="relative">
                  {/* 학년 노드 */}
                  <div
                    className={`absolute -left-4 top-0 w-4 h-4 rounded-full border-2 ${
                      idx === 0
                        ? 'bg-sky-500 border-sky-500'
                        : idx === data.roadmap.length - 1
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'bg-white border-sky-300'
                    }`}
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">{year.year}</p>

                    <div className="grid grid-cols-2 gap-2">
                      {/* 1학기 */}
                      <div className="bg-sky-50 rounded-lg p-2.5 border border-sky-100">
                        <p className="text-[10px] font-medium text-sky-500 mb-1.5">1학기</p>
                        <div className="space-y-1">
                          {year.semester1.map((subject) => (
                            <p key={subject} className="text-xs text-slate-700">
                              {subject}
                            </p>
                          ))}
                          {year.semester1.length === 0 && (
                            <p className="text-[11px] text-slate-400">-</p>
                          )}
                        </div>
                      </div>

                      {/* 2학기 */}
                      <div className="bg-indigo-50 rounded-lg p-2.5 border border-indigo-100">
                        <p className="text-[10px] font-medium text-indigo-500 mb-1.5">2학기</p>
                        <div className="space-y-1">
                          {year.semester2.map((subject) => (
                            <p key={subject} className="text-xs text-slate-700">
                              {subject}
                            </p>
                          ))}
                          {year.semester2.length === 0 && (
                            <p className="text-[11px] text-slate-400">-</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {year.note && (
                      <p className="text-[11px] text-slate-400 mt-1.5 italic">{year.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
