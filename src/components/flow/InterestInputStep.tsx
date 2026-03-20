import { Sparkles, CheckCircle2, ExternalLink, ClipboardList } from 'lucide-react';
import { GradeSelector } from '@/components/career/GradeSelector';
import { QuickTag } from '@/components/career/QuickTag';
import { RecentSearches } from '@/components/explore/RecentSearches';
import { useFlow } from '@/hooks/useFlow';
import { getRemainingUsage, getDailyLimit, canUseAI } from '@/lib/usage';

export function InterestInputStep() {
  const { state, dispatch, go, analyze, selectMajor } = useFlow();

  const canProceed = (state.interest.trim().length >= 2 || state.tags.length > 0) && canUseAI();
  const remaining = getRemainingUsage();
  const limit = getDailyLimit();

  const handleRecentSelect = (q: string) => {
    dispatch({ type: 'SET_INTEREST', payload: q });
    setTimeout(() => analyze(), 50);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-slate-800">어떤 꿈을 꾸고 있나요?</h1>
        <p className="text-sm text-slate-500 mt-1">관심사를 알려주면 AI가 맞춤 학과를 추천해드려요</p>
      </div>

      {/* 적성검사: 완료 시 결과 배지, 미완료 시 선택 카드 */}
      {state.aptitudeResult?.url ? (
        <a
          href={state.aptitudeResult.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2.5 border border-green-200 hover:bg-green-100 transition-colors"
        >
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="text-sm font-medium text-green-700 flex-1">흥미검사 완료</span>
          <ExternalLink size={14} className="text-green-400" />
        </a>
      ) : (
        <button
          onClick={() => go('aptitude-intro')}
          className="w-full flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <ClipboardList size={16} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-600">직업흥미검사 해보기</p>
            <p className="text-[11px] text-slate-400">커리어넷 검사로 적성을 먼저 파악해보세요 (선택)</p>
          </div>
        </button>
      )}

      {/* 학년 */}
      <GradeSelector
        value={state.grade}
        onChange={(g) => dispatch({ type: 'SET_GRADE', payload: g })}
      />

      {/* 관심 분야 태그 */}
      <QuickTag
        tags={state.tags}
        selected={state.tags}
        onToggle={(tag) => dispatch({ type: 'TOGGLE_TAG', payload: tag })}
      />

      {/* 자유 텍스트 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          <Sparkles size={12} className="inline mr-1 -mt-0.5" />
          장래희망 / 관심 분야 (선택)
        </label>
        <textarea
          value={state.interest}
          onChange={(e) => dispatch({ type: 'SET_INTEREST', payload: e.target.value })}
          placeholder="예: 코딩이 재미있고 AI에 관심이 많아요 / 사람을 돕는 일을 하고 싶어요"
          rows={2}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary transition-all leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canProceed) analyze();
            }
          }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={analyze}
        disabled={!canProceed}
        className="w-full py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-2"
      >
        <Sparkles size={16} />
        AI 학과 추천 받기
      </button>
      {remaining < limit && (
        <p className={`text-xs text-center ${remaining === 0 ? 'text-red-500' : 'text-slate-400'}`}>
          {remaining === 0
            ? '오늘 무료 추천 횟수를 모두 사용했어요'
            : `오늘 남은 무료 추천: ${remaining}/${limit}회`}
        </p>
      )}

      {/* 최근 검색 */}
      <RecentSearches
        onSelectInterest={handleRecentSelect}
        onSelectMajor={(name, cat) => selectMajor(name, cat)}
      />
    </div>
  );
}
