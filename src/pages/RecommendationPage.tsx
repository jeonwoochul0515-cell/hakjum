import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { RotateCcw, AlertCircle, Share2, ArrowRight, PartyPopper } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingAnimation } from '@/components/recommendation/LoadingAnimation';
import { SubjectTier } from '@/components/recommendation/SubjectTier';
import { SubjectMatchList } from '@/components/recommendation/SubjectMatchList';
import { AdmissionStrategy } from '@/components/recommendation/AdmissionStrategy';
import { StrategySummary } from '@/components/recommendation/StrategySummary';
import { ShareSection } from '@/components/recommendation/ShareSection';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWizard } from '@/context/WizardContext';
import { useRecommendation } from '@/hooks/useRecommendation';

function MatchRateCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="text-center animate-count-up">
      <div className="text-5xl font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
        {count}%
      </div>
      <p className="text-sm text-slate-500 mt-1">매칭률</p>
    </div>
  );
}

export default function RecommendationPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useWizard();
  const { result, loading, error, recommend } = useRecommendation();
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (state.school && state.grade) {
      recommend(state);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save result when available
  useEffect(() => {
    if (result) {
      dispatch({ type: 'SAVE_RESULT', payload: result });
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state.school) return <Navigate to="/school" replace />;
  if (!state.grade) return <Navigate to="/career" replace />;

  // Calculate match rate from subjectMatches
  const matchRate = useMemo(() => {
    if (!result?.subjectMatches || result.subjectMatches.length === 0) {
      // 폴백은 과목 수 기준으로 적당한 매칭률 계산
      if (!result) return 0;
      const essential = result.tiers.find(t => t.tier === 'essential')?.subjects.length || 0;
      const recommended = result.tiers.find(t => t.tier === 'strongly_recommended')?.subjects.length || 0;
      // essential 5개 + recommended 5개 = 최대 10 → 100%
      return Math.min(90, Math.round((essential + recommended * 0.7) * 10));
    }
    const available = result.subjectMatches.filter(m => m.status === 'available').length;
    const total = result.subjectMatches.length;
    return total > 0 ? Math.round((available / total) * 100) : 0;
  }, [result]);

  const topSubjects = useMemo(() => {
    if (!result) return [];
    return result.tiers
      .flatMap(t => t.subjects)
      .slice(0, 5)
      .map(s => s.name);
  }, [result]);

  const totalRecommended = useMemo(() => {
    if (!result) return 0;
    return result.tiers.reduce((sum, t) => sum + t.subjects.length, 0);
  }, [result]);

  return (
    <AppShell step={3}>
      <div className="space-y-4">
        {loading && <LoadingAnimation />}

        {error && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-red-800">추천 생성 실패</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <>
            {/* Result reveal header */}
            <div className="text-center py-4 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 text-2xl mb-2">
                <PartyPopper size={28} className="text-amber-primary" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                나만을 위한 맞춤 과목 조합이 완성됐어요!
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                {state.school.name} × {state.tags.length > 0 ? state.tags[0] : '선택 진로'} — {state.school.allSubjects.length}개 과목 중 {totalRecommended}개를 엄선했어요
              </p>
            </div>

            {/* Match rate */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <MatchRateCounter target={matchRate} />
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <Badge color="sky">{state.school.name}</Badge>
                <Badge color="indigo">{state.grade}</Badge>
                {state.targetMajor && (
                  <Badge color="green">{state.targetMajor.name}</Badge>
                )}
                {state.tags.map((tag) => (
                  <Badge key={tag} color="amber">{tag}</Badge>
                ))}
              </div>
              {state.careerGoal && (
                <p className="text-sm text-slate-500 mt-3 text-center">"{state.careerGoal}"</p>
              )}
            </div>

            {/* Source badge */}
            <div className="flex justify-center">
              {result.source === 'ai' && <Badge color="indigo">AI 맞춤 추천</Badge>}
              {result.source === 'fallback' && <Badge color="amber">키워드 기반 추천</Badge>}
            </div>

            {/* Tier recommendations */}
            <div className="space-y-3">
              {result.tiers.map((tier) => (
                <SubjectTier key={tier.tier} tier={tier} />
              ))}
            </div>

            {/* Subject match analysis */}
            {result.subjectMatches && result.subjectMatches.length > 0 && (
              <SubjectMatchList matches={result.subjectMatches} />
            )}

            {/* Admission strategy */}
            {result.admissionInfo && state.targetMajor && (
              <AdmissionStrategy
                info={result.admissionInfo}
                majorName={state.targetMajor.name}
              />
            )}

            {/* Strategy summary */}
            <StrategySummary strategy={result.strategy} source={result.source} />

            {/* Share section */}
            <div className="pt-2">
              <button
                onClick={() => setShowShare(!showShare)}
                className="flex items-center gap-2 text-sm font-medium text-sky-primary hover:text-sky-600 transition-colors cursor-pointer mx-auto"
              >
                <Share2 size={16} />
                {showShare ? '공유 닫기' : '결과 저장 & 공유하기'}
              </button>
            </div>

            {showShare && (
              <div className="animate-fade-in-up">
                <ShareSection
                  schoolName={state.school.name}
                  grade={state.grade}
                  tags={state.tags}
                  majorName={state.targetMajor?.name}
                  matchRate={matchRate}
                  topSubjects={topSubjects}
                />
              </div>
            )}

            {/* Bottom CTAs */}
            <div className="space-y-2 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate('/career')}
              >
                진로 바꿔서 다시 추천받기
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => {
                  dispatch({ type: 'RESET' });
                  navigate('/');
                }}
              >
                <RotateCcw size={16} className="mr-2" />
                다른 학교로 처음부터 하기
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
