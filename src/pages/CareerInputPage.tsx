import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GradeSelector } from '@/components/career/GradeSelector';
import { CareerInput } from '@/components/career/CareerInput';
import { QuickTag } from '@/components/career/QuickTag';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWizard } from '@/context/WizardContext';

export default function CareerInputPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useWizard();

  if (!state.school) {
    return <Navigate to="/school" replace />;
  }

  const canProceed = state.grade && (state.careerGoal.trim() || state.tags.length > 0);

  return (
    <AppShell step={2}>
      <div className="space-y-6">
        <div>
          <button onClick={() => navigate('/school')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 cursor-pointer">
            <ArrowLeft size={16} /> 학교 다시 선택
          </button>
          <h1 className="text-xl font-bold text-slate-800">진로를 알려주세요</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="sky">{state.school.name}</Badge>
          </div>
        </div>

        <GradeSelector
          value={state.grade}
          onChange={(g) => dispatch({ type: 'SET_GRADE', payload: g })}
        />

        <CareerInput
          value={state.careerGoal}
          onChange={(v) => dispatch({ type: 'SET_CAREER_GOAL', payload: v })}
        />

        <QuickTag
          tags={state.tags}
          selected={state.tags}
          onToggle={(tag) => dispatch({ type: 'TOGGLE_TAG', payload: tag })}
        />

        <Button
          size="lg"
          className="w-full"
          disabled={!canProceed}
          onClick={() => navigate('/recommendation')}
        >
          <Sparkles size={18} className="mr-2" />
          AI 추천 받기
        </Button>
      </div>
    </AppShell>
  );
}
