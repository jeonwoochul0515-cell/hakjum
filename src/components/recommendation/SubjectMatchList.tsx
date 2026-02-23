import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { SubjectMatch } from '@/types';

interface SubjectMatchListProps {
  matches: SubjectMatch[];
}

const statusConfig = {
  available: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-500',
    textColor: 'text-green-800',
    label: '개설됨',
  },
  missing: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    textColor: 'text-red-800',
    label: '미개설',
  },
  similar: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-800',
    label: '유사과목',
  },
};

export function SubjectMatchList({ matches }: SubjectMatchListProps) {
  const available = matches.filter((m) => m.status === 'available');
  const similar = matches.filter((m) => m.status === 'similar');
  const missing = matches.filter((m) => m.status === 'missing');

  return (
    <div className="bg-white rounded-2xl p-4 border border-indigo-200">
      <h3 className="font-bold text-sm text-indigo-800 mb-3">
        학과 요구과목 vs 내 학교 개설과목
      </h3>

      <div className="flex gap-3 mb-3 text-xs">
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle size={12} /> 개설 {available.length}
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <AlertTriangle size={12} /> 유사 {similar.length}
        </span>
        <span className="flex items-center gap-1 text-red-600">
          <XCircle size={12} /> 미개설 {missing.length}
        </span>
      </div>

      <div className="space-y-2">
        {matches.map((match) => {
          const config = statusConfig[match.status];
          const Icon = config.icon;
          return (
            <div
              key={match.subject}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl ${config.bg} border ${config.border}`}
            >
              <Icon size={16} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${config.textColor}`}>{match.subject}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.iconColor} font-medium border ${config.border}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{match.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
