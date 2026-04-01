import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ReportState, ReportAction } from '@/types/report';

const initialState: ReportState = {
  currentStep: 'input',
  input: null,
  reportData: null,
  isPaid: false,
  error: null,
};

function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload, error: null };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_REPORT':
      return { ...state, reportData: action.payload, currentStep: 'preview' };
    case 'SET_PAID':
      return { ...state, isPaid: true, currentStep: 'full' };
    case 'SET_ERROR':
      return { ...state, error: action.payload, currentStep: 'input' };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface ReportContextType {
  state: ReportState;
  dispatch: React.Dispatch<ReportAction>;
}

const ReportContext = createContext<ReportContextType | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reportReducer, initialState);

  return (
    <ReportContext.Provider value={{ state, dispatch }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReportContext() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReportContext must be used within ReportProvider');
  return ctx;
}
