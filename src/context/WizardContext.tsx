import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { WizardState, WizardAction } from '@/types';

const STORAGE_KEY = 'hakjum-wizard';

const initialState: WizardState = {
  school: null,
  grade: '',
  careerGoal: '',
  tags: [],
  targetMajor: null,
  checkedSubjects: [],
  lastResult: null,
  aptitudeResult: null,
};

function loadFromStorage(): Partial<WizardState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: WizardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_SCHOOL':
      return { ...state, school: action.payload };
    case 'SET_GRADE':
      return { ...state, grade: action.payload };
    case 'SET_CAREER_GOAL':
      return { ...state, careerGoal: action.payload };
    case 'TOGGLE_TAG': {
      const tag = action.payload;
      const tags = state.tags.includes(tag)
        ? state.tags.filter((t) => t !== tag)
        : [...state.tags, tag];
      return { ...state, tags };
    }
    case 'SET_TARGET_MAJOR':
      return { ...state, targetMajor: action.payload };
    case 'TOGGLE_CHECKED_SUBJECT': {
      const subj = action.payload;
      const checkedSubjects = state.checkedSubjects.includes(subj)
        ? state.checkedSubjects.filter((s) => s !== subj)
        : [...state.checkedSubjects, subj];
      return { ...state, checkedSubjects };
    }
    case 'SAVE_RESULT':
      return { ...state, lastResult: action.payload };
    case 'HYDRATE':
      return { ...state, ...action.payload };
    case 'RESET':
      return { ...initialState, lastResult: state.lastResult };
    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState, () => {
    const saved = loadFromStorage();
    return saved ? { ...initialState, ...saved } : initialState;
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
