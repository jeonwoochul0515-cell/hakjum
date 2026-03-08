import type { Major, MajorFull, University, UniversityFull } from '@/types';

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
  property: string;
  interest: string;
  relate_subject: { subject_name: string; subject_description: string | null }[];
  university: { schoolName: string; area: string; majorName: string; schoolURL: string }[];
  job: string;
  qualifications: string;
  career_act: { act_name: string; act_description: string }[];
}

interface CareerMajorJobDetail {
  major: string;
  employment_rate: string;
  salary: string;
  enter_field: string;
  post_graduation: string;
  admission_info: string;
  relate_job: { job_name: string; job_description: string }[];
  relate_qualifi: { qualifi_name: string; qualifi_description: string }[];
  main_subject: { subject_name: string; subject_description: string }[];
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

  // 대학 목록: 중복 학교 제거, 서울 → 가나다순
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
    if (a.area === '서울' && b.area !== '서울') return -1;
    if (a.area !== '서울' && b.area === '서울') return 1;
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

// 커리어넷 MAJOR_VIEW 종합 (univ_list + job_list) → MajorFull 반환
export async function getMajorFullAPI(majorSeq: string): Promise<MajorFull> {
  const res = await fetch(`/api/career/major-full?id=${majorSeq}`);
  if (!res.ok) throw new Error('CareerNet full API error');

  const data = await res.json();
  const univDetail: CareerMajorDetail | undefined = data?.univ?.dataSearch?.content?.[0];
  const jobDetail: CareerMajorJobDetail | undefined = data?.job?.dataSearch?.content?.[0];

  if (!univDetail) throw new Error('Major not found');

  // 관련 고교과목 파싱
  const subjectMap: Record<string, string> = {};
  for (const s of univDetail.relate_subject ?? []) {
    if (!s.subject_description) continue;
    const clean = s.subject_description.replace(/<br>/g, ', ').replace(/<[^>]+>/g, '');
    if (s.subject_name.includes('공통')) subjectMap.common = clean;
    else if (s.subject_name.includes('일반')) subjectMap.general = clean;
    else if (s.subject_name.includes('진로')) subjectMap.career = clean;
    else if (s.subject_name.includes('전문교과Ⅰ') || s.subject_name.includes('전문교과I'))
      subjectMap.professional = clean;
  }

  // 대학 목록: 중복 학교 제거, 서울 → 가나다순 (URL 포함)
  const univMap = new Map<string, UniversityFull>();
  for (const u of univDetail.university ?? []) {
    if (!univMap.has(u.schoolName)) {
      univMap.set(u.schoolName, {
        name: u.schoolName,
        area: u.area.replace(/특별시|광역시|특별자치시|특별자치도/g, ''),
        schoolURL: u.schoolURL || '',
        majorName: u.majorName || '',
      });
    }
  }
  const universitiesFull = [...univMap.values()].sort((a, b) => {
    if (a.area === '서울' && b.area !== '서울') return -1;
    if (a.area !== '서울' && b.area === '서울') return 1;
    return a.name.localeCompare(b.name);
  });

  const universities: University[] = universitiesFull.map(({ name, area }) => ({ name, area }));

  // 대학 핵심과목 파싱
  const mainSubjects = (jobDetail?.main_subject ?? []).map((s) => ({
    name: s.subject_name || '',
    desc: (s.subject_description || '').replace(/<br>/g, ', ').replace(/<[^>]+>/g, ''),
  }));

  // 진로활동 파싱
  const careerActivities = (univDetail.career_act ?? []).map((a) => ({
    name: a.act_name || '',
    desc: (a.act_description || '').replace(/<br>/g, ', ').replace(/<[^>]+>/g, ''),
  }));

  const cleanHtml = (s: string) => s.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '').trim();

  // 관련 직업 상세
  const relatedJobDetails = (jobDetail?.relate_job ?? []).map((j) => ({
    name: j.job_name || '',
    desc: cleanHtml(j.job_description || ''),
  }));

  // 관련 자격증 상세
  const relatedQualifiDetails = (jobDetail?.relate_qualifi ?? []).map((q) => ({
    name: q.qualifi_name || '',
    desc: cleanHtml(q.qualifi_description || ''),
  }));

  return {
    id: majorSeq,
    name: univDetail.major,
    category: '',
    relateSubject: {
      common: subjectMap.common || '',
      general: subjectMap.general || '',
      career: subjectMap.career || '',
      professional: subjectMap.professional || '',
    },
    universities,
    universitiesFull,
    jobs: univDetail.job || jobDetail?.relate_job?.map((j) => j.job_name).join(', ') || '',
    qualifications: univDetail.qualifications || jobDetail?.relate_qualifi?.map((q) => q.qualifi_name).join(', ') || '',
    summary: cleanHtml(univDetail.summary || ''),
    property: cleanHtml(univDetail.property || ''),
    interest: cleanHtml(univDetail.interest || ''),
    mainSubjects,
    employmentRate: jobDetail?.employment_rate || '',
    salary: cleanHtml(jobDetail?.salary || ''),
    admissionInfo: cleanHtml(jobDetail?.admission_info || ''),
    postGraduation: cleanHtml(jobDetail?.post_graduation || ''),
    enterField: cleanHtml(jobDetail?.enter_field || ''),
    careerActivities,
    relatedJobDetails,
    relatedQualifiDetails,
  };
}
