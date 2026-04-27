/**
 * UniversityCostCard
 *
 * 학과/대학 카드에 부착하는 비용 정보 카드.
 * /api/university/cost 를 호출하여 1년 등록금, 장학금 수혜, 학자금대출(취업후상환 포함)
 * 정보를 KCUE 표준데이터 기반으로 표시한다.
 *
 * - 데이터가 전혀 없는 경우 (hasData=false) 카드 자체를 렌더링하지 않음 (조용히 숨김)
 * - props.category 가 주어지면(예: '공학계열') 입학정원 byCategory 비교 라벨로 활용
 * - 디자인 토큰(C)만 사용
 */

import { useEffect, useState } from 'react';
import { Wallet, GraduationCap, CreditCard, Loader2 } from 'lucide-react';
import { C } from '../../lib/design-tokens';

interface CostBucket {
  count: number;
  amount: number;
}

interface CostApiResponse {
  data: {
    tuition: { average: number; byCategory: Record<string, number> } | null;
    scholarship: { internal: CostBucket; external: CostBucket } | null;
    loan: { tuitionLoan: CostBucket; lifeLoan: CostBucket } | null;
    admissionQuota: number | null;
    admissionByCategory: Record<string, number> | null;
  };
  hasData: boolean;
  _meta: {
    source: string;
    organization?: string;
    syncedAt: string;
    matchedName: string | null;
    matchType: 'exact' | 'normalized' | 'none';
  };
}

interface Props {
  universityName: string;
  /** '공학계열', '인문계열' 등. 등록금 byCategory 라벨 표기에 사용 */
  category?: string;
  className?: string;
}

/** 원 → '○억 ○○○만원' / '○○○만원' */
function formatWon(won: number): string {
  if (!Number.isFinite(won) || won <= 0) return '0원';
  const eok = Math.floor(won / 100_000_000);
  const man = Math.floor((won % 100_000_000) / 10_000);
  if (eok > 0 && man > 0) return `${eok.toLocaleString()}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok.toLocaleString()}억원`;
  if (man > 0) return `${man.toLocaleString()}만원`;
  return `${won.toLocaleString()}원`;
}

/** 원 → '○○○만원' (등록금처럼 만원 단위가 일반적인 경우) */
function formatManwon(won: number): string {
  if (!Number.isFinite(won) || won <= 0) return '-';
  const man = Math.round(won / 10_000);
  return `${man.toLocaleString()}만원`;
}

export function UniversityCostCard({ universityName, category, className }: Props) {
  // universityName 이 없으면 처음부터 로딩 상태 아님
  const [resp, setResp] = useState<CostApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(universityName));
  const [errored, setErrored] = useState<boolean>(false);

  useEffect(() => {
    if (!universityName) return;
    let cancelled = false;

    fetch(`/api/university/cost?university=${encodeURIComponent(universityName)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as CostApiResponse;
      })
      .then((d) => {
        if (cancelled) return;
        setResp(d);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErrored(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [universityName]);

  // 로딩 상태 — 살짝만 표시
  if (loading) {
    return (
      <div
        className={className}
        style={{
          background: '#fff',
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: C.sub,
          fontSize: 12,
        }}
      >
        <Loader2 size={14} color={C.brand} className="animate-spin" />
        등록금·장학금 정보를 불러오는 중…
      </div>
    );
  }

  // 에러 또는 데이터 없음 — 카드 자체 숨김 (조용히 처리)
  if (errored || !resp || !resp.hasData) return null;

  const { tuition, scholarship, loan } = resp.data;
  const byCat = tuition?.byCategory ?? {};

  // 표시할 등록금: category 가 주어졌고 입학정원 byCategory 에 해당 계열이 있으면 라벨로 활용
  // tuition 데이터에는 계열별 분리가 없으므로 'category 평균' 표기는 추정 라벨로만 사용
  const tuitionLabel =
    tuition && category && resp.data.admissionByCategory && resp.data.admissionByCategory[category]
      ? `${category} 포함 학부 평균`
      : tuition
        ? '학부 평균'
        : '';

  // 등록금 보조 수치: '대학' 외 카테고리도 있으면 1~2개 함께 노출
  const otherCats = Object.entries(byCat)
    .filter(([k]) => k !== '대학')
    .slice(0, 2);

  return (
    <div
      className={className}
      style={{
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        letterSpacing: '-0.01em',
      }}
    >
      {/* 1년 등록금 */}
      {tuition && tuition.average > 0 && (
        <Row
          icon={<Wallet size={14} color={C.brand} />}
          title="1년 등록금"
          value={formatManwon(tuition.average)}
          sub={tuitionLabel}
          extra={
            otherCats.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {otherCats.map(([k, v]) => (
                  <span
                    key={k}
                    style={{
                      fontSize: 10.5,
                      color: C.sub,
                      background: C.bg,
                      border: `1px solid ${C.line}`,
                      borderRadius: 6,
                      padding: '2px 6px',
                    }}
                  >
                    {k} {formatManwon(v)}
                  </span>
                ))}
              </div>
            ) : null
          }
        />
      )}

      {/* 장학금 수혜 */}
      {scholarship && (scholarship.internal.amount > 0 || scholarship.external.amount > 0) && (
        <Row
          icon={<GraduationCap size={14} color={C.brand} />}
          title="장학금 수혜"
          value={formatWon(scholarship.internal.amount + scholarship.external.amount)}
          sub={`교내 ${scholarship.internal.count}건 · 교외 ${scholarship.external.count}건`}
        />
      )}

      {/* 학자금대출 */}
      {loan && (loan.tuitionLoan.count > 0 || loan.lifeLoan.count > 0) && (
        <Row
          icon={<CreditCard size={14} color={C.brand} />}
          title="학자금대출"
          value={formatWon(loan.tuitionLoan.amount + loan.lifeLoan.amount)}
          sub={
            loan.tuitionLoan.count > 0 && loan.lifeLoan.count > 0
              ? `등록금 ${loan.tuitionLoan.count.toLocaleString()}건 · 생활비 ${loan.lifeLoan.count.toLocaleString()}건`
              : loan.tuitionLoan.count > 0
                ? `등록금 ${loan.tuitionLoan.count.toLocaleString()}건`
                : `생활비 ${loan.lifeLoan.count.toLocaleString()}건`
          }
        />
      )}

      {/* 출처 표기 (간소) */}
      <div
        style={{
          fontSize: 10.5,
          color: C.sub,
          borderTop: `1px solid ${C.line}`,
          paddingTop: 8,
          lineHeight: 1.5,
        }}
      >
        출처: 대교협 표준데이터 (한국대학교육협의회 · 한국장학재단 · 한국교육개발원)
      </div>
    </div>
  );
}

interface RowProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  extra?: React.ReactNode;
}

function Row({ icon, title, value, sub, extra }: RowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontSize: 11.5, fontWeight: 600, color: C.sub }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {sub && <span style={{ fontSize: 11, color: C.sub }}>{sub}</span>}
      </div>
      {extra}
    </div>
  );
}
