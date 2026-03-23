import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BusinessFooter } from '@/components/layout/BusinessFooter';

export default function PrivacyPolicyPage() {
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
          <h1 className="ml-2 text-lg font-bold text-slate-800">개인정보처리방침</h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-8">
        <div className="prose prose-sm prose-slate max-w-none">
          <h2 className="text-xl font-bold text-slate-900 mb-6">개인정보처리방침</h2>

          <p className="text-sm text-slate-500 mb-6">
            시행일: 2026년 3월 23일
          </p>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제1조 (개인정보의 수집 및 이용목적)</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              법률사무소 청송law(이하 "회사")는 다음의 목적을 위해 최소한의 개인정보를 수집·이용합니다.
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li><strong>회원 관리:</strong> 회원 식별, 본인 확인, 서비스 이용 내역 관리</li>
              <li><strong>결제 처리:</strong> 유료 서비스 결제 및 환불 처리</li>
              <li><strong>서비스 제공:</strong> 맞춤 과목 추천 리포트 생성 및 제공</li>
              <li><strong>고객 문의 대응:</strong> 민원 처리 및 서비스 관련 공지</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제2조 (수집하는 개인정보 항목)</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>필수항목 (Google 로그인 시):</strong> 이메일 주소, 이름(닉네임), 프로필 사진</li>
              <li><strong>결제 시:</strong> 결제 수단 정보 (토스페이먼츠를 통해 처리되며, 회사는 카드번호 등 민감 결제정보를 직접 저장하지 않습니다)</li>
              <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 로그</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제3조 (개인정보의 보유 및 이용기간)</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (탈퇴 후 즉시 파기)</li>
              <li><strong>결제 기록:</strong> 전자상거래법에 따라 5년간 보관</li>
              <li><strong>접속 로그:</strong> 통신비밀보호법에 따라 3개월간 보관</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제4조 (개인정보의 제3자 제공)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside mt-2">
              <li>법령에 의거하거나 수사기관의 요청이 있는 경우</li>
              <li>결제 처리를 위해 토스페이먼츠에 필요 최소한의 정보를 전달하는 경우</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제5조 (개인정보의 파기)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              회사는 개인정보의 수집 및 이용목적이 달성되면 해당 정보를 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 삭제하며, 종이 문서는 분쇄 또는 소각합니다.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제6조 (이용자의 권리)</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
            </p>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li>개인정보 열람, 수정, 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>회원 탈퇴</li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              위 요청은 이메일(support@hakjumnabi.com)로 접수하실 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">제7조 (개인정보 보호책임자)</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
              <li>성명: 김창희</li>
              <li>직위: 대표이사</li>
              <li>연락처: support@hakjumnabi.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-base font-bold text-slate-800 mb-3">부칙</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              본 개인정보처리방침은 2026년 3월 23일부터 시행됩니다.
            </p>
          </section>
        </div>
      </main>

      <BusinessFooter />
    </div>
  );
}
