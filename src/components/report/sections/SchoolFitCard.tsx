/**
 * 학교 적합도 카드
 * — 추천 학과별로 "내 학교에서 준비 가능한 정도"를 0-100점으로 표시
 * 매칭/미개설 과목을 함께 보여 공동교육과정·온라인 보완 필요 여부를 인지시킨다.
 */
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import type { SchoolFitSection } from '@/types/report';

interface Props {
  data: SchoolFitSection;
  isPaid: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function SchoolFitCard({ data, isPaid }: Props) {
  if (!data?.items?.length) return null;

  // 무료에서는 평균 + TOP 1 학과만, 유료는 전체
  const visibleItems = isPaid ? data.items : data.items.slice(0, 1);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <CheckCircle2 size={14} style={{ color: C.brand }} />
        <h3 className="text-sm font-bold text-slate-700">우리 학교 적합도</h3>
      </div>

      {/* 평균 적합도 */}
      <div
        className="rounded-lg p-3 mb-3"
        style={{ background: C.brandSoft, borderLeft: `3px solid ${C.brand}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-700">평균 학교 적합도</span>
          <span className="text-lg font-bold" style={{ color: scoreColor(data.avgScore) }}>
            {data.avgScore}점
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          추천 학과 {data.items.length}개 기준 — 우리 학교 개설과목으로 준비 가능한 정도
        </p>
      </div>

      <div className={!isPaid && data.items.length > 1 ? 'relative' : ''}>
        <div className="space-y-2">
          {visibleItems.map((item) => (
            <div key={item.majorName} className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-slate-700 truncate">{item.majorName}</p>
                <span
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color: scoreColor(item.schoolFitScore) }}
                >
                  {item.schoolFitScore}점
                </span>
              </div>

              {item.matched.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mb-1">
                  <span className="text-[10px] text-emerald-600 font-medium">개설 ✓</span>
                  {item.matched.map((s) => (
                    <span
                      key={s}
                      className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {item.missing.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                    <AlertCircle size={9} />
                    미개설 △ {item.missing.length}개
                  </span>
                  {item.missing.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isPaid && data.items.length > 1 && (
          <div className="mt-2 text-center">
            <p className="text-[11px] text-slate-400">
              나머지 {data.items.length - 1}개 학과 적합도는 전체 보고서에서 확인하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchoolFitCard;
