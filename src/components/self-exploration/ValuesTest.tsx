import { useState } from 'react';
import { ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import { QuestionRunner } from './QuestionRunner';
import { DonutChart, HorizontalBars } from './ResultChart';
import {
  VALUE_QUESTIONS,
  VALUES_SCALE_LABELS,
  VALUE_META,
  calculateValues,
  type ValuesResult,
  type ValueAxis,
} from '@/lib/self-exploration/values';

interface Props {
  initialResult?: ValuesResult;
  onComplete: (result: ValuesResult) => void;
  onBack: () => void;
}

export function ValuesTest({ initialResult, onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<ValuesResult | null>(initialResult ?? null);

  const handleComplete = () => {
    const r = calculateValues(answers);
    setResult(r);
    onComplete(r);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  if (result) {
    return <ValuesResultView result={result} onRetry={handleRetry} onBack={onBack} />;
  }

  return (
    <QuestionRunner
      title="가치관 검사 (18문항)"
      subtitle="일·진로에서 무엇이 중요한지 답해주세요"
      questions={VALUE_QUESTIONS}
      scaleLabels={VALUES_SCALE_LABELS}
      answers={answers}
      setAnswers={setAnswers}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      onComplete={handleComplete}
      onCancel={onBack}
    />
  );
}

function ValuesResultView({
  result,
  onRetry,
  onBack,
}: {
  result: ValuesResult;
  onRetry: () => void;
  onBack: () => void;
}) {
  const order: ValueAxis[] = ['stability', 'achievement', 'autonomy', 'creativity', 'service', 'relationship'];
  const slices = order.map((k) => ({
    key: k,
    label: VALUE_META[k].ko,
    value: Math.max(1, result.axes[k]),
    color: VALUE_META[k].color,
  }));
  const bars = order
    .map((k) => ({
      label: VALUE_META[k].ko,
      value: result.axes[k],
      color: VALUE_META[k].color,
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
            직업 가치관 결과
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
            {result.topValues.join(' · ')}
          </h2>
        </div>

        <DonutChart slices={slices} centerLabel="Top 3" centerSubLabel={result.topValues[0]} />

        <p
          style={{
            fontSize: 13,
            color: C.sub,
            lineHeight: 1.6,
            marginTop: 16,
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          {result.description}
        </p>
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
          축별 점수
        </div>
        <HorizontalBars bars={bars} />
      </div>

      {result.conflicts.length > 0 && (
        <div
          style={{
            background: '#fff8ed',
            borderRadius: 16,
            border: '1px solid #fde68a',
            padding: 14,
            display: 'flex',
            gap: 10,
          }}
        >
          <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#92400e',
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              가치관 갈등 가능성
            </div>
            {result.conflicts.map((c) => (
              <p
                key={c}
                style={{
                  fontSize: 12,
                  color: '#78350f',
                  lineHeight: 1.55,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {c}
              </p>
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
