import { useState, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';

const tips = [
  '선택과목은 내신 등급뿐 아니라 학생부에도 기록돼요',
  '대학은 교과이수 현황을 종합적으로 평가합니다',
  '진로와 연계된 과목 선택은 학생부에서 큰 강점이에요',
  '같은 계열이라도 대학마다 권장과목이 다를 수 있어요',
];

export function LoadingAnimation() {
  const { state } = useWizard();
  const [phase, setPhase] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const schoolName = state.school?.name || '학교';
  const subjectCount = state.school?.allSubjects.length || 0;
  const tagLabel = state.tags.length > 0 ? state.tags[0] : '선택한 분야';

  const phases = [
    `${schoolName} 개설과목 ${subjectCount}개를 불러오고 있어요...`,
    `${tagLabel} 분야와 매칭되는 과목을 찾고 있어요...`,
    '최적의 과목 조합을 생성하고 있어요...',
  ];

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhase((p) => Math.min(p + 1, phases.length - 1));
    }, 2000);
    return () => clearInterval(phaseTimer);
  }, [phases.length]);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((t) => (t + 1) % tips.length);
    }, 4000);
    return () => clearInterval(tipTimer);
  }, []);

  const progress = ((phase + 1) / phases.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Animated butterfly */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-primary to-indigo-primary opacity-15 animate-ping" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/butterfly.svg" alt="" className="w-12 h-12 animate-butterfly" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-primary to-indigo-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phase messages */}
      <div className="text-center space-y-2 min-h-[60px]">
        {phases.map((msg, i) => (
          <p
            key={i}
            className={`text-sm transition-all duration-500 ${
              i <= phase ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
            } ${i === phase ? 'text-slate-700 font-medium' : 'text-slate-400 text-xs'}`}
          >
            {i < phase && '✓ '}{msg}
          </p>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-8 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 max-w-xs">
        <p className="text-xs text-amber-700 text-center">
          💡 {tips[tipIndex]}
        </p>
      </div>
    </div>
  );
}
