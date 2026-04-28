import { RotateCcw } from 'lucide-react';
import { AIRecommendationCards } from '@/components/explore/AIRecommendationCards';
import { ShareButton } from '@/components/explore/ShareButton';
import { useFlow } from '@/hooks/useFlow';
import { useState } from 'react';
import { C, iconBtn } from '@/lib/design-tokens';

export function MajorResultsStep() {
  const { state, selectMajor, go } = useFlow();
  const { exploreResult, interest } = state;
  const [detailLoading, setDetailLoading] = useState(false);

  if (!exploreResult) return null;

  const handleSelectMajor = async (majorName: string, category: string) => {
    setDetailLoading(true);
    try {
      await selectMajor(majorName, category);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* 진행 표시 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        <Step n={1} label="관심사 입력" active />
        <Step n={2} label="AI 분석" active />
        <Step n={3} label="결과 확인" active current />
      </div>

      {/* 헤더 + 액션 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: C.brand,
              fontWeight: 700,
              marginBottom: 4,
              letterSpacing: '0.02em',
            }}
          >
            ✦ 추천 학과
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 4px', color: C.ink }}>
            내게 맞는 학과
          </h1>
          <div style={{ fontSize: 12, color: C.sub }}>
            "{interest}" 관련 <strong style={{ color: C.ink }}>{exploreResult.recommendations.length}개 학과</strong>를{' '}
            <strong style={{ color: C.ink }}>도전 · 적정 · 안전</strong> 3분할로 추천했어요
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={iconBtn()}>
            <ShareButton interest={interest} />
          </div>
          <button
            onClick={() => go('interest-input')}
            className="cursor-pointer"
            style={iconBtn()}
            aria-label="다시 분석하기"
          >
            <RotateCcw size={15} color={C.sub} />
          </button>
        </div>
      </div>

      <AIRecommendationCards
        result={exploreResult}
        loading={detailLoading}
        onSelectMajor={handleSelectMajor}
      />

      {detailLoading && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              borderRadius: 12,
              padding: '12px 16px',
              border: `1px solid ${C.line}`,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: `2px solid ${C.brand}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>학과 상세 정보를 불러오고 있어요...</p>
          </div>
        </div>
      )}

      {/* 안내 푸터 */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            background: C.bg,
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 11,
            color: C.sub,
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
          }}
        >
          <div style={{ fontWeight: 600, color: C.ink, marginBottom: 4 }}>📚 추천 근거</div>
          <div style={{ marginBottom: 6 }}>
            2026 대교협 학과별 권장 이수 기준 · 교육부 고교학점제 매뉴얼
            {exploreResult.schoolContextName
              ? ` · ${exploreResult.schoolContextName} NEIS 시간표·학교알리미 실측 데이터 반영`
              : state.school?.name
                ? ` · ${state.school.name} 2026학년도 교육과정 편성표 기반`
                : ' 기반'}
          </div>
          <div style={{ color: C.sub, opacity: 0.85 }}>
            * 도전 · 적정 · 안전 3분할은 진학사 · 메가스터디 등 입시 컨설팅 표준 분류 방식을 따랐어요
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, active, current }: { n: number; label: string; active?: boolean; current?: boolean }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ height: 3, borderRadius: 2, background: active ? C.brand : C.line }} />
      <div
        style={{
          fontSize: 10.5,
          marginTop: 6,
          color: active ? C.brand : C.sub,
          fontWeight: active ? 700 : 500,
          letterSpacing: '-0.01em',
          opacity: active && !current ? 0.7 : 1,
        }}
      >
        {n}. {label}
      </div>
    </div>
  );
}
