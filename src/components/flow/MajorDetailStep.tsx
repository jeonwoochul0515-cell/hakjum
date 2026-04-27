import { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle, FileText, Building2, Users, GraduationCap } from 'lucide-react';
import { MajorOverviewCard } from '@/components/explore/MajorOverviewCard';
import { CareerOutcomeSection } from '@/components/explore/CareerOutcomeSection';
import { RequiredSubjectsView } from '@/components/explore/RequiredSubjectsView';
import { AdmissionRequirementSection } from '@/components/explore/AdmissionRequirementSection';
import { FavoriteButton } from '@/components/explore/FavoriteButton';
import { ShareButton } from '@/components/explore/ShareButton';
import { useFlow } from '@/hooks/useFlow';
import { C } from '@/lib/design-tokens';

interface MajorApiRecord {
  majorName: string;
  category?: string;
  schoolCount?: number;
  quotaStats?: { min: number; avg: number; max: number; total: number };
  tuitionAvgWon?: number | null;
  scholarshipAvgPerUniv?: number | null;
}

const MAJOR_NOTICES: Record<string, string> = {
  '법학과':
    '2009년부터 서울대, 연세대, 고려대 등 주요 25개 대학의 학부 법학과가 법학전문대학원(로스쿨)으로 전환되었습니다. 변호사를 희망하는 경우 학부 졸업 후 로스쿨 진학이 필요합니다. 일부 대학은 여전히 학부 법학과를 운영합니다.',
};

