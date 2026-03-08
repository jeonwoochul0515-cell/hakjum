import type { Major } from '@/types';

/**
 * 주요 대학 인기 학과 폴백 데이터 (2025-2026 기준)
 * 커리어넷 API 실시간 데이터가 없을 때 보완용으로 사용
 *
 * 출처:
 * - 과목 매핑: 대교협 「2028 모집단위별 반영과목 및 대학별 권장과목 자료집」 (2025.12.31)
 * - 대학·학과 목록: 커리어넷(career.go.kr) 학과정보
 * - 관련직업·자격증: 커리어넷(career.go.kr) 직업정보
 * - 최종 업데이트: 2026.03
 */
export const popularMajors: Major[] = [
  {
    id: 'cs',
    name: '컴퓨터공학과',
    category: '공학계열',
    relateSubject: {
      common: '수학, 정보, 통합과학',
      general: '수학Ⅰ, 수학Ⅱ, 미적분, 확률과 통계, 물리학Ⅰ, 정보',
      career: '인공지능 기초, 프로그래밍, 기하, 데이터 과학',
      professional: '정보과학, 인공지능과 미래사회',
    },
    universities: [
      { name: '부산대학교', area: '부산' },
      { name: '부경대학교', area: '부산' },
      { name: '동아대학교', area: '부산' },
      { name: '동의대학교', area: '부산' },
      { name: '경성대학교', area: '부산' },
      { name: '동서대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
      { name: 'KAIST', area: '대전' },
    ],
    jobs: 'AI/ML 엔지니어, 소프트웨어 개발자, 데이터 사이언티스트, 사이버보안 전문가, 클라우드 엔지니어, MLOps 엔지니어',
    qualifications: '정보처리기사, SQLD, AWS 자격증, TOPCIT, 정보보안기사, ADsP',
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
      { name: '경성대학교', area: '부산' },
      { name: '동의대학교', area: '부산' },
      { name: '동서대학교', area: '부산' },
      { name: '부산가톨릭대학교', area: '부산' },
      { name: '동명대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '이화여자대학교', area: '서울' },
      { name: '중앙대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
    ],
    jobs: '간호사, 전문간호사(13개 분야), 보건교사, 산업간호사, 임상연구 코디네이터(CRC), 디지털 헬스케어 간호사',
    qualifications: '간호사 국가면허, BLS(기본심폐소생술), KALS, 전문간호사 자격, 보건교사 자격증',
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
      { name: '동아대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '울산대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
      { name: '가톨릭대학교', area: '서울' },
      { name: '중앙대학교', area: '서울' },
    ],
    jobs: '임상의사(내과·외과 등 25개 전문과목), 의학 연구자, 의과대학 교수, 공중보건의, AI 의료 전문가',
    qualifications: '의사 국가면허, 전문의 자격(25개 전문과목)',
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
      { name: '경성대학교', area: '부산' },
      { name: '동의대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '서강대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
      { name: '중앙대학교', area: '서울' },
    ],
    jobs: '경영 컨설턴트, 디지털 마케터, 재무 분석가, ESG 경영 전문가, 데이터 기반 마케팅 분석가, 스타트업 창업가',
    qualifications: '공인회계사(CPA), 재무위험관리사(FRM), 매경TEST, 한경TESAT, 전산회계, 금융투자분석사, 경영지도사',
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
      { name: '경성대학교', area: '부산' },
      { name: '신라대학교', area: '부산' },
      { name: '동의대학교', area: '부산' },
      { name: '부산대학교(로스쿨)', area: '부산' },
      { name: '동아대학교(로스쿨)', area: '부산' },
      { name: '서울대학교(로스쿨)', area: '서울' },
      { name: '고려대학교(로스쿨)', area: '서울' },
      { name: '연세대학교(로스쿨)', area: '서울' },
      { name: '성균관대학교(로스쿨)', area: '서울' },
      { name: '한양대학교(로스쿨)', area: '서울' },
      { name: '이화여자대학교(로스쿨)', area: '서울' },
    ],
    jobs: '변호사, 판사, 검사, 법무사, 공인노무사, 기업 법무/컴플라이언스 전문가, 리걸테크 종사자, 변리사',
    qualifications: '변호사시험, 법무사, 공인노무사, 행정사, 변리사, 감정평가사',
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
      { name: '동아대학교', area: '부산' },
      { name: '신라대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '이화여자대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
      { name: '서울교육대학교', area: '서울' },
    ],
    jobs: '교사, 교육행정 공무원, 교육 연구원, HRD 전문가, 교수, 에듀테크 기획자, AI 교육 콘텐츠 설계자, 평생교육사',
    qualifications: '교원자격증(정교사 2급), 상담심리사, 임상심리사, 평생교육사, 직업상담사, 청소년상담사, 한국어교원자격증',
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
      { name: '동의대학교', area: '부산' },
      { name: '경성대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: 'KAIST', area: '대전' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
    ],
    jobs: '반도체 엔지니어, 전기차/배터리 엔지니어, 신재생에너지 엔지니어, 통신 엔지니어, 로봇 공학 연구원, 디스플레이 엔지니어',
    qualifications: '전기기사, 전자기사, 정보통신기사, 반도체설계기사, 신재생에너지발전설비기사, 임베디드기사',
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
      { name: '경성대학교', area: '부산' },
      { name: '인제대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '중앙대학교', area: '서울' },
      { name: '이화여자대학교', area: '서울' },
      { name: '경희대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
    ],
    jobs: '약국 약사, 병원약사, 임상약사, 제약회사 연구원(신약개발), 바이오의약품 연구원, 공무원 약사(식약처)',
    qualifications: '약사 국가면허, 임상약사 전문인증',
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
      { name: '경성대학교', area: '부산' },
      { name: '신라대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '고려대학교', area: '서울' },
      { name: '연세대학교', area: '서울' },
      { name: '성균관대학교', area: '서울' },
      { name: '이화여자대학교', area: '서울' },
      { name: '한양대학교', area: '서울' },
    ],
    jobs: '작가, 기자, 편집자, 국어교사, 콘텐츠 크리에이터, UX 라이터, AI 자연어처리(NLP) 데이터 전문가, 한국어 교원',
    qualifications: '교원자격증, 한국어교원자격증, KBS 한국어능력시험, 독서지도사',
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
      { name: '동아대학교', area: '부산' },
      { name: '동의대학교', area: '부산' },
      { name: '경성대학교', area: '부산' },
      { name: '동명대학교', area: '부산' },
      { name: '서울대학교', area: '서울' },
      { name: '홍익대학교', area: '서울' },
      { name: '국민대학교', area: '서울' },
      { name: '건국대학교', area: '서울' },
      { name: '중앙대학교', area: '서울' },
    ],
    jobs: 'UI/UX 디자이너, 그래픽 디자이너, 산업디자이너, 브랜드 디자이너, 서비스 디자이너, 영상/모션 그래픽 디자이너, AI 활용 디자이너',
    qualifications: '시각디자인기사, 컬러리스트, GTQ(그래픽기술자격), 웹디자인개발기능사, 서비스경험디자인기사',
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
