import { Sparkles, ChevronRight, FileText, RefreshCw, Search } from 'lucide-react';
import { GradeSelector } from '@/components/career/GradeSelector';
import { QuickTag } from '@/components/career/QuickTag';
import { useFlow } from '@/hooks/useFlow';
import { getRemainingUsage, getDailyLimit, canUseAI } from '@/lib/usage';
import { C } from '@/lib/design-tokens';

export function InterestInputStep() {
  const { state, dispatch, go, analyze, selectMajor } = useFlow();

  const canProceed = (state.interest.trim().length >= 2 || state.tags.length > 0) && canUseAI();
  const remaining = getRemainingUsage();
  const limit = getDailyLimit();

  const handleRecentSelect = (q: string) => {
    dispatch({ type: 'SET_INTEREST', payload: q });
    setTimeout(() => analyze(), 50);
  };
  void selectMajor;

  return (
    <div className="animate-fade-in-up">
      {/* 진행 표시 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        <Step n={1} label="관심사 입력" active />
        <Step n={2} label="AI 분석" />
        <Step n={3} label="결과 확인" />
      </div>

      {/* 타이틀 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', lineHeight: 1.3, color: C.ink }}>
          어떤 꿈을<br />꾸고 있나요?
        </h1>
        <p style={{ fontSize: 13, color: C.sub, margin: 0, letterSpacing: '-0.01em' }}>
          관심사를 알려주면 AI가 맞춤 학과를 추천해드려요
        </p>
      </div>

      {/* 직업흥미검사 카드 */}
      {!state.aptitudeResult?.url && (
        <button
          onClick={() => go('aptitude-intro')}
          className="cursor-pointer transition-colors text-left"
          style={{
            background: C.bg,
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 28,
            width: '100%',
            border: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${C.line}`,
              flexShrink: 0,
            }}
          >
            <FileText size={18} color={C.brand} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink }}>
              직업흥미검사 해보기
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>
              커리어넷 검사로 적성을 먼저 파악해보세요 (선택)
            </div>
          </div>
          <ChevronRight size={16} color={C.sub} />
        </button>
      )}

      {state.aptitudeResult?.url && (
        <a
          href={state.aptitudeResult.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#eef9f0',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 28,
            border: '1px solid #c8ecd2',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#1c7a3e',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1c7a3e', flex: 1 }}>
            흥미검사 완료
          </span>
        </a>
      )}

      {/* 학년 */}
      <div style={{ marginBottom: 24 }}>
        <GradeSelector
          value={state.grade}
          onChange={(g) => dispatch({ type: 'SET_GRADE', payload: g })}
        />
      </div>

      {/* 관심 분야 */}
      <div style={{ marginBottom: 24 }}>
        <QuickTag
          tags={state.tags}
          selected={state.tags}
          onToggle={(tag) => dispatch({ type: 'TOGGLE_TAG', payload: tag })}
        />
      </div>

      {/* 장래희망 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.025em', color: C.ink }}>
          장래희망 / 관심 분야 <span style={{ color: C.sub, fontWeight: 500 }}>(선택)</span>
        </div>
        <textarea
          value={state.interest}
          onChange={(e) => dispatch({ type: 'SET_INTEREST', payload: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canProceed) analyze();
            }
          }}
          placeholder="예 : 코딩이 재미있고 AI에 관심이 많아요"
          style={{
            width: '100%',
            minHeight: 80,
            padding: 14,
            fontSize: 13.5,
            color: C.ink,
            background: C.bg,
            border: 'none',
            borderRadius: 12,
            resize: 'none',
            outline: 'none',
            letterSpacing: '-0.01em',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={analyze}
        disabled={!canProceed}
        className="cursor-pointer active:scale-[0.98] transition-transform"
        style={{
          width: '100%',
          padding: 18,
          background: C.brand,
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          letterSpacing: '-0.02em',
          boxShadow: `0 6px 20px ${C.brandShadow}`,
          opacity: canProceed ? 1 : 0.5,
        }}
      >
        <Sparkles size={18} strokeWidth={2.2} />
        AI 학과 추천 받기
      </button>
      <div style={{ fontSize: 11, color: C.sub, textAlign: 'center', marginTop: 10 }}>
        예상 분석 시간 8초 · 무료
        {remaining < limit && (
          <>
            {' · '}
            <span style={{ color: remaining === 0 ? '#dc2626' : C.sub }}>
              {remaining === 0 ? '오늘 무료 추천 횟수 소진' : `오늘 남은 ${remaining}/${limit}회`}
            </span>
          </>
        )}
      </div>

      {/* 최근 검색 */}
      <RecentSearchesCompact onSelect={handleRecentSelect} />
    </div>
  );
}

function Step({ n, label, active }: { n: number; label: string; active?: boolean }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ height: 3, borderRadius: 2, background: active ? C.brand : C.line }} />
      <div
        style={{
          fontSize: 10.5,
          marginTop: 6,
          color: active ? C.brand : C.sub,
          fontWeight: active ? 700 : 500,
          letterSpacing: '-0.01em',
        }}
      >
        {n}. {label}
      </div>
    </div>
  );
}

function RecentSearchesCompact({ onSelect }: { onSelect: (q: string) => void }) {
  const recent = (() => {
    try {
      const raw = localStorage.getItem('hakjum-recent-interests');
      if (!raw) return [] as string[];
      return JSON.parse(raw) as string[];
    } catch {
      return [] as string[];
    }
  })();
  if (recent.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
          fontSize: 11.5,
          color: C.sub,
          fontWeight: 600,
        }}
      >
        <RefreshCw size={12} />
        최근 검색
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {recent.slice(0, 5).map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="cursor-pointer"
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: C.bg,
              fontSize: 11.5,
              color: C.ink,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
            }}
          >
            <Search size={11} color={C.sub} />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
