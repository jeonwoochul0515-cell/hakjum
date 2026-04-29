import { ArrowRight, SkipForward, ClipboardCheck, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useFlow } from '@/hooks/useFlow';
import { C } from '@/lib/design-tokens';

export function AptitudeIntroStep() {
  const { state, dispatch, go } = useFlow();
  const navigate = useNavigate();

  const genderSelected = !!state.aptitudeGender;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center pt-4">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: C.brandSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <ClipboardCheck size={32} color={C.brand} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.03em' }}>
          나의 직업 흥미를 알아볼까요?
        </h1>
        <p
          style={{
            fontSize: 13,
            color: C.sub,
            marginTop: 8,
            lineHeight: 1.65,
            letterSpacing: '-0.01em',
          }}
        >
          커리어넷 직업흥미검사로 나에게 맞는 직업 유형을 발견하고,
          <br />
          AI가 더 정확한 학과를 추천해드려요
        </p>
      </div>

      {/* 검사 안내 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: `1px solid ${C.line}`,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {[
          { n: 1, title: '직업흥미검사 (K형)', desc: '교육부 커리어넷 공식 검사' },
          { n: 2, title: '약 5~10분 소요', desc: '간단한 질문에 답하면 끝!' },
          { n: 3, title: '결과 즉시 확인', desc: '나의 흥미 유형 + 맞춤 학과 추천까지' },
        ].map((item) => (
          <div key={item.n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.brandSoft,
                color: C.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {item.n}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 성별 선택 */}
      <div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: C.ink,
            marginBottom: 10,
            letterSpacing: '-0.025em',
          }}
        >
          성별 선택
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { code: '100323', label: '남학생' },
            { code: '100324', label: '여학생' },
          ].map((g) => {
            const active = state.aptitudeGender === g.code;
            return (
              <button
                key={g.code}
                onClick={() => dispatch({ type: 'SET_APTITUDE_GENDER', payload: g.code })}
                className="cursor-pointer transition-colors"
                style={{
                  padding: 16,
                  fontSize: 14,
                  fontWeight: 700,
                  background: active ? C.brand : '#fff',
                  color: active ? '#fff' : C.ink,
                  border: `1.5px solid ${active ? C.brand : C.line}`,
                  borderRadius: 12,
                  letterSpacing: '-0.02em',
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        className="w-full"
        disabled={!genderSelected}
        onClick={() => go('aptitude-test')}
      >
        흥미검사 시작하기
        <ArrowRight size={18} className="ml-2" />
      </Button>

      {/* 학점나비 자체 자가탐색 카드 (보완재) */}
      <button
        onClick={() => navigate('/self-exploration')}
        className="w-full cursor-pointer transition-colors"
        style={{
          padding: 14,
          background: '#fff',
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: C.brandSoft,
            color: C.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Compass size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: '-0.025em',
            }}
          >
            학점나비 자체 자가탐색 (10분)
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: C.sub,
              marginTop: 2,
              letterSpacing: '-0.01em',
              lineHeight: 1.45,
            }}
          >
            RIASEC + 강점 + 가치관 — AI 추천에 자동 반영돼요
          </div>
        </div>
        <ArrowRight size={16} color={C.sub} />
      </button>

      <button
        onClick={() => go('interest-input')}
        className="w-full cursor-pointer transition-colors"
        style={{
          padding: '10px 0',
          fontSize: 13,
          color: C.sub,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <SkipForward size={14} />
        이미 관심 분야를 알고 있어요 (건너뛰기)
      </button>
    </div>
  );
}
