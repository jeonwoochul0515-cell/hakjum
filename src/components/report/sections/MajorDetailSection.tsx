import { BookOpen, Briefcase, Sparkles } from 'lucide-react';
import type { MajorDetailSection as MajorDetailSectionType } from '@/types/report';

interface Props {
  data: MajorDetailSectionType;
  isPaid: boolean;
}

export function MajorDetailSection({ data, isPaid }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <BookOpen size={14} className="text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-700">학과 상세 분석</h3>
      </div>

      <div className={!isPaid ? 'relative' : ''}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="space-y-4">
            {data.details.map((item) => (
              <div key={item.name} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                  <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-2">{item.description}</p>

                {/* 커리큘럼 */}
                <div className="mb-2">
                  <p className="text-[11px] text-slate-400 mb-1">주요 커리큘럼</p>
                  <div className="flex flex-wrap gap-1">
                    {item.curriculum.map((c) => (
                      <span
                        key={c}
                        className="inline-block px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 진로 */}
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Briefcase size={11} className="text-indigo-400" />
                    <p className="text-[11px] text-slate-400">졸업 후 진로</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.careerPaths.map((path) => (
                      <span
                        key={path}
                        className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px]"
                      >
                        {path}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI 근거 */}
                <div className="bg-amber-50 rounded-md p-2 border border-amber-100">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Sparkles size={11} className="text-amber-500" />
                    <p className="text-[10px] font-medium text-amber-600">AI 추천 근거</p>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">{item.aiReason}</p>
                </div>
              </div>
            ))}
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
