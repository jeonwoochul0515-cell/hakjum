import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Clock, Crown, ChevronRight, BookOpen, History, Settings, Pencil, Check, X, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { listReports, deleteReport, type SavedReportSummary } from '@/lib/report-storage';
import { SelfExplorationSummaryCard } from '@/components/self-exploration/SelfExplorationSummaryCard';

export default function ProfilePage() {
  const { currentUser, logout, profileExtra, savedResults, updateProfileExtra, isPaidUser } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editGrade, setEditGrade] = useState(profileExtra.grade || '');
  const [editSchool, setEditSchool] = useState(profileExtra.schoolName || '');
  const [editUserType, setEditUserType] = useState(profileExtra.userType || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedReports, setSavedReports] = useState<SavedReportSummary[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    setEditGrade(profileExtra.grade || '');
    setEditSchool(profileExtra.schoolName || '');
    setEditUserType(profileExtra.userType || '');
  }, [profileExtra]);

  // 내 보고서 목록 로드 (Firestore)
  useEffect(() => {
    if (!currentUser?.uid) return;
    let cancelled = false;
    setReportsLoading(true);
    listReports(currentUser.uid)
      .then((items) => {
        if (!cancelled) setSavedReports(items);
      })
      .finally(() => {
        if (!cancelled) setReportsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  async function handleDeleteReport(id: string) {
    if (!currentUser?.uid) return;
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
    await deleteReport(currentUser.uid, id);
  }

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
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-4 space-y-3 animate-fade-in-up">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">유형</label>
                <div className="flex gap-2">
                  {['학생', '학부모', '교사/상담사'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setEditUserType(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        editUserType === t
                          ? 'bg-sky-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">학년</label>
                <div className="flex gap-2">
                  {['고1', '고2', '고3'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setEditGrade(g)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        editGrade === g
                          ? 'bg-indigo-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">학교명</label>
                <input
                  type="text"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  placeholder="학교 이름을 입력하세요"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-primary/20"
                />
              </div>
              {saveError && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                  {saveError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setSaving(true);
                    setSaveError('');
                    try {
                      await updateProfileExtra({
                        userType: editUserType,
                        grade: editGrade,
                        schoolName: editSchool,
                      });
                      setEditing(false);
                    } catch {
                      setSaveError('프로필 저장에 실패했습니다. 다시 시도해주세요.');
                    } finally { setSaving(false); }
                  }}
                  disabled={saving}
                  className="flex items-center gap-1 px-4 py-2 bg-sky-primary text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditGrade(profileExtra.grade || '');
                    setEditSchool(profileExtra.schoolName || '');
                    setEditUserType(profileExtra.userType || '');
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              {profileExtra.schoolName && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  {profileExtra.schoolName}
                </div>
              )}
            </>
          )}

          {createdAt && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {createdAt} 가입
            </div>
          )}
        </Card>

        {/* Purchase Status */}
        <Card className="p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPaidUser ? 'bg-amber-50' : 'bg-slate-50'}`}>
                <Crown className={`w-5 h-5 ${isPaidUser ? 'text-amber-primary' : 'text-slate-400'}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {isPaidUser ? profileExtra.purchase?.planName || '이용권' : '무료'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isPaidUser && profileExtra.purchase
                    ? `${new Date(profileExtra.purchase.expiryDate).toLocaleDateString('ko-KR')}까지 · 리포트 ${profileExtra.purchase.reportsRemaining}건`
                    : 'AI 추천 하루 3회 이용 가능'}
                </p>
              </div>
            </div>
            <Badge color={isPaidUser ? 'amber' : 'green'}>{isPaidUser ? '이용 중' : '무료'}</Badge>
          </div>
          {!isPaidUser && (
            <button
              onClick={() => navigate('/subscription')}
              className="mt-3 w-full text-center text-xs text-sky-primary font-medium hover:underline cursor-pointer"
            >
              이용권 구매하기
            </button>
          )}
        </Card>

        {/* 자가탐색 결과 (RIASEC + 강점 + 가치관) */}
        <div className="animate-fade-in-up">
          <SelfExplorationSummaryCard uid={currentUser?.uid} />
        </div>

        {/* My Reports (Firestore) */}
        <Card className="animate-fade-in-up overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-sky-primary" />
              <h3 className="text-base font-semibold text-slate-900">내 보고서</h3>
              {savedReports.length > 0 && (
                <span className="text-xs text-slate-400">{savedReports.length}건</span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              결제한 보고서는 영구 보관 · 무료 미리보기는 30일 후 자동 정리
            </p>
          </div>

          {reportsLoading ? (
            <div className="px-5 pb-5">
              <div className="text-center py-6 text-sm text-slate-400">불러오는 중...</div>
            </div>
          ) : savedReports.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {savedReports.map((r) => (
                <div
                  key={r.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <button
                    onClick={() => navigate(`/report?id=${encodeURIComponent(r.id)}`)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {r.schoolName || '학교 미선택'}
                      </p>
                      {r.isPaid && (
                        <Badge color="amber">결제</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {r.topMajor ? `TOP ${r.topMajor}` : r.interest || '관심사 미입력'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteReport(r.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors cursor-pointer ml-2"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 pb-5">
              <div className="text-center py-6 bg-slate-50 rounded-xl">
                <FileText className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-sm text-slate-400">아직 생성된 보고서가 없어요</p>
                <button
                  onClick={() => navigate('/report')}
                  className="text-sm text-sky-primary font-semibold mt-2 hover:underline cursor-pointer"
                >
                  AI 분석 보고서 받으러 가기
                </button>
              </div>
            </div>
          )}
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
