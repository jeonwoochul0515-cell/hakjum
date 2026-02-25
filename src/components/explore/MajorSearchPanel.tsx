import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchMajorsAPI } from '@/lib/career-api';
import type { Major } from '@/types';

const CATEGORIES = ['전체', '공학계열', '자연계열', '인문계열', '사회계열', '교육계열', '의약계열', '예체능계열'];

interface Props {
  onSelect: (major: Major) => void;
}

export function MajorSearchPanel({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('전체');
  const [results, setResults] = useState<Major[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() && category === '전체') {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchMajorsAPI(query.trim(), category);
        setResults(data);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category]);

  return (
    <div>
      {/* 검색바 */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="학과 이름을 검색해보세요 (예: 컴퓨터, 간호, 경영)"
          className="w-full pl-10 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 계열 필터 칩 */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              category === cat
                ? 'bg-sky-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 결과 */}
      <div className="mt-4">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-sky-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 mt-2">학과를 찾고 있어요...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">검색 결과가 없어요</p>
            <p className="text-xs text-slate-400 mt-1">다른 키워드로 검색해보세요</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">{results.length}개 학과를 찾았어요</p>
            {results.map((major) => (
              <button
                key={major.id}
                onClick={() => onSelect(major)}
                className="w-full text-left bg-white rounded-xl p-4 border border-slate-100 hover:border-sky-primary/30 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{major.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{major.category}</p>
                  </div>
                  <span className="text-sky-primary text-xs font-medium">자세히 →</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">궁금한 학과를 검색하거나</p>
            <p className="text-sm text-slate-500">계열을 선택해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
