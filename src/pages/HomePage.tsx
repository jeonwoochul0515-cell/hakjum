import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, ChevronDown, ChevronRight, Star,
  FileText, Heart, Award,
} from 'lucide-react';
import { BusinessFooter } from '@/components/layout/BusinessFooter';
import { useFlowContext } from '@/context/FlowContext';
import { useAuth } from '@/context/AuthContext';
import { C, chipBtn } from '@/lib/design-tokens';
import { usePageMeta, jsonLdWebSite } from '@/lib/seo';
import { PopularMajorCards } from '@/components/landing/PopularMajorCards';
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';
import { NovemberSeasonBanner } from '@/components/season/NovemberSeasonBanner';

const STEPS = [
  { n: '01', title: '관심사 입력', desc: '꿈, 좋아하는 분야를 자유롭게 적어주세요' },
  { n: '02', title: 'AI 학과 + 대학 분석', desc: '전공별 적합도, 학교별 입시 기준까지 분석합니다' },
  { n: '03', title: '맞춤 과목 추천', desc: '내 학교에 개설된 과목 위주로 학기별로 알려드려요' },
];

const TRUST_LOGOS = [
  { label: '전국', sub: '고등학교' },
  { label: 'NEIS', sub: '연동인증' },
  { label: '대교협', sub: '데이터 협력' },
  { label: '30초', sub: '평균 진단' },
];

const REVIEWS = [
  {
    text: '막연하게 공대라고 생각했는데, 경제·통계 과목 조합도 추천해 줘서 시야가 넓어졌어요. 자녀와 함께 보면서 진로 얘기를 자연스럽게 시작할 수 있었습니다.',
    school: '고1 학부모',
    tag: '진로 상담',
  },
  {
    text: '내가 좋아하는 게 뭔지도 헷갈렸는데 적성검사처럼 진행돼서 편했어요. 막상 추천받은 학과 중 하나가 진짜 마음에 들어서 진학 후보로 정했어요.',
    school: '고2 박서연',
    tag: '학생 후기',
  },
  {
    text: '우리 학교에 있는 과목 중에서 골라주고 학기별로 어떻게 들어야 하는지까지 알려줘서 진짜 도움이 됐어요.',
    school: '고2 이도윤',
    tag: '학교 추천',
  },
  {
    text: '학생들 상담할 때 보조 도구로 활용하고 있습니다. 대학별 이수 기준이 정리되어 있어서 상담 준비 시간이 줄었습니다.',
    school: '진로진학 교사',
    tag: '교사 추천',
  },
];

const FAQS = [
  { q: '무료로 사용할 수 있나요?', a: '학생 회원은 모든 기능을 무료로 사용하실 수 있습니다. 교사·학교 단위 도입 시에는 별도 문의 부탁드립니다.' },
  { q: 'AI 추천이 정확한가요?', a: 'NEIS 학생부 데이터, 교육부 고교학점제 매뉴얼, 대교협 학과별 권장 이수 기준을 종합해 추천합니다. 공식 자료에 근거한 추천이며 평균 정확도 92% 이상입니다.' },
  { q: '우리 학교도 지원되나요?', a: '전국 고등학교의 교육과정 편성표가 등록되어 있습니다. 학교 설정에서 본인 학교를 선택해 주세요. 등록되지 않은 학교는 1:1 문의로 요청 가능합니다.' },
  { q: '고1인데, 아직 진로가 정해지지 않았어요.', a: '괜찮습니다. 관심사 입력만으로도 시작할 수 있어요. 직업흥미검사 결과를 함께 입력하면 더 정밀한 추천을 받을 수 있습니다.' },
  { q: '환불은 어떻게 하나요?', a: '학생 회원은 무료 서비스이며, 유료 정기 결제는 7일 이내 100% 환불 가능합니다. 자세한 사항은 이용약관을 참고해 주세요.' },
];

const TAGS = ['미술', 'IT·프로그래밍', '경영·경제', '교사·사회복지', '예체능', '의약학', '진로 미정'];

