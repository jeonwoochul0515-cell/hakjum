import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BusinessFooter } from '@/components/layout/BusinessFooter';

export default function TermsPage() {
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
          <h1 className="ml-2 text-lg font-bold text-slate-800">이용약관</h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-8">
        <div className="prose prose-sm prose-slate max-w-none">
          <h2 className="text-xl font-bold text-slate-900 mb-6">서비스 이용약관</h2>

          <p className="text-sm text-slate-500 mb-6">
            시행일: 2026년 3월 23일
          </p>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제1조 (목적)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              본 약관은 법률사무소 청송law(이하 "회사")가 운영하는 학점나비 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제2조 (서비스의 내용)</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              회사가 제공하는 서비스는 다음과 같습니다.
            </p>
            <ol className="text-sm text-slate-600 leading-relaxed space-y-1 list-decimal list-inside">
              <li>고교학점제 AI 맞춤 과목 추천 서비스</li>
              <li>대학별 교과이수 기준 조회 서비스</li>
              <li>과목 선택 리포트 제공 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
            </ol>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제3조 (이용요금 및 결제)</h3>
            <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
              <li>서비스는 무료 서비스와 유료 서비스로 구분됩니다.</li>
              <li>유료 서비스의 이용요금은 서비스 내 이용권 페이지에 게시된 금액에 따릅니다.</li>
              <li>결제는 1회성 결제이며, 자동 갱신(정기결제)은 이루어지지 않습니다.</li>
              <li>결제 수단: 신용카드, 체크카드 등 회사가 지정한 결제수단</li>
            </ol>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제4조 (서비스 제공 기간)</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li><strong>무료 서비스:</strong> 별도의 기간 제한 없음 (일일 이용 횟수 제한 있음)</li>
              <li><strong>과목 선택 리포트 (4,900원):</strong> 구매 즉시 제공되는 1회성 디지털 콘텐츠</li>
              <li><strong>올인원 패키지 (7,900원):</strong> 구매일로부터 해당 학기 종료 시까지 (최대 6개월)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제5조 (환불)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              환불에 관한 사항은 <a href="/refund-policy" className="text-sky-600 underline">환불정책</a>에 따릅니다.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제6조 (서비스 이용 제한)</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다.
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li>타인의 정보를 도용하여 서비스를 이용한 경우</li>
              <li>서비스의 정상적인 운영을 방해한 경우</li>
              <li>서비스를 통해 얻은 정보를 상업적 목적으로 무단 이용한 경우</li>
              <li>기타 관련 법령에 위반되는 행위를 한 경우</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제7조 (면책)</h3>
            <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
              <li>회사가 제공하는 AI 과목 추천은 참고용 정보이며, 최종 과목 선택에 대한 책임은 이용자에게 있습니다.</li>
              <li>대학별 입시 기준은 변경될 수 있으며, 회사는 실시간 정확성을 보장하지 않습니다. 반드시 해당 대학의 공식 발표를 확인하시기 바랍니다.</li>
              <li>천재지변, 시스템 장애 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 회사는 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제8조 (개인정보 보호)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              회사는 이용자의 개인정보를 관련 법령에 따라 보호하며, 자세한 사항은 개인정보처리방침에 따릅니다.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제9조 (분쟁 해결)</h3>
            <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
              <li>본 약관에서 정하지 않은 사항은 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령에 따릅니다.</li>
              <li>서비스 이용과 관련한 분쟁은 회사의 소재지를 관할하는 법원을 관할법원으로 합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">부칙</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              본 약관은 2026년 3월 23일부터 시행됩니다.
            </p>
          </section>
        </div>
      </main>

      <BusinessFooter />
    </div>
  );
}
