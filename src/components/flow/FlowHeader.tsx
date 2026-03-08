import { ArrowLeft } from 'lucide-react';
import { useFlow } from '@/hooks/useFlow';
import { Badge } from '@/components/ui/Badge';
import type { FlowStep } from '@/types';

const STEP_ORDER: FlowStep[] = [
  'school-select',
  'aptitude-intro',
  'aptitude-test',
  'aptitude-result',
  'interest-input',
  'ai-loading',
  'major-results',
  'major-detail',
  'university-list',
  'university-detail',
  'subject-match',
];

const STEP_LABELS: Partial<Record<FlowStep, string>> = {
  'school-select': '학교 선택',
  'aptitude-intro': '흥미검사',
  'aptitude-test': '검사 진행',
  'aptitude-result': '검사 결과',
  'interest-input': '관심사 입력',
  'ai-loading': 'AI 분석 중',
  'major-results': '추천 학과',
  'major-detail': '학과 상세',
  'university-list': '대학 목록',
  'university-detail': '대학 상세',
  'subject-match': '과목 추천',
};

export function FlowHeader() {
  const { state, back, reset } = useFlow();
  const { currentStep, stepHistory, school } = state;

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const progress = Math.max(0, ((currentIndex + 1) / STEP_ORDER.length) * 100);

  const canGoBack = stepHistory.length > 0 && currentStep !== 'ai-loading' && currentStep !== 'aptitude-test';

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-lg mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          {/* Back */}
          {canGoBack ? (
            <button onClick={back} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 cursor-pointer">
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">뒤로</span>
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Logo - 클릭 시 첫 페이지로 */}
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src="/butterfly.svg" alt="학점나비" className="w-7 h-7" />
            <span className="text-lg font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
              학점나비
            </span>
          </button>

          {/* School badge - 한줄 표시 */}
          <div className="shrink-0 flex justify-end">
            {school && currentStep !== 'school-select' && (
              <Badge color="sky"><span className="whitespace-nowrap">{school.name}</span></Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100 -mx-4">
          <div
            className="h-full bg-gradient-to-r from-sky-primary to-indigo-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step label */}
      <div className="max-w-lg mx-auto px-4">
        <p className="text-[10px] text-slate-400 py-1">
          {STEP_LABELS[currentStep] || ''}
        </p>
      </div>
    </header>
  );
}
