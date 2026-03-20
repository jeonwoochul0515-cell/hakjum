import { Check } from 'lucide-react';
import { useFlowContext } from '@/context/FlowContext';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = ['내 학교', '내 꿈', '내 과목'];

const encourageMessages: Record<number, string> = {
  1: '먼저 학교를 골라볼까요?',
  2: '거의 다 왔어요! 진로만 알려주세요',
  3: 'AI가 분석 중이에요...',
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { state } = useFlowContext();

  return (
    <div className="py-4">
      <div className="flex items-center justify-center gap-1">
        {steps.map((label, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={label} className="flex items-center">
              {i > 0 && (
                <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${isCompleted ? 'bg-sky-primary' : 'bg-slate-200'}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-sky-primary text-white'
                      : isCurrent
                        ? 'bg-gradient-to-r from-sky-primary to-indigo-primary text-white shadow-md'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : step}
                </div>
                <span className={`text-xs font-medium ${isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-400 mt-2">
        {encourageMessages[currentStep]}
        {currentStep >= 2 && state.school && (
          <span className="ml-1 text-sky-primary font-medium">{state.school.name}</span>
        )}
      </p>
    </div>
  );
}
