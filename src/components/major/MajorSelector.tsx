import { useState, useEffect, useRef, useCallback } from 'react';
import { GraduationCap, Search, X, Building2, Briefcase, Award, Loader2 } from 'lucide-react';
import { searchMajors, majorCategories } from '@/data/majors';
import { searchMajorsAPI, getMajorDetailAPI } from '@/lib/career-api';
import type { Major } from '@/types';

interface MajorSelectorProps {
  selected: Major | null;
  onSelect: (major: Major | null) => void;
}

export function MajorSelector({ selected, onSelect }: MajorSelectorProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [isOpen, setIsOpen] = useState(false);
  const [apiResults, setApiResults] = useState<Major[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 디바운스 API 검색
  const searchAPI = useCallback((q: string, cat: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim() && cat === '전체') {
      setApiResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchMajorsAPI(q, cat);
        setApiResults(results);
      } catch {
        setApiResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    if (isOpen) {
      searchAPI(query, categoryFilter);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, categoryFilter, isOpen, searchAPI]);

  // 학과 선택 시 상세 정보 로드
  const handleSelect = async (major: Major) => {
    setIsOpen(false);
    setDetailLoading(true);

    try {
      const detail = await getMajorDetailAPI(major.id);
      detail.category = major.category;
      onSelect(detail);
    } catch {
      // API 실패 시 기본 정보로 선택
      onSelect(major);
    } finally {
      setDetailLoading(false);
    }
  };

  // 로컬 폴백 + API 결과 합산
  const localResults = searchMajors(query, categoryFilter);
  const apiOnlyResults = apiResults.filter(
    (api) => !localResults.some((l) => l.name === api.name)
  );
  const combinedResults = [...localResults, ...apiOnlyResults];

  if (detailLoading) {
    return (
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-2">
          <GraduationCap size={14} className="inline mr-1 text-indigo-primary" />
          목표 대학·학과
        </label>
        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-indigo-500" />
          <span className="text-sm text-indigo-600">학과 상세 정보 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-2">
          <GraduationCap size={14} className="inline mr-1 text-indigo-primary" />
          목표 대학·학과
        </label>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-indigo-800 text-sm">{selected.name}</h4>
              <p className="text-xs text-indigo-500 mt-0.5">{selected.category}</p>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-indigo-400 hover:text-indigo-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* 설치 대학 */}
          {selected.universities.length > 0 && (
            <div className="mt-3 flex items-start gap-1.5">
              <Building2 size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-600">
                {selected.universities.slice(0, 8).map((u) => `${u.name}(${u.area})`).join(', ')}
                {selected.universities.length > 8 && ` 외 ${selected.universities.length - 8}개`}
              </p>
            </div>
          )}

          {/* 관련 직업 */}
          {selected.jobs && (
            <div className="mt-2 flex items-start gap-1.5">
              <Briefcase size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-600">{selected.jobs}</p>
            </div>
          )}

          {/* 관련 자격증 */}
          {selected.qualifications && (
            <div className="mt-2 flex items-start gap-1.5">
              <Award size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-600">{selected.qualifications}</p>
            </div>
          )}

          {/* 관련 고교 과목 미리보기 */}
          {selected.relateSubject.general && (
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <p className="text-[10px] font-medium text-indigo-400 mb-1">관련 고교 과목</p>
              <p className="text-xs text-indigo-700">{selected.relateSubject.general}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block mb-2">
        <GraduationCap size={14} className="inline mr-1 text-indigo-primary" />
        목표 대학·학과 <span className="font-normal text-slate-400">(선택)</span>
      </label>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer"
        >
          목표 학과를 선택하면 입시 전략도 분석해드려요
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Search */}
          <div className="relative p-3 border-b border-slate-100">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="학과명으로 검색 (예: 컴퓨터, 간호, 법학...)"
              className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 rounded-lg border-none focus:outline-none"
              autoFocus
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 p-3 overflow-x-auto border-b border-slate-100">
            {['전체', ...majorCategories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  categoryFilter === cat
                    ? 'bg-indigo-primary text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-[240px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span className="text-xs text-slate-400">커리어넷에서 검색 중...</span>
              </div>
            )}

            {!loading && combinedResults.map((major) => (
              <button
                key={`${major.id}-${major.name}`}
                onClick={() => handleSelect(major)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{major.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {major.category}
                      {major.universities.length > 0 && ` · ${major.universities.length}개 대학`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-300">선택</span>
                </div>
              </button>
            ))}

            {!loading && combinedResults.length === 0 && query.trim() && (
              <p className="text-center text-sm text-slate-400 py-6">검색 결과가 없습니다</p>
            )}

            {!loading && !query.trim() && categoryFilter === '전체' && (
              <p className="text-center text-sm text-slate-400 py-6">
                학과명을 입력하거나 계열을 선택하세요
              </p>
            )}
          </div>

          {/* Close */}
          <div className="p-2 border-t border-slate-100">
            <button
              onClick={() => { setIsOpen(false); setQuery(''); setCategoryFilter('전체'); }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
