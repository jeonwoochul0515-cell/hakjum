import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWizard } from '@/context/WizardContext';

const worryCards = [
  '인문계인데 미적분 들어야 하나...?',
  '의대 가고 싶은데 우리 학교에 물리학II가 있나?',
  '친구들은 다 정한 것 같은데 나만 모르겠어',
  '선택과목이 너무 많아서 뭘 골라야 할지...',
  '내신 관리하면서 진로에 맞는 과목을 들을 수 있을까?',
];

const testimonials = [
  { name: '김○○', grade: '고2', text: '진짜 30초 만에 추천받았어요. 선생님한테 물어보기 전에 여기서 먼저 확인해봐요!' },
  { name: '이○○ 학부모', grade: '', text: '아이 과목 선택 때 막막했는데, 진로에 맞는 과목을 한눈에 볼 수 있어서 좋았습니다.' },
  { name: '박○○', grade: '고2', text: '우리 학교 개설과목 중에서 골라주니까 현실적이에요. 친구한테도 추천했어요.' },
];

function getUsageCount(): number {
  const key = 'hakjum-usage-count';
  const count = parseInt(localStorage.getItem(key) || '247', 10);
  return count;
}

function incrementUsageCount() {
  const key = 'hakjum-usage-count';
  const count = parseInt(localStorage.getItem(key) || '247', 10);
  localStorage.setItem(key, String(count + 1));
}

export default function HomePage() {
  const navigate = useNavigate();
  const { state } = useWizard();
  const [currentWorry, setCurrentWorry] = useState(0);
  const [worryVisible, setWorryVisible] = useState(true);
  const [usageCount] = useState(getUsageCount);

  const hasLastResult = !!state.lastResult;

  useEffect(() => {
    const interval = setInterval(() => {
      setWorryVisible(false);
      setTimeout(() => {
        setCurrentWorry((prev) => (prev + 1) % worryCards.length);
        setWorryVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    incrementUsageCount();
    navigate('/explore');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      <div className="max-w-lg mx-auto px-4 pt-12 pb-8">
        {/* Returning user banner */}
        {hasLastResult && (
          <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-sky-100 animate-fade-in-up">
            <p className="text-sm font-medium text-slate-700">지난번에 받은 추천이 있어요!</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => navigate('/recommendation')}
                className="px-3 py-1.5 text-sm font-medium text-sky-primary bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
              >
                다시 보기
              </button>
              <button
                onClick={handleStart}
                className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                새로 시작
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <img src="/butterfly.svg" alt="학점나비" className="w-20 h-20 drop-shadow-lg animate-butterfly" />
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            <span className="bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
              과목 선택, 혼자 고민하지 마세요
            </span>
          </h1>
          <p className="text-base text-slate-500 mt-2">2학년 선택과목 마감이 다가오는데...</p>
        </div>

        {/* Worry rotation card */}
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 min-h-[72px] flex items-center justify-center">
          <p
            className={`text-sm text-slate-600 text-center italic transition-all duration-300 ${
              worryVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            "{worryCards[currentWorry]}"
          </p>
        </div>

        {/* Value proposition */}
        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-slate-700 leading-relaxed px-2">
            내 학교 개설과목 + 희망 진로 ={' '}
            <span className="text-indigo-primary font-bold">AI가 최적의 과목 조합</span>을 찾아드려요
          </p>
        </div>

        {/* Social proof counter */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Users size={16} className="text-sky-primary" />
          <span>지금까지 <strong className="text-slate-700">{usageCount.toLocaleString()}명</strong>의 학생이 과목 추천을 받았어요</span>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <Button size="lg" className="w-full" onClick={handleStart}>
            내 맞춤 과목 찾기
            <ArrowRight size={20} className="ml-2" />
          </Button>
          <p className="text-xs text-slate-400 text-center mt-3">
            30초면 끝 · 무료 · 회원가입 없이
          </p>
        </div>

        {/* Parent CTA */}
        <div className="mt-3 text-center">
          <button
            onClick={handleStart}
            className="text-sm text-slate-500 hover:text-indigo-primary transition-colors cursor-pointer underline underline-offset-2"
          >
            학부모이신가요? 자녀 과목 선택 도우미 →
          </button>
        </div>

        {/* Testimonials */}
        <div className="mt-10 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">이용 후기</h2>
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
            >
              <p className="text-sm text-slate-600 leading-relaxed">"{t.text}"</p>
              <p className="text-xs text-slate-400 mt-2">
                — {t.name} {t.grade && <span className="text-sky-primary">{t.grade}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* How it works (simplified) */}
        <div className="mt-10 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">이용 방법</h2>
          {[
            { step: 1, title: '관심사 입력', desc: '하고 싶은 일을 자유롭게 적어요' },
            { step: 2, title: 'AI 학과 추천', desc: '맞춤 학과 + 대학교를 추천받아요' },
            { step: 3, title: '맞춤 과목 확인', desc: '내 학교 과목과 매칭해줘요' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-primary to-indigo-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 mb-4">
          <Button size="lg" className="w-full" onClick={handleStart}>
            <Sparkles size={18} className="mr-2" />
            내 맞춤 과목 찾기
          </Button>
        </div>
      </div>
    </div>
  );
}
