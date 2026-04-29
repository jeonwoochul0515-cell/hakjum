/**
 * ProfilePage에 임베드되는 자가탐색 요약 카드.
 * RIASEC 도넛 + 강점 Top 5 + 가치관 Top 3 한 번에 미니 표시.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronRight, Sparkles, Heart, RotateCcw } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import { DonutChart } from './ResultChart';
import { loadSelfExploration, type SelfExplorationData } from '@/lib/self-exploration/storage';
import { RIASEC_META, type RiasecType } from '@/lib/self-exploration/riasec';
import { VALUE_META } from '@/lib/self-exploration/values';

interface Props {
  uid: string | null | undefined;
}

export function SelfExplorationSummaryCard({ uid }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<SelfExplorationData | null>(null);
  // 초기값 true → effect 안에서 setLoading(true)을 다시 부르지 않아도 됨
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadSelfExploration(uid)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const hasAny = !!(data?.riasec || data?.strengths || data?.values);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Compass size={18} color={C.brand} />
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: '-0.025em',
            }}
          >
            내 자가탐색 결과
          </h3>
        </div>
        <p
          style={{
            fontSize: 11.5,
            color: C.sub,
            letterSpacing: '-0.01em',
          }}
        >
          RIASEC 흥미 + 강점 + 직업 가치관
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '8px 20px 20px', fontSize: 12.5, color: C.sub }}>불러오는 중...</div>
      ) : !hasAny ? (
        <div style={{ padding: '0 20px 20px' }}>
          <div
            style={{
              padding: 24,
              background: C.bg,
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 13, color: C.sub, marginBottom: 12, letterSpacing: '-0.02em' }}>
              아직 자가탐색을 진행하지 않았어요
            </p>
            <button
              onClick={() => navigate('/self-exploration')}
              style={{
                padding: '10px 18px',
                background: C.brand,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '-0.02em',
              }}
            >
              자가탐색 시작하기
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* RIASEC 도넛 */}
          {data?.riasec && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ flexShrink: 0 }}>
                <DonutChart
                  size={120}
                  slices={(['R', 'I', 'A', 'S', 'E', 'C'] as RiasecType[]).map((k) => ({
                    key: k,
                    label: RIASEC_META[k].ko,
                    value: Math.max(1, data.riasec!.types[k]),
                    color: RIASEC_META[k].color,
                  }))}
                  centerLabel={data.riasec.primaryType}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: C.brand,
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  RIASEC 흥미
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.ink,
                    marginTop: 2,
                    letterSpacing: '-0.025em',
                  }}
                >
                  {RIASEC_META[data.riasec.primaryType].ko} ·{' '}
                  {RIASEC_META[data.riasec.secondaryType].ko}
                </div>
                <p
                  style={{
                    fontSize: 11.5,
                    color: C.sub,
                    marginTop: 4,
                    lineHeight: 1.5,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {RIASEC_META[data.riasec.primaryType].short}
                </p>
              </div>
            </div>
          )}

          {/* 강점 Top 5 */}
          {data?.strengths && data.strengths.strengths.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 11,
                  color: C.brand,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                <Sparkles size={12} /> 강점 Top {Math.min(5, data.strengths.strengths.length)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.strengths.strengths.slice(0, 5).map((s, i) => (
                  <span
                    key={s}
                    style={{
                      padding: '6px 10px',
                      background: i === 0 ? C.brand : C.brandSoft,
                      color: i === 0 ? '#fff' : C.brand,
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 가치관 Top 3 */}
          {data?.values && data.values.topValues.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 11,
                  color: C.brand,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                <Heart size={12} /> 가치관 Top 3
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {data.values.topValues.map((v, i) => {
                  const meta = Object.values(VALUE_META).find((m) => m.ko === v);
                  return (
                    <span
                      key={v}
                      style={{
                        padding: '6px 10px',
                        background: meta?.color ?? C.brand,
                        color: '#fff',
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {i + 1}. {v}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => navigate('/self-exploration')}
              style={{
                flex: 1,
                padding: '10px',
                background: '#fff',
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                color: C.ink,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                letterSpacing: '-0.02em',
              }}
            >
              <RotateCcw size={12} /> 다시 검사
            </button>
            <button
              onClick={() => navigate('/self-exploration')}
              style={{
                flex: 1,
                padding: '10px',
                background: C.brand,
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                letterSpacing: '-0.02em',
              }}
            >
              상세 보기 <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
