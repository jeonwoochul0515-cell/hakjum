import { useState, useEffect } from 'react';
import { ExternalLink, Users, GraduationCap, Wallet, BookOpen, Briefcase, MapPin, ArrowRight, BarChart3, Loader2 } from 'lucide-react';
import { useFlow } from '@/hooks/useFlow';
import type { EnrollmentInfo, UniversityStats, AcademyInfo } from '@/lib/university-api';
import { UniversityRecommendations } from './UniversityRecommendations';
import { AdmissionResultSection } from './AdmissionResultSection';

export function UniversityDetailStep() {
  const { state, runRecommendation } = useFlow();
  const { selectedUniversity, selectedMajor, enrollment, universityStats, academyInfo } = state;
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드 완료 감지 (2초 후 로딩 종료 — 비동기 fire-and-forget이므로 타이머 기반)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, [selectedUniversity?.name]);

  if (!selectedUniversity || !selectedMajor) return null;

  const info: EnrollmentInfo | undefined = enrollment.find((e) => e.schoolName === selectedUniversity.name);
  const stats: UniversityStats | undefined = universityStats.find((s) => s.schoolName === selectedUniversity.name);
  const academy: AcademyInfo | null = academyInfo;
  const hasAcademyData = academy && Object.keys(academy).length > 0;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">{selectedUniversity.name}</h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} />
            {selectedUniversity.area || '정보 없음'}
          </span>
          {selectedUniversity.majorName && (
            <span className="text-xs text-slate-400">· {selectedUniversity.majorName}</span>
          )}
        </div>
        {selectedUniversity.schoolURL && (
          <a
            href={selectedUniversity.schoolURL.startsWith('http') ? selectedUniversity.schoolURL : `https://${selectedUniversity.schoolURL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-sky-primary hover:text-sky-600 transition-colors"
          >
            <ExternalLink size={12} />
            학교 홈페이지
          </a>
        )}
      </div>

      {/* 정원·졸업 */}
      {info && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">학과 현황</h3>
          <div className="grid grid-cols-2 gap-3">
            {info.enrollmentQuota > 0 && (
              <div className="flex items-center gap-2">
                <Users size={14} className="text-green-500" />
                <div>
                  <p className="text-[11px] text-slate-400">입학정원</p>
                  <p className="text-sm font-semibold text-slate-700">{info.enrollmentQuota}명</p>
                </div>
              </div>
            )}
            {info.graduateCount > 0 && (
              <div className="flex items-center gap-2">
                <GraduationCap size={14} className="text-purple-500" />
                <div>
                  <p className="text-[11px] text-slate-400">졸업생</p>
                  <p className="text-sm font-semibold text-slate-700">{info.graduateCount}명</p>
                </div>
              </div>
            )}
            {info.duration && (
              <div>
                <p className="text-[11px] text-slate-400">수업연한</p>
                <p className="text-sm font-semibold text-slate-700">{info.duration}</p>
              </div>
            )}
            {info.schoolType && (
              <div>
                <p className="text-[11px] text-slate-400">구분</p>
                <p className="text-sm font-semibold text-slate-700">{info.schoolType}</p>
              </div>
            )}
            {info.category7 && (
              <div>
                <p className="text-[11px] text-slate-400">계열</p>
                <p className="text-sm font-semibold text-slate-700">{info.category7}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 등록금 정보 */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">등록금 정보</h3>
          <div className="space-y-3">
            {stats.tuitionAvg && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-amber-500" />
                  <span className="text-sm text-slate-600">평균 등록금</span>
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {Math.round(stats.tuitionAvg / 10000).toLocaleString()}만원
                </span>
              </div>
            )}
            {stats.entranceFee !== undefined && stats.entranceFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">평균 입학금</span>
                <span className="text-sm font-medium text-slate-700">
                  {Math.round(stats.entranceFee / 10000).toLocaleString()}만원
                </span>
              </div>
            )}
            {stats.foundationType && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">설립 형태</span>
                <span className="text-sm font-medium text-slate-700">{stats.foundationType}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 대학 주요 지표 */}
      {hasAcademyData && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 size={14} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-700">대학 주요 지표</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {academy!.competitionRate != null && (
              <div>
                <p className="text-[11px] text-slate-400">경쟁률</p>
                <p className="text-sm font-semibold text-slate-700">{academy!.competitionRate}:1</p>
              </div>
            )}
            {academy!.employmentRate != null && (
              <div>
                <p className="text-[11px] text-slate-400">취업률</p>
                <p className="text-sm font-semibold text-slate-700">{academy!.employmentRate}%</p>
              </div>
            )}
            {academy!.fillingRate != null && (
              <div>
                <p className="text-[11px] text-slate-400">충원율</p>
                <p className="text-sm font-semibold text-slate-700">{academy!.fillingRate}%</p>
              </div>
            )}
            {academy!.dropoutRate != null && (
              <div>
                <p className="text-[11px] text-slate-400">중퇴율</p>
                <p className="text-sm font-semibold text-slate-700">{academy!.dropoutRate}%</p>
              </div>
            )}
            {academy!.foreignStudents != null && (
              <div>
                <p className="text-[11px] text-slate-400">외국인 학생</p>
                <p className="text-sm font-semibold text-slate-700">{academy!.foreignStudents.toLocaleString()}명</p>
              </div>
            )}
            {academy!.studentsPerFaculty != null && (
              <div>
                <p className="text-[11px] text-slate-400">교원 1인당 학생</p>
                <p className="text-sm font-semibold text-slate-700">{academy!.studentsPerFaculty}명</p>
              </div>
            )}
            {academy!.eduCostPerStudent != null && (
              <div>
                <p className="text-[11px] text-slate-400">1인당 교육비</p>
                <p className="text-sm font-semibold text-slate-700">{Math.round(academy!.eduCostPerStudent / 10000).toLocaleString()}만원</p>
              </div>
            )}
            {academy!.industryCoopCount != null && (
              <div>
                <p className="text-[11px] text-slate-400">산학협력</p>
                <p className="text-sm font-semibold text-slate-700">{academy!.industryCoopCount.toLocaleString()}건</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 입시결과 (커트라인, 경쟁률, 추합) */}
      {state.admissionResults && state.admissionResults.length > 0 && (
        <AdmissionResultSection
          results={state.admissionResults}
          universityName={selectedUniversity.name}
          majorName={selectedMajor.name}
        />
      )}

      {/* 대학별 권장과목 (2028학년도 대교협 자료) */}
      <UniversityRecommendations
        universityName={selectedUniversity.name}
        majorName={selectedMajor.name}
      />

      {/* 주요 교과목 */}
      {info?.mainCourses && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen size={14} className="text-sky-500" />
            <h3 className="text-sm font-bold text-slate-700">주요 교과목</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {info.mainCourses.split(/[,+]/).map((c) => c.trim()).filter(Boolean).map((course) => (
              <span key={course} className="inline-block px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-xs">
                {course}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 관련 직업 */}
      {info?.relatedJobs && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase size={14} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">관련 직업</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {info.relatedJobs.split(/[,+]/).map((j) => j.trim()).filter(Boolean).map((job) => (
              <span key={job} className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs">
                {job}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 데이터 로딩 중 또는 없을 때 */}
      {!info && !stats && (
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-sky-primary" />
              <p className="text-sm text-slate-500">대학 데이터를 불러오는 중...</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">이 대학교의 상세 데이터가 아직 없어요</p>
          )}
        </div>
      )}

      {/* 출처 표기 */}
      {(info || stats || hasAcademyData) && (
        <p className="text-[10px] text-slate-400 text-right mt-1 mb-2">
          출처: 커리어넷 학과정보 API · 대학알리미(academyinfo.go.kr) · 공공데이터포털(data.go.kr)
        </p>
      )}

      {/* CTA */}
      <div className="mt-6">
        <button
          onClick={() => runRecommendation()}
          className="w-full py-3.5 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          내 학교 맞춤 과목 추천받기
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
