import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BusinessFooter } from '@/components/layout/BusinessFooter';

export default function RefundPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-slate-800">환불정책</h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-8">
        <div className="prose prose-sm prose-slate max-w-none">
          <h2 className="text-xl font-bold text-slate-900 mb-6">환불 및 취소 정책</h2>

          <p className="text-sm text-slate-500 mb-6">
            시행일: 2026년 3월 23일
          </p>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제1조 (목적)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              본 정책은 법률사무소 청송law(이하 "회사")가 제공하는 유료 서비스의 환불 및 취소에 관한 사항을 규정합니다.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제2조 (환불 가능 조건)</h3>
            <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
              <li>
                <strong>과목 선택 리포트 (4,900원)</strong>
                <ul className="ml-5 mt-1 space-y-1 list-disc list-inside">
                  <li>리포트 미열람 시 구매일로부터 7일 이내 전액 환불 가능</li>
                  <li>리포트 열람(PDF 다운로드 포함) 후에는 환불 불가</li>
                </ul>
              </li>
              <li>
                <strong>올인원 패키지 (7,900원)</strong>
                <ul className="ml-5 mt-1 space-y-1 list-disc list-inside">
                  <li>리포트 미열람 및 AI 추천 미사용 시 구매일로부터 7일 이내 전액 환불 가능</li>
                  <li>리포트 열람 또는 유료 AI 추천 기능 사용 후에는 환불 불가</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제3조 (환불 불가 사유)</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li>리포트를 열람(PDF 다운로드 포함)한 경우</li>
              <li>유료 AI 맞춤 추천 기능을 1회 이상 사용한 경우</li>
              <li>구매일로부터 7일이 경과한 경우</li>
              <li>서비스 이용 제한 사유에 해당하는 경우 (부정 이용 등)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제4조 (환불 절차)</h3>
            <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
              <li>환불을 원하시는 경우 아래 방법으로 신청해 주세요.
                <ul className="ml-5 mt-1 space-y-1 list-disc list-inside">
                  <li>이메일: support@hakjumnabi.com</li>
                  <li>전화: 1660-4452</li>
                </ul>
              </li>
              <li>환불 신청 시 주문번호, 결제자 성명, 환불 사유를 기재해 주세요.</li>
              <li>환불 요청 접수 후 3영업일 이내 처리되며, 결제 수단에 따라 환불 소요 기간이 상이할 수 있습니다.
                <ul className="ml-5 mt-1 space-y-1 list-disc list-inside">
                  <li>신용카드: 취소 후 3~5영업일</li>
                  <li>기타 결제수단: 취소 후 5~7영업일</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제5조 (서비스 제공 기간)</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li><strong>과목 선택 리포트:</strong> 구매 즉시 제공 (1회성 디지털 콘텐츠)</li>
              <li><strong>올인원 패키지:</strong> 구매일로부터 해당 학기 종료 시까지 (최대 6개월)</li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              본 서비스는 무형의 디지털 콘텐츠로, 별도의 배송이 없습니다.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제6조 (기타)</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li>본 정책은 전자상거래 등에서의 소비자보호에 관한 법률에 따릅니다.</li>
              <li>본 정책에서 정하지 않은 사항은 관련 법령 및 상관례에 따릅니다.</li>
              <li>본 정책은 2026년 3월 23일부터 시행됩니다.</li>
            </ul>
          </section>
        </div>
      </main>

      <BusinessFooter />
    </div>
  );
}
