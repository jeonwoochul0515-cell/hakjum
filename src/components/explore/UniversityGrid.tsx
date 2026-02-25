import { MapPin, ExternalLink, Users } from 'lucide-react';
import type { UniversityFull } from '@/types';
import type { EnrollmentInfo } from '@/lib/university-api';

interface Props {
  universities: UniversityFull[];
  enrollment?: EnrollmentInfo[];
}

export function UniversityGrid({ universities, enrollment = [] }: Props) {
  // 정원 데이터를 학교명으로 매핑
  const enrollmentMap = new Map<string, number>();
  for (const e of enrollment) {
    enrollmentMap.set(e.schoolName, e.enrollmentQuota);
  }
  // 지역별 그룹핑: 부산 → 서울 → 나머지 가나다순
  const grouped = new Map<string, UniversityFull[]>();
  for (const u of universities) {
    const area = u.area || '기타';
    if (!grouped.has(area)) grouped.set(area, []);
    grouped.get(area)!.push(u);
  }

  const areaOrder = [...grouped.keys()].sort((a, b) => {
    if (a === '부산') return -1;
    if (b === '부산') return 1;
    if (a === '서울') return -1;
    if (b === '서울') return 1;
    return a.localeCompare(b);
  });

  const areaColorMap: Record<string, string> = {
    부산: 'bg-sky-100 text-sky-700',
    서울: 'bg-indigo-100 text-indigo-700',
    경기: 'bg-green-100 text-green-700',
    인천: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="animate-fade-in-up">
      <p className="text-xs text-slate-400 mb-4">
        총 <strong className="text-slate-600">{universities.length}개</strong> 대학에 설치되어 있어요
      </p>

      {areaOrder.map((area) => (
        <div key={area} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-slate-400" />
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{area}</h4>
            <span className="text-xs text-slate-400">({grouped.get(area)!.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {grouped.get(area)!.map((u) => (
              <div
                key={u.name}
                className="bg-white rounded-lg p-3 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <h5 className="text-sm font-medium text-slate-700 truncate">{u.name}</h5>
                    {u.majorName && u.majorName !== u.name && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{u.majorName}</p>
                    )}
                  </div>
                  {u.schoolURL && (
                    <a
                      href={u.schoolURL.startsWith('http') ? u.schoolURL : `https://${u.schoolURL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-sky-primary transition-colors flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${areaColorMap[area] || 'bg-gray-100 text-gray-600'}`}>
                    {area}
                  </span>
                  {enrollmentMap.has(u.name) && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-medium">
                      <Users size={9} />
                      {enrollmentMap.get(u.name)}명
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
