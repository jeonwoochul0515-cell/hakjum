import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'sky' | 'indigo' | 'amber' | 'red' | 'green' | 'gray' | 'orange';
  className?: string;
}

const colorMap = {
  sky: 'bg-sky-100 text-sky-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-700',
};

export function Badge({ children, color = 'sky', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
}
