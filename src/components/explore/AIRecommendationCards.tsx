import { Sparkles, MapPin, Award, ArrowRight } from 'lucide-react';
import type { AIExploreResult } from '@/types';
import { C } from '@/lib/design-tokens';

interface Props {
  result: AIExploreResult;
  loading: boolean;
  onSelectMajor: (majorName: string, category: string) => void;
}

export function AIRecommendationCards({ result, loading, onSelectMajor }: Props) {
  return (
    <div className="animate-fade-in-up">
      {/* AI 분석 요약 */}
      {result.summary && (
        <div
          style={{
            background: C.brandSoft,
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
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

      {/* 추천 학과 카드 목록 */}
      <div>
        {result.recommendations.map((rec, i) => (
          <button
            key={i}
            onClick={() => onSelectMajor(rec.majorName, rec.category)}
            disabled={loading}
            className="cursor-pointer active:scale-[0.99] transition-all text-left disabled:opacity-60 disabled:cursor-wait"
            style={{
              width: '100%',
              background: '#fff',
              border: `1.5px solid ${C.line}`,
              borderRadius: 16,
              padding: 18,
              marginBottom: 10,
              display: 'block',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: i === 0 ? C.brand : C.brandSoft,
                      color: i === 0 ? '#fff' : C.brand,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {rec.category}
                  </span>
                  {i === 0 && (
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
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6, color: C.ink }}>
                  {rec.majorName}
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: C.brandSoft,
                  color: C.brand,
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
                <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2, fontWeight: 600 }}>적합도</div>
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
        ))}
      </div>
    </div>
  );
}
