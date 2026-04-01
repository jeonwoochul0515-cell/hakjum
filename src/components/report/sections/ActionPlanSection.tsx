import { ClipboardList, Zap, Clock, Target } from 'lucide-react';
import type { ActionPlanSection as ActionPlanSectionType } from '@/types/report';

interface Props {
  data: ActionPlanSectionType;
  isPaid: boolean;
}

export function ActionPlanSection({ data, isPaid }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <ClipboardList size={14} className="text-emerald-500" />
        <h3 className="text-sm font-bold text-slate-700">액션 플랜</h3>
      </div>

      <div className={!isPaid ? 'relative' : ''}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          {/* 종합 의견 */}
          <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-lg p-3 border border-emerald-100 mb-3">
            <p className="text-xs text-slate-600 leading-relaxed">{data.summary}</p>
          </div>

          {/* 즉시 실행 */}
          {data.immediate.length > 0 && (
            <ActionGroup
              icon={<Zap size={13} className="text-red-500" />}
              title="즉시 실행"
              items={data.immediate}
              dotColor="bg-red-400"
            />
          )}

          {/* 단기 계획 */}
          {data.shortTerm.length > 0 && (
            <ActionGroup
              icon={<Clock size={13} className="text-amber-500" />}
              title="단기 계획 (1~3개월)"
              items={data.shortTerm}
              dotColor="bg-amber-400"
            />
          )}

          {/* 장기 계획 */}
          {data.longTerm.length > 0 && (
            <ActionGroup
              icon={<Target size={13} className="text-sky-500" />}
              title="장기 계획 (3개월~)"
              items={data.longTerm}
              dotColor="bg-sky-400"
            />
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

function ActionGroup({
  icon,
  title,
  items,
  dotColor,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  dotColor: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs font-bold text-slate-600">{title}</p>
      </div>
      <div className="space-y-1.5 pl-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 flex-shrink-0`} />
            <p className="text-xs text-slate-600 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
