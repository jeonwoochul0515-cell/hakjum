import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MajorExplorePage = lazy(() => import('@/pages/MajorExplorePage'));
const SchoolSelectPage = lazy(() => import('@/pages/SchoolSelectPage'));
const CareerInputPage = lazy(() => import('@/pages/CareerInputPage'));
const RecommendationPage = lazy(() => import('@/pages/RecommendationPage'));

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
        <Route path="/explore" element={<MajorExplorePage />} />
        <Route path="/school" element={<SchoolSelectPage />} />
        <Route path="/career" element={<CareerInputPage />} />
        <Route path="/recommendation" element={<RecommendationPage />} />
      </Routes>
    </Suspense>
  );
}
