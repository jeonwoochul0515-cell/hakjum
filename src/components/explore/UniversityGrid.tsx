import { useState } from 'react';
import { MapPin, ExternalLink, Users, GraduationCap, BookOpen, Briefcase, ChevronDown, ChevronUp, Wallet, ArrowRight } from 'lucide-react';
import type { UniversityFull } from '@/types';
import type { EnrollmentInfo, UniversityStats } from '@/lib/university-api';

interface Props {
  universities: UniversityFull[];
  enrollment?: EnrollmentInfo[];
  universityStats?: UniversityStats[];
  onSelectUniversity?: (university: UniversityFull) => void;
}

export function UniversityGrid({ universities, enrollment = [], universityStats = [], onSelectUniversity }: Props) {
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  // 정원 데이터를 학교명으로 매핑
  const enrollmentMap = new Map<string, EnrollmentInfo>();
  for (const e of enrollment) {
    enrollmentMap.set(e.schoolName, e);
  }

  // 대학알리미 통계 매핑
  const statsMap = new Map<string, UniversityStats>();
  for (const s of universityStats) {
    statsMap.set(s.schoolName, s);
  }

  // 주요교과목·관련직업: 전체 enrollment에서 첫 번째로 있는 것 사용 (학과 기준 공통)
  const commonCourses = enrollment.find((e) => e.mainCourses)?.mainCourses || '';
  const commonJobs = enrollment.find((e) => e.relatedJobs)?.relatedJobs || '';
  // 지역별 그룹핑: 서울 → 나머지 가나다순
  const grouped = new Map<string, UniversityFull[]>();
  for (const u of universities) {
    const area = u.area || '기타';
    if (!grouped.has(area)) grouped.set(area, []);
    grouped.get(area)!.push(u);
  }

  const areaOrder = [...grouped.keys()].sort((a, b) => {
    if (a === '서울') return -1;
    if (b === '서울') return 1;
    return a.localeCompare(b);
  });

  const areaColorMap: Record<string, string> = {
    서울: 'bg-indigo-100 text-indigo-700',
    경기: 'bg-green-100 text-green-700',
    인천: 'bg-amber-100 text-amber-700',
    부산: 'bg-sky-100 text-sky-700',
    대구: 'bg-rose-100 text-rose-700',
    광주: 'bg-emerald-100 text-emerald-700',
    대전: 'bg-violet-100 text-violet-700',
    울산: 'bg-cyan-100 text-cyan-700',
    세종: 'bg-teal-100 text-teal-700',
    강원: 'bg-lime-100 text-lime-700',
    충북: 'bg-orange-100 text-orange-700',
    충남: 'bg-yellow-100 text-yellow-700',
    전북: 'bg-pink-100 text-pink-700',
    전남: 'bg-fuchsia-100 text-fuchsia-700',
    경북: 'bg-red-100 text-red-700',
    경남: 'bg-blue-100 text-blue-700',
    제주: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="animate-fade-in-up">
      <p className="text-xs text-slate-400 mb-4">
        총 <strong className="text-slate-600">{universities.length}개</strong> 대학에 설치되어 있어요
      </p>

      {/* 학과 공통 정보: 주요교과목, 관련직업 */}
      {(commonCourses || commonJobs) && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-5 space-y-3">
          {commonCourses && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <BookOpen size={13} className="text-sky-500" />
                <span className="text-xs font-semibold text-slate-600">주요 교과목</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {commonCourses.split(/[,+]/).map((c) => c.trim()).filter(Boolean).slice(0, 15).map((course) => (
                  <span key={course} className="inline-block px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[11px]">
                    {course}
                  </span>
                ))}
              </div>
            </div>
          )}
          {commonJobs && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Briefcase size={13} className="text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600">관련 직업</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {commonJobs.split(/[,+]/).map((j) => j.trim()).filter(Boolean).slice(0, 10).map((job) => (
                  <span key={job} className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px]">
                    {job}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-400 mb-3">
        출처: 커리어넷 학과정보 API · 대학알리미(academyinfo.go.kr) · 공공데이터포털(data.go.kr)
      </p>

      {areaOrder.map((area) => (
        <div key={area} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-slate-400" />
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{area}</h4>
            <span className="text-xs text-slate-400">({grouped.get(area)!.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {grouped.get(area)!.map((u) => {
              const info = enrollmentMap.get(u.name);
              const stats = statsMap.get(u.name);
              const hasDetail = !!(info || stats);
              const isExpanded = expandedSchool === u.name;

              return (
                <div
                  key={u.name}
                  className="bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <h5 className="text-sm font-medium text-slate-700 truncate">{u.name}</h5>
                        {u.majorName && u.majorName !== u.name && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{u.majorName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {u.schoolURL && (
                          <a
                            href={u.schoolURL.startsWith('http') ? u.schoolURL : `https://${u.schoolURL}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-300 hover:text-sky-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {onSelectUniversity && (
                          <button
                            onClick={() => onSelectUniversity(u)}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium text-sky-primary bg-sky-50 hover:bg-sky-100 rounded-md transition-colors cursor-pointer"
                          >
                            상세
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${areaColorMap[area] || 'bg-gray-100 text-gray-600'}`}>
                        {area}
                      </span>
                      {info && info.enrollmentQuota > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-medium">
                          <Users size={9} />
                          정원 {info.enrollmentQuota}명
                        </span>
                      )}
                      {info && info.graduateCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px] font-medium">
                          <GraduationCap size={9} />
                          졸업 {info.graduateCount}명
                        </span>
                      )}
                      {stats?.tuitionAvg && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">
                          <Wallet size={9} />
                          {Math.round(stats.tuitionAvg / 10000).toLocaleString()}만원
                        </span>
                      )}
                      {info?.duration && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-medium">
                          {info.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 확장 상세 (더보기) */}
                  {hasDetail && (
                    <div className="px-3 pb-1">
                      <button
                        className="w-full flex items-center justify-center gap-0.5 py-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        onClick={() => setExpandedSchool(isExpanded ? null : u.name)}
                      >
                        {isExpanded ? '접기' : '더보기'}
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                  )}

                  {isExpanded && hasDetail && (
                    <div className="px-3 pb-3 border-t border-slate-50 pt-2 space-y-2 animate-fade-in-up">
                      {info?.schoolType && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">구분</span>
                          {info.schoolType}
                        </div>
                      )}
                      {info?.category7 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">계열</span>
                          {info.category7}
                        </div>
                      )}
                      {stats && (
                        <div className="flex flex-wrap gap-2 py-1">
                          {stats.tuitionAvg && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Wallet size={10} className="text-amber-500" />
                              <span className="text-slate-500">등록금</span>
                              <span className="font-medium text-slate-700">{Math.round(stats.tuitionAvg / 10000).toLocaleString()}만원</span>
                            </div>
                          )}
                          {stats.foundationType && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-slate-500">설립</span>
                              <span className="font-medium text-slate-700">{stats.foundationType}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {info?.mainCourses && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-600 mb-1">주요 교과목</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{info.mainCourses}</p>
                        </div>
                      )}
                      {info?.relatedJobs && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-600 mb-1">관련 직업</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{info.relatedJobs}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
