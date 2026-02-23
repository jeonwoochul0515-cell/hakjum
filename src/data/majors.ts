import type { Major } from '@/types';

// 부산 + 인서울 주요 대학 인기 학과 폴백 데이터
// 커리어넷 API 승인 후 실시간 데이터로 대체 예정
export const popularMajors: Major[] = [
  {
    id: 'cs',
    name: '컴퓨터공학과',
    category: '공학계열',
    relateSubject: {
      common: '수학, 정보, 통합과학',
      general: '수학Ⅰ, 수학Ⅱ, 미적분, 확률과 통계, 물리학Ⅰ, 정보',
      career: '인공지능 기초, 프로그래밍, 기하',
      professional: '정보과학, 인공지능과 미래사회',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '부경대학교', area: '부산' },
      { name: '동아대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
    ],
    jobs: '소프트웨어 개발자, AI 엔지니어, 데이터 사이언티스트, 보안 전문가',
    qualifications: '정보처리기사, SQLD, AWS 자격증, TOPCIT',
  },
  {
    id: 'nursing',
    name: '간호학과',
    category: '의약계열',
    relateSubject: {
      common: '통합과학, 생명과학',
      general: '생명과학Ⅰ, 화학Ⅰ, 수학Ⅰ, 영어Ⅰ',
      career: '생명과학Ⅱ, 화학Ⅱ, 생활과 과학',
      professional: '보건, 인체구조와 기능',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '동아대학교', area: '부산' },
      { name: '고신대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
    ],
    jobs: '간호사, 보건교사, 보건진료전문간호사, 산업간호사',
    qualifications: '간호사 면허, BLS(기본생명구조술), 전문간호사',
  },
  {
    id: 'medicine',
    name: '의예과(의학과)',
    category: '의약계열',
    relateSubject: {
      common: '통합과학, 생명과학, 수학',
      general: '생명과학Ⅰ, 화학Ⅰ, 물리학Ⅰ, 수학Ⅰ, 수학Ⅱ, 미적분',
      career: '생명과학Ⅱ, 화학Ⅱ, 물리학Ⅱ, 기하',
      professional: '과학과제 연구, 생명과학 실험',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '고신대학교', area: '부산' },
      { name: '인제대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
    ],
    jobs: '의사, 전문의, 의학 연구자',
    qualifications: '의사 면허, 전문의 자격',
  },
  {
    id: 'business',
    name: '경영학과',
    category: '사회계열',
    relateSubject: {
      common: '수학, 통합사회',
      general: '경제, 수학Ⅰ, 수학Ⅱ, 사회·문화, 확률과 통계',
      career: '경제 수학, 사회문제 탐구, 창업과 경영',
      professional: '회계정보처리, 비즈니스 영어',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '동아대학교', area: '부산' },
      { name: '부경대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '서강대학교', area: '서울' },
    ],
    jobs: '경영 컨설턴트, 마케팅 전문가, 재무 분석가, CEO',
    qualifications: '공인회계사(CPA), 재무위험관리사(FRM), 매경TEST, 한경TESAT',
  },
  {
    id: 'law',
    name: '법학과',
    category: '사회계열',
    relateSubject: {
      common: '통합사회, 한국사',
      general: '정치와 법, 사회·문화, 생활과 윤리, 윤리와 사상',
      career: '사회문제 탐구, 고전과 윤리',
      professional: '논술',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '동아대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
    ],
    jobs: '변호사, 판사, 검사, 법무사, 기업 법률 자문',
    qualifications: '변호사, 법무사, 행정사, 공인노무사',
  },
  {
    id: 'education',
    name: '교육학과',
    category: '교육계열',
    relateSubject: {
      common: '국어, 영어, 수학, 통합사회',
      general: '문학, 화법과 작문, 영어Ⅰ, 수학Ⅰ, 사회·문화',
      career: '심리학, 교육학, 논술',
      professional: '',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '부산교육대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '서울교육대학교', area: '서울' },
    ],
    jobs: '교사, 교육 행정가, 교육 상담사, 교수',
    qualifications: '교원자격증(정교사 2급), 상담심리사, 임상심리사',
  },
  {
    id: 'elec-eng',
    name: '전기·전자공학과',
    category: '공학계열',
    relateSubject: {
      common: '수학, 통합과학, 물리학',
      general: '수학Ⅰ, 수학Ⅱ, 미적분, 물리학Ⅰ, 화학Ⅰ',
      career: '물리학Ⅱ, 기하, 공학 일반',
      professional: '전기회로, 디지털 논리회로',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '부경대학교', area: '부산' },
      { name: '동아대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: 'KAIST', area: '대전' },
      { name: '한양대학교', area: '서울' },
    ],
    jobs: '전자 엔지니어, 반도체 설계, 통신 엔지니어, 로봇 공학자',
    qualifications: '전기기사, 전자기사, 정보통신기사, 반도체설계기사',
  },
  {
    id: 'pharmacy',
    name: '약학과',
    category: '의약계열',
    relateSubject: {
      common: '수학, 통합과학, 화학',
      general: '화학Ⅰ, 생명과학Ⅰ, 수학Ⅰ, 수학Ⅱ, 미적분',
      career: '화학Ⅱ, 생명과학Ⅱ, 과학과제 연구',
      professional: '의약품 관리, 생명공학 기초',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '인제대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '중앙대학교', area: '서울' },
    ],
    jobs: '약사, 제약 연구원, 임상시험 관리자',
    qualifications: '약사 면허',
  },
  {
    id: 'korean-lit',
    name: '국어국문학과',
    category: '인문계열',
    relateSubject: {
      common: '국어, 한국사',
      general: '문학, 화법과 작문, 독서, 언어와 매체',
      career: '심화 국어, 고전 읽기, 현대문학 감상',
      professional: '논술',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '동아대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
    ],
    jobs: '작가, 기자, 편집자, 국어교사, 출판기획자',
    qualifications: '교원자격증, 한국어교원자격증',
  },
  {
    id: 'design',
    name: '디자인학과(시각/산업)',
    category: '예체능계열',
    relateSubject: {
      common: '미술, 기술가정',
      general: '미술, 미술 창작, 영어Ⅰ',
      career: '미술 감상과 비평, 미술 이론',
      professional: '디자인 일반, 시각디자인, 공예',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '동서대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '홍익대학교', area: '서울' },
      { name: '국민대학교', area: '서울' },
    ],
    jobs: 'UI/UX 디자이너, 그래픽 디자이너, 산업디자이너, 브랜드 디자이너',
    qualifications: '시각디자인기사, 컬러리스트, GTQ(그래픽기술자격)',
  },
];

export const majorCategories = [...new Set(popularMajors.map((m) => m.category))].sort();

export function searchMajors(query: string, category?: string): Major[] {
  let results = popularMajors;

  if (category && category !== '전체') {
    results = results.filter((m) => m.category === category);
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.jobs.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }

  return results;
}
