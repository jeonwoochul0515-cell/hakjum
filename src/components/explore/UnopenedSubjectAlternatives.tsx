import { Globe, Building, BookOpen, ArrowUpRight } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import {
  ONLINE_PORTAL,
  getRegionalPortal,
  type RegionalPortal,
} from '@/data/regional-curriculum-portals';

interface Props {
  subjectName: string;
  /** 학생 학교 시도코드 (NEIS 'B10'/'C10' 또는 표준 '11'/'21' 형식 모두 허용) */
  studentRegionCode?: string;
  className?: string;
}

interface AlternativeItem {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  href: string;
}

/**
 * 학교에 미개설된 과목을 다른 방법으로 들을 수 있도록 안내하는 펼침 카드.
 *  1) 교실온닷 — 전국 통합 온라인 공동교육과정
 *  2) [시도명] 공동교육과정 — 학생 시도교육청 포털
 *  3) 보충 학습 — K-MOOC + EBS 검색
 */
export function UnopenedSubjectAlternatives({
  subjectName,
  studentRegionCode,
  className,
}: Props) {
  const regional: RegionalPortal | null = studentRegionCode
    ? getRegionalPortal(studentRegionCode)
    : null;

  // K-MOOC / EBS 보충 학습 검색 URL (과목명 인코딩)
  const kmoocSearch = `https://www.kmooc.kr/search/?q=${encodeURIComponent(subjectName)}`;

  const items: AlternativeItem[] = [
    {
      icon: Globe,
      title: `${ONLINE_PORTAL.name} 온라인 수강`,
      description: ONLINE_PORTAL.description,
      href: ONLINE_PORTAL.url,
    },
    {
      icon: Building,
      title: regional
        ? `${regional.region} 공동교육과정`
        : '시도별 공동교육과정',
      description: regional
        ? regional.portalName
        : '학교 시도교육청 정보를 확인해주세요',
      href: regional?.portalUrl ?? '',
    },
    {
      icon: BookOpen,
      title: '보충 학습 (K-MOOC)',
      description: 'EBS·대학 무료 강의에서 같은 과목을 찾아볼 수 있어요',
      href: kmoocSearch,
    },
  ];

  return (
    <div
      className={className}
      style={{
        background: C.brandSoft,
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.brand,
          letterSpacing: '-0.01em',
          marginBottom: 2,
        }}
      >
        다른 방법으로 듣기 — {subjectName}
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const disabled = !item.href;

        const inner = (
          <>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={14} color={C.brand} strokeWidth={2.2} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: C.ink,
                  letterSpacing: '-0.02em',
                }}
              >
                {item.title}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: C.sub,
                  marginTop: 2,
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.description}
              </span>
            </span>
            <ArrowUpRight
              size={14}
              color={disabled ? C.sub : C.brand}
              strokeWidth={2.2}
            />
          </>
        );

        const sharedStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          background: '#fff',
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          textDecoration: 'none',
          color: 'inherit',
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? 'default' : 'pointer',
        };

        if (disabled) {
          return (
            <div key={item.title} style={sharedStyle} aria-disabled="true">
              {inner}
            </div>
          );
        }

        return (
          <a
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            style={sharedStyle}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
