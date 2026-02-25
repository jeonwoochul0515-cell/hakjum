import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { useWizard } from '@/context/WizardContext';
import { getMajorFullAPI } from '@/lib/career-api';
import { MajorSearchPanel } from '@/components/explore/MajorSearchPanel';
import { MajorOverviewCard } from '@/components/explore/MajorOverviewCard';
import { UniversityGrid } from '@/components/explore/UniversityGrid';
import { CareerOutcomeSection } from '@/components/explore/CareerOutcomeSection';
import { RequiredSubjectsView } from '@/components/explore/RequiredSubjectsView';
import { Badge } from '@/components/ui/Badge';
import type { Major, MajorFull } from '@/types';

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
  const [selectedMajor, setSelectedMajor] = useState<MajorFull | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectMajor = async (major: Major) => {
    setLoading(true);
    setError('');
    try {
      const full = await getMajorFullAPI(major.id);
      full.category = major.category || full.category;
      setSelectedMajor(full);
      setActiveTab('overview');
    } catch {
      setError('학과 정보를 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedMajor) {
      setSelectedMajor(null);
      setError('');
    } else {
      navigate('/');
    }
  };

  const handleGoToRecommendation = () => {
    if (!selectedMajor) return;
    // WizardContext에 targetMajor 설정
    dispatch({ type: 'SET_TARGET_MAJOR', payload: selectedMajor });
    dispatch({ type: 'SET_CAREER_GOAL', payload: selectedMajor.name });
    navigate('/school');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 cursor-pointer">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{selectedMajor ? '검색으로' : '홈'}</span>
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            <img src="/butterfly.svg" alt="학점나비" className="w-7 h-7" />
            <span className="text-lg font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
              학점나비
            </span>
          </button>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* 검색 화면 */}
        {!selectedMajor && !loading && (
          <div className="animate-fade-in-up">
            {/* 히어로 */}
            <div className="text-center pt-8 pb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-50 rounded-2xl mb-4">
                <Compass size={28} className="text-sky-primary" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                어떤 학과가 궁금하세요?
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                학과를 탐색하고 필요한 과목을 확인해보세요
              </p>
            </div>

            <MajorSearchPanel onSelect={handleSelectMajor} />
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div className="w-10 h-10 border-3 border-sky-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-4">학과 정보를 불러오고 있어요...</p>
          </div>
        )}

        {/* 에러 */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => { setError(''); setSelectedMajor(null); }}
              className="mt-3 text-sm text-sky-primary hover:underline cursor-pointer"
            >
              다시 검색하기
            </button>
          </div>
        )}

        {/* 학과 상세 */}
        {selectedMajor && !loading && !error && (
          <div className="animate-fade-in-up">
            {/* 학과명 + 뱃지 */}
            <div className="pt-6 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{selectedMajor.name}</h1>
                {selectedMajor.category && (
                  <Badge color="sky">{selectedMajor.category}</Badge>
                )}
              </div>
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
