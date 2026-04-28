/**
 * 학교 규모 인사이트 카드
 * — Profile 섹션 보강 (무료 공개)
 * 학생수 기반 분류 + 전국 분포 비율 + 규모별 권장사항.
 */
import { School2, TrendingUp, Lightbulb } from 'lucide-react';
import { sizeMeta } from '@/lib/school-size';
import type { SchoolInsight } from '@/types/report';

interface Props {
  data: SchoolInsight;
}

export function SchoolInsightCard({ data }: Props) {
  const meta = sizeMeta(data.size);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <School2 size={14} className="text-violet-500" />
        <h3 className="text-sm font-bold text-slate-700">우리 학교 규모 인사이트</h3>
      </div>

      <div
        className="rounded-lg p-3 mb-2"
        style={{ background: meta.bg, borderLeft: `3px solid ${meta.color}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold" style={{ color: meta.color }}>
              {meta.icon}
            </span>
            <p className="text-sm font-bold" style={{ color: meta.color }}>
              {meta.label}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <TrendingUp size={11} />
            <span>전국 {data.distributionPct}%</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-600">
          {meta.description}
          {typeof data.studentCount === 'number' && data.studentCount > 0 && (
            <> · 학생 {data.studentCount}명</>
          )}
          {typeof data.avgPerClass === 'number' && data.avgPerClass > 0 && (
            <> · 학급당 {data.avgPerClass.toFixed(1)}명</>
          )}
        </p>
      </div>

      <div className="bg-amber-50 rounded-md p-2 border border-amber-100">
        <div className="flex items-start gap-1.5">
          <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-amber-700 mb-0.5">규모별 권장사항</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">{data.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolInsightCard;
