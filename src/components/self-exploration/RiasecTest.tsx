import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import { QuestionRunner } from './QuestionRunner';
import { DonutChart, HorizontalBars } from './ResultChart';
import {
  RIASEC_QUESTIONS,
  RIASEC_SCALE_LABELS,
  RIASEC_META,
  calculateRiasecResult,
  type RiasecResult,
  type RiasecType,
} from '@/lib/self-exploration/riasec';

interface Props {
  initialResult?: RiasecResult;
  onComplete: (result: RiasecResult) => void;
  onBack: () => void;
}

export function RiasecTest({ initialResult, onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<RiasecResult | null>(initialResult ?? null);

  const handleComplete = () => {
    const r = calculateRiasecResult(answers);
    setResult(r);
    onComplete(r);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  if (result) {
    return <RiasecResultView result={result} onRetry={handleRetry} onBack={onBack} />;
  }

  return (
    <QuestionRunner
      title="RIASEC 흥미 검사 (30문항)"
      subtitle="평소 모습을 떠올리며 답해주세요"
      questions={RIASEC_QUESTIONS}
      scaleLabels={RIASEC_SCALE_LABELS}
      answers={answers}
      setAnswers={setAnswers}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      onComplete={handleComplete}
      onCancel={onBack}
    />
  );
}

function RiasecResultView({
  result,
  onRetry,
  onBack,
}: {
  result: RiasecResult;
  onRetry: () => void;
  onBack: () => void;
}) {
  const order: RiasecType[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  const slices = order.map((k) => ({
    key: k,
    label: RIASEC_META[k].ko,
    value: Math.max(1, result.types[k]), // 0이면 슬라이스 안 보여서 최소 1
    color: RIASEC_META[k].color,
  }));

  const bars = order
    .map((k) => ({
      label: `${RIASEC_META[k].ko} (${k})`,
      value: result.types[k],
      color: RIASEC_META[k].color,
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
            RIASEC 흥미 결과
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
            {RIASEC_META[result.primaryType].ko}({result.primaryType}) +{' '}
            {RIASEC_META[result.secondaryType].ko}({result.secondaryType})
          </h2>
        </div>

        <DonutChart
          slices={slices}
          centerLabel={result.primaryType}
          centerSubLabel={RIASEC_META[result.primaryType].ko}
        />

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
          {RIASEC_META[result.primaryType].short}
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
          유형별 점수
        </div>
        <HorizontalBars bars={bars} />
      </div>

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
