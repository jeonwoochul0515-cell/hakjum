import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink, TrendingUp, Loader2 } from 'lucide-react';
import { C } from '@/lib/design-tokens';

interface Props {
  className?: string;
}

interface PopularMajor {
  name: string;
  category: string;
  schoolCount: number;
  totalQuota: number;
  tuitionAvgWon: number | null;
  summary: string;
  matchScore: number;
}

interface TrendingApiItem {
  keyword?: string;
  majorName?: string;
  category?: string;
  schoolCount?: number;
  totalQuota?: number;
  tuitionAvgWon?: number | null;
  summary?: string;
}

// ── mock fallback (KCUE 데이터 미동기화 / 응답 빈 경우) ─────────────────────
const MOCK_POPULAR_MAJORS: PopularMajor[] = [
  {
    name: 'AI·인공지능학과',
    category: '공학계열',
    schoolCount: 11,
    totalQuota: 703,
    tuitionAvgWon: 7_134_475,
    summary: '코딩과 AI에 관심 있는 학생에게',
    matchScore: 95,
  },
  {
    name: '반도체공학과',
    category: '공학계열',
    schoolCount: 5,
    totalQuota: 218,
    tuitionAvgWon: null,
    summary: '물리·전자에 강점 있는 학생에게',
    matchScore: 92,
  },
  {
    name: '데이터사이언스학과',
    category: '자연계열',
    schoolCount: 8,
    totalQuota: 438,
    tuitionAvgWon: null,
    summary: '수학·통계로 세상을 읽고 싶다면',
    matchScore: 90,
  },
  {
    name: '의예과',
    category: '의약계열',
    schoolCount: 30,
    totalQuota: 3_000,
    tuitionAvgWon: null,
    summary: '생명과학 + 사람을 돕는 길',
    matchScore: 88,
  },
  {
    name: '바이오메디컬공학과',
    category: '공학계열',
    schoolCount: 4,
    totalQuota: 180,
    tuitionAvgWon: null,
    summary: '의료기술과 공학의 융합',
    matchScore: 87,
  },
];

// 키워드별 보조 카피 (matchScore + summary 라벨)
const KEYWORD_COPY: Record<string, { summary: string; matchScore: number }> = {
  AI: { summary: '코딩과 AI에 관심 있는 학생에게', matchScore: 95 },
  인공지능: { summary: '코딩과 AI에 관심 있는 학생에게', matchScore: 95 },
  반도체: { summary: '물리·전자에 강점 있는 학생에게', matchScore: 92 },
  데이터: { summary: '수학·통계로 세상을 읽고 싶다면', matchScore: 90 },
  바이오: { summary: '의료기술과 생명과학의 융합', matchScore: 87 },
  의예: { summary: '생명과학 + 사람을 돕는 길', matchScore: 88 },
  주요: { summary: '많은 대학이 운영하는 인기 학과', matchScore: 85 },
};

function buildAdigaUrl(majorName: string): string {
  try {
    return `https://www.adiga.kr/man/inf/searchMajor.do?q=${encodeURIComponent(majorName)}`;
  } catch {
    return 'https://www.adiga.kr';
  }
}

function formatManwon(won: number | null): string | null {
  if (won == null || !Number.isFinite(won) || won <= 0) return null;
  const man = Math.round(won / 10_000);
  return `등록금 평균 ${man.toLocaleString()}만원`;
}

function MatchDonut({ score }: { score: number }) {
  const circumference = 188.5;
  const dashLength = (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="30" stroke={C.brandSoft} strokeWidth="6" fill="none" />
        <circle
          cx="36"
          cy="36"
          r="30"
          stroke={C.brand}
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${dashLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: C.brand,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 8, color: C.brand, opacity: 0.8, fontWeight: 600 }}>/100</div>
      </div>
    </div>
  );
}

function mapTrendingItem(item: TrendingApiItem): PopularMajor | null {
  if (!item.majorName) return null;
  const kw = item.keyword || '';
  const copy = KEYWORD_COPY[kw] ?? { summary: '실데이터 기반 추천 학과', matchScore: 86 };
  return {
    name: item.majorName,
    category: item.category || '',
    schoolCount: item.schoolCount ?? 0,
    totalQuota: item.totalQuota ?? 0,
    tuitionAvgWon: item.tuitionAvgWon ?? null,
    summary: copy.summary,
    matchScore: copy.matchScore,
  };
}

