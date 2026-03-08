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

  const { login } = useAuth();
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

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

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
