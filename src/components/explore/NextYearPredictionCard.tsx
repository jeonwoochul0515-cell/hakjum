import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import type { MajorFull } from '@/types';
import { C } from '@/lib/design-tokens';
import {
  predictNextYearOpening,
  predictionMeta,
  summarizePredictions,
  type SubjectPrediction,
  type PredictionLevel,
} from '@/lib/subject-prediction';

interface Props {
  major: MajorFull;
  /** 학교알리미 과목명 → 작년 교사 수 매핑 */
  teacherCountMap: Record<string, number>;
  /** 학교 학생 수 (없으면 0) */
  studentCount: number;
  /** 학교가 선택되지 않았거나 학교알리미 매칭 실패 시 true */
  schoolUnavailable?: boolean;
  /** 예측 기준 연도 — 기본 2025, 표시용 */
  baseYear?: number;
  /** 내년 표시 (현재 날짜 기준 자동 계산되지만 명시 가능) */
  targetYear?: number;
}

const LEVEL_ORDER: PredictionLevel[] = [
  'very-high',
  'high',
  'possible',
  'low',
  'very-low',
];

/** major.relateSubject의 4개 카테고리를 단일 과목 배열로 평탄화(중복 제거). */
function flattenRelateSubjects(major: MajorFull): string[] {
  const all = [
    major.relateSubject.common,
    major.relateSubject.general,
    major.relateSubject.career,
    major.relateSubject.professional,
  ]
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  // 순서 유지하며 dedupe
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of all) {
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

export function NextYearPredictionCard({
  major,
  teacherCountMap,
  studentCount,
  schoolUnavailable = false,
  baseYear = 2025,
  targetYear,
}: Props) {
  const computedTargetYear = targetYear ?? new Date().getFullYear() + 1;

  const predictions: SubjectPrediction[] = useMemo(() => {
    if (schoolUnavailable) return [];
    const subjects = flattenRelateSubjects(major);
    return subjects.map((name) =>
      predictNextYearOpening(name, teacherCountMap[name] ?? 0, studentCount),
    );
  }, [major, teacherCountMap, studentCount, schoolUnavailable]);

  // 학교 미선택/미매칭 시 안내 카드
  if (schoolUnavailable) {
    return (
      <div
        style={{
          background: C.brandSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <Sparkles size={13} color={C.brand} strokeWidth={2.4} />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: C.brand,
              letterSpacing: '-0.02em',
            }}
          >
            {computedTargetYear}학년도 개설 예측
          </span>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: C.sub,
            lineHeight: 1.5,
            letterSpacing: '-0.01em',
          }}
        >
          학교를 선택하면 작년({baseYear}) 운영 데이터로 내년 개설 가능성을
          예측해드려요.
        </div>
      </div>
    );
  }

  if (predictions.length === 0) return null;

  const summary = summarizePredictions(predictions);

  // 단계별 그룹핑
  const groups = LEVEL_ORDER.map((level) => ({
    level,
    meta: predictionMeta(level),
    items: predictions.filter((p) => p.prediction === level),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <Sparkles size={13} color={C.brand} strokeWidth={2.4} />
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: '-0.02em',
          }}
        >
          {computedTargetYear}학년도 개설 예측
        </span>
        <span
          style={{
            fontSize: 10.5,
            color: C.sub,
            fontWeight: 600,
          }}
        >
          작년({baseYear}) 운영 데이터 기반
        </span>
      </div>

      {/* 분포 통계 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <SummaryPill
          label="안정"
          count={summary.stable}
          total={summary.total}
          color="#15803d"
          bg="#dcfce7"
        />
        <SummaryPill
          label="가능"
          count={summary.possible}
          total={summary.total}
          color="#a16207"
          bg="#fef9c3"
        />
        <SummaryPill
          label="위험"
          count={summary.risky}
          total={summary.total}
          color="#b91c1c"
          bg="#fee2e2"
        />
      </div>

      {/* 그룹별 칩 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {groups.map((g) => (
          <div key={g.level}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: g.meta.color,
                letterSpacing: '-0.01em',
                marginBottom: 4,
              }}
            >
              {g.meta.icon} {g.meta.label} ({g.items.length})
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
              }}
            >
              {g.items.map((p) => (
                <span
                  key={p.subjectName}
                  title={p.message}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    background: g.meta.bg,
                    color: g.meta.color,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {p.subjectName}
                  {p.prevYearTeachers > 0 ? (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        opacity: 0.8,
                      }}
                    >
                      교사 {p.prevYearTeachers}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 면책 */}
      <div
        style={{
          fontSize: 10,
          color: C.sub,
          marginTop: 10,
          lineHeight: 1.5,
          letterSpacing: '-0.01em',
        }}
      >
        작년({baseYear}) 학교알리미(KERIS) 교사 자격 데이터 기반 휴리스틱
        예측이에요. 학교 신설/폐지 결정에 따라 달라질 수 있으니, 정확한
        개설 여부는 학교에 직접 확인해주세요.
      </div>
    </div>
  );
}

interface SummaryPillProps {
  label: string;
  count: number;
  total: number;
  color: string;
  bg: string;
}

function SummaryPill({ label, count, total, color, bg }: SummaryPillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        padding: '4px 10px',
        background: bg,
        color,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}
    >
      {label}
      <span style={{ fontSize: 12.5, fontWeight: 800 }}>{count}</span>
      <span style={{ fontSize: 10, opacity: 0.7 }}>/ {total}</span>
    </span>
  );
}
