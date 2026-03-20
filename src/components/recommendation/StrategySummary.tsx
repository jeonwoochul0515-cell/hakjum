import { Lightbulb } from 'lucide-react';

interface StrategySummaryProps {
  strategy: string;
  source: 'ai' | 'fallback';
}

export function StrategySummary({ strategy, source }: StrategySummaryProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
      <div className="flex items-start gap-3">
        <Lightbulb size={20} className="text-amber-primary flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-amber-800 mb-1">수강 전략</h3>
          <p className="text-sm text-amber-700 leading-relaxed">{strategy}</p>
          {source === 'fallback' && (
            <p className="text-xs text-amber-500 mt-2">
              * 키워드 기반 추천입니다. API 키를 설정하면 AI 맞춤 추천을 받을 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
