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

// ── 인사이트 보강 데이터 (2026-04 추가) ──

/** A. 학교 규모 인사이트 — Profile 섹션 보강 */
export interface SchoolInsight {
  size: 'large' | 'medium' | 'small' | 'tiny';
  label: string;            // 예: "대형 학교"
  studentCount?: number;    // 학생 수
  classCount?: number;
  avgPerClass?: number;
  /** 전국 분포에서 같은 규모대 비율 (%) */
  distributionPct: number;
  /** 학교 규모에 맞는 권장사항 */
  recommendation: string;
  diversityHint: string;
}

/** B. 도전·적정·안전 매트릭스 — TOP 10 또는 대학 매칭 */
export interface TierMatrix {
  challenge: { name: string; rank: number; matchScore: number }[];
  fit: { name: string; rank: number; matchScore: number }[];
  safe: { name: string; rank: number; matchScore: number }[];
  /** 한 줄 요약 */
  summary: string;
}

/** C. 학교 적합도 (학과별) — MajorDetail 또는 SubjectTiering 보강 */
export interface SchoolFitItem {
  majorName: string;
  /** 0-100 학교 적합도 */
  schoolFitScore: number;
  matched: string[];
  missing: string[];
}
export interface SchoolFitSection {
  items: SchoolFitItem[];
  /** 평균 적합도 */
  avgScore: number;
}

/** D. 부산 학생 특화 정보 — 조건부 노출 */
export interface BusanInsight {
  isBusan: boolean;
  matchedLocation?: string;
  jointCurriculumSchools: { name: string; location?: string; role: string }[];
  guides: { topic: string; content: string }[];
}

/** E. KCUE 통계 — Competition 섹션 보강 */
export interface KcueStatItem {
  majorName: string;
  schoolCount: number;
  /** 학과 평균 정원 */
  quotaAvg: number;
  /** 평균 등록금 (원) */
  tuitionAvgWon: number;
  /** 대학당 장학금 평균 */
  scholarshipAvgPerUniv: number;
}
export interface KcueStatsSection {
  items: KcueStatItem[];
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
    /** 학교 규모 인사이트 (없을 수도 있음) */
    schoolInsight?: SchoolInsight;
    /** 도전·적정·안전 매트릭스 */
    tierMatrix?: TierMatrix;
    /** 학교 적합도 (학과별) */
    schoolFit?: SchoolFitSection;
    /** 부산 학생 특화 (비부산은 isBusan=false) */
    busanInsight?: BusanInsight;
    /** KCUE 학과 통계 (정원/등록금/장학금) */
    kcueStats?: KcueStatsSection;
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
