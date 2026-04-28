import type { EnrollmentInfo, UniversityStats, AcademyInfo } from '@/lib/university-api';

export interface School {
  id: string;
  name: string;
  type: string;
  totalRecords: number;
  subjectsByGrade: Record<string, string[]>;
  allSubjects: string[];
  gradeDataYear?: Record<string, string>;  // 학년별 데이터 기준 연도
  shlIdfCd?: string;        // 학교알리미 학교 식별 UUID (정보공시 페이지 URL용)
  homepageUrl?: string;     // 학교 자체 홈페이지 (학교알리미 HMPG_ADRES)
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
  /** 분야별 관심도 점수 (0~100). tags 토글과 호환되는 보조 필드.
   *  Gottfredson 절충 모형: 단정적 진로 결정 대신 관심도를 점진적으로 좁힘. */
  tagInterests: Record<string, number>;
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
  | { type: 'SET_TAG_INTEREST_LEVEL'; payload: { tag: string; level: number } }
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
  /** 학교 컨텍스트 기반 — 학생 학교에서 이 학과를 준비할 수 있는 정도 (0-100) */
  schoolFitScore?: number;
  /** 학교에 개설되어 학과 준비에 활용 가능한 과목 (최대 3개) */
  schoolMatchedSubjects?: string[];
  /** 학교에 미개설된, 학과가 요구하는 핵심 과목 */
  schoolMissingSubjects?: string[];
}

export interface AIExploreResult {
  recommendations: AIExploreRecommendation[];
  summary: string;
  source: 'ai' | 'fallback';
  /** 추천에 사용된 학교명 (출처 표시용) */
  schoolContextName?: string;
}
