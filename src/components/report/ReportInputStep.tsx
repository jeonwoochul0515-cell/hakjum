import { useState } from 'react';
import {
  Search, MapPin, Globe, Loader2, School as SchoolIcon,
  GraduationCap, Sparkles, ArrowRight, X, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useReportContext } from '@/context/ReportContext';
import type { NEISSchool } from '@/lib/neis-api';
import type { School } from '@/types';
import type { ReportInput } from '@/types/report';

const QUICK_TAGS = ['의대', 'IT/프로그래밍', '경영/경제', '교대/사범대', '예체능', '간호/보건'];
const GRADES = ['1학년', '2학년', '3학년'];

export function ReportInputStep() {
  const { dispatch } = useReportContext();
  const {
    query, setQuery,
    regionFilter, setRegionFilter,
    regions,
    neisResults, neisLoading, neisTotalCount,
    loadNeisSchoolSubjects,
  } = useSchoolSearch();

  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [neisLoadingSchool, setNeisLoadingSchool] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [interest, setInterest] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [univInput, setUnivInput] = useState('');
  const [targetUniversities, setTargetUniversities] = useState<string[]>([]);

  const handleNeisSchoolSelect = async (neisSchool: NEISSchool) => {
    setNeisLoadingSchool(neisSchool.code);
    const school = await loadNeisSchoolSubjects(neisSchool, (fullSchool) => {
      setSelectedSchool(fullSchool);
      setNeisLoadingSchool(null);
    });
    setSelectedSchool(school);
    if (school.allSubjects.length > 0) {
      setNeisLoadingSchool(null);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddUniv = () => {
    const trimmed = univInput.trim();
    if (!trimmed || targetUniversities.length >= 5 || targetUniversities.includes(trimmed)) return;
    setTargetUniversities((prev) => [...prev, trimmed]);
    setUnivInput('');
  };

  const handleRemoveUniv = (univ: string) => {
    setTargetUniversities((prev) => prev.filter((u) => u !== univ));
  };

  const isValid = selectedSchool && (interest.trim() || selectedTags.length > 0);

  const handleSubmit = () => {
    if (!selectedSchool || !isValid) return;

    const input: ReportInput = {
      school: selectedSchool,
      grade: grade || '1학년',
      interest: interest.trim(),
      tags: selectedTags,
      targetUniversities,
    };

    dispatch({ type: 'SET_INPUT', payload: input });
    dispatch({ type: 'SET_STEP', payload: 'loading' });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">AI 분석 보고서 생성</h1>
        <p className="text-sm text-slate-500 mt-1">
          학교와 관심사를 입력하면 맞춤형 입시 분석 보고서를 만들어드려요
        </p>
      </div>

      {/* ── 1. 학교 검색 ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-1.5 text-sm text-indigo-primary font-medium mb-3">
          <Globe size={14} />
          학교 선택 <span className="text-red-400">*</span>
        </div>

        {/* 검색 입력 */}
        <div className="relative mb-3">
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
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-3">
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
          <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">NEIS에서 학교 검색 중...</span>
          </div>
        )}

        {!neisLoading && neisResults.length > 0 && (
          <>
            <p className="text-xs text-slate-400 mb-2">
              {neisTotalCount > neisResults.length
                ? `${neisTotalCount.toLocaleString()}개 중 ${neisResults.length}개 표시`
                : `${neisResults.length}개 학교`}
            </p>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto">
              {neisResults.map((ns) => {
                const schoolId = `${ns.regionCode}_${ns.code}`;
                const isSelected = selectedSchool?.id === schoolId;
                const isLoading = neisLoadingSchool === ns.code;
                const typeBadgeColor: Record<string, 'sky' | 'indigo' | 'amber' | 'green' | 'gray'> = {
                  '일반고': 'sky', '특성화고': 'amber', '자율고': 'indigo', '특목고': 'green',
                  '자율형사립고': 'indigo', '자율형공립고': 'indigo', '과학고': 'green',
                  '외국어고': 'green', '국제고': 'green', '예술고': 'amber', '체육고': 'amber', '마이스터고': 'amber',
                };
                return (
                  <Card key={schoolId} hover selected={isSelected} onClick={() => handleNeisSchoolSelect(ns)} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-indigo-primary text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <SchoolIcon size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 text-sm truncate">{ns.name}</h3>
                          <Badge color={typeBadgeColor[ns.type] || 'gray'}>{ns.type || '일반고'}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={10} />
                          {ns.region} · {ns.foundation}
                          {ns.coedu && ` · ${ns.coedu}`}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {!neisLoading && neisResults.length === 0 && (query || regionFilter) && (
          <p className="text-center text-slate-400 py-6 text-sm">
            {query ? `"${query}" 검색 결과가 없습니다` : '지역을 선택하고 학교 이름을 검색하세요'}
          </p>
        )}

        {!neisLoading && !query && !regionFilter && !selectedSchool && (
          <div className="text-center py-6 text-slate-400">
            <MapPin size={20} className="mx-auto mb-1 text-slate-300" />
            <p className="text-sm">학교 이름을 검색하세요</p>
          </div>
        )}

        {/* 선택된 학교 */}
        {selectedSchool && (
          <div className="bg-green-50 rounded-xl p-3 border border-green-200 mt-2 animate-fade-in-up">
            <p className="text-sm text-green-700 font-medium flex items-center gap-2">
              {selectedSchool.name} 선택 완료!
              {selectedSchool.allSubjects.length > 0
                ? ` (${selectedSchool.allSubjects.length}개 과목 로드됨)`
                : neisLoadingSchool
                  ? <><Loader2 size={14} className="animate-spin" /> 개설과목 불러오는 중...</>
                  : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── 2. 학년 선택 ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-3">
          <GraduationCap size={14} className="text-indigo-primary" />
          학년 선택
        </div>
        <div className="flex gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                grade === g
                  ? 'bg-gradient-to-r from-sky-primary to-indigo-primary text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. 관심사 입력 ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-3">
          <Sparkles size={14} className="text-indigo-primary" />
          관심사 <span className="text-red-400">*</span>
        </div>
        <input
          type="text"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          placeholder="예: 의사, 프로그래머, 디자이너, AI 개발..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary text-sm transition-all mb-3"
        />
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedTags.includes(tag)
                  ? 'bg-sky-primary text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. 희망 대학 입력 ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <SchoolIcon size={14} className="text-indigo-primary" />
            희망 대학 (선택, 최대 5개)
          </div>
          <span className="text-xs text-slate-400">{targetUniversities.length}/5</span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={univInput}
            onChange={(e) => setUnivInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUniv()}
            placeholder="대학교 이름 입력..."
            disabled={targetUniversities.length >= 5}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary text-sm transition-all disabled:opacity-50"
          />
          <button
            onClick={handleAddUniv}
            disabled={!univInput.trim() || targetUniversities.length >= 5}
            className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
        </div>
        {targetUniversities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {targetUniversities.map((univ) => (
              <span
                key={univ}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
              >
                {univ}
                <button onClick={() => handleRemoveUniv(univ)} className="hover:text-red-500 transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA 버튼 ── */}
      <Button
        size="lg"
        className="w-full"
        disabled={!isValid}
        onClick={handleSubmit}
      >
        <Sparkles size={18} className="mr-2" />
        보고서 생성
        <ArrowRight size={18} className="ml-2" />
      </Button>

      <p className="text-center text-xs text-slate-400">
        AI가 127개 학과와 교과이수기준을 분석하여 맞춤 보고서를 생성합니다
      </p>
    </div>
  );
}
