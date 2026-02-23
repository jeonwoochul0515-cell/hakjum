import { useNavigate } from 'react-router-dom';
import { Sparkles, School, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { schools } from '@/data/schools';

export default function HomePage() {
  const navigate = useNavigate();

  const totalSubjects = new Set(schools.flatMap((s) => s.allSubjects)).size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="max-w-lg mx-auto px-4 pt-16 pb-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <img src="/butterfly.svg" alt="학점나비" className="w-20 h-20 drop-shadow-lg" />
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            <span className="bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">학점나비</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium">고교학점제 AI 맞춤 과목 추천</p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            부산 지역 고등학교의 실제 개설과목 데이터를 기반으로<br />
            나만의 최적 과목 조합을 AI가 추천해드립니다
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-10">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <School size={24} className="mx-auto text-sky-primary mb-2" />
            <p className="text-2xl font-bold text-slate-800">{schools.length}</p>
            <p className="text-xs text-slate-500">학교</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <BookOpen size={24} className="mx-auto text-indigo-primary mb-2" />
            <p className="text-2xl font-bold text-slate-800">{totalSubjects}</p>
            <p className="text-xs text-slate-500">과목 종류</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <Target size={24} className="mx-auto text-amber-primary mb-2" />
            <p className="text-2xl font-bold text-slate-800">4단계</p>
            <p className="text-xs text-slate-500">추천</p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-10 space-y-3">
          <h2 className="text-sm font-bold text-slate-700 text-center mb-4">이용 방법</h2>
          {[
            { step: 1, title: '학교 선택', desc: '부산 지역 고등학교를 검색하고 선택하세요' },
            { step: 2, title: '진로 입력', desc: '희망 진로와 관심 분야를 알려주세요' },
            { step: 3, title: 'AI 추천', desc: '실제 개설과목 기반 맞춤 추천을 받아보세요' },
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

        {/* CTA */}
        <div className="mt-10">
          <Button size="lg" className="w-full" onClick={() => navigate('/school')}>
            <Sparkles size={20} className="mr-2" />
            시작하기
          </Button>
          <p className="text-xs text-slate-400 text-center mt-3">
            무료 · 회원가입 불필요 · 부산 {schools.length}개교 지원
          </p>
        </div>
      </div>
    </div>
  );
}
