import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, AlertCircle, Sparkles, Users } from 'lucide-react';
import type { MajorFull } from '@/types';
import { useFlow } from '@/hooks/useFlow';
import { checkSubjectAvailability } from '@/lib/subject-content';
import { C } from '@/lib/design-tokens';
import { UnopenedSubjectAlternatives } from '@/components/explore/UnopenedSubjectAlternatives';
import { getUploadedCurriculum } from '@/lib/curriculum-storage';

interface SchoolSubjectsResp {
  data: {
    schoolCode: string;
    schoolName: string;
    subjects: Record<string, number>;
    subjectCount: number;
    totalTeachers: number;
    studentCount?: number;
    studentByGrade?: { grade1: number; grade2: number; grade3: number };
    teacherCountTotal?: number;
    weeklyHours?: number;
  } | null;
  _meta: { source: string; curriculum?: string; matched: boolean };
}

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
  const studentRegionCode = extractRegionCode(school?.id);

  // 펼쳐진 미개설 과목명 (한 번에 하나씩만 표시)
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  // 학생이 업로드한 교육과정 PDF가 있으면 NEIS보다 우선 사용
  const uploaded = useMemo(() => getUploadedCurriculum(), []);
  const usingUploaded = !!uploaded && uploaded.subjects.length > 0;
  const schoolSubjects = useMemo(() => {
    if (usingUploaded) {
      return uploaded!.subjects.filter((s) => s.status === '개설').map((s) => s.name);
    }
    return school?.allSubjects ?? [];
  }, [usingUploaded, uploaded, school]);
  const uploadedDateLabel = uploaded?.meta.syncedAt
    ? new Date(uploaded.meta.syncedAt).toLocaleDateString('ko-KR')
    : '';

  // 학교알리미 학교 × 과목 인덱스에서 교사 수 가져오기 (보강 데이터)
  const [keris, setKeris] = useState<SchoolSubjectsResp['data'] | null>(null);
  useEffect(() => {
    if (!school?.name) return;
    let cancelled = false;
    fetch(`/api/school/subjects?schoolName=${encodeURIComponent(school.name)}`)
      .then((r) => (r.ok ? (r.json() as Promise<SchoolSubjectsResp>) : null))
      .then((j) => {
        if (cancelled) return;
        if (j?._meta?.matched !== false) setKeris(j?.data ?? null);
      })
      .catch(() => {
        // graceful: KERIS 없으면 NEIS만 사용
      });
    return () => {
      cancelled = true;
    };
  }, [school?.name]);

  // 과목명 → 교사 수 매핑
  const teacherCountMap = keris?.subjects ?? {};

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

      {/* 학교 규모 + 학교알리미 매칭 출처 */}
      {keris && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {keris.studentCount && keris.studentCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                background: C.brandSoft,
                color: C.brand,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
              title={
                keris.studentByGrade
                  ? `1학년 ${keris.studentByGrade.grade1} · 2학년 ${keris.studentByGrade.grade2} · 3학년 ${keris.studentByGrade.grade3}`
                  : ''
              }
            >
              <Users size={11} strokeWidth={2.4} />
              학생 {keris.studentCount.toLocaleString()}명
            </span>
          )}
          {keris.teacherCountTotal && keris.teacherCountTotal > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                background: C.bg,
                color: C.ink,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                border: `1px solid ${C.line}`,
              }}
            >
              교원 {keris.teacherCountTotal}명
            </span>
          )}
          {Object.keys(teacherCountMap).length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: '#eef9f0',
                color: '#1c7a3e',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
              title="학교알리미 KERIS 데이터로 학교 규모와 담당 교사 수를 보강했어요"
            >
              출처: 학교알리미 (2022 개정)
            </span>
          )}
        </div>
      )}

      {/* 출처 표시: 업로드한 PDF가 있으면 NEIS 대신 그 데이터를 사용 */}
      {usingUploaded && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: C.brandSoft,
            color: C.brand,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          <Sparkles size={11} strokeWidth={2.4} />
          출처: 학생 업로드 PDF (AI 추출{uploadedDateLabel ? `, ${uploadedDateLabel}` : ''})
        </div>
      )}

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
                  const tCount = teacherCountMap[subj];
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
                    >
                      {subj}
                      {tCount && tCount > 0 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            padding: '1px 5px',
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: 999,
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: C.ink,
                            letterSpacing: '-0.01em',
                          }}
                          aria-label={`담당 교사 ${tCount}명`}
                          title={`담당 교사 ${tCount}명 (학교알리미)`}
                        >
                          <Users size={9} strokeWidth={2.5} />
                          {tCount}
                        </span>
                      ) : null}
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
