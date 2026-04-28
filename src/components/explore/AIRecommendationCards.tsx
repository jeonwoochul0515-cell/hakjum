import { useEffect, useState } from 'react';
import {
  Sparkles,
  MapPin,
  Award,
  ArrowRight,
  Building2,
  Wallet,
  GraduationCap,
} from 'lucide-react';
import type { AIExploreResult, AIExploreRecommendation } from '@/types';
import { C } from '@/lib/design-tokens';
import {
  classifyTier,
  tierMeta,
  TIER_ORDER,
  type Tier,
} from '@/lib/recommendation-tier';

interface Props {
  result: AIExploreResult;
  loading: boolean;
  onSelectMajor: (majorName: string, category: string) => void;
}

interface IndexedRec {
  rec: AIExploreRecommendation;
  index: number;
  tier: Tier;
}

interface MajorStatsLite {
  schoolCount?: number;
  quotaStats?: { min: number; avg: number; max: number; total: number };
  tuitionAvgWon?: number | null;
  scholarshipAvgPerUniv?: number | null;
}

interface MajorApiResp {
  data?: Array<MajorStatsLite & { majorName: string }>;
}

const TIER_HEADER_COPY: Record<Tier, string> = {
  challenge: '도전 — 꿈에 가까운 학과',
  fit: '적정 — 현실적으로 잘 맞는 학과',
  safe: '안전 — 기본기를 다지기 좋은 학과',
};

export function AIRecommendationCards({ result, loading, onSelectMajor }: Props) {
  // 각 추천에 도전/적정/안전 티어 부여 후 그룹화 (도전 → 적정 → 안전)
  const indexed: IndexedRec[] = result.recommendations.map((rec, index) => ({
    rec,
    index,
    tier: classifyTier(rec.matchScore),
  }));

  // KCUE 사전계산 통계 인덱스 — 학과명별로 개수/정원/등록금/장학 가져오기
  const [statsByName, setStatsByName] = useState<Record<string, MajorStatsLite>>({});

  useEffect(() => {
    let cancelled = false;
    const names = result.recommendations.map((r) => r.majorName);
    if (names.length === 0) {
      setStatsByName({});
      return;
    }
    Promise.all(
      names.map((n) =>
        fetch(`/api/search/major?q=${encodeURIComponent(n)}&limit=3`)
          .then((r) => (r.ok ? (r.json() as Promise<MajorApiResp>) : null))
          .catch(() => null),
      ),
    )
      .then((responses) => {
        if (cancelled) return;
        const next: Record<string, MajorStatsLite> = {};
        responses.forEach((resp, i) => {
          const name = names[i];
          if (!resp?.data) return;
          const exact = resp.data.find((d) => d.majorName === name) ?? resp.data[0];
          if (!exact) return;
          next[name] = {
            schoolCount: exact.schoolCount,
            quotaStats: exact.quotaStats,
            tuitionAvgWon: exact.tuitionAvgWon,
            scholarshipAvgPerUniv: exact.scholarshipAvgPerUniv,
          };
        });
        setStatsByName(next);
      })
      .catch(() => {
        // graceful: 통계 미부착
      });
    return () => {
      cancelled = true;
    };
  }, [result.recommendations]);

  const grouped: Record<Tier, IndexedRec[]> = {
    challenge: [],
    fit: [],
    safe: [],
  };
  indexed.forEach((item) => grouped[item.tier].push(item));

  const visibleTiers = TIER_ORDER.filter((t) => grouped[t].length > 0);

  return (
    <div className="animate-fade-in-up">
      {/* AI 분석 요약 */}
      {result.summary && (
        <div
          style={{
            background: C.brandSoft,
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: C.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={13} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.brand, letterSpacing: '-0.02em' }}>
              AI 분석 결과
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: C.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {result.summary}
          </div>
          {result.source === 'fallback' && (
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 8 }}>* 오프라인 추천 결과입니다</div>
          )}
        </div>
      )}

      {/* 3분할 매트릭스 안내 */}
      <MatrixIntro grouped={grouped} />

      {/* 추천 학과 카드 목록 — 도전/적정/안전 그룹 */}
      <div>
        {visibleTiers.map((tier) => {
          const meta = tierMeta(tier);
          const items = grouped[tier];
          return (
            <section key={tier} style={{ marginBottom: 18 }}>
              <TierSectionHeader tier={tier} count={items.length} />
              {items.map((item) => (
                <MajorCard
                  key={item.index}
                  rec={item.rec}
                  isTopOverall={item.index === 0}
                  tier={tier}
                  loading={loading}
                  stats={statsByName[item.rec.majorName]}
                  onSelect={() => onSelectMajor(item.rec.majorName, item.rec.category)}
                />
              ))}
              {items.length === 0 && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.sub,
                    padding: '8px 4px',
                  }}
                >
                  이 카테고리에 해당하는 추천이 없어요
                </div>
              )}
              <div
                style={{
                  fontSize: 10.5,
                  color: meta.bg,
                  marginTop: 4,
                  paddingLeft: 2,
                  letterSpacing: '-0.01em',
                  fontWeight: 500,
                }}
              >
                {meta.message}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MatrixIntro({ grouped }: { grouped: Record<Tier, IndexedRec[]> }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: C.ink,
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}
      >
        도전 · 적정 · 안전 3가지 카테고리로 추천했어요
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {TIER_ORDER.map((t) => {
          const meta = tierMeta(t);
          const count = grouped[t].length;
          return (
            <div
              key={t}
              style={{
                flex: 1,
                background: meta.softBg,
                border: `1px solid ${meta.border}`,
                borderRadius: 10,
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: meta.bg,
                  letterSpacing: '-0.01em',
                  marginBottom: 2,
                }}
              >
                {meta.icon} {meta.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: C.ink,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.03em',
                }}
              >
                {count}
                <span style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginLeft: 2 }}>
                  개
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TierSectionHeader({ tier, count }: { tier: Tier; count: number }) {
  const meta = tierMeta(tier);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        marginTop: 6,
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          padding: '4px 9px',
          borderRadius: 999,
          background: meta.bg,
          color: meta.color,
          letterSpacing: '-0.01em',
        }}
      >
        {meta.icon} {meta.label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: C.ink,
          letterSpacing: '-0.02em',
        }}
      >
        {TIER_HEADER_COPY[tier]}
      </span>
      <span
        style={{
          fontSize: 11,
          color: C.sub,
          marginLeft: 'auto',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}개
      </span>
    </div>
  );
}

