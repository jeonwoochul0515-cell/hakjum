import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { schools as localSchools, schoolTypes } from '@/data/schools';
import { fetchSchoolList, fetchSchoolSubjects, REGION_CODES } from '@/lib/neis-api';
import type { NEISSchool } from '@/lib/neis-api';
import type { School } from '@/types';

export type SearchMode = 'local' | 'national';

export function useSchoolSearch() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('전체');
  const [searchMode, setSearchMode] = useState<SearchMode>('local');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [neisResults, setNeisResults] = useState<NEISSchool[]>([]);
  const [neisLoading, setNeisLoading] = useState(false);
  const [neisTotalCount, setNeisTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 로컬 검색 (부산 기존 데이터)
  const localFiltered = useMemo(() => {
    let result = localSchools;
    if (typeFilter !== '전체') {
      result = result.filter((s) => s.type === typeFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    return result;
  }, [query, typeFilter]);

  // NEIS 전국 검색
  const searchNEIS = useCallback(async (name: string, region: string) => {
    if (!name && !region) {
      setNeisResults([]);
      setNeisTotalCount(0);
      return;
    }

    setNeisLoading(true);
    try {
      const { schools, totalCount } = await fetchSchoolList({
        name: name || undefined,
        region: region || undefined,
        size: 50,
      });
      setNeisResults(schools);
      setNeisTotalCount(totalCount);
    } catch {
      setNeisResults([]);
    } finally {
      setNeisLoading(false);
    }
  }, []);

  // 디바운스 검색 (전국 모드)
  useEffect(() => {
    if (searchMode !== 'national') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchNEIS(query.trim(), regionFilter);
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, regionFilter, searchMode, searchNEIS]);

  // NEIS 학교 선택 시 개설과목 로딩
  const loadNeisSchoolSubjects = useCallback(async (neisSchool: NEISSchool): Promise<School> => {
    try {
      const subjects = await fetchSchoolSubjects(neisSchool.regionCode, neisSchool.code);
      return {
        id: `${neisSchool.regionCode}_${neisSchool.code}`,
        name: neisSchool.name,
        type: neisSchool.type || '일반고',
        totalRecords: subjects.totalRecords,
        subjectsByGrade: subjects.subjectsByGrade,
        allSubjects: subjects.allSubjects,
      };
    } catch {
      // 개설과목 로딩 실패 시 기본 정보만 반환
      return {
        id: `${neisSchool.regionCode}_${neisSchool.code}`,
        name: neisSchool.name,
        type: neisSchool.type || '일반고',
        totalRecords: 0,
        subjectsByGrade: {},
        allSubjects: [],
      };
    }
  }, []);

  const filtered = searchMode === 'local' ? localFiltered : [];

  return {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    searchMode,
    setSearchMode,
    regionFilter,
    setRegionFilter,
    filtered,
    types: ['전체', ...schoolTypes],
    regions: REGION_CODES,
    neisResults,
    neisLoading,
    neisTotalCount,
    loadNeisSchoolSubjects,
  };
}
