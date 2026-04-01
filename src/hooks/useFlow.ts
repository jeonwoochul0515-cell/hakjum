import { useCallback, useRef } from 'react';
import { useFlowContext } from '@/context/FlowContext';
import { getExploreRecommendations } from '@/lib/explore-ai';
import { getMajorFullAPI, searchMajorsAPI } from '@/lib/career-api';
import { getEnrollmentAPI, getUniversityStats, getAcademyInfoStats } from '@/lib/university-api';
import { getAdmissionResults } from '@/lib/admission-api';
import { buildPrompt } from '@/lib/recommendation-prompt';
import { callClaudeAPI } from '@/lib/claude-api';
import { fallbackRecommend } from '@/lib/fallback-engine';
import { addSearchHistory } from '@/lib/history';
import { REGION_CODES } from '@/lib/neis-api';
import { canUseAI, recordAIUsage } from '@/lib/usage';
import type { WizardState } from '@/types';

interface CacheEntry {
  result: import('@/types').AIExploreResult;
  timestamp: number;
}
const CACHE_TTL = 10 * 60 * 1000;

export function useFlow() {
  const { state, dispatch } = useFlowContext();
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const selectMajorIdRef = useRef(0); // race condition 방지

  // ── Navigate ──
  const go = useCallback(
    (step: import('@/types').FlowStep) => dispatch({ type: 'GO', payload: step }),
    [dispatch],
  );
  const back = useCallback(() => dispatch({ type: 'BACK' }), [dispatch]);

  // ── Explore AI ──
  const analyze = useCallback(async () => {
    // Use interest text, or fall back to tags joined as text
    const interestText = state.interest.trim() || state.tags.join(', ');
    if (!interestText) return;

    // 과목이 아직 로딩 중이면 AI 호출하지 않음 (stub 상태)
    if (state.school && state.school.allSubjects.length === 0) return;

    const regionName = (() => {
      try {
        const code = localStorage.getItem('hakjum_selected_region') || '';
        const match = REGION_CODES.find((r) => r.code === code);
        return match?.name || '';
      } catch { return ''; }
    })();

    const cacheKey = `${interestText}|${state.school?.name || ''}|${regionName}`;

    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      dispatch({ type: 'SET_EXPLORE_RESULT', payload: cached.result });
      dispatch({ type: 'GO', payload: 'major-results' });
      return;
    }

    if (!canUseAI()) return;

    dispatch({ type: 'GO', payload: 'ai-loading' });
    addSearchHistory(interestText, state.school?.name);

    try {
      const aptitudeInfo = state.aptitudeResult ? '커리어넷 직업흥미검사 완료' : undefined;
      const result = await getExploreRecommendations(interestText, state.school, regionName || undefined, aptitudeInfo);
      recordAIUsage();
      dispatch({ type: 'SET_EXPLORE_RESULT', payload: result });
      cacheRef.current.set(cacheKey, { result, timestamp: Date.now() });
      // Replace ai-loading with major-results (pop loading, then push results)
      dispatch({ type: 'BACK' });
      dispatch({ type: 'GO', payload: 'major-results' });
    } catch {
      dispatch({ type: 'BACK' }); // back to interest-input
    }
  }, [state.interest, state.tags, state.school, dispatch]);

  // ── Select Major (loads detail) ──
  const selectMajor = useCallback(async (majorName: string, category: string) => {
    const callId = ++selectMajorIdRef.current; // 현재 호출 ID
    try {
      const searchResults = await searchMajorsAPI(majorName, category);
      if (callId !== selectMajorIdRef.current) return; // 새 호출이 왔으면 중단

      // 1. 정확 매칭 우선
      const match = searchResults.find((m) => m.name === majorName)
        // 2. 정확 매칭 실패 시에만 부분 매칭 (길이 긴 쪽이 짧은 쪽을 포함할 때만)
        || searchResults.find((m) => m.name.length > majorName.length && m.name.includes(majorName))
        || searchResults.find((m) => majorName.length > m.name.length && majorName.includes(m.name))
        || searchResults[0];

      if (match) {
        const full = await getMajorFullAPI(match.id);
        if (callId !== selectMajorIdRef.current) return; // 새 호출이 왔으면 중단

        full.category = match.category || category || full.category;
        dispatch({ type: 'SET_SELECTED_MAJOR', payload: full });
        dispatch({ type: 'GO', payload: 'major-detail' });

        // Async load — callId 체크로 stale 응답 방지
        getEnrollmentAPI(match.name)
          .then((data) => { if (callId === selectMajorIdRef.current) dispatch({ type: 'SET_ENROLLMENT', payload: data }); })
          .catch(() => {});
        const univNames = full.universitiesFull.map((u) => u.name);
        getUniversityStats(univNames)
          .then((data) => { if (callId === selectMajorIdRef.current) dispatch({ type: 'SET_UNIVERSITY_STATS', payload: data }); })
          .catch(() => {});
      }
    } catch {
      // silently fail — user stays on results
    }
  }, [dispatch]);

  // ── Select University (loads academy info) ──
  const selectUniversity = useCallback((u: import('@/types').UniversityFull) => {
    dispatch({ type: 'SET_SELECTED_UNIVERSITY', payload: u });
    dispatch({ type: 'GO', payload: 'university-detail' });

    // Async load academy info (fire and forget)
    getAcademyInfoStats(u.name)
      .then((data) => dispatch({ type: 'SET_ACADEMY_INFO', payload: data }))
      .catch(() => {});

    // Async load admission results (fire and forget)
    getAdmissionResults(u.name, state.selectedMajor?.name || '')
      .then((data) => { if (data.length > 0) dispatch({ type: 'SET_ADMISSION_RESULTS', payload: data }); })
      .catch(() => {});
  }, [dispatch, state.selectedMajor]);

  // ── Subject Match (recommendation) ──
  const runRecommendation = useCallback(async () => {
    if (!state.school || !state.selectedMajor) return;
    if (state.school.allSubjects.length === 0) return;
    if (!canUseAI()) return;

    dispatch({ type: 'GO', payload: 'subject-match' });
    recordAIUsage();

    // Build a WizardState-compatible object for the existing prompt builder
    const wizardCompat: WizardState = {
      school: state.school,
      grade: state.grade || '2학년',
      careerGoal: state.interest || state.selectedMajor.name,
      tags: state.tags,
      targetMajor: state.selectedMajor,
      aptitudeResult: state.aptitudeResult,
      admissionResults: state.admissionResults || undefined,
    };

    try {
      const prompt = buildPrompt(wizardCompat);
      const result = await callClaudeAPI(prompt);
      dispatch({ type: 'SET_RECOMMENDATION', payload: result });
    } catch (err) {
      console.error('[runRecommendation] AI failed, using fallback:', err);
      try {
        const result = fallbackRecommend(wizardCompat);
        dispatch({ type: 'SET_RECOMMENDATION', payload: result });
      } catch (fbErr) {
        console.error('[runRecommendation] Fallback also failed:', fbErr);
      }
    }
  }, [state.school, state.selectedMajor, state.grade, state.interest, state.tags, dispatch]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);

  return {
    state,
    dispatch,
    go,
    back,
    analyze,
    selectMajor,
    selectUniversity,
    runRecommendation,
    reset,
  };
}
