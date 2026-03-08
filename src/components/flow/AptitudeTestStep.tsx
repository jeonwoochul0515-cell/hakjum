import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAptitudeQuestions, submitAptitudeAnswers } from '@/lib/aptitude-api';
import { useFlow } from '@/hooks/useFlow';
import type { AptitudeQuestion } from '@/types';

const BATCH_SIZE = 5;

export function AptitudeTestStep() {
  const { state, dispatch, go } = useFlow();
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [batchIndex, setBatchIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const startDtmRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // 문항 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = await fetchAptitudeQuestions('31');
        if (!cancelled) {
          setQuestions(qs);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('검사 문항을 불러오지 못했습니다');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
  const batchStart = batchIndex * BATCH_SIZE;
  const batchQuestions = questions.slice(batchStart, batchStart + BATCH_SIZE);

  // 현재 배치의 모든 문항에 답했는지
  const batchComplete = batchQuestions.every((q) => answers[q.questionNo] !== undefined);
  const allComplete = questions.length > 0 && questions.every((q) => answers[q.questionNo] !== undefined);
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (questionNo: number, answerNo: number) => {
    setAnswers((prev) => ({ ...prev, [questionNo]: answerNo }));
  };

  const nextBatch = () => {
    if (batchIndex < totalBatches - 1) {
      setBatchIndex((i) => i + 1);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevBatch = () => {
    if (batchIndex > 0) {
      setBatchIndex((i) => i - 1);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!allComplete) return;
    setSubmitting(true);
    setError('');

    try {
      // "1=3 2=5 3=2 ..." 형식으로 변환
      const answerString = questions
        .map((q) => `${q.questionNo}=${answers[q.questionNo]}`)
        .join(' ');

      const result = await submitAptitudeAnswers({
        qestrnSeq: '31',
        trgetSe: '100207', // 고등학생
        gender: state.aptitudeGender,
        grade: '1',
        startDtm: startDtmRef.current,
        answers: answerString,
      });

      dispatch({ type: 'SET_APTITUDE_RESULT', payload: result });
      dispatch({ type: 'BACK' }); // pop aptitude-test
      dispatch({ type: 'GO', payload: 'aptitude-result' });
    } catch (err) {
      setError('결과 제출에 실패했습니다. 다시 시도해주세요.');
      setSubmitting(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <Loader2 size={32} className="animate-spin text-sky-primary mb-4" />
        <p className="text-sm text-slate-500">검사 문항을 불러오는 중...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <button onClick={() => go('interest-input')} className="text-sm text-sky-primary hover:underline cursor-pointer">
          건너뛰고 관심사 입력하기
        </button>
      </div>
    );
  }

  // 제출 중
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <Loader2 size={32} className="animate-spin text-sky-primary mb-4" />
        <p className="text-sm font-medium text-slate-700">결과를 분석하고 있어요...</p>
        <p className="text-xs text-slate-400 mt-1">잠시만 기다려주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up" ref={containerRef}>
      {/* 진행률 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-slate-500">
            {answeredCount} / {questions.length} 문항
          </p>
          <p className="text-xs text-slate-400">
            {Math.round((answeredCount / questions.length) * 100)}%
          </p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-primary to-indigo-primary transition-all duration-300 rounded-full"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 문항 배치 */}
      <div className="space-y-4">
        {batchQuestions.map((q, idx) => (
          <div
            key={q.questionNo}
            className="bg-white rounded-2xl border border-slate-200 p-4"
          >
            <p className="text-sm font-medium text-slate-700 mb-3">
              <span className="text-sky-primary font-bold mr-1.5">Q{batchStart + idx + 1}.</span>
              {q.question}
            </p>
            <div className="grid gap-2">
              {q.answers.map((a) => (
                <button
                  key={a.answerNo}
                  onClick={() => handleAnswer(q.questionNo, a.answerNo)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                    answers[q.questionNo] === a.answerNo
                      ? 'bg-gradient-to-r from-sky-primary to-indigo-primary text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  {a.answer}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* 네비게이션 */}
      <div className="flex gap-3">
        {batchIndex > 0 && (
          <button
            onClick={prevBatch}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <ChevronLeft size={16} />
            이전
          </button>
        )}

        {batchIndex < totalBatches - 1 ? (
          <button
            onClick={nextBatch}
            disabled={!batchComplete}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-primary to-indigo-primary text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            다음
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allComplete}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-primary to-indigo-primary text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            결과 확인하기
          </button>
        )}
      </div>
    </div>
  );
}