export function MajorDetailStep() {
  const { state, go, runRecommendation } = useFlow();
  const { selectedMajor, school, interest, exploreResult } = state;
  const [stats, setStats] = useState<MajorApiRecord | null>(null);

  // KCUE 통계 인덱스에서 학과 메타 (운영 대학 수·정원 통계) 조회
  useEffect(() => {
    if (!selectedMajor?.name) return;
    let cancelled = false;
    fetch(`/api/search/major?q=${encodeURIComponent(selectedMajor.name)}&limit=5`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('major fetch failed'))))
      .then((json: { data?: MajorApiRecord[] }) => {
        if (cancelled) return;
        const exact = (json.data ?? []).find((d) => d.majorName === selectedMajor.name);
        setStats(exact ?? json.data?.[0] ?? null);
      })
      .catch(() => {
        // 폴백: stats null 유지 → 통계 영역 숨김
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMajor?.name]);

  if (!selectedMajor) return null;

  const handleGoToUniversities = () => go('university-list');
  const handleGoToSubjectMatch = () => runRecommendation();
  const notice = MAJOR_NOTICES[selectedMajor.name];

  // exploreResult에서 현재 선택된 학과의 적합도 추출
  const matchScore =
    exploreResult?.recommendations.find((r) => r.majorName === selectedMajor.name)?.matchScore ?? 90;

  const hasMajorStats =
    !!stats &&
    ((stats.schoolCount ?? 0) > 0 ||
      (stats.quotaStats && stats.quotaStats.total > 0) ||
      (stats.tuitionAvgWon ?? 0) > 0);

  return (
    <div className="animate-fade-in-up">
      {/* 학과 헤더 */}
      <div style={{ paddingTop: 8, paddingBottom: 20 }}>
        {school?.name && (
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 6, letterSpacing: '-0.01em' }}>
            {school.name} 학생을 위한 맞춤 정보
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: C.ink }}>
              {selectedMajor.name}
            </h1>
            {selectedMajor.category && (
              <span
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: C.brand,
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {selectedMajor.category}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <FavoriteButton
              majorName={selectedMajor.name}
              category={selectedMajor.category || ''}
              interest={interest}
            />
            <ShareButton interest={interest} majorName={selectedMajor.name} />
          </div>
        </div>

        {/* 적합도 도넛 */}
        <div
          style={{
            background: C.brandSoft,
            borderRadius: 16,
            padding: 18,
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" stroke="#fff" strokeWidth="6" fill="none" />
              <circle
                cx="36"
                cy="36"
                r="30"
                stroke={C.brand}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(matchScore / 100) * 188.5} 188.5`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.brand,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {matchScore}
              </div>
              <div style={{ fontSize: 9, color: C.brand, opacity: 0.8, fontWeight: 600 }}>/100</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.brand, marginBottom: 4 }}>
              {matchScore >= 90 ? '최적 추천' : matchScore >= 80 ? '강력 추천' : '추천'}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: C.ink, letterSpacing: '-0.02em' }}>
              {hasMajorStats && stats?.schoolCount && stats.quotaStats
                ? `전국 ${stats.schoolCount}개 대학에서 운영하고 있어요.`
                : '관심사와 잘 맞는 학과예요.'}
              <br />
              {hasMajorStats && stats?.quotaStats
                ? `평균 ${stats.quotaStats.avg.toLocaleString()}명 모집 (최저 ${stats.quotaStats.min}명 · 최고 ${stats.quotaStats.max}명)`
                : '우리 학교 개설 과목으로도 충분히 준비 가능해요.'}
            </div>
          </div>
        </div>
      </div>

      {/* 학과 통계 카드 — KCUE 사전계산 인덱스 기반 (운영 대학 수, 입학정원, 등록금) */}
      {hasMajorStats && (
        <div style={{ paddingBottom: 20 }}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.line}`,
              borderRadius: 14,
              padding: 14,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            {stats?.schoolCount && stats.schoolCount > 0 && (
              <StatCell
                icon={<Building2 size={14} color={C.brand} />}
                label="운영 대학"
                value={`${stats.schoolCount.toLocaleString()}개`}
              />
            )}
            {stats?.quotaStats && stats.quotaStats.total > 0 && (
              <StatCell
                icon={<Users size={14} color={C.brand} />}
                label="평균 모집정원"
                value={`${stats.quotaStats.avg.toLocaleString()}명`}
                sub={`총 ${stats.quotaStats.total.toLocaleString()}명`}
              />
            )}
            {stats?.tuitionAvgWon != null && stats.tuitionAvgWon > 0 && (
              <StatCell
                icon={<GraduationCap size={14} color={C.brand} />}
                label="등록금 평균"
                value={`${Math.round(stats.tuitionAvgWon / 10_000).toLocaleString()}만원`}
                sub="학부 1년"
              />
            )}
          </div>
        </div>
      )}

      {/* 특수 안내 */}
      {notice && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            background: '#fef3c7',
            borderRadius: 14,
            border: '1px solid #fde68a',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={16} color="#a16207" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: '#a16207', lineHeight: 1.6, letterSpacing: '-0.01em' }}>{notice}</div>
        </div>
      )}

      {/* 개요 (Block들) */}
      <MajorOverviewCard major={selectedMajor} />

      {/* PICK 카드 — 학점내비 차별화 */}
      <div style={{ paddingTop: 20 }}>
        <div
          style={{
            background: C.brand,
            borderRadius: 18,
            padding: 20,
            color: '#fff',
            boxShadow: `0 12px 32px ${C.brandShadow}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: '0.02em' }}>★</span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: '0.02em' }}>학점나비 PICK</span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.035em', marginBottom: 6 }}>
            우리 학교에서 들어야 할 과목
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 16, letterSpacing: '-0.01em' }}>
            {school?.name ? `${school.name} 2026 편성표 기반 추천` : '학교 편성표 기반 추천'}
          </div>
          <RequiredSubjectsView major={selectedMajor} />
          <button
            onClick={handleGoToSubjectMatch}
            className="cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              width: '100%',
              marginTop: 12,
              padding: 14,
              background: '#fff',
              color: C.brand,
              border: 'none',
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            학기별 수강 계획 받기
            <ArrowRight size={14} color={C.brand} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 진로·취업 */}
      <div style={{ paddingTop: 20 }}>
        <CareerOutcomeSection major={selectedMajor} />
      </div>

      {/* 진학필수 교과목 (2028 대입기준) */}
      <div style={{ paddingTop: 20 }}>
        <AdmissionRequirementSection
          majorName={selectedMajor.name}
          schoolSubjects={school?.allSubjects || []}
        />
      </div>

      {/* 출처 */}
      <div style={{ paddingTop: 20 }}>
        <div
          style={{
            background: C.bg,
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 11,
            color: C.sub,
            lineHeight: 1.7,
            letterSpacing: '-0.01em',
          }}
        >
          <div style={{ fontWeight: 700, color: C.ink, marginBottom: 6, fontSize: 12 }}>📚 데이터 출처</div>
          • 2026 대교협 학과별 권장 이수 기준
          <br />
          • 교육부 고교학점제 운영 매뉴얼 (2025년 개정)
          <br />
          • 한국직업능력연구원 직업 정보
          {school?.name && (
            <>
              <br />• {school.name} 2026학년도 교육과정 편성표
            </>
          )}
        </div>
      </div>

      {/* 하단 CTA */}
      <div style={{ paddingTop: 20 }}>
        <button
          onClick={handleGoToSubjectMatch}
          className="cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            width: '100%',
            padding: 18,
            background: C.brand,
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            boxShadow: `0 6px 20px ${C.brandShadow}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <FileText size={16} />
          내 학교 맞춤 과목 추천받기
        </button>
        <button
          onClick={handleGoToUniversities}
          className="cursor-pointer"
          style={{
            width: '100%',
            marginTop: 8,
            padding: 14,
            background: '#fff',
            color: C.ink,
            border: `1.5px solid ${C.line}`,
            borderRadius: 14,
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          이 학과가 있는 대학교 보기 →
        </button>
      </div>
    </div>
  );
}

interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function StatCell({ icon, label, value, sub }: StatCellProps) {
  return (
    <div
      style={{
        flex: '1 1 100px',
        minWidth: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontSize: 11, color: C.sub, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: C.ink,
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: C.sub }}>{sub}</div>}
    </div>
  );
}
