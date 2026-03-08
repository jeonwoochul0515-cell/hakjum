// 2028학년도 대입개편 교과이수기준 + 대학별 진학필수 교과목
// 출처:
//  - 대교협 「2028 모집단위별 반영과목 및 대학별 권장과목 자료집」 (2025.12.31)
//  - 대교협 「2028학년도 권역별 대학별 권장과목」 (2026.02.20)
//  - 서울대 입학본부 「2028학년도 전공 연계 과목 선택 안내」 (2025.06.30)
//  - 경희대 「2028학년도 교과 이수 권장과목」 (2025.10)
//  - 각 대학 입학본부 공식 발표자료
//  - 에듀인사이트 대학별 필수 반영 과목 정리 (2025-2026)
//
// [고교학점제 전면 시행에 따른 교과이수기준]
// 2025년 고1부터 적용 → 2028학년도 대입부터 반영
// 대학은 모집단위별로 '교과이수기준'을 사전 공개해야 함
// ※ 마지막 업데이트: 2026.03

export interface AdmissionRequirement {
  university: string;
  category: string;        // 모집단위 계열
  requiredSubjects: string[];   // 필수이수 과목
  recommendedSubjects: string[]; // 권장 과목
  notes: string;
}

export interface SubjectRequirementByTrack {
  track: string;           // 계열명 (인문, 자연, 공학, 의약, 예체능 등)
  essential: string[];     // 필수 교과목
  recommended: string[];   // 권장 교과목
  description: string;
}

// ── 2028 대입 공통 교과이수기준 (대교협 권고안) ──
// 모든 대학 공통 적용 예정
export const COMMON_REQUIREMENTS: SubjectRequirementByTrack[] = [
  {
    track: '인문·사회계열',
    essential: [
      '화법과 작문', '독서와 작문', '문학',
      '수학I', '수학II',
      '영어I', '영어II',
      '한국사',
    ],
    recommended: [
      '언어와 매체', '심화 국어',
      '확률과 통계',
      '영어 독해와 작문',
      '세계사', '동아시아사', '정치와 법', '경제', '사회·문화',
      '윤리와 사상', '생활과 윤리',
      '제2외국어I',
    ],
    description: '인문·사회계열은 국어·영어·사회 교과의 심화과목 이수를 중시합니다.',
  },
  {
    track: '자연·공학계열',
    essential: [
      '수학I', '수학II', '미적분', '확률과 통계',
      '물리학I', '화학I',
      '영어I',
      '한국사',
    ],
    recommended: [
      '기하',
      '물리학II', '화학II', '생명과학I', '생명과학II', '지구과학I',
      '정보', '프로그래밍',
      '영어II', '영어 독해와 작문',
      '미적분II', '경제 수학',
    ],
    description: '자연·공학계열은 수학·과학 심화과목 이수가 핵심입니다. 특히 미적분은 거의 필수입니다.',
  },
  {
    track: '의약계열',
    essential: [
      '수학I', '수학II', '미적분',
      '물리학I', '화학I', '생명과학I',
      '영어I',
      '한국사',
    ],
    recommended: [
      '기하', '확률과 통계',
      '물리학II', '화학II', '생명과학II',
      '영어II', '영어 독해와 작문',
      '생활과 윤리',
      '보건',
    ],
    description: '의약계열은 수학(미적분 필수) + 과학 3과목 이상 이수를 요구하며, 과학II 과목 이수가 유리합니다.',
  },
  {
    track: '교육계열',
    essential: [
      '화법과 작문', '문학',
      '수학I', '수학II',
      '영어I',
      '한국사',
      '교육학',
    ],
    recommended: [
      '언어와 매체',
      '확률과 통계',
      '영어II',
      '심리학', '사회·문화',
      '윤리와 사상',
    ],
    description: '교육계열은 국어·수학·영어 기본 이수 + 전공 관련 교과 심화를 권장합니다.',
  },
  {
    track: '예체능계열',
    essential: [
      '국어',
      '영어I',
      '한국사',
    ],
    recommended: [
      '미술', '음악', '체육',
      '미술 창작', '미술 감상과 비평',
      '음악 연주와 창작', '음악 감상과 비평',
      '스포츠 생활', '체육 탐구',
    ],
    description: '예체능계열은 전공 실기가 중심이지만, 국어·영어 기본 교과 이수와 예체능 관련 선택과목 이수를 봅니다.',
  },
  {
    track: '상경계열',
    essential: [
      '수학I', '수학II', '확률과 통계',
      '영어I', '영어II',
      '경제', '사회·문화',
      '한국사',
    ],
    recommended: [
      '미적분',
      '영어 독해와 작문',
      '정치와 법',
      '정보',
      '제2외국어I',
      '경제 수학',
    ],
    description: '상경계열은 수학 역량(확률과 통계 필수) + 사회 교과 이수를 중시합니다.',
  },
];