interface MajorCardProps {
  rec: AIExploreRecommendation;
  isTopOverall: boolean;
  tier: Tier;
  loading: boolean;
  stats?: MajorStatsLite;
  onSelect: () => void;
}

function MajorCard({ rec, isTopOverall, tier, loading, stats, onSelect }: MajorCardProps) {
  const meta = tierMeta(tier);
  return (
    <button
      onClick={onSelect}
      disabled={loading}
      className="cursor-pointer active:scale-[0.99] transition-all text-left disabled:opacity-60 disabled:cursor-wait"
      style={{
        width: '100%',
        background: '#fff',
        border: `1.5px solid ${meta.border}`,
        borderLeft: `4px solid ${meta.bg}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 10,
        display: 'block',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            {/* 티어 배지 */}
            <span
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 999,
                background: meta.bg,
                color: meta.color,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              {meta.icon} {meta.label}
            </span>
            {/* 카테고리 배지 */}
            <span
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 4,
                background: C.brandSoft,
                color: C.brand,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              {rec.category}
            </span>
            {isTopOverall && (
              <span
                style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: '#fef3c7',
                  color: '#a16207',
                  fontWeight: 700,
                }}
              >
                ★ 최적 추천
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              marginBottom: 6,
              color: C.ink,
            }}
          >
            {rec.majorName}
          </div>
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: meta.softBg,
            color: meta.bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {rec.matchScore}
          </div>
          <div style={{ fontSize: 9, opacity: 0.85, marginTop: 2, fontWeight: 600 }}>적합도</div>
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: C.sub,
          marginBottom: 12,
          letterSpacing: '-0.01em',
        }}
      >
        {rec.reason}
      </div>

      {rec.universities.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            fontSize: 11.5,
            color: C.sub,
          }}
        >
          <MapPin size={12} color={C.sub} />
          <span>{rec.universities.slice(0, 4).map((u) => u.name).join(' · ')}</span>
        </div>
      )}

      {rec.relatedJobs.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            color: C.sub,
          }}
        >
          <Award size={12} color={C.sub} />
          <span>{rec.relatedJobs.slice(0, 3).join(' · ')} 등</span>
        </div>
      )}

      {/* 내 학교 적합도 — 학교 컨텍스트 기반 후처리 결과 */}
      {typeof rec.schoolFitScore === 'number' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 10,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10.5,
              padding: '3px 8px',
              borderRadius: 6,
              background: rec.schoolFitScore >= 75 ? '#dcfce7' : rec.schoolFitScore >= 50 ? '#fef3c7' : '#fee2e2',
              color: rec.schoolFitScore >= 75 ? '#166534' : rec.schoolFitScore >= 50 ? '#854d0e' : '#991b1b',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}
            title={
              (rec.schoolMatchedSubjects?.length ? `개설: ${rec.schoolMatchedSubjects.join(', ')}` : '')
                + (rec.schoolMissingSubjects?.length ? ` / 부족: ${rec.schoolMissingSubjects.join(', ')}` : '')
            }
          >
            내 학교 적합도 {rec.schoolFitScore}
          </span>
          {(rec.schoolMatchedSubjects ?? []).slice(0, 2).map((s) => (
            <span
              key={s}
              style={{
                fontSize: 10.5,
                padding: '3px 8px',
                borderRadius: 6,
                background: C.brandSoft,
                color: C.brand,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              ✓ {s}
            </span>
          ))}
          {(rec.schoolMissingSubjects ?? []).slice(0, 1).map((s) => (
            <span
              key={s}
              style={{
                fontSize: 10.5,
                padding: '3px 8px',
                borderRadius: 6,
                background: '#f1f5f9',
                color: '#64748b',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              미개설: {s}
            </span>
          ))}
        </div>
      )}

      {/* KCUE 통계 — 운영 대학 수 / 등록금 평균 / 장학금 수혜 평균 */}
      {stats && hasStatChips(stats) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 10,
          }}
        >
          {(stats.schoolCount ?? 0) > 0 && (
            <StatChip
              icon={<Building2 size={11} color={C.brand} />}
              label={`전국 ${stats.schoolCount}개 대학에서 운영`}
            />
          )}
          {(stats.tuitionAvgWon ?? 0) > 0 && (
            <StatChip
              icon={<Wallet size={11} color={C.brand} />}
              label={`1년 등록금 평균 ${Math.round(
                (stats.tuitionAvgWon ?? 0) / 10_000,
              ).toLocaleString()}만원`}
            />
          )}
          {(stats.scholarshipAvgPerUniv ?? 0) > 0 && (
            <StatChip
              icon={<GraduationCap size={11} color={C.brand} />}
              label={`장학금 평균 ${stats.scholarshipAvgPerUniv}건/대학`}
            />
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${C.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: C.brand,
          letterSpacing: '-0.02em',
        }}
      >
        <span>상세 정보 + 추천 과목 보기</span>
        <ArrowRight size={14} color={C.brand} strokeWidth={2.2} />
      </div>
    </button>
  );
}

function hasStatChips(s: MajorStatsLite): boolean {
  return (
    (s.schoolCount ?? 0) > 0 ||
    (s.tuitionAvgWon ?? 0) > 0 ||
    (s.scholarshipAvgPerUniv ?? 0) > 0
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10.5,
        padding: '3px 8px',
        borderRadius: 6,
        background: C.brandSoft,
        color: C.brand,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {icon}
      {label}
    </span>
  );
}