export function PopularMajorCards({ className }: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<PopularMajor[]>(MOCK_POPULAR_MAJORS);
  const [loading, setLoading] = useState(true);
  const [syncedAt, setSyncedAt] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/search/major?mode=trending')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('trend fetch failed'))))
      .then((json: { data?: TrendingApiItem[]; _meta?: { syncedAt?: string } }) => {
        if (cancelled) return;
        const apiItems = (json.data ?? [])
          .map(mapTrendingItem)
          .filter((x): x is PopularMajor => x !== null);
        if (apiItems.length > 0) {
          setItems(apiItems.slice(0, 5));
          setSyncedAt(json._meta?.syncedAt || '');
        }
        setLoading(false);
      })
      .catch(() => {
        // mock 유지
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStart = (majorName: string) => {
    sessionStorage.setItem('hakjum-entry', 'popular-major');
    sessionStorage.setItem('hakjum-popular-major', majorName);
    navigate('/flow');
  };

  return (
    <section
      className={className}
      style={{ padding: '24px 0 20px', background: '#fff' }}
    >
      {/* 헤더 */}
      <div style={{ padding: '0 20px 14px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            background: C.brandSoft,
            borderRadius: 999,
            color: C.brand,
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 10,
            letterSpacing: '-0.02em',
          }}
        >
          <TrendingUp size={12} strokeWidth={2.4} />
          지금 트렌드
          {loading && (
            <Loader2 size={11} className="animate-spin" style={{ marginLeft: 2 }} />
          )}
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            margin: '0 0 4px',
            color: C.ink,
          }}
        >
          지금 학생들이 가장 많이 보는 학과
        </h2>
        <div style={{ fontSize: 12, color: C.sub, letterSpacing: '-0.01em' }}>
          2026 트렌드 · NEIS·대교협 데이터 기반
        </div>
      </div>

      {/* 가로 스크롤 카드 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '4px 20px 16px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((m, i) => {
          const tuitionLabel = formatManwon(m.tuitionAvgWon);
          const quotaLabel =
            m.totalQuota > 0
              ? `총 ${m.totalQuota.toLocaleString()}명 모집`
              : null;
          return (
            <article
              key={`${m.name}-${i}`}
              className="hover:shadow-lg transition-shadow"
              style={{
                flex: '0 0 280px',
                width: 280,
                background: '#fff',
                border: `1.5px solid ${C.line}`,
                borderRadius: 16,
                padding: 18,
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: 'none',
                transition: 'box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 24px ${C.brandShadow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* 상단: 랭킹 + 카테고리 배지 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: C.brand,
                    letterSpacing: '0.04em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  #{i + 1}
                </div>
                {m.category && (
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: C.brandSoft,
                      color: C.brand,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {m.category}
                  </span>
                )}
              </div>

              {/* 중단: 학과명 + 도넛 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      letterSpacing: '-0.035em',
                      color: C.ink,
                      lineHeight: 1.25,
                      marginBottom: 6,
                      wordBreak: 'keep-all',
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: C.sub,
                      lineHeight: 1.5,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {m.summary}
                  </div>
                </div>
                <MatchDonut score={m.matchScore} />
              </div>

              {/* 통계 칩 — 실데이터 라벨 (학교 수·모집정원·등록금) */}
              {(m.schoolCount > 0 || quotaLabel || tuitionLabel) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.schoolCount > 0 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: C.bg,
                        color: C.ink,
                        border: `1px solid ${C.line}`,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      전국 {m.schoolCount}개 대학
                    </span>
                  )}
                  {quotaLabel && (
                    <span
                      style={{
                        fontSize: 10.5,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: C.bg,
                        color: C.ink,
                        border: `1px solid ${C.line}`,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {quotaLabel}
                    </span>
                  )}
                  {tuitionLabel && (
                    <span
                      style={{
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
                      {tuitionLabel}
                    </span>
                  )}
                </div>
              )}

              {/* 하단: CTA + 외부 링크 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                <button
                  onClick={() => handleStart(m.name)}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: C.brand,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  탐색 시작
                  <ArrowRight size={14} strokeWidth={2.4} />
                </button>
                <a
                  href={buildAdigaUrl(m.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: C.sub,
                    letterSpacing: '-0.01em',
                    textDecoration: 'none',
                    padding: '4px 0',
                  }}
                >
                  어디가에서 입시결과 보기
                  <ExternalLink size={11} strokeWidth={2.2} />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* 출처 */}
      <div style={{ padding: '0 20px' }}>
        <div
          style={{
            fontSize: 11,
            color: C.sub,
            letterSpacing: '-0.01em',
            lineHeight: 1.55,
          }}
        >
          📚 데이터 출처: 한국대학교육협의회 · 대학알리미
          {syncedAt
            ? ` (마지막 업데이트 ${new Date(syncedAt).toISOString().slice(0, 10)})`
            : ' (마지막 업데이트 2026-04-27)'}
        </div>
      </div>
    </section>
  );
}

export default PopularMajorCards;
