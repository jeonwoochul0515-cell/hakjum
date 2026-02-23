import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { WizardState, WizardAction } from '@/types';

const initialState: WizardState = {
  school: null,
  grade: '',
  careerGoal: '',
  tags: [],
};

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
    case 'RESET':
      return initialState;
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
  const [state, dispatch] = useReducer(wizardReducer, initialState);
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
