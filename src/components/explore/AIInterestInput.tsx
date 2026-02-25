import { useState } from 'react';
import { Search, X, School as SchoolIcon, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import type { School } from '@/types';

interface Props {
  school: School | null;
  interest: string;
  onSchoolChange: (school: School | null) => void;
  onInterestChange: (interest: string) => void;
  onSubmit: () => void;
}

export function AIInterestInput({ school, interest, onSchoolChange, onInterestChange, onSubmit }: Props) {
  const [showSchoolSearch, setShowSchoolSearch] = useState(false);
  const { query, setQuery, filtered } = useSchoolSearch();

  const handleSelectSchool = (s: School) => {
    onSchoolChange(s);
    setShowSchoolSearch(false);
    setQuery('');
  };

  const handleSubmit = () => {
    if (interest.trim().length < 2) return;
    onSubmit();
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 학교 선택 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <SchoolIcon size={14} className="inline mr-1.5 -mt-0.5" />
          내 고등학교
        </label>

        {school ? (
          <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
            <SchoolIcon size={16} className="text-sky-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{school.name}</p>
              <p className="text-xs text-slate-500">{school.type} · 과목 {school.totalRecords}개</p>
            </div>
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
            className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 text-left hover:border-sky-primary/30 transition-all cursor-pointer"
          >
            <span className="text-sm text-slate-400">학교를 선택하면 더 정확한 추천을 받을 수 있어요</span>
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
              {filtered.slice(0, 20).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSchool(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors text-sm border-b border-slate-50 last:border-b-0 cursor-pointer"
                >
                  <span className="font-medium text-slate-700">{s.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{s.type}</span>
                </button>
              ))}
              {query && filtered.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400 text-center">검색 결과가 없어요</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 관심사 입력 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <Sparkles size={14} className="inline mr-1.5 -mt-0.5" />
          관심사 또는 하고 싶은 일
        </label>
        <textarea
          value={interest}
          onChange={(e) => onInterestChange(e.target.value)}
          placeholder="예: 코딩이 재미있고 AI에 관심이 많아요&#10;예: 사람을 돕는 일을 하고 싶어요&#10;예: 경영이나 마케팅 쪽에 관심이 있어요"
          rows={3}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary transition-all leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <p className="text-xs text-slate-400 mt-1.5">
          자유롭게 적어주세요. AI가 분석해서 맞춤 학과를 추천해드려요
        </p>
      </div>

      {/* 제출 */}
      <button
        onClick={handleSubmit}
        disabled={interest.trim().length < 2}
        className="w-full py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-2"
      >
        <Sparkles size={16} />
        AI 학과 추천 받기
      </button>
    </div>
  );
}
