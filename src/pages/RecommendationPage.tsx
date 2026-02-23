import { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingAnimation } from '@/components/recommendation/LoadingAnimation';
import { SubjectTier } from '@/components/recommendation/SubjectTier';
import { StrategySummary } from '@/components/recommendation/StrategySummary';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWizard } from '@/context/WizardContext';
import { useRecommendation } from '@/hooks/useRecommendation';

export default function RecommendationPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useWizard();
  const { result, loading, error, recommend } = useRecommendation();

  useEffect(() => {
    if (state.school && state.grade) {
      recommend(state);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state.school) return <Navigate to="/school" replace />;
  if (!state.grade) return <Navigate to="/career" replace />;

  return (
    <AppShell step={3}>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI 추천 결과</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge color="sky">{state.school.name}</Badge>
            <Badge color="indigo">{state.grade}</Badge>
            {state.tags.map((tag) => (
              <Badge key={tag} color="amber">{tag}</Badge>
            ))}
          </div>
          {state.careerGoal && (
            <p className="text-sm text-slate-500 mt-2">"{state.careerGoal}"</p>
          )}
        </div>

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
            {result.source === 'ai' && (
              <Badge color="indigo">AI 맞춤 추천</Badge>
            )}
            {result.source === 'fallback' && (
              <Badge color="amber">키워드 기반 추천</Badge>
            )}

            <div className="space-y-3">
              {result.tiers.map((tier) => (
                <SubjectTier key={tier.tier} tier={tier} />
              ))}
            </div>

            <StrategySummary strategy={result.strategy} source={result.source} />
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => {
              dispatch({ type: 'RESET' });
              navigate('/');
            }}
          >
            <RotateCcw size={16} className="mr-2" />
            처음부터
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => navigate('/career')}
          >
            다시 선택하기
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
