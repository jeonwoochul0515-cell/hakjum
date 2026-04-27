import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Search, School as SchoolIcon, Loader2, Globe, FileText, ChevronRight } from 'lucide-react';
import { SubjectPreview } from '@/components/school/SubjectPreview';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useFlow } from '@/hooks/useFlow';
import type { NEISSchool } from '@/lib/neis-api';
import { C } from '@/lib/design-tokens';

export function SchoolSelectStep() {
  const { state, dispatch, go } = useFlow();
  const {
    query, setQuery,
    regionFilter, setRegionFilter,
    regions,
    neisResults, neisLoading, neisTotalCount,
    loadNeisSchoolSubjects,
  } = useSchoolSearch();
  const [neisLoadingSchool, setNeisLoadingSchool] = useState<string | null>(null);

  const handleNeisSchoolSelect = async (neisSchool: NEISSchool) => {
    setNeisLoadingSchool(neisSchool.code);
    const school = await loadNeisSchoolSubjects(neisSchool, (fullSchool) => {
      // 백그라운드에서 과목 로딩 완료 시 업데이트
      dispatch({ type: 'SET_SCHOOL', payload: fullSchool });
      setNeisLoadingSchool(null);
    });
    dispatch({ type: 'SET_SCHOOL', payload: school });
    // 캐시 히트 시 이미 과목 있으므로 로딩 해제
    if (school.allSubjects.length > 0) {
      setNeisLoadingSchool(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-slate-800">내 학교의 숨겨진 과목들, 확인해볼까요?</h1>
        <p className="text-sm text-slate-500 mt-1">학교마다 개설과목이 다릅니다. 내 학교에는 어떤 과목이 있을까요?</p>
      </div>

      {/* 전국 검색 헤더 */}
      <div className="flex items-center gap-1.5 text-sm text-indigo-primary font-medium">
        <Globe size={14} />
        전국 고등학교 검색 (NEIS 실시간)
      </div>

      {/* 검색 입력 */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="학교 이름을 검색하세요..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary text-sm transition-all"
        />
      </div>

      {/* 지역 필터 */}
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

      {/* 검색 결과 */}
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

      {/* 선택된 학교 표시 */}
      {state.school && (
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 animate-fade-in-up">
          <p className="text-sm text-green-700 font-medium flex items-center gap-2">
            {state.school.name} 선택 완료!
            {state.school.allSubjects.length > 0
              ? ` ${state.school.allSubjects.length}개 과목 중 딱 맞는 과목을 찾아볼게요`
              : neisLoadingSchool
                ? <><Loader2 size={14} className="animate-spin" /> 개설과목 불러오는 중...</>
                : ' 개설과목 데이터가 없습니다'}
          </p>
        </div>
      )}

      {state.school && state.school.allSubjects.length > 0 && <SubjectPreview school={state.school} />}

      {/* 학교 교육과정 PDF 업로드 진입 (가장 정확한 데이터 — NEIS보다 우선) */}
      <Link
        to="/curriculum-upload"
        className="cursor-pointer transition-colors"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          background: C.bg,
          borderRadius: 12,
          textDecoration: 'none',
          border: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${C.line}`,
            flexShrink: 0,
          }}
        >
          <FileText size={16} color={C.brand} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
            학교에서 받은 교육과정 PDF가 있나요?
          </div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
            AI가 PDF를 읽고 정확한 개설 과목을 정리해드려요
          </div>
        </div>
        <ChevronRight size={14} color={C.sub} />
      </Link>

      <Button
        size="lg"
        className="w-full"
        disabled={!state.school}
        onClick={() => go('interest-input')}
      >
        다음: 관심사 입력
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
