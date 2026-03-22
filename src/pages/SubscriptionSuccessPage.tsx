import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { savePurchase, currentUser, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return; // Auth 로딩 완료 대기
    if (confirmedRef.current) return; // 중복 실행 방지

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      setErrorMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    confirmedRef.current = true;
    confirmPayment(paymentKey, orderId, Number(amount));
  }, [searchParams, authLoading, currentUser]);

  async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '결제 확인 실패' }));
        throw new Error(err.message || '결제 확인에 실패했습니다.');
      }

      // sessionStorage에서 구매 정보 복원
      const pendingRaw = sessionStorage.getItem('pendingPurchase');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : null;

      if (currentUser && pending) {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 6);

        const isAllinone = pending.planId === 'allinone';

        await savePurchase({
          planId: pending.planId,
          planName: pending.planName,
          orderId: pending.orderId,
          paymentKey,
          purchaseDate: now.toISOString(),
          expiryDate: expiry.toISOString(),
          amount: pending.amount,
          reportsRemaining: isAllinone ? 3 : 1,
          unlimitedAI: isAllinone,
        });

        // savePurchase 성공 후에만 sessionStorage 삭제
        sessionStorage.removeItem('pendingPurchase');
      }

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
            <h2 className="mt-4 text-lg font-bold text-slate-800">결제 확인 중...</h2>
            <p className="mt-2 text-sm text-slate-500">잠시만 기다려주세요.</p>
          </Card>
        )}

        {status === 'success' && (
          <Card className="p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">결제 완료!</h2>
            <p className="mt-2 text-sm text-slate-500">
              이제 맞춤 과목 추천을 받아보세요.
            </p>

            <div className="mt-6 space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/flow')}>
                과목 추천 받으러 가기
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
