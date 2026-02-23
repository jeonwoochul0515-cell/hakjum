import type { SubjectRecommendation } from '@/types';

interface SubjectCardProps {
  subject: SubjectRecommendation;
  tierColor: string;
}

export function SubjectCard({ subject, tierColor }: SubjectCardProps) {
  return (
    <div className={`p-3 rounded-xl bg-white border ${tierColor} transition-all hover:shadow-sm`}>
      <h4 className="font-semibold text-slate-800 text-sm">{subject.name}</h4>
      <p className="text-xs text-slate-500 mt-1">{subject.reason}</p>
    </div>
  );
}
