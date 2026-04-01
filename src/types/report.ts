import type { School } from '@/types';

// ── 보고서 입력 ──

export interface ReportInput {
  school: School;
  grade: string;
  interest: string;
  tags: string[];
  targetUniversities: string[];
}

// ── 보고서 섹션 타입 ──

export interface ProfileSection {
  schoolName: string;
  schoolType: string;
  grade: string;
  interest: string;
  tags: string[];
  targetUniversities: string[];
  totalSubjects: number;
}

export interface MajorRecommendation {
  rank: number;
  name: string;
  category: string;
  matchScore: number;
  reason: string;
  relatedJobs: string[];
}

export interface MajorTop10Section {
  recommendations: MajorRecommendation[];
}

export interface MajorDetailItem {
  name: string;
  category: string;
  description: string;
  curriculum: string[];
  careerPaths: string[];
  aiReason: string;
}

export interface MajorDetailSection {
  details: MajorDetailItem[];
}

export interface UniversityMatchItem {
  universityName: string;
  majorName: string;
  region: string;
  difficulty: 'high' | 'medium' | 'low';
  competitionRate?: number;
  cutline?: number;
}

export interface UnivMatchSection {
  matches: UniversityMatchItem[];
}

export interface AdmissionStrategySection {
  earlyAdmission: string;
  regularAdmission: string;
  recommendedType: string;
  detailByUniversity: {
    university: string;
    strategy: string;
  }[];
}

export interface FulfillmentItem {
  university: string;
  major: string;
  fulfillmentRate: number;
  met: string[];
  unmet: string[];
  recommended: string[];
}

export interface FulfillmentSection {
  items: FulfillmentItem[];
  overallRate: number;
}

export interface SubjectTier {
  tier: 'essential' | 'strongly_recommended' | 'consider' | 'optional';
  label: string;
  subjects: { name: string; reason: string }[];
}

export interface SubjectTieringSection {
  tiers: SubjectTier[];
  strategy: string;
}

export interface RoadmapYear {
  year: string;
  semester1: string[];
  semester2: string[];
  note: string;
}

export interface RoadmapSection {
  roadmap: RoadmapYear[];
  summary: string;
}

export interface CompetitionSection {
  data: {
    university: string;
    major: string;
    admissionType: string;
    competitionRate: number;
    cutlineAvg: number;
    trend: string;
  }[];
}

export interface ActionPlanSection {
  summary: string;
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
}

// ── 보고서 전체 ──

export interface ReportData {
  id: string;
  createdAt: string;
  input: ReportInput;
  sections: {
    profile: ProfileSection;
    majorTop10: MajorTop10Section;
    majorDetail: MajorDetailSection;
    universityMatch: UnivMatchSection;
    admissionStrategy: AdmissionStrategySection;
    fulfillmentRate: FulfillmentSection;
    subjectTiering: SubjectTieringSection;
    roadmap: RoadmapSection;
    competition: CompetitionSection;
    actionPlan: ActionPlanSection;
  };
  isPaid: boolean;
}

// ── 보고서 플로우 상태 ──

export type ReportStep = 'input' | 'loading' | 'preview' | 'full';

export interface ReportState {
  currentStep: ReportStep;
  input: ReportInput | null;
  reportData: ReportData | null;
  isPaid: boolean;
  error: string | null;
}

export type ReportAction =
  | { type: 'SET_INPUT'; payload: ReportInput }
  | { type: 'SET_STEP'; payload: ReportStep }
  | { type: 'SET_REPORT'; payload: ReportData }
  | { type: 'SET_PAID' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };
