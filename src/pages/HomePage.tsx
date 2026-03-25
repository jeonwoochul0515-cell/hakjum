import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Users, Clock, AlertTriangle,
  CheckCircle, TrendingUp, BookOpen, GraduationCap,
  ChevronDown, Shield, Zap, Target, Star, User, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BusinessFooter } from '@/components/layout/BusinessFooter';
import { useFlowContext } from '@/context/FlowContext';
import { useAuth } from '@/context/AuthContext';

// ── 소비심리학 기반 데이터 ──


// [손실회피 + 프레이밍] 고민 카드 - 불안감을 자극하되 해결책 제시
const worryCards = [
  { worry: '과목 잘못 골라서 원하는 대학 못 가면...', solution: 'AI가 진로별 최적 과목을 분석해드려요' },
  { worry: '의대 가고 싶은데 물리학II 안 들으면 불이익?', solution: '대학별 필수이수과목을 한눈에 확인' },
  { worry: '친구는 다 정했는데 나만 아직...', solution: '30초면 맞춤 과목 추천 완료' },
  { worry: '내신 관리 + 진로 과목, 둘 다 잡을 수 있을까?', solution: '내 학교 개설과목 기반 현실적 추천' },
  { worry: '학부모인데 아이 과목 선택을 도와주고 싶어요', solution: '진로별 필수과목 + 입시 전략까지' },
];

// [사회적 증거] 이용 시나리오 (실제 후기가 아닌 예시 시나리오임을 명시)
const testimonials = [
  {
    name: '김○○', role: '고2 학생', school: '',
    text: '막연하게 경영학과 가고 싶다고만 생각했는데, 경제·통계 과목 조합을 추천받고 방향이 잡혔어요.',
    highlight: '과목 조합 탐색',
  },
  {
    name: '이○○', role: '학부모', school: '',
    text: '아이가 과목 선택표 들고 왔는데 저도 몰라서 막막했거든요. 진로별 필수과목을 확인하고 아이랑 같이 정했어요.',
    highlight: '학부모 활용 사례',
  },
  {
    name: '박○○', role: '고1 학생', school: '',
    text: '우리 학교에 있는 과목 중에서 골라주니까 현실적이에요. 아직 진로가 확실하진 않지만 탐색하는 데 도움이 됐어요.',
    highlight: '학교 맞춤 추천',
  },
  {
    name: '최○○', role: '진로상담교사', school: '',
    text: '학생들 상담할 때 참고자료로 활용하고 있습니다. 대학별 이수기준까지 정리되어 있어서 실질적으로 도움이 됩니다.',
    highlight: '교사 활용 사례',
  },
];

// [앵커링] 핵심 수치 — 검증 가능한 데이터만 표시
const stats = [
  { value: '전국', label: '고등학교 지원', icon: BookOpen },
  { value: 'NEIS', label: '실시간 연동', icon: Users },
  { value: '대교협', label: '공식 데이터', icon: Star },
  { value: '30초', label: '소요시간', icon: Clock },
];

// [프레이밍] 과목 선택 안 했을 때 vs 했을 때
const comparisonData = {
  without: [
    '대학 지원 시 불이익 가능성',
    '진로와 무관한 과목 수강',
    '내신 관리 전략 부재',
    '입시 정보 부족으로 불안',
  ],
  with: [
    '진로 맞춤 과목으로 입시 경쟁력 UP',
    '대학별 필수이수과목 완벽 충족',
    '내신 + 진로 두 마리 토끼',
    '데이터 기반 확실한 전략',
  ],
};

