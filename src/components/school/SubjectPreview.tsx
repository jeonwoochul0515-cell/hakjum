import { BookOpen } from 'lucide-react';
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
  // 활동
  if (/활동|동아리/.test(name)) return 'activity';
  // 국어
  if (/국어|문학|화법|작문|독서|언어와 매체|고전|심화 국어/.test(name)) return 'korean';
  // 수학
  if (/수학|미적분|기하|확률과 통계|경제 수학/.test(name)) return 'math';
  // 영어
  if (/영어|영문|영어권/.test(name)) return 'english';
  // 과학
  if (/과학|물리|화학|생명|지구|천문|과학사|융합|실험/.test(name)) return 'science';
  // 사회
  if (/사회|역사|지리|정치|법|경제|윤리|한국사|세계사|도덕|통합사회/.test(name)) return 'social';
  // 예술
  if (/미술|음악|연극|영화|사진|디자인|서예/.test(name)) return 'arts';
  // 체육
  if (/체육|운동|스포츠|보건/.test(name)) return 'pe';
  // 기술·정보
  if (/정보|프로그래밍|웹|빅데이터|인공지능|AI|공학|기술|로봇|SW|코딩|컴퓨터/.test(name)) return 'tech';
  // 진로·교양 (제2외국어 포함)
  if (/진로|직업|교양|심리|교육|철학|논리|환경|한문|일본어|중국어|프랑스어|독일어|스페인어|아랍어|베트남어|러시아어/.test(name)) return 'career';
  return 'other';
}

export function SubjectPreview({ school }: SubjectPreviewProps) {
  const grades = Object.entries(school.subjectsByGrade).sort(([a], [b]) => a.localeCompare(b, 'ko'));

  return (
    <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={16} className="text-sky-primary" />
        <h4 className="text-sm font-semibold text-slate-700">{school.name} 개설과목</h4>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(categoryConfig).map(([key, cfg]) => (
          <span key={key} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            {cfg.label}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {grades.map(([grade, subjects]) => (
          <div key={grade}>
            <p className="text-xs font-medium text-slate-500 mb-1.5">{grade} <span className="text-slate-400">({subjects.length}개)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const cat = categorize(s);
                const cfg = categoryConfig[cat];
                return (
                  <span key={s} className={`px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {s}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
