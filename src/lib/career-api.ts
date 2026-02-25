import type { Major, University } from '@/types';

interface CareerMajorListItem {
  majorSeq: string;
  mClass: string;
  lClass: string;
  facilName: string;
  totalCount: string;
}

interface CareerMajorDetail {
  major: string;
  summary: string;
  relate_subject: { subject_name: string; subject_description: string | null }[];
  university: { schoolName: string; area: string; majorName: string; schoolURL: string }[];
  job: string;
  qualifications: string;
  career_act: { act_name: string; act_description: string }[];
}

// 커리어넷 MAJOR 목록 검색 → 간략 Major[] 반환
export async function searchMajorsAPI(
  query: string,
  category?: string
): Promise<Major[]> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category && category !== '전체') params.set('category', category);

  const res = await fetch(`/api/career/majors?${params}`);
  if (!res.ok) throw new Error('CareerNet API error');

  const data = await res.json();
  const items: CareerMajorListItem[] = data?.dataSearch?.content ?? [];

  return items.map((item) => ({
    id: item.majorSeq,
    name: item.mClass,
    category: item.lClass,
    relateSubject: { common: '', general: '', career: '', professional: '' },
    universities: [],
    jobs: '',
    qualifications: '',
  }));
}

// 커리어넷 MAJOR_VIEW 상세 → 완전한 Major 반환
export async function getMajorDetailAPI(majorSeq: string): Promise<Major> {
  const res = await fetch(`/api/career/major-detail?id=${majorSeq}`);
  if (!res.ok) throw new Error('CareerNet detail API error');

  const data = await res.json();
  const detail: CareerMajorDetail = data?.dataSearch?.content?.[0];
  if (!detail) throw new Error('Major not found');

  const subjectMap: Record<string, string> = {};
  for (const s of detail.relate_subject ?? []) {
    if (!s.subject_description) continue;
    const clean = s.subject_description.replace(/<br>/g, ', ').replace(/<[^>]+>/g, '');
    if (s.subject_name.includes('공통')) subjectMap.common = clean;
    else if (s.subject_name.includes('일반')) subjectMap.general = clean;
    else if (s.subject_name.includes('진로')) subjectMap.career = clean;
    else if (s.subject_name.includes('전문교과Ⅰ') || s.subject_name.includes('전문교과I'))
      subjectMap.professional = clean;
  }

  // 대학 목록: 중복 학교 제거, 부산 우선 정렬
  const univMap = new Map<string, University>();
  for (const u of detail.university ?? []) {
    if (!univMap.has(u.schoolName)) {
      univMap.set(u.schoolName, {
        name: u.schoolName,
        area: u.area.replace(/특별시|광역시|특별자치시|특별자치도/g, ''),
      });
    }
  }
  const universities = [...univMap.values()].sort((a, b) => {
    if (a.area === '부산' && b.area !== '부산') return -1;
    if (a.area !== '부산' && b.area === '부산') return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    id: majorSeq,
    name: detail.major,
    category: '',
    relateSubject: {
      common: subjectMap.common || '',
      general: subjectMap.general || '',
      career: subjectMap.career || '',
      professional: subjectMap.professional || '',
    },
    universities,
    jobs: detail.job || '',
    qualifications: detail.qualifications || '',
  };
}
