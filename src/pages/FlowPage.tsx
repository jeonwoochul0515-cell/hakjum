import { FlowHeader } from '@/components/flow/FlowHeader';
import { SchoolSelectStep } from '@/components/flow/SchoolSelectStep';
import { AptitudeIntroStep } from '@/components/flow/AptitudeIntroStep';
import { AptitudeTestStep } from '@/components/flow/AptitudeTestStep';
import { AptitudeResultStep } from '@/components/flow/AptitudeResultStep';
import { InterestInputStep } from '@/components/flow/InterestInputStep';
import { MajorResultsStep } from '@/components/flow/MajorResultsStep';
import { MajorDetailStep } from '@/components/flow/MajorDetailStep';
import { UniversityListStep } from '@/components/flow/UniversityListStep';
import { UniversityDetailStep } from '@/components/flow/UniversityDetailStep';
import { SubjectMatchStep } from '@/components/flow/SubjectMatchStep';
import { AILoadingState } from '@/components/explore/AILoadingState';
import { useFlowContext } from '@/context/FlowContext';

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  'school-select': SchoolSelectStep,
  'aptitude-intro': AptitudeIntroStep,
  'aptitude-test': AptitudeTestStep,
  'aptitude-result': AptitudeResultStep,
  'interest-input': InterestInputStep,
  'ai-loading': AILoadingState,
  'major-results': MajorResultsStep,
  'major-detail': MajorDetailStep,
  'university-list': UniversityListStep,
  'university-detail': UniversityDetailStep,
  'subject-match': SubjectMatchStep,
};

export default function FlowPage() {
  const { state } = useFlowContext();
  const StepComponent = STEP_COMPONENTS[state.currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <FlowHeader />
      <div className="max-w-lg mx-auto px-4 pb-8 pb-safe">
        {StepComponent ? <StepComponent /> : null}
      </div>
    </div>
  );
}
