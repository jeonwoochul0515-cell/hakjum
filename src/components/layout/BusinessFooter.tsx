import { Link } from 'react-router-dom';

export function BusinessFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-12">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {/* 사업자 정보 */}
        <div className="text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600 mb-2">사업자 정보</p>
          <p>상호: 법률사무소 청송law | 대표자: 김창희</p>
          <p>사업자등록번호: 102-78-00061</p>
          <p>주소: 부산광역시 연제구 법원남로15번길 10, 2층 202호(거제동, 미르코아빌딩)</p>
          <p>이메일: support@hakjumnabi.com | 전화: 1660-4452</p>
        </div>

        {/* 정책 링크 */}
        <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-200">
          <Link to="/terms" className="hover:text-slate-600 transition-colors">
            이용약관
          </Link>
          <span>|</span>
          <Link to="/refund-policy" className="hover:text-slate-600 transition-colors">
            환불정책
          </Link>
          <span>|</span>
          <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors">
            개인정보처리방침
          </Link>
        </div>

        <p className="text-[10px] text-slate-300 pt-1">
          &copy; {new Date().getFullYear()} 법률사무소 청송law. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
