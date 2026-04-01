import { MapPin, Users } from 'lucide-react';
import type { UnivMatchSection } from '@/types/report';

interface Props {
  data: UnivMatchSection;
  isPaid: boolean;
}

const difficultyConfig = {
  high: { label: '높음', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  medium: { label: '보통', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  low: { label: '낮음', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

export function UniversityMatchSection({ data, isPaid }: Props) {
  const FREE_LIMIT = 3;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin size={14} className="text-sky-500" />
        <h3 className="text-sm font-bold text-slate-700">
          대학 매칭 결과
          <span className="ml-2 text-xs font-normal text-slate-400">
            {data.matches.length}개교
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {data.matches.map((match, idx) => {
          const isBlurred = !isPaid && idx >= FREE_LIMIT;
          const diff = difficultyConfig[match.difficulty];

          return (
            <div key={`${match.universityName}-${match.majorName}`} className={isBlurred ? 'relative' : ''}>
              <div
                className={`bg-slate-50 rounded-lg p-3 ${
                  isBlurred ? 'blur-sm pointer-events-none select-none' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-700">{match.universityName}</p>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${diff.bg} ${diff.text} ${diff.border}`}
                  >
                    난이도 {diff.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1.5">{match.majorName}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {match.region}
                  </span>
                  {match.competitionRate != null && (
                    <span className="flex items-center gap-1">
                      <Users size={10} />
                      {match.competitionRate}:1
                    </span>
                  )}
                  {match.cutline != null && (
                    <span>커트라인 {match.cutline}등급</span>
                  )}
                </div>
              </div>

              {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                  <p className="text-sm font-medium text-slate-500">전체 보고서에서 확인하세요</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
