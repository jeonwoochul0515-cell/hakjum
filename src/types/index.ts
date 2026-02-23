export interface School {
  id: string;
  name: string;
  type: string;
  totalRecords: number;
  subjectsByGrade: Record<string, string[]>;
  allSubjects: string[];
}

export interface WizardState {
  school: School | null;
  grade: string;
  careerGoal: string;
  tags: string[];
}

export type WizardAction =
  | { type: 'SET_SCHOOL'; payload: School }
  | { type: 'SET_GRADE'; payload: string }
  | { type: 'SET_CAREER_GOAL'; payload: string }
  | { type: 'TOGGLE_TAG'; payload: string }
  | { type: 'RESET' };

export interface SubjectRecommendation {
  name: string;
  reason: string;
}

export interface TierRecommendation {
  tier: 'essential' | 'strongly_recommended' | 'consider' | 'optional';
  label: string;
  subjects: SubjectRecommendation[];
}

export interface RecommendationResult {
  tiers: TierRecommendation[];
  strategy: string;
  source: 'ai' | 'fallback';
}
