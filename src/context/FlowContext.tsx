import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { FlowState, FlowAction, FlowStep } from '@/types';

const STORAGE_KEY = 'hakjum-flow';

const initialState: FlowState = {
  currentStep: 'school-select',
  stepHistory: [],
  school: null,
  grade: '',
  interest: '',
  tags: [],
  aptitudeResult: null,
  aptitudeGender: '',
  exploreResult: null,
  selectedMajor: null,
  enrollment: [],
  universityStats: [],
  selectedUniversity: null,
  academyInfo: null,
  recommendationResult: null,
};

// Only persist user-input fields, not transient API results
const PERSIST_KEYS: (keyof FlowState)[] = [
  'currentStep',
  'stepHistory',
  'school',
  'grade',
  'interest',
  'tags',
];

function loadFromStorage(): Partial<FlowState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: FlowState) {
  try {
    const partial: Record<string, unknown> = {};
    for (const key of PERSIST_KEYS) {
      partial[key] = state[key];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
  } catch { /* ignore */ }
}

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'GO': {
      const nextStep: FlowStep = action.payload;
      return {
        ...state,
        stepHistory: [...state.stepHistory, state.currentStep],
        currentStep: nextStep,
      };
    }
    case 'BACK': {
      if (state.stepHistory.length === 0) return state;
      const history = [...state.stepHistory];
      const prevStep = history.pop()!;
      return { ...state, stepHistory: history, currentStep: prevStep };
    }
    case 'SET_SCHOOL':
      return { ...state, school: action.payload };
    case 'SET_GRADE':
      return { ...state, grade: action.payload };
    case 'SET_INTEREST':
      return { ...state, interest: action.payload };
    case 'TOGGLE_TAG': {
      const tag = action.payload;
      const tags = state.tags.includes(tag)
        ? state.tags.filter((t) => t !== tag)
        : [...state.tags, tag];
      return { ...state, tags };
    }
    case 'SET_EXPLORE_RESULT':
      return { ...state, exploreResult: action.payload };
    case 'SET_SELECTED_MAJOR':
      return { ...state, selectedMajor: action.payload, enrollment: [], universityStats: [], selectedUniversity: null, academyInfo: null, recommendationResult: null };
    case 'SET_ENROLLMENT':
      return { ...state, enrollment: action.payload };
    case 'SET_UNIVERSITY_STATS':
      return { ...state, universityStats: action.payload };
    case 'SET_SELECTED_UNIVERSITY':
      return { ...state, selectedUniversity: action.payload, academyInfo: null };
    case 'SET_ACADEMY_INFO':
      return { ...state, academyInfo: action.payload };
    case 'SET_APTITUDE_RESULT':
      return { ...state, aptitudeResult: action.payload };
    case 'SET_APTITUDE_GENDER':
      return { ...state, aptitudeGender: action.payload };
    case 'SET_RECOMMENDATION':
      return { ...state, recommendationResult: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface FlowContextType {
  state: FlowState;
  dispatch: React.Dispatch<FlowAction>;
}

const FlowContext = createContext<FlowContextType | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flowReducer, initialState, () => {
    const saved = loadFromStorage();
    if (!saved) return initialState;
    const merged = { ...initialState, ...saved };

    // API 결과가 필요한 step인데 데이터가 없으면 안전한 step으로 복원
    const dataRequired: Partial<Record<FlowStep, keyof FlowState>> = {
      'major-results': 'exploreResult',
      'major-detail': 'selectedMajor',
      'university-list': 'selectedMajor',
      'university-detail': 'selectedUniversity',
      'subject-match': 'recommendationResult',
      'ai-loading': 'exploreResult',
    };
    const requiredField = dataRequired[merged.currentStep as FlowStep];
    if (requiredField && !merged[requiredField]) {
      const safeStep: FlowStep = merged.school ? 'interest-input' : 'school-select';
      return { ...merged, currentStep: safeStep, stepHistory: [] };
    }

    return merged;
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return (
    <FlowContext.Provider value={{ state, dispatch }}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlowContext() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlowContext must be used within FlowProvider');
  return ctx;
}
