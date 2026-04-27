import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from '@/components/auth/PrivateRoute';

const HomePage = lazy(() => import('@/pages/HomePage'));
const FlowPage = lazy(() => import('@/pages/FlowPage'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const SubscriptionSuccessPage = lazy(() => import('@/pages/SubscriptionSuccessPage'));
const SubscriptionFailPage = lazy(() => import('@/pages/SubscriptionFailPage'));
const TeacherSubscriptionPage = lazy(() => import('@/pages/TeacherSubscriptionPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ParentPaymentPage = lazy(() => import('@/pages/ParentPaymentPage'));
const RefundPolicyPage = lazy(() => import('@/pages/RefundPolicyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const ReportPage = lazy(() => import('@/pages/ReportPage'));
const CurriculumUploadPage = lazy(() => import('@/pages/CurriculumUploadPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">로딩 중...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flow" element={<FlowPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
        <Route path="/subscription/fail" element={<SubscriptionFailPage />} />
        <Route path="/subscription/teacher" element={<TeacherSubscriptionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/pay" element={<ParentPaymentPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/curriculum-upload" element={<CurriculumUploadPage />} />
        {/* Legacy redirects */}
        <Route path="/explore" element={<Navigate to="/flow" replace />} />
        <Route path="/school" element={<Navigate to="/flow" replace />} />
        <Route path="/career" element={<Navigate to="/flow" replace />} />
        <Route path="/recommendation" element={<Navigate to="/flow" replace />} />
      </Routes>
    </Suspense>
  );
}