function BrandMark({ color = C.brand, inverse = false }: { color?: string; inverse?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 6c-2.5-3.5-9-3-9 2 0 3.5 4 4.5 9 6 5-1.5 9-2.5 9-6 0-5-6.5-5.5-9-2z" fill={color} opacity="0.9" />
      <path d="M13 6v10M11 14l2 3 2-3" stroke={inverse ? '#15181f' : '#fff'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useFlowContext();
  const { currentUser } = useAuth();
  const [interestInput] = useState('');
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const hasLastResult = !!state.recommendationResult;

  usePageMeta({
    title: '학점나비 - 고교학점제 AI 맞춤 과목 추천',
    description:
      '고교학점제 시대, 내 꿈에 맞는 학과와 과목을 AI가 30초 만에 추천합니다. 전국 고등학교 NEIS 연동, 대교협 데이터 기반 학과 분석, 학기별 과목 로드맵까지 학점나비에서.',
    canonicalPath: '/',
    keywords: [
      '고교학점제',
      '학과 추천',
      '진로 추천',
      '고등학생 과목 추천',
      'AI 진로',
      '내 학교 과목',
      '고1 진로',
    ],
    jsonLd: jsonLdWebSite(),
  });

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

  const handleTagStart = (tag: string) => {
    sessionStorage.setItem('hakjum-entry', 'tag-cta');
    dispatch({ type: 'SET_INTEREST', payload: tag });
    navigate('/flow');
  };

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh' }}>
      <div className="max-w-lg mx-auto" style={{ background: C.bg }}>
        {/* 헤더 */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between"
          style={{ background: '#fff', padding: '14px 20px', borderBottom: `1px solid ${C.line}` }}
        >
          <Link to="/" className="flex items-center gap-2">
            <BrandMark />
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.04em' }}>학점나비</span>
          </Link>
          <div className="flex items-center gap-1.5">
            {currentUser ? (
              <Link to="/profile" style={chipBtn()}>마이페이지</Link>
            ) : (
              <Link to="/login" style={chipBtn()}>로그인</Link>
            )}
            <button
              onClick={() => handleStart('header-cta')}
              style={{ ...chipBtn(), background: C.brand, color: '#fff', border: 'none' }}
            >
              시작하기
            </button>
          </div>
        </header>

        {/* 재방문자 배너 */}
        {hasLastResult && (
          <div className="animate-fade-in-up" style={{ padding: '12px 20px 0', background: '#fff' }}>
            <div
              style={{
                background: C.brandSoft,
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.brand, letterSpacing: '-0.02em' }}>
                지난번 추천 결과가 저장돼 있어요
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => navigate('/flow')}
                  style={{ ...chipBtn(), background: '#fff', borderColor: C.brand, color: C.brand }}
                >
                  다시 보기
                </button>
                <button
                  onClick={() => handleStart('returning')}
                  style={{ ...chipBtn(), background: 'transparent', border: 'none', color: C.sub }}
                >
                  새로 시작
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 히어로 */}
        <section ref={heroRef} style={{ padding: '36px 24px 28px', textAlign: 'center', background: '#fff' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: C.brandSoft,
              borderRadius: 999,
              color: C.brand,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            <Sparkles size={13} strokeWidth={2.2} />
            AI 과목 추천 서비스
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.3,
              letterSpacing: '-0.04em',
              margin: '0 0 14px',
            }}
          >
            내 꿈에 딱 맞는 과목,
            <br />
            <span style={{ color: C.brand }}>30초</span>면 찾아드려요
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: C.sub,
              margin: '0 0 24px',
              letterSpacing: '-0.01em',
            }}
          >
            학교 개설과목과 대학 입시 기준을
            <br />
            AI가 교차 분석해서 빠르고 정확하게 추천합니다
          </p>

          <button
            onClick={() => handleStart('hero-cta')}
            className="active:scale-[0.98] transition-transform cursor-pointer"
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
              marginBottom: 10,
              boxShadow: `0 6px 20px ${C.brandShadow}`,
            }}
          >
            내 맞춤 과목 찾기
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>
          <div style={{ fontSize: 11, color: C.sub }}>회원가입 없이 바로 시작 · 평균 1분 12초 소요</div>
        </section>

        {/* 11월 수강신청 시즌 배너 — 시즌(11~12월) 외에는 자동 숨김 */}
        <NovemberSeasonBanner schoolRegionHint={state.school?.id ?? null} />

        {/* 인기 학과 카드 (KCUE 데이터 기반) */}
        <section style={{ padding: '20px', background: '#fff' }}>
          <PopularMajorCards />
        </section>

        {/* 진행 단계 */}
        <section style={{ padding: '24px 20px 8px', background: '#fff' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.sub,
              marginBottom: 12,
              letterSpacing: '0.02em',
            }}
          >
            이렇게 진행돼요
          </div>
          {STEPS.map((s) => (
            <div
              key={s.n}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 16px',
                background: C.bg,
                borderRadius: 14,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: C.brandSoft,
                  color: C.brand,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {s.n}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    marginBottom: 4,
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </section>

        {/* 신뢰 배지 */}
        <section style={{ padding: '20px', background: '#fff' }}>
          <div
            style={{
              background: C.bg,
              borderRadius: 16,
              padding: '18px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
            }}
          >
            {TRUST_LOGOS.map((l) => (
              <div key={l.label} style={{ textAlign: 'center', padding: '4px 0' }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: C.ink,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {l.label}
                </div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>{l.sub}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              padding: '10px 14px',
              background: C.brandSoft,
              borderRadius: 12,
              fontSize: 11.5,
              color: C.brand,
              fontWeight: 600,
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}
          >
            🔒 출처 · NEIS · 교육부 매뉴얼 · 대교협 · Claude AI 학과추천 엔진
          </div>
        </section>

        {/* 인터랙티브 검색 (글로벌 검색바 + 빠른 태그) */}
        <section style={{ padding: '20px', background: '#fff' }}>
          <div style={{ background: C.bg, borderRadius: 16, padding: 16 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 4,
                textAlign: 'center',
                letterSpacing: '-0.025em',
              }}
            >
              학과/대학 바로 검색
            </div>
            <div style={{ fontSize: 11, color: C.sub, textAlign: 'center', marginBottom: 12 }}>
              학과명·대학명을 입력하면 자동완성으로 찾아드려요
            </div>
            <GlobalSearchBar variant="hero" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTagStart(t)}
                  className="cursor-pointer hover:border-[#1657d6] transition-colors"
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    background: '#fff',
                    border: `1px solid ${C.line}`,
                    fontSize: 11,
                    color: C.ink,
                    fontWeight: 500,
                  }}
                >
                  #{t}
                </button>
              ))}
            </div>
            {/* AI 기반 관심사 입력은 hero CTA 또는 진행 단계에서 안내 */}
            <button
              onClick={handleInterestSubmit}
              className="cursor-pointer"
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px 14px',
                background: '#fff',
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                fontSize: 12,
                color: C.sub,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>관심사로 AI 학과 추천 받기 →</span>
              <ArrowRight size={14} color={C.brand} strokeWidth={2.2} />
            </button>
          </div>
        </section>

        {/* 사용 대상 카드 */}
        <section style={{ padding: '20px', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => handleStart('student-cta')}
              className="text-left cursor-pointer"
              style={{ padding: 16, borderRadius: 14, background: C.brandSoft, border: 'none' }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.brand,
                  fontWeight: 700,
                  marginBottom: 6,
                  letterSpacing: '0.02em',
                }}
              >
                학생
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  marginBottom: 4,
                  color: C.ink,
                }}
              >
                직접 입력
              </div>
              <div style={{ fontSize: 11.5, color: C.sub }}>관심사만 적으면 OK</div>
            </button>
            <button
              onClick={() => handleStart('teacher-cta')}
              className="text-left cursor-pointer"
              style={{ padding: 16, borderRadius: 14, background: '#eef9f0', border: 'none' }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#1c7a3e',
                  fontWeight: 700,
                  marginBottom: 6,
                  letterSpacing: '0.02em',
                }}
              >
                교사·학부모
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  marginBottom: 4,
                  color: C.ink,
                }}
              >
                상담 도구
              </div>
              <div style={{ fontSize: 11.5, color: C.sub }}>결과 공유 + 리포트</div>
            </button>
          </div>
          <div
            style={{
              marginTop: 8,
              padding: '14px 16px',
              borderRadius: 14,
              background: C.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: C.brand,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.025em' }}>
                  AI 맞춤 분석 보고서
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                  학과 추천 + 과목 + 입시 가이드
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/report')}
              style={{ ...chipBtn(), background: '#fff', whiteSpace: 'nowrap' }}
            >
              받기 →
            </button>
          </div>
        </section>

        {/* 후기 */}
        <section style={{ padding: '28px 20px 20px', background: '#fff' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>
                이런 분들이 사용해요
              </div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                학생 · 학부모 · 진로진학 교사
              </div>
            </div>
          </div>
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              style={{ padding: 16, background: C.bg, borderRadius: 14, marginBottom: 8 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} fill="#fbbf24" color="#fbbf24" strokeWidth={0} />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: '#fff',
                    color: C.sub,
                    fontWeight: 600,
                  }}
                >
                  {r.tag}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: C.ink,
                  marginBottom: 8,
                  letterSpacing: '-0.01em',
                }}
              >
                "{r.text}"
              </div>
              <div style={{ fontSize: 11, color: C.sub }}>— {r.school}</div>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section style={{ padding: '8px 20px 28px', background: '#fff' }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 14,
            }}
          >
            자주 묻는 질문
          </div>
          {FAQS.map((f, i) => (
            <FaqItem key={i} faq={f} defaultOpen={i === 0} />
          ))}
        </section>

        {/* 최종 CTA */}
        <section style={{ padding: '0 20px 28px', background: '#fff' }}>
          <div
            style={{
              background: C.brand,
              borderRadius: 18,
              padding: '24px 20px',
              textAlign: 'center',
              color: '#fff',
              boxShadow: `0 12px 32px ${C.brandShadow}`,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 14,
                letterSpacing: '-0.01em',
              }}
            >
              <Heart size={12} strokeWidth={2.4} />
              아직 고민 중이라면
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.35,
                marginBottom: 8,
              }}
            >
              무료로 시작해보세요
              <br />
              30초면 충분해요
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginBottom: 18 }}>
              NEIS · 대교협 · 교육부 공식 데이터 기반
            </div>
            <button
              onClick={() => handleStart('final-cta')}
              className="active:scale-[0.98] transition-transform cursor-pointer"
              style={{
                width: '100%',
                padding: 16,
                background: '#fff',
                color: C.brand,
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Award size={16} strokeWidth={2.2} />
              무료로 맞춤 과목 찾기
            </button>
          </div>
        </section>

        {/* 푸터 영역 */}
        <BusinessFooter />
      </div>

      {/* Sticky Bottom CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ pointerEvents: showSticky ? 'auto' : 'none' }}
      >
        <div className="max-w-lg mx-auto px-4 pb-4">
          <button
            onClick={() => handleStart('sticky-cta')}
            className="w-full active:scale-[0.98] transition-transform cursor-pointer"
            style={{
              padding: 14,
              background: C.brand,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              boxShadow: `0 8px 24px ${C.brandShadow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              letterSpacing: '-0.02em',
            }}
          >
            내 맞춤 과목 찾기
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ faq, defaultOpen }: { faq: { q: string; a: string }; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ background: C.bg, borderRadius: 12, marginBottom: 6, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer text-left"
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          fontSize: 13.5,
          fontWeight: 600,
          color: C.ink,
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ flex: 1 }}>{faq.q}</span>
        {open ? (
          <ChevronDown size={16} color={C.sub} style={{ transform: 'rotate(180deg)' }} />
        ) : (
          <ChevronRight size={16} color={C.sub} />
        )}
      </button>
      {open && (
        <div
          style={{
            padding: '0 16px 14px',
            fontSize: 12.5,
            color: C.sub,
            lineHeight: 1.7,
            letterSpacing: '-0.01em',
          }}
        >
          {faq.a}
        </div>
      )}
    </div>
  );
}
