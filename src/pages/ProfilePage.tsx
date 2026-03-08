import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Clock, Crown, ChevronRight, BookOpen, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { currentUser, logout, profileExtra, savedResults } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch {
      setLoggingOut(false);
    }
  }

  if (!currentUser) return null;

  const createdAt = currentUser.metadata.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            <img src="/butterfly.svg" alt="학점나비" className="w-7 h-7" />
            <span className="text-lg font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
              학점나비
            </span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            홈으로
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-5">
        {/* Profile Card */}
        <Card className="p-6 animate-fade-in-up">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="프로필"
                className="w-16 h-16 rounded-full border-2 border-slate-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-primary to-indigo-primary flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {currentUser.displayName || '사용자'}
              </h2>
              <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {currentUser.email}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {profileExtra.userType && (
                  <Badge color="sky">{profileExtra.userType}</Badge>
                )}
                {profileExtra.grade && (
                  <Badge color="indigo">{profileExtra.grade}</Badge>
                )}
              </div>
            </div>
          </div>

          {profileExtra.schoolName && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              {profileExtra.schoolName}
            </div>
          )}

          {createdAt && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {createdAt} 가입
            </div>
          )}
        </Card>

        {/* Subscription Status */}
        <Card className="p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">무료 플랜</h3>
                <p className="text-xs text-slate-500">기본 추천 기능 이용 중</p>
              </div>
            </div>
            <Badge color="green">활성</Badge>
          </div>
        </Card>

        {/* Saved Recommendations */}
        <Card className="animate-fade-in-up overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-indigo-primary" />
              <h3 className="text-base font-semibold text-slate-900">저장된 추천 기록</h3>
            </div>
          </div>

          {savedResults.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {savedResults.map((result) => (
                <div key={result.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{result.career}</p>
                    <p className="text-xs text-slate-500">
                      {result.major} · 추천 과목 {result.subjectCount}개
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{result.date}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 pb-5">
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">아직 저장된 추천 기록이 없습니다</p>
                <button
                  onClick={() => navigate('/flow')}
                  className="text-sm text-sky-primary font-semibold mt-2 hover:underline cursor-pointer"
                >
                  과목 추천 받으러 가기
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Settings / Actions */}
        <Card className="p-2 animate-fade-in-up">
          <button
            onClick={() => navigate('/flow')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-700">새로운 과목 추천 받기</span>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
          </button>
        </Card>

        {/* Logout */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {loggingOut ? '로그아웃 중...' : '로그아웃'}
        </Button>
      </div>
    </div>
  );
}
