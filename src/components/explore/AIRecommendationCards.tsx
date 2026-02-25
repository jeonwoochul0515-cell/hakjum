import { Sparkles, MapPin, Briefcase, ChevronRight, Star } from 'lucide-react';
import type { AIExploreResult } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface Props {
  result: AIExploreResult;
  loading: boolean;
  onSelectMajor: (majorName: string, category: string) => void;
}

const categoryColorMap: Record<string, 'sky' | 'indigo' | 'amber' | 'red' | 'green' | 'gray' | 'orange'> = {
  '공학계열': 'sky',
  '자연계열': 'green',
  '인문계열': 'indigo',
  '사회계열': 'orange',
  '교육계열': 'amber',
  '의약계열': 'red',
  '예체능계열': 'gray',
};

export function AIRecommendationCards({ result, loading, onSelectMajor }: Props) {
  return (
    <div className="animate-fade-in-up">
      {/* AI 분석 요약 */}
      {result.summary && (
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-4 mb-5 border border-sky-100">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-sky-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-sky-700 mb-1">AI 분석 결과</p>
              <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
            </div>
          </div>
          {result.source === 'fallback' && (
            <p className="text-xs text-slate-400 mt-2 ml-6">* 오프라인 추천 결과입니다</p>
          )}
        </div>
      )}

      {/* 추천 학과 카드 목록 */}
      <div className="space-y-3">
        {result.recommendations.map((rec, i) => (
          <button
            key={i}
            onClick={() => onSelectMajor(rec.majorName, rec.category)}
            disabled={loading}
            className="w-full text-left bg-white rounded-xl p-4 border border-slate-100 hover:border-sky-primary/30 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait group"
          >
            {/* 상단: 학과명 + 매칭 점수 */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-slate-800 text-base">{rec.majorName}</h3>
                  <Badge color={categoryColorMap[rec.category] || 'gray'}>{rec.category}</Badge>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{rec.reason}</p>
              </div>

              {/* 매칭 점수 */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke={rec.matchScore >= 80 ? '#0ea5e9' : rec.matchScore >= 60 ? '#6366f1' : '#94a3b8'}
                      strokeWidth="3"
                      strokeDasharray={`${(rec.matchScore / 100) * 125.6} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-slate-700">{rec.matchScore}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">적합도</span>
              </div>
            </div>

            {/* 대학 목록 (간략) */}
            {rec.universities.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                {rec.universities.slice(0, 4).map((u, j) => (
                  <span
                    key={j}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      u.area === '부산' ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {u.name}
                  </span>
                ))}
                {rec.universities.length > 4 && (
                  <span className="text-xs text-slate-400">+{rec.universities.length - 4}</span>
                )}
              </div>
            )}

            {/* 관련 직업 */}
            {rec.relatedJobs.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <Briefcase size={12} className="text-slate-400 flex-shrink-0" />
                {rec.relatedJobs.slice(0, 3).map((job, j) => (
                  <span key={j} className="text-xs text-slate-500">{job}{j < Math.min(rec.relatedJobs.length, 3) - 1 ? ',' : ''}</span>
                ))}
              </div>
            )}

            {/* 하단 CTA */}
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-primary" />
                <span className="text-xs text-slate-500">상세 정보 보기</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-sky-primary transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
