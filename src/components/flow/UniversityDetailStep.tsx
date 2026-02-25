import { ExternalLink, Users, GraduationCap, Wallet, BookOpen, Briefcase, MapPin, ArrowRight } from 'lucide-react';
import { useFlow } from '@/hooks/useFlow';
import type { EnrollmentInfo, UniversityStats } from '@/lib/university-api';

export function UniversityDetailStep() {
  const { state, runRecommendation } = useFlow();
  const { selectedUniversity, selectedMajor, enrollment, universityStats } = state;

  if (!selectedUniversity || !selectedMajor) return null;

  const info: EnrollmentInfo | undefined = enrollment.find((e) => e.schoolName === selectedUniversity.name);
  const stats: UniversityStats | undefined = universityStats.find((s) => s.schoolName === selectedUniversity.name);

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

      {/* 등록금·장학금·대출 */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">등록금 및 장학금</h3>
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
            {stats.scholarshipTotal && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap size={14} className="text-sky-500" />
                  <span className="text-sm text-slate-600">장학금 총액</span>
                </div>
                <span className="text-sm font-bold text-sky-600">
                  {Math.round(stats.scholarshipTotal / 100000000).toLocaleString()}억원
                </span>
              </div>
            )}
            {stats.loanTotal && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">학자금 대출 총액</span>
                <span className="text-sm font-medium text-slate-700">
                  {Math.round(stats.loanTotal / 100000000).toLocaleString()}억원
                  {stats.loanCount ? ` (${stats.loanCount.toLocaleString()}명)` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* 데이터 없을 때 */}
      {!info && !stats && (
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-500">이 대학교의 상세 데이터가 아직 없어요</p>
        </div>
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
