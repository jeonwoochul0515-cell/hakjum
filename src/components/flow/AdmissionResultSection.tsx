import { BarChart3, TrendingUp, Users, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { AdmissionResult } from '@/types';

interface Props {
  results: AdmissionResult[];
  universityName: string;
  majorName: string;
}

export function AdmissionResultSection({ results, universityName }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (results.length === 0) return null;

  // 전형별 그룹핑
  const byType = new Map<string, AdmissionResult[]>();
  for (const r of results) {
    const list = byType.get(r.admissionType) || [];
    list.push(r);
    byType.set(r.admissionType, list);
  }

  // 최대 경쟁률 (프로그레스 바 정규화용)
  const maxRate = Math.max(...results.map((r) => r.competitionRate), 1);

  // 추합 정보가 있는 결과
  const withSupp = results.filter((r) => r.supplementaryOrder != null && r.supplementaryOrder > 0);

  const year = results[0]?.year;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <BarChart3 size={14} className="text-rose-500" />
          <h3 className="text-sm font-bold text-slate-700">
            입시결과 {year && `(${year}학년도)`}
          </h3>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 요약 (항상 표시) */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {[...byType.entries()].slice(0, 4).map(([type, items]) => {
          const latest = items[0];
          return (
            <div key={type}>
              <p className="text-[11px] text-slate-400">{type}</p>
              <p className="text-sm font-semibold text-slate-700">
                {latest.competitionRate}:1
                {latest.cutline.avg > 0 && (
                  <span className="text-[11px] font-normal text-slate-400 ml-1">
                    (평균 {latest.cutline.avg}등급)
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* 상세 (토글) */}
      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in-up">
          {/* 섹션 A: 커트라인 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} className="text-amber-500" />
              <h4 className="text-xs font-bold text-slate-600">전형별 커트라인</h4>
            </div>
            <div className="space-y-2">
              {[...byType.entries()].map(([type, items]) => {
                const r = items[0];
                return (
                  <div key={type} className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-slate-700 mb-1">{type}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {r.cutline.avg > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400">평균</p>
                          <p className="text-sm font-bold text-slate-800">{r.cutline.avg}</p>
                        </div>
                      )}
                      {r.cutline.percentile70 > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400">70%컷</p>
                          <p className="text-sm font-bold text-sky-600">{r.cutline.percentile70}</p>
                        </div>
                      )}
                      {r.cutline.min > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400">최저</p>
                          <p className="text-sm font-bold text-slate-600">{r.cutline.min}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                      <span>모집 {r.recruited}명</span>
                      <span>지원 {r.applied}명</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 섹션 B: 경쟁률 비교 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={13} className="text-sky-500" />
              <h4 className="text-xs font-bold text-slate-600">전형별 경쟁률</h4>
            </div>
            <div className="space-y-2">
              {[...byType.entries()].map(([type, items]) => {
                const r = items[0];
                const pct = Math.min((r.competitionRate / maxRate) * 100, 100);
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-600">{type}</span>
                      <span className="text-xs font-bold text-slate-700">{r.competitionRate}:1</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 섹션 C: 추합 정보 */}
          {withSupp.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 mb-1.5">추가합격 정보</h4>
              <div className="space-y-1">
                {withSupp.map((r) => (
                  <div key={`${r.admissionType}-supp`} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{r.admissionType}</span>
                    <span className="font-semibold text-slate-700">
                      추합 {r.supplementaryOrder}번째까지
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 출처 + 면책 */}
      <p className="text-[10px] text-slate-400 text-right mt-2">
        출처: {universityName} 입학처 공개 입시결과 | 참고용 데이터이며 정확한 정보는 각 대학 입학처에서 확인하세요
      </p>
    </div>
  );
}
