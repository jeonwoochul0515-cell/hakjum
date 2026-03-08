import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Star, AlertCircle } from 'lucide-react';
import { findRecommendations, type RecommendationMatch, type DeptRecommendation } from '@/lib/university-recommendations';

interface Props {
  universityName: string;
  majorName?: string;
}

function SubjectBadge({ text, type }: { text: string; type: 'core' | 'recommended' }) {
  const colors = type === 'core'
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : 'bg-sky-50 text-sky-700 border-sky-100';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${colors}`}>
      {text}
    </span>
  );
}

function DeptCard({ dept, isDirectMatch }: { dept: DeptRecommendation; isDirectMatch: boolean }) {
  const coreSubjects = dept.core ? dept.core.split(/[,،]/).map(s => s.trim()).filter(Boolean) : [];
  const recSubjects = dept.recommended ? dept.recommended.split(/[,،]/).map(s => s.trim()).filter(Boolean) : [];
  const hasSubjects = coreSubjects.length > 0 || recSubjects.length > 0;

  if (!hasSubjects && !dept.notes) return null;

  return (
    <div className={`rounded-lg border p-3 ${isDirectMatch ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-start gap-2 mb-2">
        {isDirectMatch && <Star size={12} className="text-amber-500 mt-0.5 shrink-0" />}
        <div className="min-w-0">
          {dept.category && (
            <p className="text-[11px] text-slate-400 mb-0.5">{dept.category}</p>
          )}
          <p className="text-xs font-medium text-slate-700 break-keep">
            {dept.majors || dept.category}
          </p>
        </div>
      </div>

      {coreSubjects.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[10px] text-rose-500 font-medium mb-1">핵심</p>
          <div className="flex flex-wrap gap-1">
            {coreSubjects.map(s => <SubjectBadge key={s} text={s} type="core" />)}
          </div>
        </div>
      )}

      {recSubjects.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[10px] text-sky-500 font-medium mb-1">권장</p>
          <div className="flex flex-wrap gap-1">
            {recSubjects.map(s => <SubjectBadge key={s} text={s} type="recommended" />)}
          </div>
        </div>
      )}

      {dept.notes && (
        <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1">
          <AlertCircle size={10} className="shrink-0 mt-0.5 text-slate-400" />
          {dept.notes}
        </p>
      )}
    </div>
  );
}

export function UniversityRecommendations({ universityName, majorName }: Props) {
  const [result, setResult] = useState<RecommendationMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    findRecommendations(universityName, majorName)
      .then(r => setResult(r))
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [universityName, majorName]);

  if (loading) return null;
  if (!result) return null;

  const directMatches = result.matches;
  const otherDepts = result.allDepartments.filter(
    d => !directMatches.includes(d) && (d.core || d.recommended || d.notes)
  );

  if (directMatches.length === 0 && otherDepts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <BookOpen size={14} className="text-amber-500" />
        <h3 className="text-sm font-bold text-slate-700">
          {result.universityName} 권장과목
        </h3>
        <span className="text-[10px] text-slate-400 ml-auto">2028학년도</span>
      </div>

      {/* Direct matches */}
      {directMatches.length > 0 && (
        <div className="space-y-2 mb-3">
          {directMatches.map((dept, i) => (
            <DeptCard key={i} dept={dept} isDirectMatch />
          ))}
        </div>
      )}

      {directMatches.length === 0 && (
        <p className="text-xs text-slate-500 mb-3">
          해당 학과의 직접 매칭 정보가 없어요. 같은 대학의 다른 모집단위를 참고하세요.
        </p>
      )}

      {/* Other departments (collapsible) */}
      {otherDepts.length > 0 && (
        <>
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-xs text-sky-primary hover:text-sky-600 transition-colors cursor-pointer w-full justify-center py-1"
          >
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAll ? '접기' : `다른 모집단위 보기 (${otherDepts.length}개)`}
          </button>

          {showAll && (
            <div className="space-y-2 mt-2 animate-fade-in-up">
              {otherDepts.map((dept, i) => (
                <DeptCard key={i} dept={dept} isDirectMatch={false} />
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-slate-400 text-right mt-2">
        출처: 대교협 adiga.kr 「2028 모집단위별 반영과목 및 대학별 권장과목」
      </p>
    </div>
  );
}
