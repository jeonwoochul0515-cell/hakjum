import type { TierRecommendation } from '@/types';
import { SubjectCard } from './SubjectCard';

interface SubjectTierProps {
  tier: TierRecommendation;
}

const tierConfig = {
  essential: { emoji: '🔴', bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-600' },
  strongly_recommended: { emoji: '🟠', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-600' },
  consider: { emoji: '🟢', bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-600' },
  optional: { emoji: '⚪', bg: 'bg-gray-50', border: 'border-gray-200', accent: 'text-gray-500' },
};

export function SubjectTier({ tier }: SubjectTierProps) {
  const config = tierConfig[tier.tier];
  if (tier.subjects.length === 0) return null;

  return (
    <div className={`rounded-2xl ${config.bg} p-4 border ${config.border}`}>
      <h3 className={`font-bold text-sm ${config.accent} mb-3`}>
        {config.emoji} {tier.label}
        <span className="ml-2 text-xs font-normal text-slate-400">{tier.subjects.length}개 과목</span>
      </h3>
      <div className="space-y-2">
        {tier.subjects.map((s) => (
          <SubjectCard key={s.name} subject={s} tierColor={config.border} />
        ))}
      </div>
    </div>
  );
}
