import { CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import type { FulfillmentSection as FulfillmentSectionType } from '@/types/report';

interface Props {
  data: FulfillmentSectionType;
  isPaid: boolean;
}

export function FulfillmentSection({ data, isPaid }: Props) {
  const rate = data.overallRate;
  const rateColor =
    rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-red-500';
  const barColor =
    rate >= 80 ? 'bg-emerald-400' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Shield size={14} className="text-emerald-500" />
        <h3 className="text-sm font-bold text-slate-700">교과 충족률 분석</h3>
      </div>

      {/* 전체 충족률 (무료에서도 표시) */}
      <div className="bg-slate-50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">전체 충족률</span>
          <span className={`text-lg font-bold ${rateColor}`}>{rate}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* 대학별 상세 (유료) */}
      <div className={!isPaid ? 'relative' : ''}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="space-y-3">
            {data.items.map((item) => {
              const itemColor =
                item.fulfillmentRate >= 80
                  ? 'text-emerald-500'
                  : item.fulfillmentRate >= 50
                    ? 'text-amber-500'
                    : 'text-red-500';

              return (
                <div key={`${item.university}-${item.major}`} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.university}</p>
                      <p className="text-[11px] text-slate-400">{item.major}</p>
                    </div>
                    <span className={`text-sm font-bold ${itemColor}`}>
                      {item.fulfillmentRate}%
                    </span>
                  </div>

                  {/* 충족 과목 */}
                  {item.met.length > 0 && (
                    <div className="mb-1.5">
                      <p className="text-[10px] text-emerald-500 font-medium mb-1">충족</p>
                      <div className="space-y-0.5">
                        {item.met.map((s) => (
                          <div key={s} className="flex items-center gap-1.5">
                            <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                            <span className="text-xs text-emerald-700">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 미충족 과목 */}
                  {item.unmet.length > 0 && (
                    <div className="mb-1.5">
                      <p className="text-[10px] text-red-500 font-medium mb-1">미충족</p>
                      <div className="space-y-0.5">
                        {item.unmet.map((s) => (
                          <div key={s} className="flex items-center gap-1.5">
                            <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                            <span className="text-xs text-red-600">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 추천 과목 */}
                  {item.recommended.length > 0 && (
                    <div>
                      <p className="text-[10px] text-sky-500 font-medium mb-1">추천</p>
                      <div className="flex flex-wrap gap-1">
                        {item.recommended.map((s) => (
                          <span
                            key={s}
                            className="inline-block px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