// ── 주요 대학별 교과이수기준 (2028학년도) ──
// 출처: 대교협 자료집(2025.12), 서울대 입학본부(2025.06), 에듀인사이트 종합
// '핵심과목' = 미이수 시 감점 가능, '권장과목' = 이수 시 가점
export const UNIVERSITY_SPECIFIC: AdmissionRequirement[] = [
  // ────── 서울대학교 (2025.06.30 발표) ──────
  // 2028부터 '핵심권장'+'권장'을 '권장과목' 하나로 통합
  {
    university: '서울대학교',
    category: '공학계열',
    requiredSubjects: ['미적분', '기하', '물리학I'],
    recommendedSubjects: ['확률과 통계', '물리학II', '화학I'],
    notes: '공대 광역모집. 기계·전기정보·원자핵·항공우주는 물리학II 핵심 권장. 2028부터 권장과목 통합 안내.',
  },
  {
    university: '서울대학교',
    category: '자연계열',
    requiredSubjects: ['미적분', '기하'],
    recommendedSubjects: ['확률과 통계', '물리학II', '화학II', '생명과학II'],
    notes: '수리과학부·물리천문학부는 기하 핵심. 화학부는 화학II, 생명과학부는 생명과학II 핵심. 미적분II 권장.',
  },
  {
    university: '서울대학교',
    category: '의약계열',
    requiredSubjects: ['미적분', '화학I', '생명과학I'],
    recommendedSubjects: ['기하', '생명과학II', '화학II', '물리학I', '확률과 통계'],
    notes: '의예과는 화학I·생명과학I 핵심. 수의대는 생명과학I·II+화학I·II 권장. 약학은 화학II 핵심.',
  },
  {
    university: '서울대학교',
    category: '인문계열',
    requiredSubjects: ['제2외국어/한문 1과목 이상'],
    recommendedSubjects: ['사회교과 다양 이수', '세계사', '윤리와 사상'],
    notes: '인문계열은 제2외국어/한문 1과목 이상 이수 권장. 사학과는 한국사, 역사교육과는 세계사 핵심.',
  },
  {
    university: '서울대학교',
    category: '상경계열',
    requiredSubjects: ['미적분', '확률과 통계'],
    recommendedSubjects: ['경제', '사회·문화'],
    notes: '경영대·경제학부는 미적분+확통 권장. 자유전공학부도 수학 심화 이수 권장.',
  },

  // ────── 연세대학교 ──────
  {
    university: '연세대학교',
    category: '이공계열',
    requiredSubjects: ['미적분', '물리학I', '화학I'],
    recommendedSubjects: ['기하', '물리학II', '화학II', '생명과학I', '확률과 통계'],
    notes: '교과이수기준 미충족 시 서류평가에서 불이익. 컴퓨터공학은 미적분+확통+기하+인공지능수학 권장.',
  },
  {
    university: '연세대학교',
    category: '의약계열',
    requiredSubjects: ['미적분', '화학I', '생명과학I', '생명과학II'],
    recommendedSubjects: ['확률과 통계', '물리학I', '화학II'],
    notes: '의예과는 생명과학I·II 필수 수준. 약학은 화학I·II+생명과학I 권장.',
  },
  {
    university: '연세대학교',
    category: '인문·사회계열',
    requiredSubjects: ['사회교과 2과목 이상'],
    recommendedSubjects: ['경제', '정치와 법', '사회·문화', '윤리와 사상'],
    notes: '인문학적 소양을 위한 다양한 사회교과 이수 권장.',
  },

  // ────── 고려대학교 ──────
  {
    university: '고려대학교',
    category: '이공계열',
    requiredSubjects: ['미적분', '과학I 2과목 이상'],
    recommendedSubjects: ['기하', '확률과 통계', '과학II 과목'],
    notes: '2028 수시부터 교과이수기준 정식 반영. 기계공학은 물리학I·II 권장.',
  },
  {
    university: '고려대학교',
    category: '의약계열',
    requiredSubjects: ['미적분', '화학I', '생명과학I'],
    recommendedSubjects: ['기하', '생명과학II', '화학II', '물리학I'],
    notes: '의대·간호대 모두 생명과학I 필수 수준.',
  },
  {
    university: '고려대학교',
    category: '인문계열',
    requiredSubjects: ['사회교과 2과목 이상'],
    recommendedSubjects: ['세계사', '한국지리', '윤리와 사상', '경제'],
    notes: '교과 이수의 다양성과 깊이를 종합적으로 평가.',
  },

  // ────── 성균관대학교 ──────
  {
    university: '성균관대학교',
    category: '자연과학·공학계열',
    requiredSubjects: ['미적분', '과학I 2과목 이상'],
    recommendedSubjects: ['기하', '확률과 통계', '과학II'],
    notes: '수학·과학 심화과목 이수를 교과 역량으로 평가. 반도체학과는 물리학I·II 핵심.',
  },
  {
    university: '성균관대학교',
    category: '인문·사회계열',
    requiredSubjects: ['사회교과 2과목 이상'],
    recommendedSubjects: ['경제', '사회·문화', '정치와 법', '윤리와 사상'],
    notes: '글로벌경영은 미적분+확통 이수 권장.',
  },

  // ────── 한양대학교 ──────
  {
    university: '한양대학교',
    category: '공학계열',
    requiredSubjects: ['미적분', '물리학I 또는 화학I'],
    recommendedSubjects: ['기하', '물리학II', '정보', '프로그래밍'],
    notes: '소프트웨어·AI 관련 학과는 정보/프로그래밍 이수 우대. 기계공학은 물리학II 권장.',
  },
  {
    university: '한양대학교',
    category: '의약계열',
    requiredSubjects: ['미적분', '화학I', '생명과학I'],
    recommendedSubjects: ['생명과학II', '화학II', '물리학I'],
    notes: '의예과는 화학I+생명과학I 필수 수준.',
  },

  // ────── 중앙대학교 ──────
  {
    university: '중앙대학교',
    category: '이공계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['기하', '물리학I', '화학I', '확률과 통계'],
    notes: '교과이수기준 미충족 시 서류평가 반영. SW학부는 정보·프로그래밍 권장.',
  },
  {
    university: '중앙대학교',
    category: '인문·사회계열',
    requiredSubjects: ['사회교과 1과목 이상'],
    recommendedSubjects: ['경제', '사회·문화', '정치와 법'],
    notes: '경영경제는 미적분+확통 이수 가점.',
  },

  // ────── 경희대학교 (2025.10 발표) ──────
  {
    university: '경희대학교',
    category: '자연·공학계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['기하', '확률과 통계', '과학II'],
    notes: '핵심과목 미이수 시 감점, 권장과목 이수 시 가점. 2028학년도부터 정식 적용.',
  },
  {
    university: '경희대학교',
    category: '의약계열',
    requiredSubjects: ['미적분', '화학I', '생명과학I'],
    recommendedSubjects: ['화학II', '생명과학II', '물리학I'],
    notes: '한의예과는 생명과학I 핵심. 약학은 화학I·II 핵심.',
  },
  {
    university: '경희대학교',
    category: '인문·사회계열',
    requiredSubjects: [],
    recommendedSubjects: ['사회·문화', '생활과 윤리', '세계사', '경제'],
    notes: '사회교과 다양 이수 권장.',
  },

  // ────── 건국대학교 ──────
  {
    university: '건국대학교',
    category: '이공계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['기하', '물리학I', '화학I'],
    notes: '2028학년도 교과이수기준 적용 예정.',
  },

  // ────── 부산대학교 ──────
  {
    university: '부산대학교',
    category: '자연·공학계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['기하', '물리학II', '화학II', '확률과 통계'],
    notes: '통계·기공·화생공·전자공은 미적분 핵심. 지역거점 국립대 교과이수기준 단계적 도입.',
  },
  {
    university: '부산대학교',
    category: '의약계열',
    requiredSubjects: ['화학I', '생명과학I'],
    recommendedSubjects: ['미적분', '생명과학II', '화학II'],
    notes: '의예과·한의예과는 화학I+생명과학I 핵심. 간호학은 생명과학I·II 권장.',
  },
  {
    university: '부산대학교',
    category: '인문·사회계열',
    requiredSubjects: ['국어 심화 1과목', '사회 1과목 이상'],
    recommendedSubjects: ['화법과 작문', '언어와 매체', '사회·문화', '경제'],
    notes: '기본 교과 이수 충실도를 학생부 종합전형에서 반영.',
  },

  // ────── 경북대학교 ──────
  {
    university: '경북대학교',
    category: '자연·공학계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['기하', '확률과 통계', '과학II'],
    notes: '교과이수기준 단계적 도입 중.',
  },

  // ────── 이화여자대학교 ──────
  {
    university: '이화여자대학교',
    category: '자연·공학계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['기하', '물리학I', '화학I', '생명과학I'],
    notes: '교과이수 충실도를 종합전형에서 평가.',
  },
  {
    university: '이화여자대학교',
    category: '의약계열',
    requiredSubjects: ['미적분', '화학I', '생명과학I'],
    recommendedSubjects: ['생명과학II', '화학II'],
    notes: '약학은 화학I·II 핵심. 간호는 생명과학I 권장.',
  },

  // ────── 서강대학교 ──────
  {
    university: '서강대학교',
    category: '자연·공학계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['기하', '확률과 통계', '물리학I'],
    notes: '컴퓨터공학은 미적분+확통 권장. 교과이수 반영 예정.',
  },

  // ────── 한국외국어대학교 ──────
  {
    university: '한국외국어대학교',
    category: '인문·사회계열',
    requiredSubjects: ['제2외국어I 1과목 이상'],
    recommendedSubjects: ['세계사', '세계지리', '사회·문화', '영어II'],
    notes: '제2외국어 이수 필수. 통번역학과는 해당 언어 심화과목 권장.',
  },

  // ────── 숙명여자대학교 ──────
  {
    university: '숙명여자대학교',
    category: '자연·공학계열',
    requiredSubjects: ['미적분', '과학I 1과목 이상'],
    recommendedSubjects: ['확률과 통계', '기하'],
    notes: 'AI·SW학과는 정보·프로그래밍 이수 권장.',
  },
];

