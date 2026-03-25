import { ArrowRight, AlertTriangle } from 'lucide-react';
import { MajorOverviewCard } from '@/components/explore/MajorOverviewCard';
import { CareerOutcomeSection } from '@/components/explore/CareerOutcomeSection';
import { RequiredSubjectsView } from '@/components/explore/RequiredSubjectsView';
import { AdmissionRequirementSection } from '@/components/explore/AdmissionRequirementSection';
import { FavoriteButton } from '@/components/explore/FavoriteButton';
import { ShareButton } from '@/components/explore/ShareButton';
import { Badge } from '@/components/ui/Badge';
import { useFlow } from '@/hooks/useFlow';

// 학과별 특수 안내 (로스쿨 전환, 폐지 등)
const MAJOR_NOTICES: Record<string, string> = {
  '법학과': '2009년부터 서울대, 연세대, 고려대 등 주요 25개 대학의 학부 법학과가 법학전문대학원(로스쿨)으로 전환되었습니다. 변호사를 희망하는 경우 학부 졸업 후 로스쿨 진학이 필요합니다. 일부 대학은 여전히 학부 법학과를 운영합니다.',
};

export function MajorDetailStep() {
  const { state, go, runRecommendation } = useFlow();
  const { selectedMajor, school, interest } = state;

  if (!selectedMajor) return null;

  const handleGoToUniversities = () => go('university-list');
  const handleGoToSubjectMatch = () => runRecommendation();
  const notice = MAJOR_NOTICES[selectedMajor.name];

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

      {/* 특수 안내 (로스쿨 전환 등) */}
      {notice && (
        <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-2.5">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">{notice}</p>
        </div>
      )}

      {/* 개요 */}
      <MajorOverviewCard major={selectedMajor} />

      {/* 진로·취업 */}
      <div className="mt-5">
        <h2 className="text-base font-bold text-slate-800 mb-3">진로 및 취업</h2>
        <CareerOutcomeSection major={selectedMajor} />
      </div>

      {/* 진학필수 교과목 (2028 대입기준) */}
      <div className="mt-5">
        <AdmissionRequirementSection
          majorName={selectedMajor.name}
          schoolSubjects={school?.allSubjects || []}
        />
      </div>

      {/* 권장과목 */}
      <div className="mt-5">
        <h2 className="text-base font-bold text-slate-800 mb-3">권장 과목</h2>
        <RequiredSubjectsView major={selectedMajor} />
      </div>

      {/* 하단 CTA - 주 액션 하나 + 보조 링크 */}
      <div className="mt-6">
        <button
          onClick={handleGoToSubjectMatch}
          className="w-full py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          내 학교 맞춤 과목 추천받기
          <ArrowRight size={16} />
        </button>
        <button
          onClick={handleGoToUniversities}
          className="w-full mt-2 py-2.5 text-sm text-slate-500 hover:text-sky-primary transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          이 학과가 있는 대학교 먼저 보기 →
        </button>
      </div>
    </div>
  );
}
