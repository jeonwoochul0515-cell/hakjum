import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchSchoolList, fetchSchoolSubjects, REGION_CODES } from '@/lib/neis-api';
import type { NEISSchool } from '@/lib/neis-api';
import type { School } from '@/types';

export function useSchoolSearch() {
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [neisResults, setNeisResults] = useState<NEISSchool[]>([]);
  const [neisLoading, setNeisLoading] = useState(false);
  const [neisTotalCount, setNeisTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  // 디바운스 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchNEIS(query.trim(), regionFilter);
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, regionFilter, searchNEIS]);

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
        gradeDataYear: subjects.gradeDataYear,
      };
    } catch {
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

  return {
    query,
    setQuery,
    regionFilter,
    setRegionFilter,
    regions: REGION_CODES,
    neisResults,
    neisLoading,
    neisTotalCount,
    loadNeisSchoolSubjects,
  };
}
