import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { requestPayment } from '@/lib/toss-payments';
import { Shield, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ParentPaymentPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const plan = searchParams.get('plan') || 'report';
  const studentName = searchParams.get('name') || '학생';

  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [status, setStatus] = useState<'ready' | 'confirming' | 'success' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState('');

  const planConfig = plan === 'allinone'
    ? { name: '올인원 패키지', price: 7900, priceLabel: '7,900원' }
    : { name: '과목 선택 리포트', price: 4900, priceLabel: '4,900원' };

  // Handle success callback (when redirected back with paymentKey)
  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (paymentKey && orderId && amount && uid) {
      setStatus('confirming');
      (async () => {
        try {
          const res = await fetch('/api/payment/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: '결제 확인 실패' }));
            throw new Error(err.message);
          }

          // Update student's Firestore record
          if (db) {
            const userRef = doc(db, 'users', uid);
            const snap = await getDoc(userRef);
            const now = new Date();
            const expiry = new Date(now);
            expiry.setMonth(expiry.getMonth() + 6);
            const isAllinone = plan === 'allinone';

            const purchase = {
              planId: plan,
              planName: planConfig.name,
              orderId,
              paymentKey,
              purchaseDate: now.toISOString(),
              expiryDate: expiry.toISOString(),
              amount: Number(amount),
              reportsRemaining: isAllinone ? 3 : 1,
              unlimitedAI: isAllinone,
            };

            if (snap.exists()) {
              await updateDoc(userRef, { purchase } as Record<string, unknown>);
            }
          }

          setStatus('success');
        } catch (err) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : '결제 확인 실패');
        }
      })();
    }
  }, [searchParams, uid, plan, planConfig.name]);

  const handlePayment = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const orderId = `parent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const customerKey = `parent_${uid.slice(0, 20)}`;

      sessionStorage.setItem(
        'parentPendingPurchase',
        JSON.stringify({
          uid,
          planId: plan,
          planName: planConfig.name,
          amount: planConfig.price,
          orderId,
        })
      );

      await requestPayment({
        amount: planConfig.price,
        orderId,
        orderName: `학점나비 ${planConfig.name} (${studentName})`,
        customerKey,
      });
    } catch (err) {
      console.error('결제 요청 실패:', err);
      setLoading(false);
    }
  };

  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4">
        <Card className="p-8 text-center max-w-sm">
          <p className="text-slate-600">잘못된 링크입니다.</p>
        </Card>
      </div>
    );
  }

  if (status === 'confirming') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4">
        <Card className="p-8 text-center max-w-sm">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-700 font-medium">결제 확인 중...</p>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4">
        <Card className="p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">결제 완료!</h2>
          <p className="mt-2 text-sm text-slate-500">
            {studentName}님의 {planConfig.name} 이용권이 활성화되었습니다.
          </p>
          <p className="mt-4 text-xs text-slate-400">이 창을 닫으셔도 됩니다.</p>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-4">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold text-slate-900">문제가 발생했어요</h2>
          <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-bold text-slate-800">학점나비 — 보호자 결제</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Card className="p-5">
          <p className="text-sm text-slate-600 mb-1">학생: <span className="font-semibold text-slate-800">{studentName}</span></p>
          <p className="text-sm text-slate-600">상품: <span className="font-semibold text-slate-800">{planConfig.name}</span></p>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{planConfig.priceLabel}</p>
          <p className="text-xs text-slate-400 mt-1">1회 결제 · 자동갱신 없음</p>
        </Card>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <div className="text-xs text-slate-600 space-y-1 mb-3">
            <p className="font-semibold text-slate-700">환불 정책</p>
            <p>· 리포트 미열람 시 구매일로부터 7일 이내 환불 가능</p>
            <p>· 리포트 열람(PDF 다운로드) 후에는 환불 불가</p>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-600">위 내용에 동의합니다</span>
          </label>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!agreedToTerms || loading}
          onClick={handlePayment}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              처리 중...
            </span>
          ) : (
            `${planConfig.priceLabel} 결제하기`
          )}
        </Button>

        <div className="text-center text-xs text-slate-500">
          <span className="flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            토스페이먼츠 안전결제
          </span>
        </div>
      </main>
    </div>
  );
}
