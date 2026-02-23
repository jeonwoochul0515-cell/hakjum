import { useState, useCallback } from 'react';
import type { WizardState, RecommendationResult } from '@/types';
import { buildPrompt } from '@/lib/recommendation-prompt';
import { callClaudeAPI } from '@/lib/claude-api';
import { fallbackRecommend } from '@/lib/fallback-engine';

interface UseRecommendationResult {
  result: RecommendationResult | null;
  loading: boolean;
  error: string | null;
  recommend: (state: WizardState) => Promise<void>;
}

export function useRecommendation(): UseRecommendationResult {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommend = useCallback(async (state: WizardState) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prompt = buildPrompt(state);
      const aiResult = await callClaudeAPI(prompt);
      setResult(aiResult);
    } catch {
      // Fallback to local engine
      try {
        const fallbackResult = fallbackRecommend(state);
        setResult(fallbackResult);
      } catch (fbErr) {
        setError(fbErr instanceof Error ? fbErr.message : '추천 생성에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, recommend };
}
