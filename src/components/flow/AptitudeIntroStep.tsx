import { ArrowRight, SkipForward, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFlow } from '@/hooks/useFlow';

export function AptitudeIntroStep() {
  const { state, dispatch, go } = useFlow();

  const genderSelected = !!state.aptitudeGender;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center pt-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck size={32} className="text-sky-primary" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">나의 직업 흥미를 알아볼까요?</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          커리어넷 직업흥미검사로 나에게 맞는 직업 유형을 발견하고,
          <br />
          AI가 더 정확한 학과를 추천해드려요
        </p>
      </div>

      {/* 검사 안내 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sm">1</div>
          <div>
            <p className="text-sm font-medium text-slate-700">직업흥미검사 (K형)</p>
            <p className="text-xs text-slate-400">교육부 커리어넷 공식 검사</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sm">2</div>
          <div>
            <p className="text-sm font-medium text-slate-700">약 5~10분 소요</p>
            <p className="text-xs text-slate-400">간단한 질문에 답하면 끝!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sm">3</div>
          <div>
            <p className="text-sm font-medium text-slate-700">결과 즉시 확인</p>
            <p className="text-xs text-slate-400">나의 흥미 유형 + 맞춤 학과 추천까지</p>
          </div>
        </div>
      </div>

      {/* 성별 선택 */}
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-2">성별 선택</label>
        <div className="flex gap-3">
          {[
            { code: '100323', label: '남학생' },
            { code: '100324', label: '여학생' },
          ].map((g) => (
            <button
              key={g.code}
              onClick={() => dispatch({ type: 'SET_APTITUDE_GENDER', payload: g.code })}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                state.aptitudeGender === g.code
                  ? 'bg-gradient-to-r from-sky-primary to-indigo-primary text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        className="w-full"
        disabled={!genderSelected}
        onClick={() => go('aptitude-test')}
      >
        흥미검사 시작하기
        <ArrowRight size={18} className="ml-2" />
      </Button>

      <button
        onClick={() => go('interest-input')}
        className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
      >
        <SkipForward size={14} />
        이미 관심 분야를 알고 있어요 (건너뛰기)
      </button>
    </div>
  );
}
