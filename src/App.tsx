import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/HomePage'));
const FlowPage = lazy(() => import('@/pages/FlowPage'));

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
        {/* Legacy redirects */}
        <Route path="/explore" element={<Navigate to="/flow" replace />} />
        <Route path="/school" element={<Navigate to="/flow" replace />} />
        <Route path="/career" element={<Navigate to="/flow" replace />} />
        <Route path="/recommendation" element={<Navigate to="/flow" replace />} />
      </Routes>
    </Suspense>
  );
}
