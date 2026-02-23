import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = ['학교 선택', '진로 입력', 'AI 추천'];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {steps.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-sky-primary' : 'bg-slate-200'}`} />
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
  );
}
