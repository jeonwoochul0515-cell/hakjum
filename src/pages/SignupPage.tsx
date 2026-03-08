import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, School } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '@/lib/firebase';

type UserType = '학생' | '학부모' | '교사/상담사';
type Grade = '고1' | '고2' | '고3';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType | ''>('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const userTypes: UserType[] = ['학생', '학부모', '교사/상담사'];
  const grades: Grade[] = ['고1', '고2', '고3'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (!userType) {
      setError('사용자 유형을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, displayName);
      const uid = firebaseAuth?.currentUser?.uid;
      if (uid && db) {
        await setDoc(doc(db, 'users', uid), { userType, grade, schoolName });
      }
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('email-already-in-use')) {
        setError('이미 가입된 이메일입니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <img src="/butterfly.svg" alt="학점나비" className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
            학점나비 회원가입
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            맞춤 과목 추천을 받고 나만의 기록을 저장하세요
          </p>
        </div>

        {/* Signup Card */}
        <Card className="p-6 animate-fade-in-up">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1.5">
                이름
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-primary focus:ring-2 focus:ring-sky-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                사용자 유형
              </label>
              <div className="grid grid-cols-3 gap-2">
                {userTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUserType(type)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                      userType === type
                        ? 'bg-gradient-to-r from-sky-primary to-indigo-primary text-white border-transparent shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade (for students) */}
            {userType === '학생' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  학년
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {grades.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                        grade === g
                          ? 'bg-sky-50 text-sky-primary border-sky-primary ring-2 ring-sky-primary/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* School Name (optional) */}
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-slate-700 mb-1.5">
                학교명 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="school"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="학교명을 입력하세요"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-primary focus:ring-2 focus:ring-sky-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

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
                  placeholder="6자 이상 입력하세요"
                  required
                  minLength={6}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-primary focus:ring-2 focus:ring-sky-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500 mt-5">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-sky-primary font-semibold hover:underline">
              로그인
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
