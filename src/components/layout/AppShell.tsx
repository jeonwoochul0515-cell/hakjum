import type { ReactNode } from 'react';
import { Header } from './Header';
import { StepIndicator } from './StepIndicator';

interface AppShellProps {
  children: ReactNode;
  step?: number;
}

export function AppShell({ children, step }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-lg mx-auto px-4 pb-8">
        {step && <StepIndicator currentStep={step} />}
        {children}
      </main>
    </div>
  );
}
