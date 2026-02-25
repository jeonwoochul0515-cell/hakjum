import { Sparkles } from 'lucide-react';

interface CareerInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function CareerInput({ value, onChange }: CareerInputProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-1">
        <Sparkles size={14} className="inline mr-1 text-amber-primary" />
        희망 진로 / 관심 분야
        <span className="text-xs text-slate-400 font-normal ml-1">(선택사항)</span>
      </label>
      <p className="text-xs text-slate-400 mb-2">아직 정확히 모르겠어도 괜찮아요! 위에서 관심 분야만 골라도 추천해드려요</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="아직 정확히 모르겠어요... 그래도 괜찮아요! 예: 컴퓨터 관련 일을 하고 싶어요"
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary text-sm resize-none transition-all"
      />
    </div>
  );
}
