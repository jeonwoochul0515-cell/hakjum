import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function SubscriptionFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR';
  const errorMessage = searchParams.get('message') || '결제 처리 중 문제가 발생했습니다.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <Card className="p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">결제에 실패했어요</h2>

          <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>

          <div className="mt-4 px-4 py-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400">오류 코드: {errorCode}</p>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/subscription')}
            >
              다시 시도하기
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              홈으로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
