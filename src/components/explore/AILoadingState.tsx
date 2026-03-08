import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const PHASES = [
  { text: '관심사를 분석하고 있어요...', emoji: '🔍' },
  { text: '적합한 학과를 찾고 있어요...', emoji: '🎓' },
  { text: '대학교 정보를 매칭하고 있어요...', emoji: '🏫' },
  { text: '추천 결과를 정리하고 있어요...', emoji: '✨' },
];

const TIPS = [
  '학과 탐색 후 과목 추천도 받아보세요!',
  '전국 대학교 정보를 보여드려요',
  '관심 학과의 취업률과 진로도 확인할 수 있어요',
  '추천 학과에서 바로 맞춤 과목 추천으로 이어갈 수 있어요',
];

export function AILoadingState() {
  const [phase, setPhase] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 2500);
    return () => clearInterval(phaseTimer);
  }, []);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((t) => (t + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(tipTimer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
      {/* 메인 로딩 아이콘 */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 flex items-center justify-center">
          <Sparkles size={32} className="text-sky-primary animate-pulse" />
        </div>
        <div className="absolute -inset-2 rounded-full border-2 border-sky-primary/20 animate-spin" style={{ animationDuration: '3s' }} />
      </div>

      {/* 단계 텍스트 */}
      <div className="text-center mb-8" key={phase}>
        <span className="text-2xl mb-2 block">{PHASES[phase].emoji}</span>
        <p className="text-sm font-medium text-slate-700 animate-fade-in-up">{PHASES[phase].text}</p>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-48 bg-slate-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-gradient-to-r from-sky-primary to-indigo-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${((phase + 1) / PHASES.length) * 100}%` }}
        />
      </div>

      {/* 팁 */}
      <div className="bg-slate-50 rounded-lg px-4 py-2.5 max-w-xs" key={`tip-${tipIndex}`}>
        <p className="text-xs text-slate-500 text-center animate-fade-in-up">
          💡 {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}
