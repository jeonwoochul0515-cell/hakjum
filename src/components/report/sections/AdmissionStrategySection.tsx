import { Compass, GraduationCap } from 'lucide-react';
import type { AdmissionStrategySection as AdmissionStrategySectionType } from '@/types/report';

interface Props {
  data: AdmissionStrategySectionType;
  isPaid: boolean;
}

export function AdmissionStrategySection({ data, isPaid }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Compass size={14} className="text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-700">입시 전략</h3>
      </div>

      <div className={!isPaid ? 'relative' : ''}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          {/* 추천 전형 */}
          <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-lg p-3 border border-indigo-100 mb-3">
            <p className="text-[11px] text-indigo-400 mb-0.5">추천 전형</p>
            <p className="text-sm font-bold text-indigo-700">{data.recommendedType}</p>
          </div>

          {/* 수시 / 정시 전략 */}
          <div className="grid grid-cols-1 gap-3 mb-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] text-slate-400 mb-1">수시 전략</p>
              <p className="text-xs text-slate-600 leading-relaxed">{data.earlyAdmission}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] text-slate-400 mb-1">정시 전략</p>
              <p className="text-xs text-slate-600 leading-relaxed">{data.regularAdmission}</p>
            </div>
          </div>

          {/* 대학별 전략 */}
          {data.detailByUniversity.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap size={12} className="text-slate-400" />
                <p className="text-[11px] text-slate-400">대학별 맞춤 전략</p>
              </div>
              <div className="space-y-2">
                {data.detailByUniversity.map((item) => (
                  <div key={item.university} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-700 mb-1">{item.university}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.strategy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
