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
import {
  usePageMeta,
  buildMajorDescription,
  jsonLdMajor,
  jsonLdBreadcrumb,
  SITE_SEO,
} from '@/lib/seo';

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

  const major = state.selectedMajor;
  const onMajorStep =
    state.currentStep === 'major-detail' ||
    state.currentStep === 'university-list' ||
    state.currentStep === 'subject-match';

  const meta = (() => {
    if (onMajorStep && major) {
      const desc = buildMajorDescription({
        majorName: major.name,
        category: major.category,
        schoolCount: major.universities?.length,
        relatedJobs: major.relatedJobDetails?.map((j) => j.name) ?? [],
      });
      return {
        title: `${major.name} 추천 - 학점나비`,
        description: desc,
        canonicalPath: '/flow',
        keywords: [
          `${major.name} 추천`,
          `${major.name} 진로`,
          major.category ?? '',
          '고교학점제',
          '학과 추천',
        ].filter(Boolean),
        jsonLd: [
          jsonLdMajor({
            majorName: major.name,
            category: major.category,
            description: desc,
            url: `${SITE_SEO.url}/flow`,
            relatedJobs: major.relatedJobDetails?.map((j) => j.name) ?? [],
            schoolCount: major.universities?.length,
          }),
          jsonLdBreadcrumb([
            { name: '홈', path: '/' },
            { name: '학과 추천', path: '/flow' },
            { name: major.name, path: '/flow' },
          ]),
        ],
      };
    }
    return {
      title: '학과·과목 추천 받기 - 학점나비',
      description:
        '관심사·적성검사 기반 AI 학과 추천. 내 학교에 개설된 과목 위주로 학기별 이수 로드맵까지 30초 만에 받아보세요.',
      canonicalPath: '/flow',
      keywords: ['학과 추천', '진로 추천', '고교학점제', 'AI 학과 분석'],
    };
  })();

  usePageMeta(meta);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <FlowHeader />
      <div className="max-w-lg mx-auto px-4 pb-8 pb-safe">
        {StepComponent ? <StepComponent /> : null}
      </div>
    </div>
  );
}
