import { useState, useCallback } from 'react';
import type { School, AIExploreResult, MajorFull } from '@/types';
import { getExploreRecommendations } from '@/lib/explore-ai';
import { getMajorFullAPI, searchMajorsAPI } from '@/lib/career-api';

export type ExploreStep = 'input' | 'loading' | 'results' | 'detail';

interface UseExploreAIReturn {
  step: ExploreStep;
  school: School | null;
  interest: string;
  result: AIExploreResult | null;
  selectedMajor: MajorFull | null;
  detailLoading: boolean;
  error: string;
  setSchool: (school: School | null) => void;
  setInterest: (interest: string) => void;
  analyze: () => Promise<void>;
  selectMajor: (majorName: string, category: string) => Promise<void>;
  backToResults: () => void;
  reset: () => void;
}

export function useExploreAI(): UseExploreAIReturn {
  const [step, setStep] = useState<ExploreStep>('input');
  const [school, setSchool] = useState<School | null>(null);
  const [interest, setInterest] = useState('');
  const [result, setResult] = useState<AIExploreResult | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<MajorFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async () => {
    if (!interest.trim()) return;
    setStep('loading');
    setError('');
    try {
      const aiResult = await getExploreRecommendations(interest.trim(), school);
      setResult(aiResult);
      setStep('results');
    } catch {
      setError('추천을 생성하지 못했어요. 다시 시도해주세요.');
      setStep('input');
    }
  }, [interest, school]);

  const selectMajor = useCallback(async (majorName: string, category: string) => {
    setDetailLoading(true);
    setError('');
    try {
      // CareerNet API에서 학과 검색 → 상세 정보 로드
      const searchResults = await searchMajorsAPI(majorName, category);
      const match = searchResults.find(
        (m) => m.name === majorName || m.name.includes(majorName) || majorName.includes(m.name)
      ) || searchResults[0];

      if (match) {
        const full = await getMajorFullAPI(match.id);
        full.category = match.category || category || full.category;
        setSelectedMajor(full);
        setStep('detail');
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
    setError('');
    setStep('results');
  }, []);

  const reset = useCallback(() => {
    setStep('input');
    setSchool(null);
    setInterest('');
    setResult(null);
    setSelectedMajor(null);
    setError('');
  }, []);

  return {
    step,
    school,
    interest,
    result,
    selectedMajor,
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