// ── 학과별 필수/권장 과목 매핑 (커리어넷 + 입시요강 통합) ──
export const MAJOR_SUBJECT_MAP: Record<string, {
  essential: string[];
  recommended: string[];
  track: string;
}> = {
  // 공학계열
  '컴퓨터공학과': {
    essential: ['수학I', '수학II', '미적분', '정보'],
    recommended: ['확률과 통계', '물리학I', '기하', '프로그래밍', '인공지능 기초'],
    track: '자연·공학계열',
  },
  '전기·전자공학과': {
    essential: ['수학I', '수학II', '미적분', '물리학I'],
    recommended: ['기하', '물리학II', '화학I', '정보'],
    track: '자연·공학계열',
  },
  '기계공학과': {
    essential: ['수학I', '수학II', '미적분', '물리학I'],
    recommended: ['기하', '물리학II', '화학I'],
    track: '자연·공학계열',
  },
  '화학공학과': {
    essential: ['수학I', '수학II', '미적분', '화학I'],
    recommended: ['화학II', '물리학I', '생명과학I', '기하'],
    track: '자연·공학계열',
  },
  '건축학과': {
    essential: ['수학I', '수학II', '미적분', '물리학I'],
    recommended: ['기하', '미술', '기술·가정'],
    track: '자연·공학계열',
  },
  '산업공학과': {
    essential: ['수학I', '수학II', '미적분', '확률과 통계'],
    recommended: ['정보', '경제', '물리학I'],
    track: '자연·공학계열',
  },
  '소프트웨어학과': {
    essential: ['수학I', '수학II', '미적분', '정보'],
    recommended: ['확률과 통계', '프로그래밍', '인공지능 기초', '물리학I'],
    track: '자연·공학계열',
  },

  // 자연계열
  '수학과': {
    essential: ['수학I', '수학II', '미적분', '기하'],
    recommended: ['확률과 통계', '경제 수학', '심화 수학I', '심화 수학II'],
    track: '자연·공학계열',
  },
  '물리학과': {
    essential: ['수학I', '수학II', '미적분', '물리학I', '물리학II'],
    recommended: ['기하', '화학I'],
    track: '자연·공학계열',
  },
  '화학과': {
    essential: ['수학I', '수학II', '미적분', '화학I', '화학II'],
    recommended: ['물리학I', '생명과학I'],
    track: '자연·공학계열',
  },
  '생명과학과': {
    essential: ['생명과학I', '생명과학II', '화학I'],
    recommended: ['미적분', '화학II', '확률과 통계'],
    track: '자연·공학계열',
  },

  // 의약계열
  '의예과(의학과)': {
    essential: ['수학I', '수학II', '미적분', '생명과학I', '화학I'],
    recommended: ['기하', '생명과학II', '화학II', '물리학I', '생활과 윤리'],
    track: '의약계열',
  },
  '치의예과(치의학과)': {
    essential: ['수학I', '수학II', '미적분', '생명과학I', '화학I'],
    recommended: ['물리학I', '생명과학II', '화학II'],
    track: '의약계열',
  },
  '한의예과(한의학과)': {
    essential: ['수학I', '수학II', '미적분', '생명과학I'],
    recommended: ['화학I', '생명과학II', '생활과 윤리'],
    track: '의약계열',
  },
  '약학과': {
    essential: ['수학I', '수학II', '미적분', '화학I', '생명과학I'],
    recommended: ['화학II', '생명과학II', '물리학I'],
    track: '의약계열',
  },
  '간호학과': {
    essential: ['생명과학I', '화학I'],
    recommended: ['미적분', '생명과학II', '확률과 통계', '보건', '생활과 윤리'],
    track: '의약계열',
  },

  // 인문계열
  '국어국문학과': {
    essential: ['화법과 작문', '문학', '독서와 작문'],
    recommended: ['언어와 매체', '심화 국어', '세계사', '철학'],
    track: '인문·사회계열',
  },
  '영어영문학과': {
    essential: ['영어I', '영어II', '영어 독해와 작문'],
    recommended: ['영미 문학 읽기', '심화 영어', '세계사'],
    track: '인문·사회계열',
  },
  '사학과': {
    essential: ['세계사', '동아시아사', '한국사'],
    recommended: ['세계지리', '한국지리', '사회·문화'],
    track: '인문·사회계열',
  },
  '철학과': {
    essential: ['윤리와 사상', '생활과 윤리'],
    recommended: ['문학', '세계사', '논리학'],
    track: '인문·사회계열',
  },

  // 사회계열
  '경영학과': {
    essential: ['수학I', '수학II', '확률과 통계', '경제'],
    recommended: ['미적분', '사회·문화', '정치와 법', '영어II', '정보'],
    track: '상경계열',
  },
  '경제학과': {
    essential: ['수학I', '수학II', '미적분', '확률과 통계', '경제'],
    recommended: ['기하', '경제 수학', '사회·문화', '정치와 법'],
    track: '상경계열',
  },
  '법학과': {
    essential: ['정치와 법', '사회·문화', '생활과 윤리'],
    recommended: ['윤리와 사상', '세계사', '경제', '논술'],
    track: '인문·사회계열',
  },
  '심리학과': {
    essential: ['생명과학I', '확률과 통계'],
    recommended: ['사회·문화', '생활과 윤리', '심리학'],
    track: '인문·사회계열',
  },
  '사회학과': {
    essential: ['사회·문화', '생활과 윤리'],
    recommended: ['정치와 법', '경제', '세계지리', '확률과 통계'],
    track: '인문·사회계열',
  },
  '행정학과': {
    essential: ['정치와 법', '사회·문화', '경제'],
    recommended: ['생활과 윤리', '한국지리', '확률과 통계'],
    track: '인문·사회계열',
  },
  '국제학과': {
    essential: ['영어I', '영어II', '세계사'],
    recommended: ['영어 독해와 작문', '정치와 법', '세계지리', '제2외국어I'],
    track: '인문·사회계열',
  },

  // 교육계열
  '교육학과': {
    essential: ['교육학', '사회·문화'],
    recommended: ['심리학', '윤리와 사상', '확률과 통계'],
    track: '교육계열',
  },

  // 예체능계열
  '디자인학과(시각/산업)': {
    essential: ['미술', '미술 창작'],
    recommended: ['미술 감상과 비평', '정보', '영어I'],
    track: '예체능계열',
  },
};

