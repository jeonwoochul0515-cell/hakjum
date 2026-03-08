import { ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFlow } from '@/hooks/useFlow';

export function AptitudeResultStep() {
  const { state, go } = useFlow();
  const result = state.aptitudeResult;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center pt-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">흥미검사 완료!</h1>
        <p className="text-sm text-slate-500 mt-2">
          검사 결과를 확인하고, 맞춤 학과 추천을 받아보세요
        </p>
      </div>

      {/* 결과 보기 */}
      {result?.url && (
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">커리어넷 결과 리포트</p>
              <p className="text-xs text-slate-400 mt-1">나의 직업흥미 유형과 추천 직업을 확인하세요</p>
            </div>
            <ExternalLink size={20} className="text-sky-primary" />
          </div>
        </a>
      )}

      {/* 다음 단계 안내 */}
      <div className="bg-sky-50/50 rounded-2xl border border-sky-100 p-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          이제 관심사를 입력하면 <strong>흥미검사 결과</strong>와 함께
          AI가 더 정확한 학과를 추천해드려요.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => go('interest-input')}
      >
        맞춤 학과 추천 받기
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );
}
