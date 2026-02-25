import { ArrowLeft, ArrowRight, Compass, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '@/context/WizardContext';
import { useExploreAI } from '@/hooks/useExploreAI';
import { AIInterestInput } from '@/components/explore/AIInterestInput';
import { AIRecommendationCards } from '@/components/explore/AIRecommendationCards';
import { AILoadingState } from '@/components/explore/AILoadingState';
import { MajorOverviewCard } from '@/components/explore/MajorOverviewCard';
import { UniversityGrid } from '@/components/explore/UniversityGrid';
import { CareerOutcomeSection } from '@/components/explore/CareerOutcomeSection';
import { RequiredSubjectsView } from '@/components/explore/RequiredSubjectsView';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';

type Tab = 'overview' | 'university' | 'career' | 'subjects';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: '개요' },
  { key: 'university', label: '대학' },
  { key: 'career', label: '진로·취업' },
  { key: 'subjects', label: '권장과목' },
];

export default function MajorExplorePage() {
  const navigate = useNavigate();
  const { dispatch } = useWizard();
  const {
    step,
    school,
    interest,
    result,
    selectedMajor,
    detailLoading,
    error,
    setSchool,
    setInterest,
    analyze,
    selectMajor,
    backToResults,
    reset,
  } = useExploreAI();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const handleBack = () => {
    if (step === 'detail') {
      backToResults();
      setActiveTab('overview');
    } else if (step === 'results') {
      reset();
    } else {
      navigate('/');
    }
  };

  const handleGoToRecommendation = () => {
    if (!selectedMajor) return;
    dispatch({ type: 'SET_TARGET_MAJOR', payload: selectedMajor });
    dispatch({ type: 'SET_CAREER_GOAL', payload: selectedMajor.name });
    navigate('/school');
  };

  const backLabel = step === 'detail' ? '추천 결과로' : step === 'results' ? '다시 입력' : '홈';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 cursor-pointer">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{backLabel}</span>
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            <img src="/butterfly.svg" alt="학점나비" className="w-7 h-7" />
            <span className="text-lg font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
              학점나비
            </span>
          </button>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Step 1: 입력 */}
        {step === 'input' && (
          <div>
            <div className="flex items-center gap-3 pt-5 pb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-sky-50 rounded-xl flex-shrink-0">
                <Compass size={22} className="text-sky-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">어떤 학과가 나에게 맞을까?</h1>
                <p className="text-xs text-slate-500">관심사를 알려주면 AI가 맞춤 학과를 추천해드려요</p>
              </div>
            </div>

            <AIInterestInput
              school={school}
              interest={interest}
              onSchoolChange={setSchool}
              onInterestChange={setInterest}
              onSubmit={analyze}
            />

            {error && (
              <div className="mt-4 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 로딩 */}
        {step === 'loading' && <AILoadingState />}

        {/* Step 3: 추천 결과 */}
        {step === 'results' && result && (
          <div>
            <div className="pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">추천 학과</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    "{interest}" 관련 {result.recommendations.length}개 학과를 찾았어요
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  다시
                </button>
              </div>
            </div>

            <AIRecommendationCards
              result={result}
              loading={detailLoading}
              onSelectMajor={selectMajor}
            />

            {error && (
              <div className="mt-4 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {detailLoading && (
              <div className="mt-4 flex justify-center">
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100">
                  <div className="w-4 h-4 border-2 border-sky-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">학과 상세 정보를 불러오고 있어요...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: 학과 상세 */}
        {step === 'detail' && selectedMajor && (
          <div className="animate-fade-in-up">
            {/* 학과명 + 뱃지 */}
            <div className="pt-6 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{selectedMajor.name}</h1>
                {selectedMajor.category && (
                  <Badge color="sky">{selectedMajor.category}</Badge>
                )}
              </div>
              {school && (
                <p className="text-xs text-slate-400 mt-1.5">
                  {school.name} 학생을 위한 맞춤 정보
                </p>
              )}
            </div>

            {/* 탭 */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === key
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 */}
            {activeTab === 'overview' && (
              <MajorOverviewCard major={selectedMajor} />
            )}

            {activeTab === 'university' && (
              <UniversityGrid universities={selectedMajor.universitiesFull} />
            )}

            {activeTab === 'career' && (
              <CareerOutcomeSection major={selectedMajor} />
            )}

            {activeTab === 'subjects' && (
              <RequiredSubjectsView
                major={selectedMajor}
                onCTAClick={handleGoToRecommendation}
              />
            )}

            {/* 하단 CTA */}
            {activeTab !== 'subjects' && (
              <div className="mt-6">
                <button
                  onClick={handleGoToRecommendation}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  이 학과 맞춤 과목 추천받기
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
