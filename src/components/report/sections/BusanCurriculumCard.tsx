/**
 * 부산 학생 특화 카드
 * — 부산 학교일 때만 노출 (BusanInsight.isBusan === true)
 * 공동교육과정 운영 학교 5개 + 부산교육청 진로가이드 3개.
 */
import { MapPin, BookOpen } from 'lucide-react';
import type { BusanInsight } from '@/types/report';

interface Props {
  data: BusanInsight;
  isPaid: boolean;
}

export function BusanCurriculumCard({ data, isPaid }: Props) {
  if (!data?.isBusan) return null;

  // 무료에서는 매칭된 권역과 가이드 1개만, 유료는 전체
  const visibleSchools = isPaid ? data.jointCurriculumSchools : [];
  const visibleGuides = isPaid ? data.guides : data.guides.slice(0, 1);

  return (
    <div className="bg-white rounded-xl border border-sky-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin size={14} className="text-sky-500" />
        <h3 className="text-sm font-bold text-slate-700">부산 공동교육과정 안내</h3>
      </div>

      <div className="rounded-lg bg-sky-50 p-2.5 mb-3 border border-sky-100">
        <p className="text-[11px] text-sky-700">
          <span className="font-semibold">{data.matchedLocation ?? '부산광역시'}</span> 권역 ·
          부산교육청 고교학점제 지원센터 데이터 기반
        </p>
      </div>

      {/* 공동교육과정 학교 */}
      <div className={!isPaid ? 'relative mb-3' : 'mb-3'}>
        <p className="text-[11px] font-medium text-slate-500 mb-1.5">추천 공동교육과정 학교</p>
        <div className={!isPaid ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="space-y-1.5">
            {(isPaid ? visibleSchools : data.jointCurriculumSchools).map((s, i) => (
              <div key={`${s.name}-${i}`} className="bg-slate-50 rounded-md p-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 truncate">{s.name}</span>
                <span className="text-[10px] text-slate-400 truncate ml-2">
                  {s.location ?? ''} {s.role ? `· ${s.role}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
        {!isPaid && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-md mt-5">
            <p className="text-xs text-slate-500">전체 보고서에서 확인하세요</p>
          </div>
        )}
      </div>

      {/* 진로가이드 */}
      {data.guides.length > 0 && (
        <>
          <p className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
            <BookOpen size={11} />
            관련 진로가이드
          </p>
          <div className="space-y-1.5">
            {visibleGuides.map((g, i) => (
              <div key={`${g.topic}-${i}`} className="rounded-md bg-amber-50 border border-amber-100 p-2">
                <p className="text-[11px] font-semibold text-amber-700 mb-0.5">{g.topic}</p>
                <p className="text-[10px] text-amber-700/80 leading-relaxed line-clamp-3">
                  {g.content}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default BusanCurriculumCard;
