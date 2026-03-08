import { useState } from 'react';
import { Search, X, School as SchoolIcon, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import type { School } from '@/types';
import type { NEISSchool } from '@/lib/neis-api';

interface Props {
  school: School | null;
  interest: string;
  onSchoolChange: (school: School | null) => void;
  onInterestChange: (interest: string) => void;
  onSubmit: () => void;
}

export function AIInterestInput({ school, interest, onSchoolChange, onInterestChange, onSubmit }: Props) {
  const [showSchoolSearch, setShowSchoolSearch] = useState(false);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const { query, setQuery, neisResults, neisLoading, loadNeisSchoolSubjects } = useSchoolSearch();

  const handleSelectSchool = async (ns: NEISSchool) => {
    setLoadingSchool(true);
    try {
      const s = await loadNeisSchoolSubjects(ns);
      onSchoolChange(s);
      setShowSchoolSearch(false);
      setQuery('');
    } finally {
      setLoadingSchool(false);
    }
  };

  const handleSubmit = () => {
    if (interest.trim().length < 2) return;
    onSubmit();
  };

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* 학교 선택 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          <SchoolIcon size={12} className="inline mr-1 -mt-0.5" />
          내 고등학교 (선택)
        </label>

        {school ? (
          <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
            <SchoolIcon size={14} className="text-sky-primary flex-shrink-0" />
            <p className="flex-1 min-w-0 text-sm font-medium text-slate-800 truncate">{school.name}
              <span className="text-xs text-slate-400 font-normal ml-1.5">{school.type}</span>
            </p>
            <button
              onClick={() => { onSchoolChange(null); setShowSchoolSearch(false); }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSchoolSearch((v) => !v)}
            className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-left hover:border-sky-primary/30 transition-all cursor-pointer"
          >
            <span className="text-xs text-slate-400">학교를 선택하면 더 정확한 추천을 받을 수 있어요</span>
            {showSchoolSearch ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
        )}

        {showSchoolSearch && !school && (
          <div className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
            <div className="relative p-3 border-b border-slate-100">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="학교 이름 검색..."
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-primary/30"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {neisLoading || loadingSchool ? (
                <div className="flex items-center justify-center gap-2 py-4 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">{loadingSchool ? '과목 불러오는 중...' : '검색 중...'}</span>
                </div>
              ) : (
                <>
                  {neisResults.slice(0, 20).map((ns) => (
                    <button
                      key={`${ns.regionCode}_${ns.code}`}
                      onClick={() => handleSelectSchool(ns)}
                      className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors text-sm border-b border-slate-50 last:border-b-0 cursor-pointer"
                    >
                      <span className="font-medium text-slate-700">{ns.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{ns.type || '일반고'} · {ns.region}</span>
                    </button>
                  ))}
                  {query && neisResults.length === 0 && (
                    <p className="px-4 py-3 text-sm text-slate-400 text-center">검색 결과가 없어요</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 관심사 입력 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          <Sparkles size={12} className="inline mr-1 -mt-0.5" />
          하고 싶은 일 / 관심 분야
        </label>
        <textarea
          value={interest}
          onChange={(e) => onInterestChange(e.target.value)}
          placeholder="예: 코딩이 재미있고 AI에 관심이 많아요 / 사람을 돕는 일을 하고 싶어요"
          rows={2}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary transition-all leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* 제출 */}
      <button
        onClick={handleSubmit}
        disabled={interest.trim().length < 2}
        className="w-full py-3 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-2"
      >
        <Sparkles size={16} />
        AI 학과 추천 받기
      </button>
    </div>
  );
}
