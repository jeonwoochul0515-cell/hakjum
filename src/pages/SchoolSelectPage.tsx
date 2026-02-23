import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SchoolSearch } from '@/components/school/SchoolSearch';
import { SchoolCard } from '@/components/school/SchoolCard';
import { SubjectPreview } from '@/components/school/SubjectPreview';
import { Button } from '@/components/ui/Button';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useWizard } from '@/context/WizardContext';

export default function SchoolSelectPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useWizard();
  const { query, setQuery, typeFilter, setTypeFilter, filtered, types } = useSchoolSearch();

  return (
    <AppShell step={1}>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">학교를 선택하세요</h1>
          <p className="text-sm text-slate-500 mt-1">부산 지역 고등학교의 실제 개설과목을 기반으로 추천합니다</p>
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

        <p className="text-xs text-slate-400">{filtered.length}개 학교</p>

        {/* School list */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {filtered.map((school) => (
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

        {/* Subject preview */}
        {state.school && <SubjectPreview school={state.school} />}

        {/* Next button */}
        <Button
          size="lg"
          className="w-full"
          disabled={!state.school}
          onClick={() => navigate('/career')}
        >
          다음 단계로
        </Button>
      </div>
    </AppShell>
  );
}
