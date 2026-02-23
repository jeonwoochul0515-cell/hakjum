import { useState } from 'react';
import { GraduationCap, Search, X, Building2, Briefcase, Award } from 'lucide-react';
import { searchMajors, majorCategories } from '@/data/majors';
import type { Major } from '@/types';

interface MajorSelectorProps {
  selected: Major | null;
  onSelect: (major: Major | null) => void;
}

export function MajorSelector({ selected, onSelect }: MajorSelectorProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [isOpen, setIsOpen] = useState(false);

  const results = searchMajors(query, categoryFilter);

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
          <div className="mt-3 flex items-start gap-1.5">
            <Building2 size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-600">
              {selected.universities.map((u) => `${u.name}(${u.area})`).join(', ')}
            </p>
          </div>

          {/* 관련 직업 */}
          <div className="mt-2 flex items-start gap-1.5">
            <Briefcase size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-600">{selected.jobs}</p>
          </div>

          {/* 관련 자격증 */}
          <div className="mt-2 flex items-start gap-1.5">
            <Award size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-600">{selected.qualifications}</p>
          </div>

          {/* 관련 고교 과목 미리보기 */}
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <p className="text-[10px] font-medium text-indigo-400 mb-1">관련 고교 과목</p>
            <p className="text-xs text-indigo-700">{selected.relateSubject.general}</p>
          </div>
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
              placeholder="학과명 또는 직업으로 검색..."
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
          <div className="max-h-[200px] overflow-y-auto">
            {results.map((major) => (
              <button
                key={major.id}
                onClick={() => {
                  onSelect(major);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{major.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{major.category} · {major.universities.length}개 대학</p>
                  </div>
                  <span className="text-xs text-slate-300">선택</span>
                </div>
              </button>
            ))}
            {results.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">검색 결과가 없습니다</p>
            )}
          </div>

          {/* Close */}
          <div className="p-2 border-t border-slate-100">
            <button
              onClick={() => setIsOpen(false)}
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
