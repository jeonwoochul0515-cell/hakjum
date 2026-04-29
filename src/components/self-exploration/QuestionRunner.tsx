/**
 * 5점 척도 문항 검사 진행기.
 *
 * - 한 화면에 1문항
 * - 진행률 바 (C.brand)
 * - 큰 터치 영역의 5점 라디오
 * - 응답 시 자동으로 다음 문항으로 이동
 * - 이전 버튼으로 응답 수정 가능
 */
import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '@/lib/design-tokens';

export interface RunnerQuestion {
  id: string;
  text: string;
}

interface Props {
  title: string;
  subtitle?: string;
  questions: RunnerQuestion[];
  scaleLabels: string[]; // 길이 5
  answers: Record<string, number>;
  setAnswers: (next: Record<string, number>) => void;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  onComplete: () => void;
  onCancel: () => void;
}

export function QuestionRunner({
  title,
  subtitle,
  questions,
  scaleLabels,
  answers,
  setAnswers,
  currentIndex,
  setCurrentIndex,
  onComplete,
  onCancel,
}: Props) {
  const total = questions.length;
  const safeIndex = Math.max(0, Math.min(currentIndex, total - 1));
  const current = questions[safeIndex];
  const progress = useMemo(() => {
    const done = Object.keys(answers).filter((k) => questions.some((q) => q.id === k)).length;
    return Math.round((done / total) * 100);
  }, [answers, questions, total]);

  const handleAnswer = (value: number) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (safeIndex < total - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      // 모든 문항 응답 여부 확인
      const allAnswered = questions.every((q) => typeof next[q.id] === 'number');
      if (allAnswered) onComplete();
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: `1px solid ${C.line}`,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12.5,
            color: C.sub,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            letterSpacing: '-0.02em',
          }}
        >
          <ChevronLeft size={16} /> 메뉴
        </button>
        <div
          style={{
            fontSize: 12,
            color: C.sub,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {safeIndex + 1} / {total}
        </div>
      </div>

      {/* 진행률 바 */}
      <div
        style={{
          height: 6,
          background: C.bg,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: C.brand,
            borderRadius: 999,
            transition: 'width 250ms ease-out',
          }}
        />
      </div>

      {/* 타이틀 */}
      <div>
        <div style={{ fontSize: 12, color: C.brand, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>

      {/* 문항 */}
      <div
        style={{
          background: C.brandSoft,
          borderRadius: 16,
          padding: '20px 16px',
          minHeight: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.55,
            letterSpacing: '-0.025em',
            margin: 0,
          }}
        >
          {current.text}
        </p>
      </div>

      {/* 5점 척도 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((v) => {
          const selected = answers[current.id] === v;
          return (
            <button
              key={v}
              onClick={() => handleAnswer(v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 14px',
                background: selected ? C.brand : '#fff',
                color: selected ? '#fff' : C.ink,
                border: `1.5px solid ${selected ? C.brand : C.line}`,
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                transition: 'all 150ms',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: selected ? '#fff' : C.bg,
                  border: `1.5px solid ${selected ? '#fff' : C.line}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: selected ? C.brand : C.sub,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {v}
              </div>
              <span>{scaleLabels[v - 1]}</span>
            </button>
          );
        })}
      </div>

      {/* 네비게이션 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, safeIndex - 1))}
          disabled={safeIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '10px 14px',
            background: 'transparent',
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            color: safeIndex === 0 ? C.line : C.sub,
            fontSize: 13,
            fontWeight: 600,
            cursor: safeIndex === 0 ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.02em',
          }}
        >
          <ChevronLeft size={14} /> 이전
        </button>
        <button
          onClick={() => {
            if (safeIndex < total - 1) {
              setCurrentIndex(safeIndex + 1);
            } else if (questions.every((q) => typeof answers[q.id] === 'number')) {
              onComplete();
            }
          }}
          disabled={typeof answers[current.id] !== 'number'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '10px 14px',
            background: typeof answers[current.id] === 'number' ? C.brand : C.bg,
            border: 'none',
            borderRadius: 10,
            color: typeof answers[current.id] === 'number' ? '#fff' : C.sub,
            fontSize: 13,
            fontWeight: 700,
            cursor: typeof answers[current.id] === 'number' ? 'pointer' : 'not-allowed',
            letterSpacing: '-0.02em',
          }}
        >
          {safeIndex === total - 1 ? '결과 보기' : '다음'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
