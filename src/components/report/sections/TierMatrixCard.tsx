/**
 * 도전·적정·안전 매트릭스 시각화
 * — TOP 10 추천 학과를 자기효능감 보호 카테고리로 분류
 * Bandura(1997) 자기효능감 + Gottfredson(1981) 직업포부 절충이론 근거.
 */
import { Target } from 'lucide-react';
import { tierMeta, type Tier } from '@/lib/recommendation-tier';
import type { TierMatrix } from '@/types/report';

interface Props {
  data: TierMatrix;
  isPaid: boolean;
}

const TIER_KEYS: { key: Tier; field: keyof Omit<TierMatrix, 'summary'> }[] = [
  { key: 'challenge', field: 'challenge' },
  { key: 'fit', field: 'fit' },
  { key: 'safe', field: 'safe' },
];

export function TierMatrixCard({ data, isPaid }: Props) {
  const totalCount = data.challenge.length + data.fit.length + data.safe.length;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Target size={14} className="text-violet-500" />
        <h3 className="text-sm font-bold text-slate-700">도전·적정·안전 매트릭스</h3>
      </div>

      <p className="text-xs text-slate-500 mb-3 leading-relaxed">{data.summary}</p>

      {/* 분포 바 */}
      {totalCount > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden mb-3">
          {TIER_KEYS.map(({ key, field }) => {
            const count = data[field].length;
            const meta = tierMeta(key);
            const pct = (count / totalCount) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                style={{ width: `${pct}%`, background: meta.bg }}
                title={`${meta.label} ${count}개`}
              />
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {TIER_KEYS.map(({ key, field }) => {
          const items = data[field];
          const meta = tierMeta(key);
          // 무료에서는 "도전" 1개 미리보기, 나머지는 카운트만
          const visibleItems = isPaid ? items : items.slice(0, key === 'challenge' ? 1 : 0);

          return (
            <div
              key={key}
              className="rounded-lg p-2"
              style={{ background: meta.softBg, border: `1px solid ${meta.border}` }}
            >
              <div
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold mb-1.5"
                style={{ background: meta.bg, color: meta.color }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span>{items.length}</span>
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <div key={item.rank} className="text-[11px] text-slate-700 truncate">
                    {item.rank}. {item.name}
                  </div>
                ))}
                {!isPaid && items.length > visibleItems.length && (
                  <div className="text-[10px] text-slate-400">+{items.length - visibleItems.length}개</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">
        도전(꿈) · 적정(현실) · 안전(백업) 3분할로 사고하면 자기효능감을 지키며 균형 잡힌 진로 탐색이 가능해요.
      </p>
    </div>
  );
}

export default TierMatrixCard;
