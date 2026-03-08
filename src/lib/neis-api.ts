// NEIS API 클라이언트 - 전국 고등학교 목록 + 실시간 개설과목 조회

export interface NEISSchool {
  code: string;
  regionCode: string;
  name: string;
  engName: string;
  region: string;
  regionFull: string;
  address: string;
  type: string;
  foundation: string;
  coedu: string;
  homepage: string;
  tel: string;
}

export interface Region {
  code: string;
  name: string;
  fullName: string;
}

export interface SchoolSubjects {
  schoolName: string;
  schoolCode: string;
  regionCode: string;
  year: string;
  semester: string;
  subjectsByGrade: Record<string, string[]>;
  allSubjects: string[];
  totalRecords: number;
}

// 시도교육청 코드 (프론트에서 셀렉트박스용)
export const REGION_CODES: { code: string; name: string }[] = [
  { code: 'B10', name: '서울' },
  { code: 'C10', name: '부산' },
  { code: 'D10', name: '대구' },
  { code: 'E10', name: '인천' },
  { code: 'F10', name: '광주' },
  { code: 'G10', name: '대전' },
  { code: 'H10', name: '울산' },
  { code: 'I10', name: '세종' },
  { code: 'J10', name: '경기' },
  { code: 'K10', name: '강원' },
  { code: 'M10', name: '충북' },
  { code: 'N10', name: '충남' },
  { code: 'P10', name: '전북' },
  { code: 'Q10', name: '전남' },
  { code: 'R10', name: '경북' },
  { code: 'S10', name: '경남' },
  { code: 'T10', name: '제주' },
];

// 전국 고등학교 목록 조회
export async function fetchSchoolList(options: {
  region?: string;
  name?: string;
  page?: number;
  size?: number;
}): Promise<{ schools: NEISSchool[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.region) params.set('region', options.region);
  if (options.name) params.set('name', options.name);
  if (options.page) params.set('page', String(options.page));
  if (options.size) params.set('size', String(options.size));

  const res = await fetch(`/api/neis/schools?${params}`);
  if (!res.ok) throw new Error('Failed to fetch school list');

  const data = await res.json();
  return {
    schools: data.schools || [],
    totalCount: data.totalCount || 0,
  };
}

// 특정 학교의 개설과목 실시간 조회
export async function fetchSchoolSubjects(
  regionCode: string,
  schoolCode: string,
  year?: string,
  semester?: string,
): Promise<SchoolSubjects> {
  const params = new URLSearchParams({
    regionCode,
    schoolCode,
  });
  if (year) params.set('year', year);
  if (semester) params.set('semester', semester);

  const res = await fetch(`/api/neis/subjects?${params}`);
  if (!res.ok) throw new Error('Failed to fetch subjects');

  return await res.json();
}
