import { ArrowRight, TrendingUp } from 'lucide-react';
import { SchoolSearch } from '@/components/school/SchoolSearch';
import { SchoolCard } from '@/components/school/SchoolCard';
import { SubjectPreview } from '@/components/school/SubjectPreview';
import { Button } from '@/components/ui/Button';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useFlow } from '@/hooks/useFlow';
import { schools } from '@/data/schools';

const popularSchoolIds = schools.slice(0, 5).map((s) => s.id);

export function SchoolSelectStep() {
  const { state, dispatch, go } = useFlow();
  const { query, setQuery, typeFilter, setTypeFilter, filtered, types } = useSchoolSearch();

  const showPopular = !query && typeFilter === '전체';
  const popularSchools = schools.filter((s) => popularSchoolIds.includes(s.id));

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-slate-800">내 학교의 숨겨진 과목들, 확인해볼까요?</h1>
        <p className="text-sm text-slate-500 mt-1">학교마다 개설과목이 다릅니다. 내 학교에는 어떤 과목이 있을까요?</p>
      </div>

      <SchoolSearch query={query} onQueryChange={setQuery} />

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === t
                ? 'bg-sky-primary text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {showPopular && !state.school && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <TrendingUp size={14} />
          <span>자주 검색되는 학교</span>
        </div>
      )}

      <p className="text-xs text-slate-400">{filtered.length}개 학교</p>

      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
        {(showPopular && !state.school ? popularSchools : filtered).map((school) => (
          <SchoolCard
            key={school.id}
            school={school}
            selected={state.school?.id === school.id}
            onClick={() => dispatch({ type: 'SET_SCHOOL', payload: school })}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">검색 결과가 없습니다</p>
        )}
      </div>

      {state.school && (
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 animate-fade-in-up">
          <p className="text-sm text-green-700 font-medium">
            ✓ {state.school.name} 선택됨! {state.school.allSubjects.length}개 과목 중 딱 맞는 과목을 찾아볼게요
          </p>
        </div>
      )}

      {state.school && <SubjectPreview school={state.school} />}

      <Button
        size="lg"
        className="w-full"
        disabled={!state.school}
        onClick={() => go('interest-input')}
      >
        다음: 관심사 입력하기
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );
}
