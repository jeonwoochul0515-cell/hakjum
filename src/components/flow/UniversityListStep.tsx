import { UniversityGrid } from '@/components/explore/UniversityGrid';
import { useFlow } from '@/hooks/useFlow';
import { ArrowRight } from 'lucide-react';
import type { UniversityFull } from '@/types';

export function UniversityListStep() {
  const { state, dispatch, go, runRecommendation } = useFlow();
  const { selectedMajor, enrollment, universityStats } = state;

  if (!selectedMajor) return null;

  const handleSelectUniversity = (u: UniversityFull) => {
    dispatch({ type: 'SET_SELECTED_UNIVERSITY', payload: u });
    go('university-detail');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="pt-6 pb-4">
        <h1 className="text-xl font-bold text-slate-800">{selectedMajor.name} 개설 대학교</h1>
        <p className="text-sm text-slate-500 mt-1">대학별 정원, 등록금, 장학금 정보를 확인해보세요</p>
      </div>

      <UniversityGrid
        universities={selectedMajor.universitiesFull}
        enrollment={enrollment}
        universityStats={universityStats}
        onSelectUniversity={handleSelectUniversity}
      />

      {/* 하단 CTA */}
      <div className="mt-6">
        <button
          onClick={() => runRecommendation()}
          className="w-full py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          내 학교 맞춤 과목 추천받기
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
