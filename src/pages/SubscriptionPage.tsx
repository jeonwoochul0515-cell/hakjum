import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { requestBillingAuth } from '@/lib/toss-payments';
import {
  Sparkles,
  Crown,
  Zap,
  Check,
  BookOpen,
  School,
  BarChart3,
  Save,
  BrainCircuit,
  FileText,
  ArrowLeft,
  Shield,
  TrendingDown,
  Clock,
} from 'lucide-react';

interface PlanTier {
  id: 'free' | 'semester' | 'annual';
  name: string;
  price: number;
  originalPrice?: number;
  priceLabel: string;
  priceSubLabel?: string;
  description: string;
  badge?: { text: string; color: 'sky' | 'indigo' | 'amber' | 'green' };
  icon: React.ReactNode;
  features: { icon: React.ReactNode; text: string }[];
  highlight?: boolean;
  cta: string;
}

const plans: PlanTier[] = [
  {
    id: 'free',
    name: '무료 체험',
    price: 0,
    priceLabel: '0원',
    description: '학과 탐색을 시작해보세요',
    icon: <BookOpen className="w-6 h-6 text-sky-500" />,
    features: [
      { icon: <Sparkles className="w-4 h-4 text-sky-400" />, text: 'AI 맞춤 과목 추천 1회' },
      { icon: <School className="w-4 h-4 text-sky-400" />, text: '부산 지역 학교 검색' },
      { icon: <BarChart3 className="w-4 h-4 text-sky-400" />, text: '기본 학과 정보 열람' },
    ],
    cta: '현재 이용 중',
  },
  {
    id: 'semester',
    name: '학기패스',
    price: 9900,
    priceLabel: '9,900원',
    priceSubLabel: '6개월 · 월 1,650원',
    description: '이번 학기 과목 선택을 확실하게',
    badge: { text: '가장 인기', color: 'indigo' },
    icon: <Zap className="w-6 h-6 text-indigo-500" />,
    features: [
      { icon: <Sparkles className="w-4 h-4 text-indigo-400" />, text: '무제한 AI 맞춤 과목 추천' },
      { icon: <School className="w-4 h-4 text-indigo-400" />, text: '전국 2,400+ 고교 실시간 검색' },
      { icon: <BarChart3 className="w-4 h-4 text-indigo-400" />, text: '대학별 교과이수 기준 분석' },
      { icon: <Save className="w-4 h-4 text-indigo-400" />, text: '추천 결과 저장 · 비교 · 공유' },
      { icon: <BrainCircuit className="w-4 h-4 text-indigo-400" />, text: 'AI 입시 전략 리포트' },
    ],
    highlight: true,
    cta: '학기패스 시작하기',
  },
  {
    id: 'annual',
    name: '연간패스',
    price: 14900,
    originalPrice: 19800,
    priceLabel: '14,900원',
    priceSubLabel: '12개월 · 월 1,242원',
    description: '고1부터 졸업까지, 진로 탐색의 동반자',
    badge: { text: '25% 할인', color: 'green' },
    icon: <Crown className="w-6 h-6 text-amber-500" />,
    features: [
      { icon: <Check className="w-4 h-4 text-amber-400" />, text: '학기패스의 모든 기능 포함' },
      { icon: <FileText className="w-4 h-4 text-amber-400" />, text: '학기별 과목 변경 이력 관리' },
      { icon: <TrendingDown className="w-4 h-4 text-amber-400" />, text: '학기패스 대비 25% 절약' },
      { icon: <Clock className="w-4 h-4 text-amber-400" />, text: '신규 기능 우선 이용' },
    ],
    cta: '연간패스 시작하기',
  },
];

function generateCustomerKey(): string {
  return `cust_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: PlanTier) => {
    if (plan.id === 'free') return;
    // 학기패스: 6개월 1회 결제, 연간패스: 12개월 1회 결제

    setLoading(plan.id);
    try {
      const customerKey = generateCustomerKey();
      // 선택한 플랜 정보를 sessionStorage에 저장 (success 페이지에서 사용)
      sessionStorage.setItem(
        'pendingSubscription',
        JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          customerKey,
        })
      );
      await requestBillingAuth(customerKey);
    } catch (err) {
      console.error('빌링 인증 요청 실패:', err);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-slate-800">요금제</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center animate-fade-in-up">
          <h2 className="text-2xl font-extrabold text-slate-900">
            커피 한 잔 가격으로<br />입시 과목 전략을 완성하세요
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            과목 선택 한 번의 실수가 3년을 좌우합니다
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            3월 수강신청 시즌 — 지금이 가장 중요한 시기예요
          </div>
        </div>

        {/* Plan Cards */}
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card
                className={`relative overflow-hidden p-5 ${
                  plan.highlight
                    ? 'border-indigo-primary ring-2 ring-indigo-primary/20'
                    : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge color={plan.badge.color}>{plan.badge.text}</Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.id === 'free'
                        ? 'bg-sky-50'
                        : plan.id === 'semester'
                          ? 'bg-indigo-50'
                          : 'bg-amber-50'
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {plan.originalPrice && (
                    <span className="text-sm text-slate-400 line-through mr-2">
                      {plan.originalPrice.toLocaleString()}원
                    </span>
                  )}
                  <span className="text-2xl font-extrabold text-slate-900">
                    {plan.priceLabel}
                  </span>
                  {plan.priceSubLabel && (
                    <p className="text-xs text-slate-500 mt-0.5">{plan.priceSubLabel}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                      {feature.icon}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.id === 'free' ? 'secondary' : 'primary'}
                  size="lg"
                  className="w-full"
                  disabled={plan.id === 'free' || loading !== null}
                  onClick={() => handleSubscribe(plan)}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      처리 중...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </Card>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="animate-fade-in-up bg-white rounded-2xl p-4 border border-slate-100 shadow-sm" style={{ animationDelay: '300ms' }}>
          <p className="text-sm font-semibold text-slate-700 text-center mb-3">학부모님들의 후기</p>
          <div className="space-y-2.5">
            <div className="bg-slate-50 rounded-xl px-3.5 py-2.5">
              <p className="text-xs text-slate-600">"아이가 스스로 과목을 골라왔어요. 학원에서도 이걸 보고 상담한다고 하더라고요."</p>
              <p className="text-[10px] text-slate-400 mt-1">— 고1 학부모 김○○님</p>
            </div>
            <div className="bg-slate-50 rounded-xl px-3.5 py-2.5">
              <p className="text-xs text-slate-600">"진로 선생님이 추천해주셔서 써봤는데, 대학별 이수 기준까지 한눈에 보여서 좋아요."</p>
              <p className="text-[10px] text-slate-400 mt-1">— 고2 학부모 박○○님</p>
            </div>
          </div>
        </div>

        {/* B2B CTA */}
        <div className="animate-fade-in-up text-center" style={{ animationDelay: '350ms' }}>
          <button
            onClick={() => navigate('/subscription/teacher')}
            className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
          >
            교사 · 학원용 단체 요금제 알아보기 →
          </button>
        </div>

        {/* Trust signals */}
        <div className="animate-fade-in-up text-center space-y-3 pt-2 pb-8" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              토스페이먼츠 안전결제
            </span>
            <span>·</span>
            <span>언제든 해지 가능</span>
            <span>·</span>
            <span>잔여기간 보장</span>
          </div>
        </div>
      </main>
    </div>
  );
}
