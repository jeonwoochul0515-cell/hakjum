import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';

interface BillingResult {
  billingKey: string;
  customerKey: string;
  cardCompany?: string;
  cardNumber?: string;
}

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [billingResult, setBillingResult] = useState<BillingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const authKey = searchParams.get('authKey');
    const customerKeyParam = searchParams.get('customerKey');

    if (!authKey) {
      setStatus('error');
      setErrorMessage('인증 키가 없습니다.');
      return;
    }

    // sessionStorage에서 구독 정보 복원
    const pendingRaw = sessionStorage.getItem('pendingSubscription');
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
    const customerKey = customerKeyParam || pending?.customerKey;

    if (!customerKey) {
      setStatus('error');
      setErrorMessage('고객 키가 없습니다.');
      return;
    }

    issueBillingKey(authKey, customerKey, pending);
  }, [searchParams]);

  async function issueBillingKey(
    authKey: string,
    customerKey: string,
    pending: { planId: string; planName: string; amount: number } | null
  ) {
    try {
      const res = await fetch('/api/billing/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey, customerKey }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '빌링키 발급 실패' }));
        throw new Error(err.message || '빌링키 발급에 실패했습니다.');
      }

      const data: BillingResult = await res.json();
      setBillingResult(data);

      // 첫 결제 실행 (pending 정보가 있으면)
      if (pending && pending.amount > 0) {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const payRes = await fetch('/api/billing/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billingKey: data.billingKey,
            customerKey: data.customerKey,
            amount: pending.amount,
            orderId,
            orderName: `학줌 ${pending.planName} 구독`,
          }),
        });

        if (!payRes.ok) {
          const payErr = await payRes.json().catch(() => ({ message: '결제 실패' }));
          throw new Error(payErr.message || '첫 결제에 실패했습니다.');
        }
      }

      sessionStorage.removeItem('pendingSubscription');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {status === 'loading' && (
          <Card className="p-8 text-center animate-fade-in-up">
            <Loader2 className="w-12 h-12 text-indigo-primary mx-auto animate-spin" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">결제 처리 중...</h2>
            <p className="mt-2 text-sm text-slate-500">잠시만 기다려주세요.</p>
          </Card>
        )}

        {status === 'success' && (
          <Card className="p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">구독이 시작되었어요!</h2>
            <p className="mt-2 text-sm text-slate-500">
              이제 더 다양한 기능을 이용할 수 있습니다.
            </p>

            {billingResult && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {billingResult.cardCompany || '카드'}{' '}
                    {billingResult.cardNumber || '등록 완료'}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/flow')}>
                시작하기
              </Button>
              <Button variant="ghost" size="md" className="w-full" onClick={() => navigate('/')}>
                홈으로 돌아가기
              </Button>
            </div>
          </Card>
        )}

        {status === 'error' && (
          <Card className="p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <span className="text-3xl">!</span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">문제가 발생했어요</h2>
            <p className="mt-2 text-sm text-red-500">{errorMessage}</p>

            <div className="mt-6 space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/subscription')}>
                다시 시도하기
              </Button>
              <Button variant="ghost" size="md" className="w-full" onClick={() => navigate('/')}>
                홈으로 돌아가기
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
