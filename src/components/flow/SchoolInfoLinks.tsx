/**
 * 학교 정보 외부 링크 카드 — 학교알리미 sync 데이터 기반
 *
 * 학교알리미 OpenAPI는 학교 메타정보·통계만 제공하고 운영계획서 PDF는
 * 학교가 직접 학교알리미에 첨부하지 않는다. 따라서 학생이 정확한 교과별
 * 개설 정보를 얻으려면:
 *   1) 학교 자체 홈페이지의 운영계획서 PDF 다운로드
 *   2) 학교알리미 공시 페이지에서 표 데이터 확인
 *   3) 옵션 B (CurriculumUploadPage) 로 업로드 → AI 추출
 * 의 3-tier 경로가 필요하다.
 *
 * 본 컴포넌트는 위 3개 진입점을 한 카드에 통합한다.
 */

import { useNavigate } from 'react-router-dom';
import { ExternalLink, Globe, FileText, Upload, ArrowRight } from 'lucide-react';
import { C } from '@/lib/design-tokens';

interface Props {
  /** 학교명 (표시용) */
  schoolName: string;
  /** 학교알리미 학교 식별 UUID (Pneiss_b01_s0.do?SHL_IDF_CD=... 에 사용) */
  shlIdfCd?: string;
  /** 학교 자체 홈페이지 URL (학교알리미 sync HMPG_ADRES) */
  homepageUrl?: string;
  className?: string;
}

const SCHOOLINFO_BASE = 'https://www.schoolinfo.go.kr/ei/ss/Pneiss_b01_s0.do';

export function SchoolInfoLinks({ schoolName, shlIdfCd, homepageUrl, className }: Props) {
  const navigate = useNavigate();
  const schoolinfoUrl = shlIdfCd ? `${SCHOOLINFO_BASE}?SHL_IDF_CD=${shlIdfCd}` : null;

  return (
    <div
      className={className}
      style={{
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: C.ink,
          letterSpacing: '-0.025em',
          marginBottom: 4,
        }}
      >
        {schoolName} 교육과정 자세히 보기
      </div>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 12, lineHeight: 1.5 }}>
        학교 운영계획서·편성표는 다음 경로에서 확인할 수 있어요
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* 1) 학교 홈페이지 */}
        {homepageUrl && (
          <a
            href={homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={linkRow(C)}
          >
            <div style={iconBox(C, '#dbeafe')}>
              <Globe size={16} color="#1e40af" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
                학교 홈페이지
              </div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>
                운영계획서 · 가정통신문 · 행사안내 (PDF 보통 여기)
              </div>
            </div>
            <ExternalLink size={14} color={C.sub} />
          </a>
        )}

        {/* 2) 학교알리미 공시 */}
        {schoolinfoUrl && (
          <a
            href={schoolinfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={linkRow(C)}
          >
            <div style={iconBox(C, '#fef3c7')}>
              <FileText size={16} color="#a16207" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
                학교알리미 정보공시
              </div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>
                교원·학생·재정 등 15개 항목 공식 통계
              </div>
            </div>
            <ExternalLink size={14} color={C.sub} />
          </a>
        )}

        {/* 3) PDF 업로드 (옵션 B) */}
        <button
          onClick={() => navigate('/curriculum-upload')}
          className="cursor-pointer"
          style={{ ...linkRow(C), border: `1.5px solid ${C.brand}`, background: C.brandSoft }}
        >
          <div style={iconBox(C, C.brand)}>
            <Upload size={16} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.brand, letterSpacing: '-0.02em' }}>
              교육과정 PDF 업로드 (AI 추출)
            </div>
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>
              운영계획서 PDF가 있으면 AI가 학과별 매칭해드려요
            </div>
          </div>
          <ArrowRight size={14} color={C.brand} strokeWidth={2.4} />
        </button>
      </div>

      {/* 출처 */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${C.line}`,
          fontSize: 10,
          color: C.sub,
          letterSpacing: '-0.01em',
        }}
      >
        출처 · 학교알리미(KERIS) · 공공누리 출처표시
      </div>
    </div>
  );
}

function linkRow(c: typeof C): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    background: c.bg,
    borderRadius: 12,
    border: `1px solid ${c.line}`,
    textDecoration: 'none',
    transition: 'background 0.15s',
    cursor: 'pointer',
  };
}

function iconBox(_c: typeof C, bg: string): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}
