import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import SchoolSelectPage from '@/pages/SchoolSelectPage';
import CareerInputPage from '@/pages/CareerInputPage';
import RecommendationPage from '@/pages/RecommendationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/school" element={<SchoolSelectPage />} />
      <Route path="/career" element={<CareerInputPage />} />
      <Route path="/recommendation" element={<RecommendationPage />} />
    </Routes>
  );
}
