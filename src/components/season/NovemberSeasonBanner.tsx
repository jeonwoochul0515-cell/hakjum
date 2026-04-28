/**
 * 11월 수강신청 시즌 배너
 *
 * 한국 고등학교는 11~12월에 다음 학년도 수강신청을 받는다. 이 시기에는 NEIS·
 * 학교알리미가 아직 공시되지 않아 공식 데이터로는 학교의 "내년 개설 과목"을
 * 알 수 없다. 본 배너는 그 공백을 메우기 위한 3가지 액션을 제공한다:
 *
 *   1) PDF 업로드 — 학교가 직접 배포한 안내서를 AI로 추출 (가장 정확)
 *   2) 시도 공동교육과정 — 다음 학년도 강좌를 시도 포털에서 미리 확인
 *   3) 작년 데이터 기반 예상 — 학과 추천 플로우로 진입
 *
 * 노출 조건:
 *   - isApplicationSeason() === true (11월 ~ 12월) 일 때만 렌더링
 *   - 사용자가 닫으면 sessionStorage 에 7일간 닫힘 상태 유지
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, FileUp, BookOpen, BarChart3, X, ArrowRight } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import { isApplicationSeason } from '@/lib/season-detector';
import { getRegionalPortal } from '@/data/regional-curriculum-portals';

const DISMISS_KEY = 'hakjum-season-banner-dismissed-at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7일

interface Props {
  /**
   * 학생 학교의 시도 식별자. NEIS 코드(B10/C10), 표준 시도코드(11/21),
   * 시도명(서울/경기) 또는 `${regionCode}_${schoolCode}` 형태의 School.id 모두 허용.
   * 미지정 시 공동교육과정 액션은 일반 안내(시도 미설정)로 폴백한다.
   */
  schoolRegionHint?: string | null;
  /** 디버깅·테스트용 — 시즌 검사 우회 */
  forceShow?: boolean;
}

export function NovemberSeasonBanner({ schoolRegionHint, forceShow }: Props) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  // 1회 마운트 시 시즌·닫힘 상태 평가 (SSR-safe: sessionStorage는 effect 안에서만 접근)
  useEffect(() => {
    const inSeason = forceShow ?? isApplicationSeason();
    if (!inSeason) {
      setVisible(false);
      return;
    }
    const dismissedAt = readDismissedAt();
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DURATION_MS) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [forceShow]);

  const portal = useMemo(() => {
    if (!schoolRegionHint) return null;
    // School.id 형태 (`B10_1234567`) 일 경우 앞부분만 추출
    const head = schoolRegionHint.split('_')[0] ?? schoolRegionHint;
    return getRegionalPortal(head);
  }, [schoolRegionHint]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* sessionStorage 차단 환경 — 그냥 닫기만 */
    }
    setVisible(false);
  };

  const handleUpload = () => navigate('/curriculum-upload');
  const handlePortal = () => {
    if (portal) {
      window.open(portal.portalUrl, '_blank', 'noopener,noreferrer');
    } else {
      // 시도 미설정: 학교 선택을 먼저 유도
      navigate('/flow');
    }
  };
  const handleEstimate = () => {
    sessionStorage.setItem('hakjum-entry', 'season-banner-estimate');
    navigate('/flow');
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="11월 수강신청 시즌 안내"
      style={{
        margin: '12px 20px 0',
        borderRadius: 16,
        padding: 16,
        background: `linear-gradient(135deg, ${C.brand} 0%, #2f6fe8 100%)`,
        color: '#fff',
        boxShadow: `0 10px 26px ${C.brandShadow}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 닫기 */}
      <button
        type="button"
        aria-label="시즌 배너 닫기"
        onClick={handleDismiss}
        className="cursor-pointer"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: 8,
          border: 'none',
          background: 'rgba(255,255,255,0.18)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={14} strokeWidth={2.4} />
      </button>

      {/* 헤더 */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.18)',
          fontSize: 11,
          fontWeight: 700,
          marginBottom: 10,
          letterSpacing: '-0.01em',
        }}
      >
        <CalendarDays size={12} strokeWidth={2.4} />
        11~12월 수강신청 시즌
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '-0.035em',
          lineHeight: 1.35,
          marginBottom: 6,
        }}
      >
        수강신청 시즌이 다가왔어요
      </div>
      <div
        style={{
          fontSize: 12.5,
          opacity: 0.92,
          lineHeight: 1.55,
          marginBottom: 14,
          letterSpacing: '-0.01em',
        }}
      >
        내년 개설 과목, 학교에서 안내서 받으셨나요?
        <br />
        NEIS 공시까지 기다리지 말고 미리 확인해 보세요.
      </div>

      {/* 액션 3개 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ActionRow
          icon={<FileUp size={16} color={C.brand} strokeWidth={2.2} />}
          title="안내서 PDF 업로드"
          subtitle="AI가 학교 운영계획서를 읽어 정확히 정리"
          onClick={handleUpload}
          highlight
        />
        <ActionRow
          icon={<BookOpen size={16} color="#fff" strokeWidth={2.2} />}
          title={portal ? `공동교육과정 보기 · ${portal.region}` : '공동교육과정 보기'}
          subtitle={portal ? portal.portalName : '학교를 선택하면 시도 포털을 안내해드려요'}
          onClick={handlePortal}
        />
        <ActionRow
          icon={<BarChart3 size={16} color="#fff" strokeWidth={2.2} />}
          title="작년 데이터로 예상 보기"
          subtitle="학과 추천부터 빠르게 살펴볼 수 있어요"
          onClick={handleEstimate}
        />
      </div>
    </div>
  );
}

interface ActionRowProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  /** 가장 권장하는 액션(=PDF 업로드) — 흰 배경 강조 */
  highlight?: boolean;
}

function ActionRow({ icon, title, subtitle, onClick, highlight }: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer active:scale-[0.99] transition-transform"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 12,
        border: highlight ? 'none' : '1px solid rgba(255,255,255,0.25)',
        background: highlight ? '#fff' : 'rgba(255,255,255,0.10)',
        color: highlight ? C.ink : '#fff',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: highlight ? C.brandSoft : 'rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: highlight ? C.ink : '#fff',
          }}
        >
          {title}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            marginTop: 2,
            color: highlight ? C.sub : 'rgba(255,255,255,0.82)',
            letterSpacing: '-0.01em',
          }}
        >
          {subtitle}
        </span>
      </span>
      <ArrowRight
        size={14}
        strokeWidth={2.4}
        color={highlight ? C.brand : '#fff'}
      />
    </button>
  );
}

function readDismissedAt(): number | null {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}
