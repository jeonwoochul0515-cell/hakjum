import { GraduationCap, BookOpen, Award, Briefcase } from 'lucide-react';
import type { AdmissionInfo } from '@/types';

interface AdmissionStrategyProps {
  info: AdmissionInfo;
  majorName: string;
}

export function AdmissionStrategy({ info, majorName }: AdmissionStrategyProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-4 border border-indigo-200">
      <h3 className="font-bold text-sm text-indigo-800 mb-4">
        <GraduationCap size={16} className="inline mr-1" />
        {majorName} 입시 전략
      </h3>

      <div className="space-y-3">
        {/* 수시 전략 */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
          <h4 className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 mb-1.5">
            <BookOpen size={13} /> 수시 전형 전략
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">{info.earlyAdmission}</p>
        </div>

        {/* 정시 전략 */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
          <h4 className="text-xs font-bold text-violet-600 flex items-center gap-1.5 mb-1.5">
            <BookOpen size={13} /> 정시 전형 전략
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">{info.regularAdmission}</p>
        </div>

        {/* 자격증 */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
          <h4 className="text-xs font-bold text-amber-600 flex items-center gap-1.5 mb-1.5">
            <Award size={13} /> 관련 자격증
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">{info.relatedCerts}</p>
        </div>

        {/* 관련 직업 */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
          <h4 className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mb-1.5">
            <Briefcase size={13} /> 졸업 후 진로
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">{info.relatedJobs}</p>
        </div>
      </div>
    </div>
  );
}
