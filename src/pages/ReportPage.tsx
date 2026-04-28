import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, Crown, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { ReportProvider, useReportContext } from '@/context/ReportContext';
import { ReportInputStep } from '@/components/report/ReportInputStep';
import { ReportPreviewStep } from '@/components/report/ReportPreviewStep';
import { useAuth } from '@/context/AuthContext';
import { saveReport, getReport, getLatestReport, markReportPaid } from '@/lib/report-storage';
import type { ReportData } from '@/types/report';

// generateReport는 다른 에이전트가 구현 중이므로 동적 import로 안전하게 로드
async function loadGenerateReport() {
  try {
    const mod = await import('@/lib/report-engine');
    return mod.generateReport;
  } catch {
    return null;
  }
}

export default function ReportPage() {
  return (
    <ReportProvider>
      <ReportPageInner />
    </ReportProvider>
  );
}

function ReportPageInner() {
  const { state, dispatch } = useReportContext();
  const { currentUser, isPaidUser } = useAuth();
  const [searchParams] = useSearchParams();
  const restoredRef = useRef(false);
  const lastSavedIdRef = useRef<string | null>(null);

  // 결제 완료 후 복원: sessionStorage 의 pendingReport → 잠금해제
  // 또는 Firestore 의 사용자 보고서 (?id=xxx 또는 최근 1건) 자동 복원
  useEffect(() => {
    if (restoredRef.current) return;

    const pending = sessionStorage.getItem('pendingReport');
    if (pending) {
      try {
        const reportData = JSON.parse(pending) as ReportData;
        dispatch({ type: 'SET_REPORT', payload: reportData });
        dispatch({ type: 'SET_PAID' });
        restoredRef.current = true;
        // Firestore 영구 저장 (결제분으로 표시)
        if (currentUser?.uid) {
          markReportPaid(currentUser.uid, reportData).catch(() => undefined);
        }
      } catch { /* ignore */ }
      sessionStorage.removeItem('pendingReport');
      return;
    }

    // Firestore 새로고침 복원 — 인증된 사용자에 한함
    if (!currentUser?.uid) return;
    const wantId = searchParams.get('id');
    (async () => {
      try {
        const data = wantId
          ? await getReport(currentUser.uid, wantId)
          : await getLatestReport(currentUser.uid);
        if (data) {
          dispatch({ type: 'SET_REPORT', payload: data });
          if (data.isPaid || isPaidUser) {
            dispatch({ type: 'SET_PAID' });
          }
          restoredRef.current = true;
          lastSavedIdRef.current = data.id;
        }
      } catch { /* ignore */ }
    })();
  }, [dispatch, currentUser, searchParams, isPaidUser]);

  // 새로 생성된 보고서 자동 저장 (Firestore)
  useEffect(() => {
    const data = state.reportData;
    if (!data || !currentUser?.uid) return;
    if (lastSavedIdRef.current === data.id) return;
    lastSavedIdRef.current = data.id;
    saveReport(currentUser.uid, { ...data, isPaid: state.isPaid }).catch(() => undefined);
  }, [state.reportData, state.isPaid, currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <ReportNav />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        <ReportContent />
      </div>
    </div>
  );
}

// ── 네비게이션 바 (HomePage 패턴) ──
function ReportNav() {
  const { currentUser } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/butterfly.svg" alt="" className="w-6 h-6" />
            <span className="text-sm font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
              학점나비
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/subscription"
            className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium hover:bg-amber-100 transition-colors flex items-center gap-1"
          >
            <Crown size={12} />
            요금제
          </Link>
          {currentUser ? (
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-primary hover:bg-sky-200 transition-colors"
            >
              <User size={16} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-medium hover:bg-slate-200 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── 콘텐츠 라우팅 ──
function ReportContent() {
  const { state } = useReportContext();

  switch (state.currentStep) {
    case 'input':
      return (
        <>
          {state.error && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-4 animate-fade-in-up">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={16} />
                <p className="text-sm font-medium">{state.error}</p>
              </div>
            </div>
          )}
          <ReportInputStep />
        </>
      );

    case 'loading':
      return <ReportLoadingStep />;

    case 'preview':
      return <ReportPreviewStep isPaid={false} />;

    case 'full':
      return <ReportPreviewStep isPaid={true} />;

    default:
      return <ReportInputStep />;
  }
}

// ── 로딩 화면 ──
const LOADING_PHASES = [
  { text: 'AI가 127개 학과를 분석하고 있습니다...', duration: 3000 },
  { text: '교과이수기준 데이터를 매칭하고 있습니다...', duration: 3000 },
  { text: '대학별 입시 전략을 수립하고 있습니다...', duration: 3000 },
  { text: '맞춤 로드맵을 생성하고 있습니다...', duration: 3000 },
];

function ReportLoadingStep() {
  const { state, dispatch } = useReportContext();
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // 페이크 프로그레스
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // 90%에서 대기 (실제 완료 시 100%)
        return prev + Math.random() * 3 + 0.5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 페이즈 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % LOADING_PHASES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 보고서 생성 API 호출
  const callGenerateReport = useCallback(async () => {
    if (!state.input) return;

    try {
      const generateReport = await loadGenerateReport();
      if (!generateReport) {
        throw new Error('보고서 생성 엔진이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      }

      const reportData = await generateReport(state.input);
      setProgress(100);

      // 약간의 지연 후 전환 (100% 표시)
      setTimeout(() => {
        dispatch({ type: 'SET_REPORT', payload: reportData });
      }, 500);
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err?.message || '보고서 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
      });
    }
  }, [state.input, dispatch]);

  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      callGenerateReport();
    }
  }, [hasStarted, callGenerateReport]);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
      {/* 메인 로딩 아이콘 */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 flex items-center justify-center">
          <Sparkles size={32} className="text-sky-primary animate-pulse" />
        </div>
        <div
          className="absolute -inset-2 rounded-full border-2 border-sky-primary/20 animate-spin"
          style={{ animationDuration: '3s' }}
        />
      </div>

      {/* 단계 텍스트 */}
      <div className="text-center mb-6" key={phase}>
        <p className="text-sm font-medium text-slate-700 animate-fade-in-up">
          {LOADING_PHASES[phase].text}
        </p>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-64 bg-slate-100 rounded-full h-2 mb-3">
        <div
          className="bg-gradient-to-r from-sky-primary to-indigo-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mb-8">{Math.round(Math.min(progress, 100))}%</p>

      {/* 정보 카드 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 max-w-xs w-full">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          {state.input?.school.name}의 개설과목과 대학별 교과이수기준을
          교차 분석하여 맞춤 보고서를 생성하고 있어요.
        </p>
      </div>

      {/* 뒤로가기 */}
      <button
        onClick={() => dispatch({ type: 'SET_STEP', payload: 'input' })}
        className="mt-6 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
      >
        <ArrowLeft size={12} />
        입력 화면으로 돌아가기
      </button>
    </div>
  );
}
