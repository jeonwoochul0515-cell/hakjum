import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import { QuestionRunner } from './QuestionRunner';
import { HorizontalBars } from './ResultChart';
import {
  STRENGTH_QUESTIONS,
  STRENGTHS_SCALE_LABELS,
  STRENGTH_AREA_META,
  calculateStrengths,
  type StrengthsResult,
  type StrengthArea,
} from '@/lib/self-exploration/strengths';

interface Props {
  initialResult?: StrengthsResult;
  onComplete: (result: StrengthsResult) => void;
  onBack: () => void;
}

export function StrengthsTest({ initialResult, onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<StrengthsResult | null>(initialResult ?? null);

  const handleComplete = () => {
    const r = calculateStrengths(answers);
    setResult(r);
    onComplete(r);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  if (result) {
    return <StrengthsResultView result={result} onRetry={handleRetry} onBack={onBack} />;
  }

  return (
    <QuestionRunner
      title="강점 검사 (24문항)"
      subtitle="자신감 있게 잘하는 모습을 떠올려보세요"
      questions={STRENGTH_QUESTIONS}
      scaleLabels={STRENGTHS_SCALE_LABELS}
      answers={answers}
      setAnswers={setAnswers}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      onComplete={handleComplete}
      onCancel={onBack}
    />
  );
}

function StrengthsResultView({
  result,
  onRetry,
  onBack,
}: {
  result: StrengthsResult;
  onRetry: () => void;
  onBack: () => void;
}) {
  const order: StrengthArea[] = ['cognitive', 'social', 'execution', 'creative', 'emotional'];
  const bars = order
    .map((k) => ({
      label: STRENGTH_AREA_META[k].label,
      value: result.areas[k],
      color: STRENGTH_AREA_META[k].color,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          border: `1px solid ${C.line}`,
          padding: 20,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: C.brand,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            강점 검사 결과
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: C.ink,
              marginTop: 4,
              letterSpacing: '-0.03em',
            }}
          >
            {result.topAreas.slice(0, 2).join(' · ')}
          </h2>
          <p
            style={{
              fontSize: 12.5,
              color: C.sub,
              marginTop: 6,
              letterSpacing: '-0.01em',
            }}
          >
            {result.description}
          </p>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          border: `1px solid ${C.line}`,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: C.ink,
            marginBottom: 12,
            letterSpacing: '-0.025em',
          }}
        >
          영역별 점수
        </div>
        <HorizontalBars bars={bars} />
      </div>

      {result.strengths.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: `1px solid ${C.line}`,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: C.ink,
              marginBottom: 12,
              letterSpacing: '-0.025em',
            }}
          >
            나의 Top 강점
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {result.strengths.map((s, i) => (
              <span
                key={s}
                style={{
                  padding: '8px 14px',
                  background: i === 0 ? C.brand : C.brandSoft,
                  color: i === 0 ? '#fff' : C.brand,
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {i + 1}. {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 1,
            padding: '12px',
            background: '#fff',
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            color: C.ink,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            letterSpacing: '-0.02em',
          }}
        >
          <RotateCcw size={14} /> 다시 검사
        </button>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '12px',
            background: C.brand,
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            letterSpacing: '-0.02em',
          }}
        >
          메뉴로 <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
