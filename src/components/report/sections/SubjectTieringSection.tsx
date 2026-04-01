import { Layers } from 'lucide-react';
import type { SubjectTieringSection as SubjectTieringSectionType } from '@/types/report';

interface Props {
  data: SubjectTieringSectionType;
  isPaid: boolean;
}

const tierConfig: Record<string, { emoji: string; label: string; bg: string; border: string; accent: string }> = {
  essential: {
    emoji: '\uD83D\uDD34',
    label: '\uAF2D \uB4E4\uC5B4\uC57C \uD574\uC694',
    bg: 'bg-red-50',
    border: 'border-red-200',
    accent: 'text-red-600',
  },
  strongly_recommended: {
    emoji: '\uD83D\uDFE0',
    label: '\uB4E4\uC73C\uBA74 \uD655\uC2E4\uD788 \uC720\uB9AC\uD574\uC694',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    accent: 'text-orange-600',
  },
  consider: {
    emoji: '\uD83D\uDFE2',
    label: '\uC5EC\uC720\uAC00 \uC788\uB2E4\uBA74 \uCD94\uCC9C!',
    bg: 'bg-green-50',
    border: 'border-green-200',
    accent: 'text-green-600',
  },
  optional: {
    emoji: '\u26AA',
    label: '\uC54C\uC544\uB450\uBA74 \uC88B\uC544\uC694',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    accent: 'text-gray-500',
  },
};

export function SubjectTieringSection({ data, isPaid }: Props) {
  const essentialTier = data.tiers.find((t) => t.tier === 'essential');
  const otherTiers = data.tiers.filter((t) => t.tier !== 'essential');

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Layers size={14} className="text-orange-500" />
        <h3 className="text-sm font-bold text-slate-700">과목 티어링</h3>
      </div>

      {/* 전략 요약 */}
      <p className="text-xs text-slate-500 mb-3 leading-relaxed">{data.strategy}</p>

      {/* Essential 티어 (무료 공개) */}
      {essentialTier && essentialTier.subjects.length > 0 && (
        <TierBlock tier={essentialTier} />
      )}

      {/* 나머지 티어 (유료) */}
      <div className={!isPaid ? 'relative mt-3' : 'mt-3'}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="space-y-3">
            {otherTiers.map(
              (tier) => tier.subjects.length > 0 && <TierBlock key={tier.tier} tier={tier} />,
            )}
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

function TierBlock({ tier }: { tier: { tier: string; label: string; subjects: { name: string; reason: string }[] } }) {
  const config = tierConfig[tier.tier] ?? tierConfig.optional;

  return (
    <div className={`rounded-xl ${config.bg} p-3 border ${config.border}`}>
      <h4 className={`font-bold text-xs ${config.accent} mb-2`}>
        {config.emoji} {config.label}
        <span className="ml-2 text-[10px] font-normal text-slate-400">
          {tier.subjects.length}개 과목
        </span>
      </h4>
      <div className="space-y-1.5">
        {tier.subjects.map((s) => (
          <div key={s.name} className="bg-white/70 rounded-md px-2.5 py-1.5">
            <p className="text-xs font-semibold text-slate-700">{s.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
