import { useState, useCallback, useRef } from 'react';
import type { School, AIExploreResult, MajorFull } from '@/types';
import type { EnrollmentInfo, UniversityStats } from '@/lib/university-api';
import { getExploreRecommendations } from '@/lib/explore-ai';
import { getMajorFullAPI, searchMajorsAPI } from '@/lib/career-api';
import { getEnrollmentAPI, getUniversityStats } from '@/lib/university-api';

export type ExploreStep = 'input' | 'loading' | 'results' | 'detail';

interface UseExploreAIReturn {
  step: ExploreStep;
  school: School | null;
  interest: string;
  result: AIExploreResult | null;
  selectedMajor: MajorFull | null;
  enrollment: EnrollmentInfo[];
  universityStats: UniversityStats[];
  detailLoading: boolean;
  error: string;
  setSchool: (school: School | null) => void;
  setInterest: (interest: string) => void;
  analyze: () => Promise<void>;
  selectMajor: (majorName: string, category: string) => Promise<void>;
  backToResults: () => void;
  reset: () => void;
}

// 검색 결과 캐시
interface CacheEntry {
  result: AIExploreResult;
  timestamp: number;
}
const CACHE_TTL = 10 * 60 * 1000; // 10분

export function useExploreAI(): UseExploreAIReturn {
  const [step, setStep] = useState<ExploreStep>('input');
  const [school, setSchool] = useState<School | null>(null);
  const [interest, setInterest] = useState('');
  const [result, setResult] = useState<AIExploreResult | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<MajorFull | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo[]>([]);
  const [universityStats, setUniversityStats] = useState<UniversityStats[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const analyze = useCallback(async () => {
    if (!interest.trim()) return;
    const cacheKey = `${interest.trim()}|${school?.name || ''}`;

    // 캐시 확인
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResult(cached.result);
      setStep('results');
      return;
    }

    setStep('loading');
    setError('');
    try {
      const aiResult = await getExploreRecommendations(interest.trim(), school);
      setResult(aiResult);
      cacheRef.current.set(cacheKey, { result: aiResult, timestamp: Date.now() });
      setStep('results');
    } catch {
      setError('추천을 생성하지 못했어요. 다시 시도해주세요.');
      setStep('input');
    }
  }, [interest, school]);

  const selectMajor = useCallback(async (majorName: string, category: string) => {
    setDetailLoading(true);
    setError('');
    setEnrollment([]);
    setUniversityStats([]);
    try {
      const searchResults = await searchMajorsAPI(majorName, category);
      const match = searchResults.find(
        (m) => m.name === majorName || m.name.includes(majorName) || majorName.includes(m.name)
      ) || searchResults[0];

      if (match) {
        const full = await getMajorFullAPI(match.id);
        full.category = match.category || category || full.category;
        setSelectedMajor(full);
        setStep('detail');

        // 학과 정원 + 대학 통계 비동기 로드 (실패해도 무시)
        getEnrollmentAPI(match.name).then(setEnrollment).catch(() => {});
        const univNames = full.universitiesFull.map((u) => u.name);
        getUniversityStats(univNames).then(setUniversityStats).catch(() => {});
      } else {
        setError('학과 상세 정보를 찾지 못했어요.');
      }
    } catch {
      setError('학과 정보를 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const backToResults = useCallback(() => {
    setSelectedMajor(null);
    setEnrollment([]);
    setUniversityStats([]);
    setError('');
    setStep('results');
  }, []);

  const reset = useCallback(() => {
    setStep('input');
    setSchool(null);
    setInterest('');
    setResult(null);
    setSelectedMajor(null);
    setEnrollment([]);
    setUniversityStats([]);
    setError('');
  }, []);

  return {
    step,
    school,
    interest,
    result,
    selectedMajor,
    enrollment,
    universityStats,
    detailLoading,
    error,
    setSchool,
    setInterest,
    analyze,
    selectMajor,
    backToResults,
    reset,
  };
}
