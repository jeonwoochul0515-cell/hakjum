import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { requestBillingAuth } from '@/lib/toss-payments';
import {
  Users,
  School,
  BarChart3,
  FileText,
  BrainCircuit,
  ArrowLeft,
  Shield,
  Check,
  Sparkles,
  Building2,
} from 'lucide-react';

interface TeacherPlan {
  id: 'teacher-monthly' | 'teacher-annual' | 'academy';
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

const plans: TeacherPlan[] = [
  {
    id: 'teacher-monthly',
    name: '교사 월간',
    price: 29900,
    priceLabel: '29,900원',
    priceSubLabel: '월 · 학생 30명까지',
    description: '진로지도에 바로 활용하세요',
    icon: <Users className="w-6 h-6 text-indigo-500" />,
    features: [
      { icon: <Users className="w-4 h-4 text-indigo-400" />, text: '학생 30명 관리 대시보드' },
      { icon: <Sparkles className="w-4 h-4 text-indigo-400" />, text: '무제한 AI 과목 추천' },
      { icon: <School className="w-4 h-4 text-indigo-400" />, text: '전국 고교 실시간 검색' },
      { icon: <BarChart3 className="w-4 h-4 text-indigo-400" />, text: '대학별 교과이수 기준 분석' },
      { icon: <FileText className="w-4 h-4 text-indigo-400" />, text: '학생별 추천 결과 리포트' },
    ],
    cta: '월간 구독 시작하기',
  },
  {
    id: 'teacher-annual',
    name: '교사 연간',
    price: 239000,
    originalPrice: 358800,
    priceLabel: '239,000원',
    priceSubLabel: '연간 · 월 19,917원 · 33% 절약',
    description: '1년 내내 진로지도의 든든한 파트너',
    badge: { text: '33% 할인', color: 'green' },
    icon: <Users className="w-6 h-6 text-amber-500" />,
    features: [
      { icon: <Check className="w-4 h-4 text-amber-400" />, text: '교사 월간의 모든 기능' },
      { icon: <Users className="w-4 h-4 text-amber-400" />, text: '학생 50명까지 관리' },
      { icon: <BrainCircuit className="w-4 h-4 text-amber-400" />, text: '학급 단위 과목 현황 분석' },
      { icon: <FileText className="w-4 h-4 text-amber-400" />, text: '학기별 종합 리포트 제공' },
    ],
    highlight: true,
    cta: '연간 구독 시작하기',
  },
  {
    id: 'academy',
    name: '학원/기관',
    price: 0,
    priceLabel: '맞춤 견적',
    description: '학원 규모에 맞는 맞춤 플랜',
    badge: { text: '문의', color: 'sky' },
    icon: <Building2 className="w-6 h-6 text-sky-500" />,
    features: [
      { icon: <Check className="w-4 h-4 text-sky-400" />, text: '학생 수 무제한' },
      { icon: <Users className="w-4 h-4 text-sky-400" />, text: '강사 다수 계정 지원' },
      { icon: <BarChart3 className="w-4 h-4 text-sky-400" />, text: '학원 브랜딩 커스터마이징' },
      { icon: <FileText className="w-4 h-4 text-sky-400" />, text: '학부모 공유용 리포트' },
    ],
    cta: '도입 문의하기',
  },
];

function generateCustomerKey(): string {
  return `cust_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export default function TeacherSubscriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: TeacherPlan) => {
    if (plan.id === 'academy') {
      window.location.href = 'mailto:contact@hakjum.com?subject=학원/기관 도입 문의';
      return;
    }

    setLoading(plan.id);
    try {
      const customerKey = generateCustomerKey();
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate('/subscription')}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-slate-800">교사 · 학원용 요금제</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center animate-fade-in-up">
          <h2 className="text-2xl font-extrabold text-slate-900">
            진로지도, 데이터로<br />더 효과적으로
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            학생 1인당 월 1,000원 미만으로 맞춤 과목 상담이 가능합니다
          </p>
        </div>

        {/* Value proposition */}
        <div className="animate-fade-in-up bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <p className="text-sm font-semibold text-indigo-800 mb-2">이런 선생님께 추천합니다</p>
          <ul className="space-y-1.5 text-xs text-indigo-700">
            <li>· 수강신청 시즌마다 30명+ 학생 상담이 밀리는 진로 선생님</li>
            <li>· 학생 개개인의 학교 개설과목을 일일이 확인하기 어려운 담임 선생님</li>
            <li>· 입시 컨설팅 품질을 높이고 싶은 학원 원장님</li>
          </ul>
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
                      plan.id === 'academy'
                        ? 'bg-sky-50'
                        : plan.id === 'teacher-monthly'
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

                <ul className="space-y-2.5 mb-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                      {feature.icon}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.id === 'academy' ? 'secondary' : 'primary'}
                  size="lg"
                  className="w-full"
                  disabled={loading !== null && plan.id !== 'academy'}
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

        {/* Back to individual */}
        <div className="text-center">
          <button
            onClick={() => navigate('/subscription')}
            className="text-sm text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
          >
            개인 요금제 보기 →
          </button>
        </div>

        <div className="animate-fade-in-up text-center space-y-3 pt-2 pb-8">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              토스페이먼츠 안전결제
            </span>
            <span>·</span>
            <span>언제든 해지 가능</span>
            <span>·</span>
            <span>세금계산서 발행</span>
          </div>
        </div>
      </main>
    </div>
  );
}
