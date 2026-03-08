import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchSchoolList, fetchSchoolSubjects, REGION_CODES } from '@/lib/neis-api';
import type { NEISSchool } from '@/lib/neis-api';
import type { School } from '@/types';

const SUBJECT_CACHE_KEY = 'hakjum-subject-cache';
const CACHE_TTL = 60 * 60 * 1000; // 1시간

interface CacheEntry {
  school: School;
  timestamp: number;
}

function getCachedSubjects(schoolId: string): School | null {
  try {
    const raw = localStorage.getItem(SUBJECT_CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, CacheEntry> = JSON.parse(raw);
    const entry = cache[schoolId];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.school;
  } catch { return null; }
}

function setCachedSubjects(schoolId: string, school: School) {
  try {
    const raw = localStorage.getItem(SUBJECT_CACHE_KEY);
    const cache: Record<string, CacheEntry> = raw ? JSON.parse(raw) : {};
    // 오래된 항목 정리 (최대 20개 유지)
    const entries = Object.entries(cache);
    if (entries.length > 20) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < entries.length - 19; i++) {
        delete cache[entries[i][0]];
      }
    }
    cache[schoolId] = { school, timestamp: Date.now() };
    localStorage.setItem(SUBJECT_CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

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

  // NEIS 학교 선택: 즉시 스텁 반환 + 백그라운드에서 과목 로딩
  const loadNeisSchoolSubjects = useCallback(async (
    neisSchool: NEISSchool,
    onSubjectsLoaded?: (school: School) => void,
  ): Promise<School> => {
    const schoolId = `${neisSchool.regionCode}_${neisSchool.code}`;

    // 1. localStorage 캐시 확인
    const cached = getCachedSubjects(schoolId);
    if (cached) return cached;

    // 2. 즉시 스텁 반환 (과목 0개)
    const stub: School = {
      id: schoolId,
      name: neisSchool.name,
      type: neisSchool.type || '일반고',
      totalRecords: 0,
      subjectsByGrade: {},
      allSubjects: [],
    };

    // 3. 백그라운드에서 과목 로딩
    fetchSchoolSubjects(neisSchool.regionCode, neisSchool.code)
      .then((subjects) => {
        const full: School = {
          id: schoolId,
          name: neisSchool.name,
          type: neisSchool.type || '일반고',
          totalRecords: subjects.totalRecords,
          subjectsByGrade: subjects.subjectsByGrade,
          allSubjects: subjects.allSubjects,
          gradeDataYear: subjects.gradeDataYear,
        };
        setCachedSubjects(schoolId, full);
        onSubjectsLoaded?.(full);
      })
      .catch(() => {
        // 실패 시 스텁 유지
      });

    return stub;
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
