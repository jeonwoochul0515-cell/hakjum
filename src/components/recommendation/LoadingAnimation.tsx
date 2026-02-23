import { Sparkles } from 'lucide-react';

export function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-primary to-indigo-primary opacity-20 animate-ping" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={32} className="text-indigo-primary animate-pulse" />
        </div>
      </div>
      <p className="mt-6 text-lg font-semibold text-slate-700">AI가 최적의 과목을 분석 중...</p>
      <p className="text-sm text-slate-400 mt-1">학교 개설과목과 진로를 매칭하고 있어요</p>
    </div>
  );
}
