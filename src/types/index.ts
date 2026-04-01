import type { EnrollmentInfo, UniversityStats, AcademyInfo } from '@/lib/university-api';

export interface School {
  id: string;
  name: string;
  type: string;
  totalRecords: number;
  subjectsByGrade: Record<string, string[]>;
  allSubjects: string[];
  gradeDataYear?: Record<string, string>;  // 학년별 데이터 기준 연도
}

export interface University {
  name: string;
  area: string; // 부산, 서울 등
}

export interface Major {
  id: string;
  name: string;
  category: string; // 공학계열, 인문계열 등
  relateSubject: {
    common: string;       // 공통과목
    general: string;      // 일반선택과목
    career: string;       // 진로선택과목
    professional: string; // 전문교과Ⅰ
  };
  universities: University[];
  jobs: string;
  qualifications: string;
}

export interface UniversityFull extends University {
  schoolURL: string;
  majorName: string;
}

export interface MajorFull extends Major {
  summary: string;
  property: string;
  interest: string;
  mainSubjects: { name: string; desc: string }[];
  employmentRate: string;
  salary: string;
  admissionInfo: string;
  postGraduation: string;
  enterField: string;
  careerActivities: { name: string; desc: string }[];
  universitiesFull: UniversityFull[];
  relatedJobDetails: { name: string; desc: string }[];
  relatedQualifiDetails: { name: string; desc: string }[];
}

/** Used by buildPrompt/fallbackRecommend as input shape */
export interface WizardState {
  school: School | null;
  grade: string;
  careerGoal: string;
  tags: string[];
  targetMajor: Major | null;
  aptitudeResult: AptitudeResult | null;
  admissionResults?: AdmissionResult[];
}

export interface SubjectRecommendation {
  name: string;
  reason: string;
}

export interface TierRecommendation {
  tier: 'essential' | 'strongly_recommended' | 'consider' | 'optional';
  label: string;
  subjects: SubjectRecommendation[];
}

export interface SubjectMatch {
  subject: string;
  status: 'available' | 'missing' | 'similar';
  note: string;
}

export interface AdmissionInfo {
  earlyAdmission: string;  // 수시 전략
  regularAdmission: string; // 정시 전략
  relatedCerts: string;    // 관련 자격증
  relatedJobs: string;     // 관련 직업
}

export interface RecommendationResult {
  tiers: TierRecommendation[];
  strategy: string;
  source: 'ai' | 'fallback';
  subjectMatches?: SubjectMatch[];
  admissionInfo?: AdmissionInfo;
}

export interface ShareableResult {
  schoolName: string;
  grade: string;
  careerGoal: string;
  tags: string[];
  majorName?: string;
  matchRate: number;
  topSubjects: string[];
  timestamp: number;
}

// ── 입시결과 ──

export interface AdmissionResult {
  university: string;
  major: string;
  year: number;
  admissionType: string; // "학생부교과" | "학생부종합" | "논술" | "정시"
  period: 'susi' | 'jeongsi';
  recruited: number;
  applied: number;
  competitionRate: number;
  cutline: {
    avg: number;
    percentile70: number;
    min: number;
  };
  supplementaryOrder: number | null;
}

// ── 적성검사 ──

export interface AptitudeQuestion {
  questionNo: number;
  question: string;
  answers: { answerNo: number; answer: string }[];
}

export interface AptitudeResult {
  url: string;
  inspctSeq: string;
}

// ── 통합 플로우 ──

export type FlowStep =
  | 'school-select'
  | 'aptitude-intro'
  | 'aptitude-test'
  | 'aptitude-result'
  | 'interest-input'
  | 'ai-loading'
  | 'major-results'
  | 'major-detail'
  | 'university-list'
  | 'university-detail'
  | 'subject-match';

export interface FlowState {
  currentStep: FlowStep;
  stepHistory: FlowStep[];
  school: School | null;
  grade: string;
  interest: string;
  tags: string[];
  aptitudeResult: AptitudeResult | null;
  aptitudeGender: string;
  exploreResult: AIExploreResult | null;
  selectedMajor: MajorFull | null;
  enrollment: EnrollmentInfo[];
  universityStats: UniversityStats[];
  selectedUniversity: UniversityFull | null;
  academyInfo: AcademyInfo | null;
  admissionResults: AdmissionResult[] | null;
  recommendationResult: RecommendationResult | null;
}

export type FlowAction =
  | { type: 'GO'; payload: FlowStep }
  | { type: 'BACK' }
  | { type: 'SET_SCHOOL'; payload: School }
  | { type: 'SET_GRADE'; payload: string }
  | { type: 'SET_INTEREST'; payload: string }
  | { type: 'TOGGLE_TAG'; payload: string }
  | { type: 'SET_APTITUDE_RESULT'; payload: AptitudeResult }
  | { type: 'SET_APTITUDE_GENDER'; payload: string }
  | { type: 'SET_EXPLORE_RESULT'; payload: AIExploreResult }
  | { type: 'SET_SELECTED_MAJOR'; payload: MajorFull }
  | { type: 'SET_ENROLLMENT'; payload: EnrollmentInfo[] }
  | { type: 'SET_UNIVERSITY_STATS'; payload: UniversityStats[] }
  | { type: 'SET_SELECTED_UNIVERSITY'; payload: UniversityFull }
  | { type: 'SET_ACADEMY_INFO'; payload: AcademyInfo }
  | { type: 'SET_ADMISSION_RESULTS'; payload: AdmissionResult[] }
  | { type: 'SET_RECOMMENDATION'; payload: RecommendationResult }
  | { type: 'RESET' };

// AI 학과 탐색 추천 결과
export interface AIExploreRecommendation {
  majorName: string;
  majorId?: string;
  category: string;
  reason: string;
  universities: { name: string; area: string }[];
  relatedJobs: string[];
  matchScore: number; // 0-100
}

export interface AIExploreResult {
  recommendations: AIExploreRecommendation[];
  summary: string;
  source: 'ai' | 'fallback';
}
