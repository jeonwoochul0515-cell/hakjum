/**
 * KCUE 학과 통계 카드 — Competition 섹션 보강 (유료 전용)
 * — 학과별 평균 정원 / 평균 등록금 / 대학당 장학금
 * 데이터 출처: 한국대학교육협의회 표준데이터 (data.go.kr/15116892)
 */
import { Coins, Users2, GraduationCap } from 'lucide-react';
import type { KcueStatsSection } from '@/types/report';

interface Props {
  data: KcueStatsSection;
  isPaid: boolean;
}

function formatWon(won: number): string {
  if (!won || won < 1) return '-';
  if (won >= 100000000) return `${(won / 100000000).toFixed(1)}억`;
  if (won >= 10000) return `${Math.round(won / 10000)}만원`;
  return `${won}원`;
}

export function KcueStatsCard({ data, isPaid }: Props) {
  if (!data?.items?.length) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Coins size={14} className="text-amber-500" />
        <h3 className="text-sm font-bold text-slate-700">학과별 정원·등록금·장학금</h3>
      </div>

      <div className={!isPaid ? 'relative' : ''}>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="space-y-2">
            {data.items.map((item) => (
              <div key={item.majorName} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700 truncate">{item.majorName}</p>
                  <span className="text-[10px] text-slate-400">개설 {item.schoolCount}개교</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat
                    icon={<Users2 size={11} className="text-sky-500" />}
                    label="평균 정원"
                    value={item.quotaAvg ? `${Math.round(item.quotaAvg)}명` : '-'}
                  />
                  <Stat
                    icon={<Coins size={11} className="text-amber-500" />}
                    label="평균 등록금"
                    value={formatWon(item.tuitionAvgWon)}
                  />
                  <Stat
                    icon={<GraduationCap size={11} className="text-emerald-500" />}
                    label="대학당 장학금"
                    value={item.scholarshipAvgPerUniv ? `${item.scholarshipAvgPerUniv}건` : '-'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isPaid && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
            <p className="text-sm font-medium text-slate-500">전체 보고서에서 확인하세요</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 mt-2">
        출처: 한국대학교육협의회 표준데이터 · 이용허락범위 제한없음
      </p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-1.5 text-center">
      <div className="flex items-center justify-center gap-0.5 mb-0.5">{icon}</div>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-xs font-bold text-slate-700">{value}</p>
    </div>
  );
}

export default KcueStatsCard;
