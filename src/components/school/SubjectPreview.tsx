import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { School } from '@/types';

interface SubjectPreviewProps {
  school: School;
}

type SubjectCategory = 'korean' | 'math' | 'english' | 'science' | 'social' | 'arts' | 'pe' | 'tech' | 'career' | 'activity' | 'other';

const categoryConfig: Record<SubjectCategory, { label: string; bg: string; text: string; border: string }> = {
  korean:   { label: '국어', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  math:     { label: '수학', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  english:  { label: '영어', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  science:  { label: '과학', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  social:   { label: '사회', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  arts:     { label: '예술', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  pe:       { label: '체육', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  tech:     { label: '기술·정보', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  career:   { label: '진로·교양', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  activity: { label: '활동', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
  other:    { label: '기타/전문', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

function categorize(name: string): SubjectCategory {
  if (/활동|동아리/.test(name)) return 'activity';
  if (/국어|문학|화법|작문|독서|언어와 매체|고전|심화 국어/.test(name)) return 'korean';
  if (/수학|미적분|기하|확률과 통계|경제 수학/.test(name)) return 'math';
  if (/영어|영문|영어권/.test(name)) return 'english';
  if (/과학|물리|화학|생명|지구|천문|과학사|융합|실험/.test(name)) return 'science';
  if (/사회|역사|지리|정치|법|경제|윤리|한국사|세계사|도덕|통합사회/.test(name)) return 'social';
  if (/미술|음악|연극|영화|사진|디자인|서예/.test(name)) return 'arts';
  if (/체육|운동|스포츠|보건/.test(name)) return 'pe';
  if (/정보|프로그래밍|웹|빅데이터|인공지능|AI|공학|기술|로봇|SW|코딩|컴퓨터/.test(name)) return 'tech';
  if (/진로|직업|교양|심리|교육|철학|논리|환경|한문|일본어|중국어|프랑스어|독일어|스페인어|아랍어|베트남어|러시아어/.test(name)) return 'career';
  return 'other';
}

export function SubjectPreview({ school }: SubjectPreviewProps) {
  const [showGrade1, setShowGrade1] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentYearStr = String(currentYear);
  const gradeDataYear = school.gradeDataYear || {};

  const grade2 = school.subjectsByGrade['2학년'] || [];
  const grade3 = school.subjectsByGrade['3학년'] || [];
  const grade1 = school.subjectsByGrade['1학년'] || [];

  // 활동 제외, 나머지 모든 개설과목 표시
  const grade2Subjects = grade2.filter((s) => categorize(s) !== 'activity');
  const grade3Subjects = grade3.filter((s) => categorize(s) !== 'activity');
  const hasSubjects = grade2Subjects.length > 0 || grade3Subjects.length > 0;

  // 이전 연도 데이터 사용 여부
  const grade2IsPrevYear = gradeDataYear['2학년'] && gradeDataYear['2학년'] !== currentYearStr;
  const grade3IsPrevYear = gradeDataYear['3학년'] && gradeDataYear['3학년'] !== currentYearStr;
  const hasPrevYearData = grade2IsPrevYear || grade3IsPrevYear;

  return (
    <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={18} className="text-sky-primary" />
        <h4 className="text-base font-bold text-slate-800">{school.name} 개설과목</h4>
      </div>

      {/* 이전 연도 데이터 노티스 */}
      {hasPrevYearData && (
        <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-200 mb-4">
          <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            {grade2IsPrevYear && grade3IsPrevYear
              ? `2·3학년 과목은 ${gradeDataYear['2학년']}년 개설과목 기준입니다. (${currentYearStr}년 데이터가 아직 NEIS에 등록되지 않았습니다)`
              : grade2IsPrevYear
                ? `2학년 과목은 ${gradeDataYear['2학년']}년 개설과목 기준입니다.`
                : `3학년 과목은 ${gradeDataYear['3학년']}년 개설과목 기준입니다.`
            }
          </p>
        </div>
      )}

      {/* 카테고리 범례 (과목이 있을 때만) */}
      {hasSubjects && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(categoryConfig)
            .filter(([key]) => key !== 'activity')
            .map(([key, cfg]) => (
              <span key={key} className={`px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                {cfg.label}
              </span>
            ))}
        </div>
      )}

      <div className="space-y-5">
        {/* 데이터 없음 안내 */}
        {!hasSubjects && (
          <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-3 border border-slate-200">
            <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-500 leading-relaxed">
              아직 NEIS에 개설과목 데이터가 등록되지 않았습니다. 학기 초에는 데이터가 늦게 올라올 수 있어요.
              <br />
              <span className="text-xs text-slate-400">그래도 AI 추천은 정상적으로 이용 가능합니다.</span>
            </p>
          </div>
        )}

        {/* 2학년 선택과목 */}
        <GradeSection
          title="2학년 개설과목"
          subjects={grade2Subjects}
          dataYear={gradeDataYear['2학년']}
          currentYear={currentYearStr}
          highlight
        />

        {/* 3학년 선택과목 */}
        <GradeSection
          title="3학년 개설과목"
          subjects={grade3Subjects}
          dataYear={gradeDataYear['3학년']}
          currentYear={currentYearStr}
          highlight
        />

        {/* 1학년 (접이식) */}
        {grade1.length > 0 && (
          <div>
            <button
              onClick={() => setShowGrade1(!showGrade1)}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              1학년 과목 ({grade1.length}개)
              {showGrade1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showGrade1 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {grade1.map((s) => {
                  const cat = categorize(s);
                  const cfg = categoryConfig[cat];
                  return (
                    <span key={s} className={`px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} opacity-60`}>
                      {s}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GradeSection({ title, subjects, dataYear, currentYear, highlight }: {
  title: string;
  subjects: string[];
  dataYear?: string;
  currentYear: string;
  highlight?: boolean;
}) {
  const isPrevYear = dataYear && dataYear !== currentYear;

  if (subjects.length === 0) {
    return (
      <div>
        <p className="text-sm font-bold text-slate-600 mb-2">{title} <span className="text-slate-400 font-normal">(0개)</span></p>
        <p className="text-sm text-slate-400">데이터 없음</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className={`font-bold ${highlight ? 'text-base text-slate-800' : 'text-sm text-slate-600'}`}>
          {title} <span className="text-slate-400 font-normal">({subjects.length}개)</span>
        </p>
        {isPrevYear && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
            {dataYear}년 기준
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => {
          const cat = categorize(s);
          const cfg = categoryConfig[cat];
          return (
            <span key={s} className={`px-3 py-1 rounded-lg text-sm font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
}
