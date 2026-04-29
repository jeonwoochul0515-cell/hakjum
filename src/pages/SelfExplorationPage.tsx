/**
 * 자가탐색 페이지 — RIASEC + 강점 + 가치관 3개 검사 통합 메뉴.
 *
 * 라우트: /self-exploration
 *
 * - 비인증 사용자: sessionStorage에 결과 저장 (브라우저 탭 종료 시 삭제됨을 안내)
 * - 인증 사용자: Firestore 동기화
 *
 * 디자인 토큰만 사용 (C.brand 등). 외부 차트 라이브러리 없음.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Compass,
  Sparkles,
  Heart,
  CheckCircle2,
  Circle,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { C } from '@/lib/design-tokens';
import { RiasecTest } from '@/components/self-exploration/RiasecTest';
import { StrengthsTest } from '@/components/self-exploration/StrengthsTest';
import { ValuesTest } from '@/components/self-exploration/ValuesTest';
import {
  loadSelfExploration,
  updateSelfExploration,
  type SelfExplorationData,
} from '@/lib/self-exploration/storage';
import { buildPersonalSummary } from '@/lib/self-exploration/personal-context';
import type { RiasecResult } from '@/lib/self-exploration/riasec';
import type { StrengthsResult } from '@/lib/self-exploration/strengths';
import type { ValuesResult } from '@/lib/self-exploration/values';

type ActiveTest = 'menu' | 'riasec' | 'strengths' | 'values';

export default function SelfExplorationPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [data, setData] = useState<SelfExplorationData | null>(null);
  const [active, setActive] = useState<ActiveTest>('menu');
  // 초기값 true → effect 내부에서 setLoading(true)을 다시 부를 필요 없음
  const [loading, setLoading] = useState(true);

  // 초기 로드 — Firestore (인증) 우선 → sessionStorage
  useEffect(() => {
    let cancelled = false;
    loadSelfExploration(currentUser?.uid)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  const handleRiasecComplete = async (r: RiasecResult) => {
    const next = await updateSelfExploration(currentUser?.uid, { riasec: r });
    setData(next);
  };
  const handleStrengthsComplete = async (r: StrengthsResult) => {
    const next = await updateSelfExploration(currentUser?.uid, { strengths: r });
    setData(next);
  };
  const handleValuesComplete = async (r: ValuesResult) => {
    const next = await updateSelfExploration(currentUser?.uid, { values: r });
    setData(next);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 13, color: C.sub }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* 헤더 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 512,
            margin: '0 auto',
            padding: '0 16px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => {
              if (active === 'menu') navigate(-1);
              else setActive('menu');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              color: C.sub,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              letterSpacing: '-0.02em',
            }}
          >
            <ArrowLeft size={16} /> 뒤로
          </button>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, letterSpacing: '-0.025em' }}>
            자가탐색
          </div>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main style={{ maxWidth: 512, margin: '0 auto', padding: '20px 16px 40px' }}>
        {active === 'menu' && (
          <MenuView
            data={data}
            onSelect={setActive}
            isAuthed={!!currentUser}
            onGoToFlow={() => navigate('/flow')}
          />
        )}
        {active === 'riasec' && (
          <RiasecTest
            initialResult={data?.riasec}
            onComplete={handleRiasecComplete}
            onBack={() => setActive('menu')}
          />
        )}
        {active === 'strengths' && (
          <StrengthsTest
            initialResult={data?.strengths}
            onComplete={handleStrengthsComplete}
            onBack={() => setActive('menu')}
          />
        )}
        {active === 'values' && (
          <ValuesTest
            initialResult={data?.values}
            onComplete={handleValuesComplete}
            onBack={() => setActive('menu')}
          />
        )}
      </main>
    </div>
  );
}

interface MenuViewProps {
  data: SelfExplorationData | null;
  onSelect: (t: ActiveTest) => void;
  isAuthed: boolean;
  onGoToFlow: () => void;
}

function MenuView({ data, onSelect, isAuthed, onGoToFlow }: MenuViewProps) {
  const summary = buildPersonalSummary({
    riasec: data?.riasec,
    strengths: data?.strengths,
    values: data?.values,
  });

  const completedCount = [data?.riasec, data?.strengths, data?.values].filter(Boolean).length;

  const tests: {
    key: ActiveTest;
    title: string;
    desc: string;
    questions: number;
    minutes: string;
    icon: typeof Compass;
    completed: boolean;
    summaryLine?: string;
  }[] = [
    {
      key: 'riasec',
      title: 'RIASEC 흥미 검사',
      desc: 'Holland 6유형 — 어떤 활동이 즐거운지',
      questions: 30,
      minutes: '약 4분',
      icon: Compass,
      completed: !!data?.riasec,
      summaryLine: data?.riasec
        ? `${data.riasec.primaryType} · ${data.riasec.secondaryType} 복합`
        : undefined,
    },
    {
      key: 'strengths',
      title: '강점 검사',
      desc: 'VIA 24강점 기반 — 무엇을 자신 있게 잘하는지',
      questions: 24,
      minutes: '약 3분',
      icon: Sparkles,
      completed: !!data?.strengths,
      summaryLine: data?.strengths ? data.strengths.topAreas.slice(0, 2).join('·') : undefined,
    },
    {
      key: 'values',
      title: '가치관 검사',
      desc: 'Schwartz 직업가치 — 일에서 무엇이 중요한지',
      questions: 18,
      minutes: '약 2분',
      icon: Heart,
      completed: !!data?.values,
      summaryLine: data?.values ? data.values.topValues.slice(0, 2).join('·') : undefined,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 인트로 */}
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: C.brandSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Compass size={28} color={C.brand} />
        </div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: '-0.03em',
          }}
        >
          나를 더 깊이 알아볼까요?
        </h1>
        <p
          style={{
            fontSize: 13,
            color: C.sub,
            marginTop: 8,
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
          }}
        >
          흥미·강점·가치관 3가지 자체 검사로
          <br />
          AI 학과 추천이 더 정확해져요 (총 약 10분)
        </p>
      </div>

      {/* 진행 요약 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: `1px solid ${C.line}`,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: completedCount === 3 ? C.brand : C.brandSoft,
            color: completedCount === 3 ? '#fff' : C.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {completedCount}/3
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: '-0.02em',
            }}
          >
            {completedCount === 0
              ? '아직 검사를 시작하지 않았어요'
              : completedCount === 3
                ? '모든 검사를 완료했어요!'
                : `${3 - completedCount}개 검사 남았어요`}
          </div>
          {summary && (
            <div
              style={{
                fontSize: 11.5,
                color: C.sub,
                marginTop: 2,
                letterSpacing: '-0.01em',
              }}
            >
              {summary}
            </div>
          )}
        </div>
      </div>

      {/* 검사 카드 3개 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tests.map((t) => (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              background: '#fff',
              border: `1px solid ${t.completed ? C.brand : C.line}`,
              borderRadius: 16,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border 150ms',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: t.completed ? C.brand : C.brandSoft,
                color: t.completed ? '#fff' : C.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <t.icon size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: '-0.025em',
                  }}
                >
                  {t.title}
                </span>
                {t.completed ? (
                  <CheckCircle2 size={14} color={C.brand} />
                ) : (
                  <Circle size={14} color={C.line} />
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.sub,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.45,
                }}
              >
                {t.desc}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 6,
                  fontSize: 11,
                  color: C.sub,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span>{t.questions}문항</span>
                <span>·</span>
                <span>{t.minutes}</span>
                {t.summaryLine && (
                  <>
                    <span>·</span>
                    <span style={{ color: C.brand, fontWeight: 700 }}>{t.summaryLine}</span>
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 다음 단계 안내 */}
      {completedCount > 0 && (
        <button
          onClick={onGoToFlow}
          style={{
            padding: '14px 16px',
            background: C.brand,
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '-0.02em',
          }}
        >
          AI 학과 추천 받으러 가기
        </button>
      )}

      {/* 안내 — 비인증 sessionStorage */}
      {!isAuthed && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: 12,
            background: C.brandSoft,
            borderRadius: 12,
          }}
        >
          <Info size={16} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
          <p
            style={{
              fontSize: 11.5,
              color: C.sub,
              lineHeight: 1.55,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            로그인 없이도 검사를 진행할 수 있어요. 결과는 이 브라우저 탭이 닫힐 때까지 유지됩니다.
            로그인하시면 결과가 영구 저장되고 다른 기기에서도 이어볼 수 있어요.
          </p>
        </div>
      )}
    </div>
  );
}