// ── 크롤링 데이터 자동 병합 ──
// /api/admission/sync에서 가져온 데이터를 정적 데이터와 병합
let _crawledData: AdmissionRequirement[] | null = null;
let _crawlFetched = false;

async function fetchCrawledData(): Promise<AdmissionRequirement[]> {
  if (_crawlFetched) return _crawledData || [];
  _crawlFetched = true;
  try {
    const res = await fetch('/api/admission/sync');
    if (!res.ok) return [];
    const json = await res.json() as { universities?: AdmissionRequirement[] };
    _crawledData = json.universities || [];
    return _crawledData;
  } catch {
    return [];
  }
}

// 정적 + 크롤링 데이터 병합 (크롤링 데이터가 있으면 덮어씀)
export function getAllUniversityRequirements(): AdmissionRequirement[] {
  if (!_crawledData || _crawledData.length === 0) return UNIVERSITY_SPECIFIC;
  // 정적 데이터를 기본으로, 크롤링 데이터로 보강
  const merged = new Map<string, AdmissionRequirement>();
  for (const item of UNIVERSITY_SPECIFIC) {
    merged.set(`${item.university}__${item.category}`, item);
  }
  for (const item of _crawledData) {
    merged.set(`${item.university}__${item.category}`, item);
  }
  return Array.from(merged.values());
}

