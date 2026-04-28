/**
 * BusanCurriculumPanel — 학생 학교가 부산일 때 자동 노출되는 부산 고교학점제 안내 패널.
 *
 * 데이터 소스: GET /api/busan/curriculum-info?schoolName={이름}
 *   → 부산교육청 고교학점제 지원센터 PDF 6종에서 추출한 인덱스 기반.
 *
 * 비부산 학교는 isBusan=false 응답 → 컴포넌트 자동 숨김 (null 반환).
 *
 * 표시 콘텐츠:
 *   1) 부산 공동교육과정 운영 학교 (5~10개 카드, 모바일 가로 스크롤)
 *   2) 부산 진로진학 핵심 가이드 (3개, 펼침/접기)
 *   3) 출처 표기 (학교알리미 · 부산교육청 고교학점제 지원센터, 공공누리 출처표시)
 */

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, BookOpen, School as SchoolIcon } from 'lucide-react';
import { C } from '@/lib/design-tokens';

interface JointSchool {
  name: string;
  location?: string;
  role: string;
}

interface RelatedGuide {
  topic: string;
  content: string;
  source: string;
}

interface SchoolMatched {
  name: string;
  location?: string;
  roles: string[];
  descriptions: string[];
}

interface BusanCurriculumResp {
  data: {
    isBusan: boolean;
    schoolMatched: SchoolMatched | null;
    relatedGuides: RelatedGuide[];
    jointCurriculumSchools: JointSchool[];
  } | null;
  _meta: {
    source?: string;
    license?: string;
    organization?: string;
    upstreamUrl?: string;
    syncedAt?: string;
    totalGuides?: number;
    totalSchools?: number;
    totalSubjects?: number;
    error?: string;
  };
}

interface Props {
  /** NEIS·검색 학교 이름 (state.school.name 그대로 전달) */
  schoolName: string;
  /**
   * 학교 ID — `${regionCode}_${schoolCode}` 포맷.
   * 부산 NEIS 시도코드는 'C10' 이므로, ID 가 'C10_' 로 시작하지 않으면 즉시 부산 아님으로 판정해
   * 불필요한 API 호출을 막을 수 있다.
   */
  schoolId?: string;
  className?: string;
}

const BUSAN_REGION_CODE = 'C10';

export function BusanCurriculumPanel({ schoolName, schoolId, className }: Props) {
  const [resp, setResp] = useState<BusanCurriculumResp | null>(null);
  const [openGuideIdx, setOpenGuideIdx] = useState<number | null>(0);

  // schoolId 가 'C10_' 가 아니면 부산 아님 → API 호출 자체를 건너뜀
  const skipFetch = !!schoolId && !schoolId.startsWith(`${BUSAN_REGION_CODE}_`);

  useEffect(() => {
    if (!schoolName || skipFetch) return;
    let cancelled = false;
    fetch(`/api/busan/curriculum-info?schoolName=${encodeURIComponent(schoolName)}`)
      .then((r) => (r.ok ? (r.json() as Promise<BusanCurriculumResp>) : null))
      .then((j) => {
        if (cancelled) return;
        setResp(j);
      })
      .catch(() => {
        // graceful: 부산 인덱스 미가용 시 패널 숨김 유지
      });
    return () => {
      cancelled = true;
    };
  }, [schoolName, skipFetch]);

  // 비부산 또는 응답 없음 → 자동 숨김
  if (skipFetch) return null;
  if (!resp?.data) return null;
  if (!resp.data.isBusan) return null;

  const { schoolMatched, relatedGuides, jointCurriculumSchools } = resp.data;
  const meta = resp._meta;

  // 핵심 가이드 3개만 노출 (이미 API에서 우선순위 정렬됨)
  const topGuides = relatedGuides.slice(0, 3);

  return (
    <div
      className={className}
      style={{
        background: C.brandSoft,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }} aria-hidden>📍</span>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: C.brand,
            letterSpacing: '-0.025em',
          }}
        >
          부산 고교학점제 안내
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>
        {schoolMatched
          ? `${schoolMatched.name} 은(는) 부산 공동교육과정 협력단위 학교로 등록되어 있어요.`
          : '부산 지역 학생을 위한 고교학점제 운영 정보입니다.'}
      </div>

      {/* 섹션 1: 공동교육과정 운영 학교 (가로 스크롤 카드) */}
      {jointCurriculumSchools.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionTitle icon={<SchoolIcon size={13} color={C.brand} />} text="부산 공동교육과정 운영 학교" />
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              marginTop: 8,
              scrollbarWidth: 'thin',
            }}
          >
            {jointCurriculumSchools.map((s) => (
              <SchoolCard key={s.name} school={s} />
            ))}
          </div>
        </div>
      )}

      {/* 섹션 2: 진로진학 가이드 (펼침/접기) */}
      {topGuides.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionTitle icon={<BookOpen size={13} color={C.brand} />} text="부산 진로진학 가이드" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {topGuides.map((g, idx) => {
              const open = openGuideIdx === idx;
              return (
                <div
                  key={`${g.topic}-${idx}`}
                  style={{
                    background: '#fff',
                    border: `1px solid ${C.line}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenGuideIdx(open ? null : idx)}
                    className="cursor-pointer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.ink,
                        flex: 1,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {g.topic}
                    </span>
                    {open ? (
                      <ChevronUp size={14} color={C.sub} />
                    ) : (
                      <ChevronDown size={14} color={C.sub} />
                    )}
                  </button>
                  {open && (
                    <div
                      style={{
                        padding: '0 12px 12px',
                        fontSize: 11.5,
                        color: C.sub,
                        lineHeight: 1.6,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {g.content}
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 10,
                          color: C.sub,
                          opacity: 0.75,
                        }}
                      >
                        출처: {g.source}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 출처 */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${C.line}`,
          fontSize: 10,
          color: C.sub,
          letterSpacing: '-0.01em',
          lineHeight: 1.5,
        }}
      >
        출처 · {meta.organization ?? '부산광역시교육청 고교학점제 지원센터'} · 학교알리미(KERIS)
        <br />
        라이선스 · {meta.license ?? '공공누리 출처표시'}
        {meta.totalSchools !== undefined && meta.totalGuides !== undefined && (
          <>
            {' '}
            · 데이터: 부산 학교 {meta.totalSchools}곳 · 가이드 {meta.totalGuides}건
          </>
        )}
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────

function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon}
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: C.ink,
          letterSpacing: '-0.025em',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function SchoolCard({ school }: { school: JointSchool }) {
  return (
    <div
      style={{
        flex: '0 0 auto',
        minWidth: 160,
        maxWidth: 200,
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: C.ink,
          letterSpacing: '-0.02em',
          marginBottom: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {school.name}
      </div>
      {school.location && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            color: C.sub,
            marginBottom: 4,
          }}
        >
          <MapPin size={9} />
          {school.location}
        </div>
      )}
      <div
        style={{
          fontSize: 10,
          color: C.sub,
          lineHeight: 1.4,
          letterSpacing: '-0.01em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {school.role}
      </div>
    </div>
  );
}
