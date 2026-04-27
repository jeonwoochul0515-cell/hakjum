import { useState, useMemo } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import type { MajorFull } from '@/types';
import { useFlow } from '@/hooks/useFlow';
import { checkSubjectAvailability } from '@/lib/subject-content';
import { C } from '@/lib/design-tokens';
import { UnopenedSubjectAlternatives } from '@/components/explore/UnopenedSubjectAlternatives';

interface Props {
  major: MajorFull;
}

const SUBJECT_CATEGORIES = [
  { key: 'common' as const, label: '공통과목', color: 'bg-sky-100 text-sky-700', dotColor: 'bg-sky-primary' },
  { key: 'general' as const, label: '일반선택', color: 'bg-indigo-100 text-indigo-700', dotColor: 'bg-indigo-primary' },
  { key: 'career' as const, label: '진로선택', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-primary' },
  { key: 'professional' as const, label: '전문교과', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
];

/**
 * 학교 ID(`${regionCode}_${schoolCode}`)에서 NEIS 시도코드만 추출.
 * 예: 'B10_7530000' → 'B10'
 */
function extractRegionCode(schoolId: string | undefined): string | undefined {
  if (!schoolId) return undefined;
  const idx = schoolId.indexOf('_');
  if (idx <= 0) return undefined;
  return schoolId.slice(0, idx);
}

export function RequiredSubjectsView({ major }: Props) {
  const { state } = useFlow();
  const school = state.school;
  const schoolSubjects = school?.allSubjects ?? [];
  const studentRegionCode = extractRegionCode(school?.id);

  // 펼쳐진 미개설 과목명 (한 번에 하나씩만 표시)
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  const hasAny = useMemo(
    () => Object.values(major.relateSubject).some((v) => v.trim()),
    [major],
  );

  if (!hasAny) {
    return (
      <div className="text-center py-8 animate-fade-in-up">
        <p className="text-sm text-slate-500">관련 고교과목 정보가 아직 없어요</p>
      </div>
    );
  }

  // 학교 과목 데이터가 로드되어 있을 때만 미개설 표시 가능
  const canCheckAvailability = schoolSubjects.length > 0;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <p className="text-xs text-slate-500">
        이 학과에 진학하려면 고등학교에서 이런 과목을 들으면 좋아요
      </p>

      {SUBJECT_CATEGORIES.map(({ key, label, color, dotColor }) => {
        const subjects = major.relateSubject[key];
        if (!subjects.trim()) return null;

        const list = subjects.split(',').map((s) => s.trim()).filter(Boolean);

        return (
          <div key={key} className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              <h3 className="font-semibold text-slate-800 text-sm">{label}</h3>
              <span className="text-xs text-slate-400">({list.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((subj, i) => {
                const status = canCheckAvailability
                  ? checkSubjectAvailability(subj, schoolSubjects)
                  : 'partial';
                const isMissing = status === 'missing';
                const isOpen = openSubject === `${key}:${subj}`;

                if (!isMissing) {
                  return (
                    <span
                      key={i}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
                    >
                      {subj}
                    </span>
                  );
                }

                // 미개설 과목 — 토글 버튼으로 렌더
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setOpenSubject(isOpen ? null : `${key}:${subj}`)
                    }
                    className="cursor-pointer active:scale-[0.98] transition-transform"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#fff',
                      color: C.brand,
                      border: `1px dashed ${C.brand}`,
                      letterSpacing: '-0.01em',
                    }}
                    aria-expanded={isOpen}
                    aria-label={`${subj} — 다른 방법으로 듣기`}
                  >
                    <AlertCircle size={11} strokeWidth={2.4} />
                    <span>{subj}</span>
                    <ChevronDown
                      size={12}
                      strokeWidth={2.4}
                      style={{
                        transition: 'transform 0.18s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* 미개설 과목 펼침 영역 — 이 카테고리의 펼친 항목이 있으면 표시 */}
            {(() => {
              if (!openSubject) return null;
              const sepIdx = openSubject.indexOf(':');
              if (sepIdx < 0) return null;
              const openKey = openSubject.slice(0, sepIdx);
              const openName = openSubject.slice(sepIdx + 1);
              if (openKey !== key || !openName) return null;
              return (
                <div style={{ marginTop: 12 }}>
                  <UnopenedSubjectAlternatives
                    subjectName={openName}
                    studentRegionCode={studentRegionCode}
                  />
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
