import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GradeSelector } from '@/components/career/GradeSelector';
import { CareerInput } from '@/components/career/CareerInput';
import { QuickTag } from '@/components/career/QuickTag';
import { MajorSelector } from '@/components/major/MajorSelector';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWizard } from '@/context/WizardContext';

const tagLabels: Record<string, string> = {
  '이공계열': '과학·탐구',
  'IT/SW': 'IT·코딩',
  '의약계열': '의약·건강',
  '인문계열': '인문·언어',
  '경영/경제': '경영·경제',
  '예체능계열': '예술·디자인',
  '체육/스포츠': '체육·스포츠',
  '교육계열': '교육',
  '사회계열': '법·사회',
  '자연과학': '자연·환경',
};

export default function CareerInputPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useWizard();
  const [step, setStep] = useState(1); // progressive disclosure: 1=grade, 2=interest, 3=detail, 4=major

  if (!state.school) {
    return <Navigate to="/school" replace />;
  }

  const canProceed = state.grade && (state.careerGoal.trim() || state.tags.length > 0);

  // Feedback message based on selection
  const feedbackMsg = useMemo(() => {
    if (state.tags.length === 0) return null;
    const labels = state.tags.map(t => tagLabels[t] || t).join(' + ');
    const suggestions: Record<string, string> = {
      'IT/SW': '컴퓨터공학, 데이터사이언스',
      '의약계열': '의학, 간호학, 약학',
      '이공계열': '자연과학, 공학',
      '경영/경제': '경영학, 경제학',
      '인문계열': '국문학, 영문학, 사학',
      '사회계열': '법학, 행정학, 사회학',
    };
    const firstTag = state.tags[0];
    const suggestion = suggestions[firstTag];
    if (suggestion) {
      return `${labels}을(를) 선택하셨네요! ${suggestion} 쪽이 잘 맞을 수 있어요`;
    }
    return `${labels}을(를) 선택하셨네요! 맞춤 과목을 찾아드릴게요`;
  }, [state.tags]);

  return (
    <AppShell step={2}>
      <div className="space-y-6">
        <div>
          <button onClick={() => navigate('/school')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 cursor-pointer">
            <ArrowLeft size={16} /> 학교 다시 선택
          </button>
          <h1 className="text-xl font-bold text-slate-800">어떤 꿈을 꾸고 있나요?</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="sky">{state.school.name}</Badge>
          </div>
        </div>

        {/* Step 1: Grade */}
        <div className="animate-fade-in-up">
          <GradeSelector
            value={state.grade}
            onChange={(g) => {
              dispatch({ type: 'SET_GRADE', payload: g });
              if (step < 2) setStep(2);
            }}
          />
        </div>

        {/* Step 2: Interest tags */}
        {step >= 2 && (
          <div className="animate-fade-in-up">
            <QuickTag
              tags={state.tags}
              selected={state.tags}
              onToggle={(tag) => {
                dispatch({ type: 'TOGGLE_TAG', payload: tag });
                if (step < 3) setStep(3);
              }}
            />
            {/* Real-time feedback */}
            {feedbackMsg && (
              <div className="mt-3 bg-indigo-50 rounded-xl p-3 border border-indigo-100 animate-fade-in-up">
                <p className="text-sm text-indigo-700">{feedbackMsg}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Career goal text */}
        {step >= 3 && (
          <div className="animate-fade-in-up">
            <CareerInput
              value={state.careerGoal}
              onChange={(v) => {
                dispatch({ type: 'SET_CAREER_GOAL', payload: v });
                if (step < 4) setStep(4);
              }}
            />
          </div>
        )}

        {/* Step 4: Major selector */}
        {step >= 4 && (
          <div className="animate-fade-in-up">
            <MajorSelector
              selected={state.targetMajor}
              onSelect={(major) => dispatch({ type: 'SET_TARGET_MAJOR', payload: major })}
            />
          </div>
        )}

        {/* Personalized CTA */}
        <Button
          size="lg"
          className="w-full"
          disabled={!canProceed}
          onClick={() => navigate('/recommendation')}
        >
          <Sparkles size={18} className="mr-2" />
          {canProceed ? (
            <>
              AI가 {state.school.name} {state.school.allSubjects.length}개 과목을 분석합니다
              <ArrowRight size={18} className="ml-2" />
            </>
          ) : (
            '학년과 관심분야를 선택해주세요'
          )}
        </Button>
      </div>
    </AppShell>
  );
}
