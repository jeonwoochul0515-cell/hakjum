import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Save, BarChart3, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }

  const benefits = [
    { icon: Save, label: '추천 결과 저장' },
    { icon: BarChart3, label: '과목 비교 기록' },
    { icon: Bell, label: '맞춤 알림' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <img src="/butterfly.svg" alt="학점나비" className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
            학점나비에 로그인
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            나만의 과목 추천을 저장하고 관리하세요
          </p>
        </div>

        {/* Benefits */}
        <div className="flex justify-center gap-4 mb-8 animate-fade-in-up">
          {benefits.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-primary" />
              </div>
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <Card className="p-6 animate-fade-in-up">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-primary focus:ring-2 focus:ring-sky-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-sky-primary focus:ring-2 focus:ring-sky-primary/20 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowResetForm(true); setResetEmail(email); }}
                className="text-xs text-slate-400 hover:text-sky-primary transition-colors cursor-pointer"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          {/* Password Reset Form */}
          {showResetForm && (
            <div className="mt-4 p-4 bg-sky-50 rounded-xl border border-sky-100 animate-fade-in-up">
              {resetSent ? (
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">비밀번호 재설정 이메일을 보냈습니다!</p>
                  <p className="text-xs text-slate-500 mt-1">이메일을 확인해주세요.</p>
                  <button
                    onClick={() => { setShowResetForm(false); setResetSent(false); }}
                    className="text-xs text-sky-primary mt-2 cursor-pointer hover:underline"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700 mb-2">비밀번호 재설정</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="가입한 이메일 주소"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-primary/20"
                    />
                    <button
                      onClick={async () => {
                        if (!resetEmail) return;
                        setResetLoading(true);
                        try {
                          await resetPassword(resetEmail);
                        } catch {
                          // 이메일 존재 여부 노출 방지: 에러 시에도 동일 메시지 표시
                        } finally {
                          setResetSent(true);
                          setResetLoading(false);
                        }
                      }}
                      disabled={resetLoading}
                      className="px-4 py-2 bg-sky-primary text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {resetLoading ? '전송 중...' : '전송'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowResetForm(false)}
                    className="text-xs text-slate-400 mt-2 cursor-pointer hover:text-slate-600"
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">또는</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Login */}
          <button
            onClick={async () => {
              setGoogleLoading(true);
              setError('');
              try {
                await loginWithGoogle();
                navigate('/');
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error('Google login error:', err);
                setError(`구글 로그인에 실패했습니다. (${msg})`);
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? '로그인 중...' : 'Google로 시작하기'}
          </button>


          {/* Signup link */}
          <p className="text-center text-sm text-slate-500 mt-5">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="text-sky-primary font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </Card>

        {/* Footer link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            로그인 없이 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}
