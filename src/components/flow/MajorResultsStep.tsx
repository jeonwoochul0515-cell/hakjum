import { RotateCcw } from 'lucide-react';
import { AIRecommendationCards } from '@/components/explore/AIRecommendationCards';
import { ShareButton } from '@/components/explore/ShareButton';
import { useFlow } from '@/hooks/useFlow';
import { useState } from 'react';

export function MajorResultsStep() {
  const { state, selectMajor, go } = useFlow();
  const { exploreResult, interest } = state;
  const [detailLoading, setDetailLoading] = useState(false);

  if (!exploreResult) return null;

  const handleSelectMajor = async (majorName: string, category: string) => {
    setDetailLoading(true);
    try {
      await selectMajor(majorName, category);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">추천 학과</h1>
            <p className="text-sm text-slate-500 mt-1">
              "{interest}" 관련 {exploreResult.recommendations.length}개 학과를 찾았어요
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton interest={interest} />
            <button
              onClick={() => go('interest-input')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <RotateCcw size={14} />
              다시
            </button>
          </div>
        </div>
      </div>

      <AIRecommendationCards
        result={exploreResult}
        loading={detailLoading}
        onSelectMajor={handleSelectMajor}
      />

      {detailLoading && (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100">
            <div className="w-4 h-4 border-2 border-sky-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">학과 상세 정보를 불러오고 있어요...</p>
          </div>
        </div>
      )}
    </div>
  );
}
