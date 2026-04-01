import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Users, Clock,
  CheckCircle, BookOpen, GraduationCap,
  ChevronDown, Shield, Target, Star, User, Crown,
  Search, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BusinessFooter } from '@/components/layout/BusinessFooter';
import { useFlowContext } from '@/context/FlowContext';
import { useAuth } from '@/context/AuthContext';

// ── 핵심 수치 ──
const stats = [
  { value: '전국', label: '고등학교 지원', icon: BookOpen },
  { value: 'NEIS', label: '실시간 연동', icon: Users },
  { value: '대교협', label: '공식 데이터', icon: Star },
  { value: '30초', label: '소요시간', icon: Clock },
];

// ── 이용 시나리오 ──
const testimonials = [
  {
    name: '김○○', role: '고2 학생',
    text: '막연하게 경영학과 가고 싶다고만 생각했는데, 경제·통계 과목 조합을 추천받고 방향이 잡혔어요.',
    highlight: '과목 조합 탐색',
  },
  {
    name: '이○○', role: '학부모',
    text: '아이가 과목 선택표 들고 왔는데 저도 몰라서 막막했거든요. 진로별 필수과목을 확인하고 아이랑 같이 정했어요.',
    highlight: '학부모 활용 사례',
  },
  {
    name: '박○○', role: '고1 학생',
    text: '우리 학교에 있는 과목 중에서 골라주니까 현실적이에요. 아직 진로가 확실하진 않지만 탐색하는 데 도움이 됐어요.',
    highlight: '학교 맞춤 추천',
  },
  {
    name: '최○○', role: '진로상담교사',
    text: '학생들 상담할 때 참고자료로 활용하고 있습니다. 대학별 이수기준까지 정리되어 있어서 실질적으로 도움이 됩니다.',
    highlight: '교사 활용 사례',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useFlowContext();
  const { currentUser } = useAuth();
  const [interestInput, setInterestInput] = useState('');
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const hasLastResult = !!state.recommendationResult;

  // Sticky CTA: Hero가 뷰포트를 벗어나면 표시
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleStart = (source: string) => {
    sessionStorage.setItem('hakjum-entry', source);
    navigate('/flow');
  };

  const handleInterestSubmit = () => {
    if (!interestInput.trim()) {
      handleStart('inline-cta');
      return;
    }
    sessionStorage.setItem('hakjum-entry', 'inline-cta');
    dispatch({ type: 'SET_INTEREST', payload: interestInput.trim() });
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

        {/* ── HERO 섹션 [가치 제안] ── */}
        <div ref={heroRef} className="text-center mt-2">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/butterfly.svg" alt="학점나비" className="w-20 h-20 drop-shadow-lg animate-butterfly" />
          </div>

          <p className="text-xs font-medium text-sky-primary tracking-wider mb-2">
            AI 과목 추천 서비스
          </p>

          <h1 className="text-2xl font-bold text-slate-800 leading-tight">
            내 꿈에 딱 맞는 과목,
            <br />
            <span className="bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent text-3xl">
              30초면 찾아드려요
            </span>
          </h1>

          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            학교 개설과목 + 대학 입시기준을<br />
            <strong className="text-slate-700">AI가 교차 분석</strong>해서 최적 과목을 추천합니다
          </p>
        </div>

        {/* ── How it Works [3단계] ── */}
        <div className="mt-8">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
            이렇게 진행돼요
          </h2>
          {[
            {
              step: 1, title: '관심사 입력', icon: Target, color: 'from-sky-400 to-sky-500',
              desc: '하고 싶은 일이나 꿈을 자유롭게 적어요',
              why: '학교를 알려주면 실제 개설과목 중에서 추천해요',
            },
            {
              step: 2, title: 'AI가 학과 + 대학 분석', icon: Sparkles, color: 'from-indigo-400 to-indigo-500',
              desc: '진로에 맞는 학과를 찾고 입시결과까지 분석해요',
              why: '대학별 교과이수기준과 커트라인을 참고해요',
            },
            {
              step: 3, title: '맞춤 과목 추천', icon: CheckCircle, color: 'from-emerald-400 to-emerald-500',
              desc: '내 학교 개설과목에서 최적 조합을 찾아요',
              why: '필수 / 강추 / 고려 / 선택 4단계로 정리해줘요',
            },
          ].map(({ step, title, desc, why, icon: Icon, color }) => (
            <div key={step} className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                <p className="text-[11px] text-sky-500 mt-1">{why}</p>
              </div>
              <span className="text-xs font-bold text-slate-300 mt-1">{step}/3</span>
            </div>
          ))}
        </div>

        {/* ── CTA #1 ── */}
        <div className="mt-6">
          <Button size="lg" className="w-full" onClick={() => handleStart('hero-cta')}>
            <Sparkles size={18} className="mr-2" />
            내 맞춤 과목 찾기
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

        {/* ── 핵심 수치 + 신뢰 통합 ── */}
        <div className="mt-8">
          <div className="grid grid-cols-4 gap-2">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                <Icon size={16} className="mx-auto text-sky-primary mb-1" />
                <p className="text-sm font-bold text-slate-800">{value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-2.5 border border-sky-100">
            <Shield size={14} className="text-sky-primary flex-shrink-0" />
            <span className="text-xs text-slate-600">
              커리어넷 · NEIS · 대교협 <strong className="text-sky-primary">공식 데이터</strong> · Claude AI · 개인정보 수집 없음
            </span>
          </div>
        </div>

        {/* ── 인터랙티브 관심사 입력 [즉시 체험] ── */}
        <div className="mt-8 bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 rounded-2xl p-5 border border-sky-100">
          <h2 className="text-base font-bold text-slate-800 text-center mb-1">
            지금 바로 체험해보세요
          </h2>
          <p className="text-xs text-slate-500 text-center mb-4">
            관심사를 입력하면 AI가 맞는 학과와 과목을 찾아줘요
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInterestSubmit()}
                placeholder="예: 의사, 프로그래머, 디자이너..."
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleInterestSubmit}
              className="px-4 py-3 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer flex-shrink-0"
            >
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
            {['의대', 'IT/프로그래밍', '경영/경제', '교대/사범대', '예체능', '간호/보건'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setInterestInput(tag);
                  dispatch({ type: 'SET_INTEREST', payload: tag });
                  handleStart('tag-cta');
                }}
                className="px-2.5 py-1 bg-white/80 text-xs text-slate-600 rounded-full border border-slate-200 hover:border-sky-300 hover:text-sky-600 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── 대상별 진입 CTA ── */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => handleStart('parent-cta')}
            className="text-center py-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100 hover:border-violet-200 transition-all cursor-pointer"
          >
            <GraduationCap size={18} className="mx-auto text-violet-500 mb-1" />
            <p className="text-xs font-medium text-violet-700">학부모</p>
            <p className="text-[10px] text-violet-400 mt-0.5">자녀 과목 상담</p>
          </button>
          <button
            onClick={() => handleStart('teacher-cta')}
            className="text-center py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer"
          >
            <BookOpen size={18} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-xs font-medium text-emerald-700">교사 · 학원</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">진로지도 도구</p>
          </button>
        </div>

        {/* ── 맞춤 보고서 CTA ── */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-4 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">AI 맞춤 분석 보고서</p>
              <p className="text-[11px] text-slate-500">학과 추천 + 입시 전략 + 3년 로드맵</p>
            </div>
            <button
              onClick={() => navigate('/report')}
              className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              받기
            </button>
          </div>
        </div>

        {/* ── 후기 ── */}
        <div className="mt-10">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
            이런 분들이 이용해요
          </h2>
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
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
                  </p>
                  <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full font-medium">
                    {t.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
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
            q="고1인데, 아직 진로가 확실하지 않아도 되나요?"
            a="물론이죠! 학점나비는 정답을 알려주는 서비스가 아니에요. 여러 진로를 탐색하면서 과목을 비교하고, 스스로 결정할 수 있도록 돕는 도구예요. 오히려 일찍 탐색할수록 좋습니다."
          />
          <FAQItem
            q="환불은 어떻게 하나요?"
            a="리포트 미열람 시 구매일로부터 7일 이내 전액 환불 가능합니다. 자세한 내용은 환불정책 페이지를 확인해주세요."
          />
        </div>

        {/* ── 최종 CTA [격려 톤] ── */}
        <div className="mt-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-6 text-center text-white shadow-lg">
          <h3 className="text-lg font-bold">
            아직 고민 중이라면
          </h3>
          <p className="text-sm text-sky-100 mt-2 leading-relaxed">
            무료로 시작하세요. 30초면 됩니다.
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

        <p className="text-center text-xs text-slate-400 mt-6 mb-4">
          고교학점제 시대, 내 진로에 맞는 과목 선택을 도와드려요.
        </p>
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-lg mx-auto px-4 pb-4">
          <button
            onClick={() => handleStart('sticky-cta')}
            className="w-full py-3 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            내 맞춤 과목 찾기
            <ArrowRight size={16} />
          </button>
        </div>
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
