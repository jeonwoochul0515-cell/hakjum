import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
