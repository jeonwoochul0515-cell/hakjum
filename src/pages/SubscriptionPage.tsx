import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { requestPayment } from '@/lib/toss-payments';
import { useAuth } from '@/context/AuthContext';
import { BusinessFooter } from '@/components/layout/BusinessFooter';
import {
  Sparkles,
  Zap,
  Check,
  BookOpen,
  School,
  BarChart3,
  FileText,
  ArrowLeft,
  Shield,
  BrainCircuit,
  Clock,
} from 'lucide-react';

interface PlanTier {
  id: 'free' | 'report' | 'allinone';
  name: string;
  price: number;
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
    name: '무료',
    price: 0,
    priceLabel: '0원',
    description: '과목 탐색을 시작해보세요',
    icon: <BookOpen className="w-6 h-6 text-sky-500" />,
    features: [
      { icon: <Sparkles className="w-4 h-4 text-sky-400" />, text: 'AI 맞춤 과목 추천 하루 3회' },
      { icon: <School className="w-4 h-4 text-sky-400" />, text: '전국 학교 검색' },
      { icon: <BarChart3 className="w-4 h-4 text-sky-400" />, text: '기본 학과 정보 열람' },
    ],
    cta: '현재 이용 중',
  },
  {
    id: 'report',
    name: '과목 선택 리포트',
    price: 4900,
    priceLabel: '4,900원',
    priceSubLabel: '1회 이용권',
    description: '내 학교 × 목표 학과 맞춤 분석',
    icon: <FileText className="w-6 h-6 text-indigo-500" />,
    features: [
      { icon: <FileText className="w-4 h-4 text-indigo-400" />, text: '맞춤 과목 추천 리포트 1건' },
      { icon: <BrainCircuit className="w-4 h-4 text-indigo-400" />, text: 'AI 입시 전략 분석 포함' },
      { icon: <BarChart3 className="w-4 h-4 text-indigo-400" />, text: '대학별 교과이수 기준 비교' },
    ],
    cta: '리포트 받기',
  },
  {
    id: 'allinone',
    name: '올인원 패키지',
    price: 7900,
    priceLabel: '7,900원',
    priceSubLabel: '이번 학기 동안 사용',
    description: '과목 선택 기간에 필요한 모든 것',
    badge: { text: '추천', color: 'green' },
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    features: [
      { icon: <Sparkles className="w-4 h-4 text-amber-400" />, text: '무제한 AI 맞춤 과목 추천' },
      { icon: <FileText className="w-4 h-4 text-amber-400" />, text: '맞춤 리포트 3건' },
      { icon: <Check className="w-4 h-4 text-amber-400" />, text: '과목 비교표 제공' },
      { icon: <BrainCircuit className="w-4 h-4 text-amber-400" />, text: 'AI 입시 전략 분석 포함' },
    ],
    highlight: true,
    cta: '올인원 시작하기',
  },
];

function getSeasonMessage(): { text: string; urgent: boolean } {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return { text: '1학기 수강신청 시즌 — 지금이 가장 중요한 시기예요', urgent: true };
  if (month >= 7 && month <= 9) return { text: '2학기 수강신청 시즌 — 과목 선택이 중요한 시기예요', urgent: true };
  if (month >= 10 && month <= 12) return { text: '내년 수강신청 준비 — 미리 과목을 탐색해보세요', urgent: false };
  return { text: '다음 학기 과목 선택을 미리 준비하세요', urgent: false };
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const season = getSeasonMessage();
  const { currentUser, isPaidUser, profileExtra } = useAuth();

  const handlePurchase = async (plan: PlanTier) => {
    if (plan.id === 'free') return;

    if (!currentUser) {
      navigate('/login');
      return;
    }

    setLoading(plan.id);
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const customerKey = `user_${currentUser.uid.slice(0, 20)}`;

      sessionStorage.setItem(
        'pendingPurchase',
        JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          orderId,
        })
      );

      await requestPayment({
        amount: plan.price,
        orderId,
        orderName: `학점나비 ${plan.name}`,
        customerKey,
      });
    } catch (err) {
      console.error('결제 요청 실패:', err);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-slate-800">이용권</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center animate-fade-in-up">
          <h2 className="text-2xl font-extrabold text-slate-900">
            과목 선택, 한 번에 끝내세요
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            AI가 내 학교 개설과목과 목표 학과를 분석해드려요
          </p>
          <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${season.urgent ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'}`}>
            <Clock className="w-3.5 h-3.5" />
            {season.text}
          </div>
        </div>

        {/* 이미 구매한 경우 */}
        {isPaidUser && profileExtra.purchase && (
          <div className="animate-fade-in-up bg-green-50 rounded-2xl p-4 border border-green-200">
            <p className="text-sm font-semibold text-green-800">
              {profileExtra.purchase.planName} 이용 중
            </p>
            <p className="text-xs text-green-600 mt-1">
              {new Date(profileExtra.purchase.expiryDate).toLocaleDateString('ko-KR')}까지 ·
              리포트 {profileExtra.purchase.reportsRemaining}건 남음
              {profileExtra.purchase.unlimitedAI && ' · AI 무제한'}
            </p>
          </div>
        )}

        {/* 환불 정책 + 동의 */}
        <div className="animate-fade-in-up bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <div className="text-xs text-slate-600 space-y-1 mb-3">
            <p className="font-semibold text-slate-700">환불 정책</p>
            <p>· 리포트 미열람 시 구매일로부터 7일 이내 환불 가능</p>
            <p>· 리포트 열람(PDF 다운로드) 후에는 환불 불가</p>
            <a href="/refund-policy" className="text-sky-600 underline mt-1 inline-block">환불정책 전문 보기</a>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-600">
              <a href="/terms" className="text-sky-600 underline">이용약관</a> 및 <a href="/refund-policy" className="text-sky-600 underline">환불정책</a>에 동의합니다
            </span>
          </label>
        </div>

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
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge color={plan.badge.color}>{plan.badge.text}</Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.id === 'free'
                        ? 'bg-sky-50'
                        : plan.id === 'report'
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

                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {plan.priceLabel}
                  </span>
                  {plan.priceSubLabel && (
                    <span className="text-xs text-slate-500 ml-2">{plan.priceSubLabel}</span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                      {feature.icon}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.id === 'free' ? 'secondary' : 'primary'}
                  size="lg"
                  className="w-full"
                  disabled={plan.id === 'free' || loading !== null || !agreedToTerms}
                  onClick={() => handlePurchase(plan)}
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

        <div className="animate-fade-in-up text-center space-y-3 pt-2" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              토스페이먼츠 안전결제
            </span>
            <span>·</span>
            <span>1회 결제 (자동갱신 없음)</span>
          </div>
        </div>

      </main>

      <BusinessFooter />
    </div>
  );
}
