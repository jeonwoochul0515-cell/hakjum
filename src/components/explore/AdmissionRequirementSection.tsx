import { useState } from 'react';
import { AlertTriangle, CheckCircle, BookOpen, ChevronDown, GraduationCap, Shield } from 'lucide-react';
import { getRequirementsForMajor } from '@/data/admission-requirements';

interface Props {
  majorName: string;
  schoolSubjects: string[];  // 현재 학교 개설과목
}

export function AdmissionRequirementSection({ majorName, schoolSubjects }: Props) {
  const [showUnivDetail, setShowUnivDetail] = useState(false);
  const req = getRequirementsForMajor(majorName);

  if (!req.essential.length && !req.recommended.length) return null;

  const schoolSet = new Set(schoolSubjects.map((s) => s.replace(/[IⅠⅡ1234]+$/, '').trim()));

  function checkSubject(subject: string): 'available' | 'missing' | 'partial' {
    // 정확한 매칭
    if (schoolSubjects.includes(subject)) return 'available';
    // 부분 매칭 (예: "물리학I" → "물리학" 포함)
    const base = subject.replace(/[IⅠⅡ1234]+$/, '').trim();
    if (schoolSubjects.some((s) => s.includes(base))) return 'available';
    if (schoolSet.has(base)) return 'available';
    // 과목이 없으면
    if (schoolSubjects.length === 0) return 'partial'; // 학교 데이터 없음
    return 'missing';
  }

  const essentialChecks = req.essential.map((s) => ({ name: s, status: checkSubject(s) }));
  const recommendedChecks = req.recommended.map((s) => ({ name: s, status: checkSubject(s) }));

  const essentialMet = essentialChecks.filter((c) => c.status === 'available').length;
  const essentialTotal = essentialChecks.length;
  const fulfillRate = essentialTotal > 0 ? Math.round((essentialMet / essentialTotal) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap size={18} className="text-indigo-primary" />
        <h2 className="text-base font-bold text-slate-800">진학필수 교과목 체크</h2>
        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
          2028 대입기준
        </span>
      </div>

      {/* 계열 정보 + 출처 명시 */}
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-xl p-4 border border-indigo-100 mb-3">
        <p className="text-sm font-medium text-indigo-700">{req.track}</p>
        {req.trackRequirements && (
          <p className="text-xs text-indigo-500 mt-1 leading-relaxed">
            {req.trackRequirements.description}
          </p>
        )}
        <p className="text-[10px] text-indigo-400 mt-2">
          출처: 대교협 2028 대학별 권장과목 자료집 · 각 대학 입학본부 공식 발표
        </p>
      </div>

      {/* 충족률 */}
      {schoolSubjects.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">필수 교과 충족률</span>
            <span className={`text-lg font-bold ${
              fulfillRate >= 80 ? 'text-emerald-500' : fulfillRate >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {fulfillRate}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                fulfillRate >= 80 ? 'bg-emerald-400' : fulfillRate >= 50 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${fulfillRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            필수 {essentialTotal}개 중 {essentialMet}개 이수 가능
          </p>
        </div>
      )}

      {/* 필수 과목 */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-3">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Shield size={14} className="text-red-400" />
          필수이수 과목
        </h3>
        <div className="space-y-1.5">
          {essentialChecks.map(({ name, status }) => (
            <div key={name} className="flex items-center gap-2">
              {status === 'available' ? (
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              ) : status === 'missing' ? (
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${
                status === 'available' ? 'text-emerald-700' :
                status === 'missing' ? 'text-red-600 font-medium' : 'text-slate-500'
              }`}>
                {name}
              </span>
              {status === 'available' && schoolSubjects.length > 0 && (
                <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">개설됨</span>
              )}
              {status === 'missing' && (
                <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">미개설</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 권장 과목 */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-3">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <BookOpen size={14} className="text-sky-primary" />
          권장 과목
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {recommendedChecks.map(({ name, status }) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                status === 'available'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-slate-50 text-slate-500 border border-slate-200'
              }`}
            >
              {status === 'available' && <CheckCircle size={10} />}
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* 대학별 특이사항 */}
      {req.universitySpecific.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowUnivDetail(!showUnivDetail)}
            className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
          >
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-indigo-primary" />
              주요 대학별 이수기준 ({req.universitySpecific.length}개교)
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${showUnivDetail ? 'rotate-180' : ''}`}
            />
          </button>
          {showUnivDetail && (
            <div className="px-4 pb-4 space-y-3">
              {req.universitySpecific.map((u, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-slate-800">{u.university}</span>
                    <span className="text-[10px] text-slate-400">{u.category}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-red-500">핵심:</span> {u.requiredSubjects.join(', ') || '-'}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-sky-600">권장:</span> {u.recommendedSubjects.join(', ') || '-'}
                    </p>
                    {u.notes && (
                      <p className="text-[11px] text-slate-400 mt-1">{u.notes}</p>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 pt-1">
                출처: 대교협 adiga.kr 「2028 권역별 대학별 권장과목」 (2026.02.20) · 각 대학 입학본부
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
