import { User, GraduationCap, Heart, Target } from 'lucide-react';
import type { ProfileSection as ProfileSectionType } from '@/types/report';

interface Props {
  data: ProfileSectionType;
}

export function ProfileSection({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <User size={14} className="text-sky-500" />
        <h3 className="text-sm font-bold text-slate-700">학생 프로필</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={14} className="text-indigo-500" />
          <div>
            <p className="text-[11px] text-slate-400">학교</p>
            <p className="text-sm font-semibold text-slate-700">{data.schoolName}</p>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">학년</p>
          <p className="text-sm font-semibold text-slate-700">{data.grade}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">학교 유형</p>
          <p className="text-sm font-semibold text-slate-700">{data.schoolType}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">개설 과목 수</p>
          <p className="text-sm font-semibold text-slate-700">{data.totalSubjects}개</p>
        </div>
      </div>

      {/* 관심 분야 */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Heart size={14} className="text-rose-400" />
          <p className="text-[11px] text-slate-400">관심 분야</p>
        </div>
        <p className="text-sm text-slate-700">{data.interest}</p>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 희망 대학 */}
      {data.targetUniversities.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target size={14} className="text-amber-500" />
            <p className="text-[11px] text-slate-400">희망 대학</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.targetUniversities.map((univ) => (
              <span
                key={univ}
                className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs"
              >
                {univ}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
