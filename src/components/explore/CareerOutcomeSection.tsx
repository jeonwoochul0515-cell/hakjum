import { TrendingUp, DollarSign, Briefcase, Award, GraduationCap, Target } from 'lucide-react';
import type { MajorFull } from '@/types';

interface Props {
  major: MajorFull;
}

export function CareerOutcomeSection({ major }: Props) {
  // 취업률 숫자 추출
  const rateMatch = major.employmentRate.match(/(\d+\.?\d*)/);
  const rateNum = rateMatch ? parseFloat(rateMatch[1]) : null;

  const jobs = major.jobs
    ? major.jobs.split(',').map((j) => j.trim()).filter(Boolean)
    : [];

  const qualifications = major.qualifications
    ? major.qualifications.split(',').map((q) => q.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* 취업률 */}
      {major.employmentRate && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-green-500" />
            <h3 className="font-semibold text-slate-800 text-sm">취업률</h3>
          </div>
          {rateNum !== null ? (
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-800">{rateNum}</span>
                <span className="text-lg text-slate-500 mb-0.5">%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(rateNum, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">{major.employmentRate}</p>
          )}
        </div>
      )}

      {/* 임금 */}
      {major.salary && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-amber-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">졸업 후 첫 임금</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{major.salary}</p>
        </div>
      )}

      {/* 관련 직업 */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={16} className="text-indigo-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">졸업하면 이런 일을 할 수 있어요</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {jobs.map((job, i) => (
              <span
                key={i}
                className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
              >
                {job}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 관련 자격증 */}
      {qualifications.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-amber-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">관련 자격증</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {qualifications.map((q, i) => (
              <span
                key={i}
                className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
              >
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 졸업후 상황 */}
      {major.postGraduation && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-sky-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">졸업 후 상황</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{major.postGraduation}</p>
        </div>
      )}

      {/* 진출분야 */}
      {major.enterField && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-green-500" />
            <h3 className="font-semibold text-slate-800 text-sm">진출 분야</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{major.enterField}</p>
        </div>
      )}
    </div>
  );
}
