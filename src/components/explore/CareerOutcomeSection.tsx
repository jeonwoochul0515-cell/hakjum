import { useState } from 'react';
import { TrendingUp, DollarSign, Briefcase, Award, GraduationCap, Target, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import type { MajorFull } from '@/types';

interface Props {
  major: MajorFull;
}

export function CareerOutcomeSection({ major }: Props) {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [expandedQualifi, setExpandedQualifi] = useState<string | null>(null);

  // 취업률 숫자 추출
  const rateMatch = major.employmentRate.match(/(\d+\.?\d*)/);
  const rateNum = rateMatch ? parseFloat(rateMatch[1]) : null;

  const jobDetails = major.relatedJobDetails?.length > 0
    ? major.relatedJobDetails
    : major.jobs
      ? major.jobs.split(',').map((j) => ({ name: j.trim(), desc: '' })).filter((j) => j.name)
      : [];

  const qualifiDetails = major.relatedQualifiDetails?.length > 0
    ? major.relatedQualifiDetails
    : major.qualifications
      ? major.qualifications.split(',').map((q) => ({ name: q.trim(), desc: '' })).filter((q) => q.name)
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

      {/* 관련 직업 (상세) */}
      {jobDetails.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={16} className="text-indigo-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">졸업하면 이런 일을 할 수 있어요</h3>
          </div>
          <div className="space-y-2">
            {jobDetails.map((job, i) => (
              <div key={i} className="border border-slate-50 rounded-lg overflow-hidden">
                <button
                  onClick={() => job.desc && setExpandedJob(expandedJob === job.name ? null : job.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left ${job.desc ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                  <span className="text-sm font-medium text-indigo-700">{job.name}</span>
                  {job.desc && (
                    expandedJob === job.name
                      ? <ChevronUp size={14} className="text-slate-400" />
                      : <ChevronDown size={14} className="text-slate-400" />
                  )}
                </button>
                {expandedJob === job.name && job.desc && (
                  <div className="px-3 pb-2.5 text-xs text-slate-500 leading-relaxed">{job.desc}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 관련 자격증 (상세) */}
      {qualifiDetails.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-amber-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">관련 자격증</h3>
          </div>
          <div className="space-y-2">
            {qualifiDetails.map((q, i) => (
              <div key={i} className="border border-slate-50 rounded-lg overflow-hidden">
                <button
                  onClick={() => q.desc && setExpandedQualifi(expandedQualifi === q.name ? null : q.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left ${q.desc ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                  <span className="text-sm font-medium text-amber-700">{q.name}</span>
                  {q.desc && (
                    expandedQualifi === q.name
                      ? <ChevronUp size={14} className="text-slate-400" />
                      : <ChevronDown size={14} className="text-slate-400" />
                  )}
                </button>
                {expandedQualifi === q.name && q.desc && (
                  <div className="px-3 pb-2.5 text-xs text-slate-500 leading-relaxed">{q.desc}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진로탐색활동 */}
      {major.careerActivities?.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-sky-primary" />
            <h3 className="font-semibold text-slate-800 text-sm">진로 탐색 활동</h3>
          </div>
          <div className="space-y-2.5">
            {major.careerActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-slate-700">{act.name}</span>
                  {act.desc && <p className="text-xs text-slate-400 mt-0.5">{act.desc}</p>}
                </div>
              </div>
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
