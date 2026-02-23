import { Sparkles } from 'lucide-react';

interface CareerInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function CareerInput({ value, onChange }: CareerInputProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-2">
        <Sparkles size={14} className="inline mr-1 text-amber-primary" />
        희망 진로 / 관심 분야
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 컴퓨터공학과 진학 희망, AI와 프로그래밍에 관심이 많아요"
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary text-sm resize-none transition-all"
      />
    </div>
  );
}
