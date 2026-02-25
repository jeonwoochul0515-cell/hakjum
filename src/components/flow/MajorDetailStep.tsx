import { ArrowRight } from 'lucide-react';
import { MajorOverviewCard } from '@/components/explore/MajorOverviewCard';
import { CareerOutcomeSection } from '@/components/explore/CareerOutcomeSection';
import { RequiredSubjectsView } from '@/components/explore/RequiredSubjectsView';
import { FavoriteButton } from '@/components/explore/FavoriteButton';
import { ShareButton } from '@/components/explore/ShareButton';
import { Badge } from '@/components/ui/Badge';
import { useFlow } from '@/hooks/useFlow';

export function MajorDetailStep() {
  const { state, go, runRecommendation } = useFlow();
  const { selectedMajor, school, interest } = state;

  if (!selectedMajor) return null;

  const handleGoToUniversities = () => go('university-list');
  const handleGoToSubjectMatch = () => runRecommendation();

  return (
    <div className="animate-fade-in-up">
      {/* 학과명 + 뱃지 */}
      <div className="pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{selectedMajor.name}</h1>
            {selectedMajor.category && <Badge color="sky">{selectedMajor.category}</Badge>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <FavoriteButton majorName={selectedMajor.name} category={selectedMajor.category || ''} interest={interest} />
            <ShareButton interest={interest} majorName={selectedMajor.name} />
          </div>
        </div>
        {school && (
          <p className="text-xs text-slate-400 mt-1.5">{school.name} 학생을 위한 맞춤 정보</p>
        )}
      </div>

      {/* 개요 */}
      <MajorOverviewCard major={selectedMajor} />

      {/* 진로·취업 */}
      <div className="mt-5">
        <h2 className="text-base font-bold text-slate-800 mb-3">진로 및 취업</h2>
        <CareerOutcomeSection major={selectedMajor} />
      </div>

      {/* 권장과목 */}
      <div className="mt-5">
        <h2 className="text-base font-bold text-slate-800 mb-3">권장 과목</h2>
        <RequiredSubjectsView major={selectedMajor} onCTAClick={handleGoToSubjectMatch} />
      </div>

      {/* 하단 CTA */}
      <div className="mt-6 space-y-2">
        <button
          onClick={handleGoToUniversities}
          className="w-full py-3.5 bg-white border-2 border-sky-primary text-sky-primary rounded-xl font-semibold text-sm hover:bg-sky-50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          이 학과가 있는 대학교 보기
          <ArrowRight size={16} />
        </button>
        <button
          onClick={handleGoToSubjectMatch}
          className="w-full py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          내 학교 맞춤 과목 추천받기
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