// 앱 시작 시 크롤링 데이터 프리페치 (비차단)
if (typeof window !== 'undefined') {
  fetchCrawledData().catch(() => {});
}

// 학과명으로 필수과목 조회 (부분 매칭 지원)
export function getRequirementsForMajor(majorName: string): {
  essential: string[];
  recommended: string[];
  track: string;
  trackRequirements: SubjectRequirementByTrack | undefined;
  universitySpecific: AdmissionRequirement[];
} {
  // 정확한 매칭 먼저
  let match = MAJOR_SUBJECT_MAP[majorName];

  // 부분 매칭
  if (!match) {
    const key = Object.keys(MAJOR_SUBJECT_MAP).find(
      (k) => majorName.includes(k.replace(/[()·]/g, '')) || k.includes(majorName.replace(/[()·]/g, ''))
    );
    if (key) match = MAJOR_SUBJECT_MAP[key];
  }

  // 키워드 기반 계열 추정
  if (!match) {
    const name = majorName.toLowerCase();
    let track = '인문·사회계열';
    if (/공학|소프트웨어|컴퓨터|전자|전기|기계|건축|산업|재료|화공/.test(name)) track = '자연·공학계열';
    else if (/의|치|한의|약|간호|보건|물리치료|방사선/.test(name)) track = '의약계열';
    else if (/수학|물리|화학|생명|생물|지구|천문|통계/.test(name)) track = '자연·공학계열';
    else if (/교육|사범/.test(name)) track = '교육계열';
    else if (/미술|음악|체육|디자인|영상|연극|무용/.test(name)) track = '예체능계열';
    else if (/경영|경제|회계|무역|금융|세무/.test(name)) track = '상경계열';

    const trackReq = COMMON_REQUIREMENTS.find((r) => r.track === track);
    match = {
      essential: trackReq?.essential || [],
      recommended: trackReq?.recommended || [],
      track,
    };
  }

  const trackReq = COMMON_REQUIREMENTS.find((r) => r.track === match.track);
  // 계열 키워드로 대학별 데이터 필터링 (정적 + 크롤링 병합)
  const allUnivData = getAllUniversityRequirements();
  const trackKeyword = match.track.split('·')[0]; // '자연', '인문', '의약' 등
  const univSpecific = allUnivData.filter((u) => {
    if (u.category.includes(match.track)) return true;
    if (u.category.includes(trackKeyword)) return true;
    // 상경계열은 인문·사회 + 이공 양쪽 매칭
    if (match.track === '상경계열' && (u.category.includes('상경') || u.category.includes('인문'))) return true;
    return false;
  });

  return {
    essential: match.essential,
    recommended: match.recommended,
    track: match.track,
    trackRequirements: trackReq,
    universitySpecific: univSpecific,
  };
}
