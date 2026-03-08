import { useState } from 'react';
import { ArrowRight, TrendingUp, MapPin, Search, School as SchoolIcon, Loader2, Globe, Database } from 'lucide-react';
import { SchoolCard } from '@/components/school/SchoolCard';
import { SubjectPreview } from '@/components/school/SubjectPreview';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useFlow } from '@/hooks/useFlow';
import { schools } from '@/data/schools';
import type { NEISSchool } from '@/lib/neis-api';

const popularSchoolIds = schools.slice(0, 5).map((s) => s.id);

export function SchoolSelectStep() {
  const { state, dispatch, go } = useFlow();
  const {
    query, setQuery, typeFilter, setTypeFilter,
    searchMode, setSearchMode, regionFilter, setRegionFilter,
    filtered, types, regions,
    neisResults, neisLoading, neisTotalCount,
    loadNeisSchoolSubjects,
  } = useSchoolSearch();
  const [neisLoadingSchool, setNeisLoadingSchool] = useState<string | null>(null);

  const showPopular = searchMode === 'local' && !query && typeFilter === '전체';
  const popularSchools = schools.filter((s) => popularSchoolIds.includes(s.id));

  const handleNeisSchoolSelect = async (neisSchool: NEISSchool) => {
    setNeisLoadingSchool(neisSchool.code);
    try {
      const school = await loadNeisSchoolSubjects(neisSchool);
      dispatch({ type: 'SET_SCHOOL', payload: school });
    } finally {
      setNeisLoadingSchool(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-slate-800">내 학교의 숨겨진 과목들, 확인해볼까요?</h1>
        <p className="text-sm text-slate-500 mt-1">학교마다 개설과목이 다릅니다. 내 학교에는 어떤 과목이 있을까요?</p>
      </div>

      {/* 검색 모드 토글 */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setSearchMode('local')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            searchMode === 'local'
              ? 'bg-white text-sky-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database size={14} />
          부산 (즉시검색)
        </button>
        <button
          onClick={() => setSearchMode('national')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            searchMode === 'national'
              ? 'bg-white text-indigo-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe size={14} />
          전국 (NEIS 실시간)
        </button>
      </div>

      {/* 검색 입력 */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchMode === 'local' ? '부산 지역 학교 검색...' : '전국 학교 이름 검색...'}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary text-sm transition-all"
        />
      </div>

      {/* 지역 필터 (전국 모드) */}
      {searchMode === 'national' && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setRegionFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              !regionFilter
                ? 'bg-indigo-primary text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            전체
          </button>
          {regions.map((r) => (
            <button
              key={r.code}
              onClick={() => setRegionFilter(r.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                regionFilter === r.code
                  ? 'bg-indigo-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* 타입 필터 (로컬 모드) */}
      {searchMode === 'local' && (
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
      )}

      {/* 로컬 모드 */}
      {searchMode === 'local' && (
        <>
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
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">부산 지역에서 검색 결과가 없습니다</p>
                <button
                  onClick={() => setSearchMode('national')}
                  className="text-sm text-indigo-primary mt-2 underline cursor-pointer"
                >
                  전국 검색으로 전환 →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* 전국 NEIS 모드 */}
      {searchMode === 'national' && (
        <>
          {neisLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">NEIS에서 학교 검색 중...</span>
            </div>
          )}

          {!neisLoading && neisResults.length > 0 && (
            <>
              <p className="text-xs text-slate-400">
                {neisTotalCount > neisResults.length
                  ? `${neisTotalCount.toLocaleString()}개 중 ${neisResults.length}개 표시`
                  : `${neisResults.length}개 학교`
                }
              </p>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {neisResults.map((ns) => (
                  <NEISSchoolCard
                    key={`${ns.regionCode}_${ns.code}`}
                    school={ns}
                    selected={state.school?.id === `${ns.regionCode}_${ns.code}`}
                    loading={neisLoadingSchool === ns.code}
                    onClick={() => handleNeisSchoolSelect(ns)}
                  />
                ))}
              </div>
            </>
          )}

          {!neisLoading && neisResults.length === 0 && (query || regionFilter) && (
            <p className="text-center text-slate-400 py-8 text-sm">
              {query ? `"${query}" 검색 결과가 없습니다` : '지역을 선택하고 학교 이름을 검색하세요'}
            </p>
          )}

          {!neisLoading && !query && !regionFilter && (
            <div className="text-center py-8 text-slate-400">
              <MapPin size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm">지역을 선택하거나 학교 이름을 검색하세요</p>
              <p className="text-xs mt-1">NEIS에서 실시간으로 전국 2,400여 개 고등학교를 검색합니다</p>
            </div>
          )}
        </>
      )}

      {/* 선택된 학교 표시 */}
      {state.school && (
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 animate-fade-in-up">
          <p className="text-sm text-green-700 font-medium">
            {state.school.name} 선택 완료!
            {state.school.allSubjects.length > 0
              ? ` ${state.school.allSubjects.length}개 과목 중 딱 맞는 과목을 찾아볼게요`
              : ' 개설과목을 불러오는 중...'}
          </p>
        </div>
      )}

      {state.school && state.school.allSubjects.length > 0 && <SubjectPreview school={state.school} />}

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

// NEIS 전국 학교 카드
function NEISSchoolCard({
  school, selected, loading, onClick,
}: {
  school: NEISSchool;
  selected: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const typeBadgeColor: Record<string, 'sky' | 'indigo' | 'amber' | 'green' | 'gray'> = {
    '일반고': 'sky',
    '특성화고': 'amber',
    '자율고': 'indigo',
    '특목고': 'green',
    '자율형사립고': 'indigo',
    '자율형공립고': 'indigo',
    '과학고': 'green',
    '외국어고': 'green',
    '국제고': 'green',
    '예술고': 'amber',
    '체육고': 'amber',
    '마이스터고': 'amber',
  };

  return (
    <Card hover selected={selected} onClick={onClick} className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          selected ? 'bg-indigo-primary text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          {loading ? <Loader2 size={20} className="animate-spin" /> : <SchoolIcon size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 truncate">{school.name}</h3>
            <Badge color={typeBadgeColor[school.type] || 'gray'}>{school.type || '일반고'}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin size={10} />
            {school.region} · {school.foundation}
            {school.coedu && ` · ${school.coedu}`}
          </p>
        </div>
      </div>
    </Card>
  );
}