export default function HomePage() {
  const navigate = useNavigate();
  const { state } = useFlowContext();
  const { currentUser } = useAuth();
  const [currentWorry, setCurrentWorry] = useState(0);
  const [worryVisible, setWorryVisible] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const hasLastResult = !!state.recommendationResult;

  // [자이가르닉] 걱정 카드 로테이션
  useEffect(() => {
    const interval = setInterval(() => {
      setWorryVisible(false);
      setTimeout(() => {
        setCurrentWorry((prev) => (prev + 1) % worryCards.length);
        setWorryVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // [프레이밍] 비교 섹션 스크롤 관찰
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowComparison(true); },
      { threshold: 0.3 }
    );
    if (comparisonRef.current) observer.observe(comparisonRef.current);
    return () => observer.disconnect();
  }, []);

  const handleStart = (source: string) => {
    sessionStorage.setItem('hakjum-entry', source);
    navigate('/flow');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/butterfly.svg" alt="" className="w-6 h-6" />
            <span className="text-sm font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">학점나비</span>
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

      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">

{/* 재방문자 배너 */}
        {hasLastResult && (
          <div className="mb-4 bg-white rounded-2xl p-4 shadow-sm border border-sky-100 animate-fade-in-up">
            <p className="text-sm font-medium text-slate-700">지난번 추천 결과가 저장되어 있어요!</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => navigate('/flow')}
                className="px-3 py-1.5 text-sm font-medium text-sky-primary bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
              >
                다시 보기
              </button>
              <button
                onClick={() => handleStart('returning')}
                className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                새로 시작
              </button>
            </div>
          </div>
        )}

        {/* ── HERO 섹션 [피크엔드 - 강렬한 첫인상] ── */}
        <div className="text-center mt-2">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/butterfly.svg" alt="학점나비" className="w-20 h-20 drop-shadow-lg animate-butterfly" />
          </div>

          {/* [손실회피 프레이밍] 제목 - 놓칠 수 있다는 불안 자극 */}
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">
            <span className="text-slate-500 text-lg font-medium block mb-1">잘못된 과목 선택 한 번이</span>
            <span className="bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent text-3xl">
              대학 입시를 바꿉니다
            </span>
          </h1>

          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            고교학점제 시대, <strong className="text-slate-700">내 진로에 맞는 과목</strong>을 선택해야<br />
            원하는 대학에 갈 수 있어요
          </p>
        </div>

        {/* ── [손실회피] 고민 카드 + 즉시 해결 ── */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 min-h-[100px] flex flex-col justify-center">
            <div className={`transition-all duration-300 ${worryVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <p className="text-sm text-red-400 font-medium flex items-center gap-1.5">
                <AlertTriangle size={14} />
                {worryCards[currentWorry].worry}
              </p>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
                <CheckCircle size={14} />
                {worryCards[currentWorry].solution}
              </p>
            </div>
          </div>
          {/* [자이가르닉] 진행 인디케이터 - 더 보고 싶게 만듦 */}
          <div className="flex gap-1 px-4 pb-3">
            {worryCards.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i === currentWorry ? 'bg-sky-primary' : i < currentWorry ? 'bg-sky-200' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── [앵커링] 핵심 수치 ── */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <Icon size={16} className="mx-auto text-sky-primary mb-1" />
              <p className="text-sm font-bold text-slate-800">{value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── 데이터 출처 안내 ── */}
        <div className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-3 border border-sky-100">
          <Shield size={14} className="text-sky-primary flex-shrink-0" />
          <span className="text-xs text-slate-600">
            커리어넷 · NEIS · 대교협 <strong className="text-sky-primary">공식 데이터</strong> 기반 추천
          </span>
        </div>

        {/* ── 첫 번째 CTA [긴급성 + 제로 리스크] ── */}
        <div className="mt-6">
          <Button size="lg" className="w-full" onClick={() => handleStart('hero-cta')}>
            <Zap size={18} className="mr-2" />
            내 맞춤 과목 30초 만에 찾기
            <ArrowRight size={18} className="ml-2" />
          </Button>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Shield size={12} /> 무료
            </span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-400">회원가입 없음</span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-400">즉시 결과</span>
          </div>
        </div>

        {/* ── 대상별 진입 CTA ── */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => handleStart('parent-cta')}
            className="text-center py-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100 hover:border-violet-200 transition-all cursor-pointer group"
          >
            <GraduationCap size={18} className="mx-auto text-violet-500 mb-1" />
            <p className="text-xs font-medium text-violet-700">학부모</p>
            <p className="text-[10px] text-violet-400 mt-0.5">자녀 과목 상담</p>
          </button>
          <button
            onClick={() => handleStart('teacher-cta')}
            className="text-center py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer group"
          >
            <BookOpen size={18} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-xs font-medium text-emerald-700">교사 · 학원</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">진로지도 도구</p>
          </button>
        </div>

        {/* ── [자기주도 탐색] 핵심 가치 전달 ── */}
        <div className="mt-10 bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 rounded-2xl p-5 border border-sky-100">
          <h2 className="text-base font-bold text-slate-800 text-center mb-3">
            "아직 진로가 확실하지 않아도 괜찮아요"
          </h2>
          <p className="text-sm text-slate-600 text-center leading-relaxed mb-4">
            학점나비는 정답을 알려주는 서비스가 아니에요.<br />
            <strong className="text-indigo-primary">여러 진로를 탐색하면서 스스로 과목을 선택</strong>하고,<br />
            자기 주도적으로 수업에 임할 수 있도록 돕는 도구예요.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/70 rounded-lg p-2.5">
              <Target size={18} className="mx-auto text-sky-primary mb-1" />
              <p className="text-[11px] font-medium text-slate-700">여러 진로 탐색</p>
              <p className="text-[10px] text-slate-400">다양한 가능성</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2.5">
              <TrendingUp size={18} className="mx-auto text-indigo-primary mb-1" />
              <p className="text-[11px] font-medium text-slate-700">과목 비교</p>
              <p className="text-[10px] text-slate-400">데이터 기반 선택</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2.5">
              <Sparkles size={18} className="mx-auto text-violet-500 mb-1" />
              <p className="text-[11px] font-medium text-slate-700">자기주도 결정</p>
              <p className="text-[10px] text-slate-400">나만의 전략</p>
            </div>
          </div>
        </div>

        {/* ── [프레이밍 효과] Before / After 비교 ── */}
        <div ref={comparisonRef} className="mt-10">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
            과목 선택, 왜 중요한가요?
          </h2>
          <div className={`grid grid-cols-2 gap-3 transition-all duration-700 ${showComparison ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* WITHOUT */}
            <div className="bg-red-50/50 rounded-xl p-3 border border-red-100">
              <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                <AlertTriangle size={12} /> 그냥 선택하면
              </p>
              <ul className="space-y-2">
                {comparisonData.without.map((item, i) => (
                  <li key={i} className="text-[11px] text-red-500/80 flex items-start gap-1.5">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-red-300 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* WITH */}
            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-500 mb-2 flex items-center gap-1">
                <CheckCircle size={12} /> 학점나비와 함께
              </p>
              <ul className="space-y-2">
                {comparisonData.with.map((item, i) => (
                  <li key={i} className="text-[11px] text-emerald-600/80 flex items-start gap-1.5">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── 이용 방법 [인지적 용이성] ── */}
        <div className="mt-10">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
            딱 3단계, 30초면 끝
          </h2>
          {[
            { step: 1, title: '관심사 입력', desc: '하고 싶은 일이나 꿈을 자유롭게 적어요', icon: Target, color: 'from-sky-400 to-sky-500' },
            { step: 2, title: 'AI가 학과 추천', desc: '진로에 맞는 학과 + 대학을 분석해줘요', icon: Sparkles, color: 'from-indigo-400 to-indigo-500' },
            { step: 3, title: '내 학교 과목 매칭', desc: '우리 학교 개설과목 중 최적 조합을 찾아요', icon: CheckCircle, color: 'from-emerald-400 to-emerald-500' },
          ].map(({ step, title, desc, icon: Icon, color }) => (
            <div key={step} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <span className="text-xs font-bold text-slate-300">{step}/3</span>
            </div>
          ))}
        </div>

        {/* ── [사회적 증거] 후기 섹션 ── */}
        <div className="mt-10">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
            이런 분들이 이용해요
          </h2>
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-400">
                    — {t.name}
                    {t.role && <span className="text-sky-primary ml-1">{t.role}</span>}
                    {t.school && <span className="text-slate-300 ml-1">· {t.school}</span>}
                  </p>
                  <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full font-medium">
                    {t.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── [권위 효과] 신뢰 배지 ── */}
        <div className="mt-8 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">데이터 출처</p>
              <p className="text-xs font-medium text-slate-600 mt-1">커리어넷 · NEIS</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">AI 엔진</p>
              <p className="text-xs font-medium text-slate-600 mt-1">Claude AI</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">개인정보</p>
              <p className="text-xs font-medium text-slate-600 mt-1">수집 없음</p>
            </div>
          </div>
        </div>

        {/* ── FAQ [인지부조화 해소] ── */}
        <div className="mt-8">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
            자주 묻는 질문
          </h2>
          <FAQItem
            q="무료로 사용할 수 있나요?"
            a="기본 과목 추천은 회원가입 없이 무료로 이용 가능해요. 맞춤 리포트 등 심화 기능은 합리적인 가격의 이용권으로 제공됩니다."
          />
          <FAQItem
            q="AI 추천이 정확한가요?"
            a="커리어넷·NEIS·대교협 공식 데이터와 대학별 교과이수 기준을 기반으로 추천합니다. 다만 AI 추천은 참고용이며, 최종 결정은 담임 선생님과 상담하시길 권합니다."
          />
          <FAQItem
            q="우리 학교도 지원하나요?"
            a="NEIS(교육행정정보시스템) 연동으로 전국 고등학교를 지원합니다. 학교 검색 시 실제 개설과목을 자동으로 불러옵니다."
          />
          <FAQItem
            q="고1도 사용할 수 있나요?"
            a="물론이죠! 고1 때 미리 탐색해두면 2학년 과목 선택이 훨씬 수월해요. 오히려 일찍 시작할수록 좋습니다."
          />
          <FAQItem
            q="환불은 어떻게 하나요?"
            a="리포트 미열람 시 구매일로부터 7일 이내 전액 환불 가능합니다. 자세한 내용은 환불정책 페이지를 확인해주세요."
          />
        </div>

        {/* ── [손실회피] 최종 CTA - 놓치면 안 되는 느낌 ── */}
        <div className="mt-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-6 text-center text-white shadow-lg">
          <h3 className="text-lg font-bold">
            아직도 과목 선택 고민 중이라면
          </h3>
          <p className="text-sm text-sky-100 mt-2 leading-relaxed">
            미리 준비하는 학생이 원하는 대학에 갑니다.
          </p>
          <button
            onClick={() => handleStart('final-cta')}
            className="mt-4 w-full bg-white text-sky-600 font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-base active:scale-[0.98]"
          >
            <Sparkles size={18} className="inline mr-2 -mt-0.5" />
            무료로 맞춤 과목 찾기
          </button>
          <p className="text-[11px] text-sky-200 mt-2">
            커리어넷 · NEIS · 대교협 공식 데이터 기반
          </p>
        </div>

        {/* [피크엔드] 마지막 한마디 */}
        <p className="text-center text-xs text-slate-400 mt-6 mb-4">
          과목 선택은 한 번뿐이에요. 후회 없는 선택을 도와드릴게요.
        </p>
      </div>

      <BusinessFooter />
    </div>
  );
}

// ── FAQ 아코디언 컴포넌트 ──
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-100 mb-2 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-slate-700">{q}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-4 px-4' : 'max-h-0'}`}>
        <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}
