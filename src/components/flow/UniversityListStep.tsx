import { UniversityGrid } from '@/components/explore/UniversityGrid';
import { useFlow } from '@/hooks/useFlow';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { REGION_CODES } from '@/lib/neis-api';
import type { UniversityFull } from '@/types';

// 2009년 법학전문대학원(로스쿨)으로 전환하여 학부 법학과가 폐지된 25개 대학
const LAW_SCHOOL_CONVERTED = new Set([
  '서울대학교', '연세대학교', '고려대학교', '성균관대학교', '한양대학교',
  '이화여자대학교', '경희대학교', '중앙대학교', '건국대학교', '동국대학교',
  '서강대학교', '숙명여자대학교', '아주대학교', '인하대학교', '한국외국어대학교',
  '부산대학교', '경북대학교', '전남대학교', '전북대학교', '충남대학교',
  '충북대학교', '강원대학교', '제주대학교', '영남대학교', '원광대학교',
]);

export function UniversityListStep() {
  const { state, selectUniversity, runRecommendation } = useFlow();
  const { selectedMajor, enrollment, universityStats, school } = state;

  // 학교 ID에서 지역코드 추출 → 지역명 매핑
  const regionCode = school?.id?.split('_')[0] || '';
  const userRegion = REGION_CODES.find((r) => r.code === regionCode)?.name;

  if (!selectedMajor) return null;

  const handleSelectUniversity = (u: UniversityFull) => {
    selectUniversity(u);
  };

  // 법학과인 경우 로스쿨 전환 대학 필터링
  const isLawMajor = /^법학과$|^법학부$/.test(selectedMajor.name);
  const filteredUniversities = isLawMajor
    ? (selectedMajor.universitiesFull || []).filter((u) => !LAW_SCHOOL_CONVERTED.has(u.name))
    : selectedMajor.universitiesFull;

  return (
    <div className="animate-fade-in-up">
      <div className="pt-6 pb-4">
        <h1 className="text-xl font-bold text-slate-800">{selectedMajor.name} 개설 대학교</h1>
        <p className="text-sm text-slate-500 mt-1">대학별 정원, 등록금, 장학금 정보를 확인해보세요</p>
      </div>

      {isLawMajor && (
        <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-2.5">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            서울대·연세대·고려대 등 25개 대학은 2009년 법학전문대학원(로스쿨)으로 전환하여 학부 법학과가 폐지되었습니다. 아래는 현재 학부 법학과를 운영하는 대학 목록입니다.
          </p>
        </div>
      )}

      <UniversityGrid
        universities={filteredUniversities}
        enrollment={enrollment}
        universityStats={universityStats}
        onSelectUniversity={handleSelectUniversity}
        userRegion={userRegion}
      />

      {/* 하단 CTA */}
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
