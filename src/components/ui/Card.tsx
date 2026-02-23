import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  selected?: boolean;
}

export function Card({ children, hover = false, selected = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border ${selected ? 'border-sky-primary ring-2 ring-sky-primary/20' : 'border-slate-200'} ${hover ? 'hover:shadow-md hover:border-slate-300 cursor-pointer transition-all duration-200' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
