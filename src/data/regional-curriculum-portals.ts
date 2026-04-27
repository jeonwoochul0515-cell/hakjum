// 17개 시도교육청 공동교육과정 포털 매핑 테이블
// 학교에 미개설된 과목을 시도별 공동교육과정 또는 교실온닷(전국 통합 온라인)으로
// 안내하기 위한 외부 링크 데이터.

export interface RegionalPortal {
  /** 표준 시도코드 (행정구역, 예: '11'=서울, '21'=부산) */
  code: string;
  /** 짧은 시도명 (예: '서울', '부산') */
  region: string;
  /** 정식 시도명 (예: '서울특별시') */
  fullName: string;
  /** 공동교육과정 포털 URL */
  portalUrl: string;
  /** 포털 명칭 (브랜드명) */
  portalName: string;
  /** 부가 설명 (선택) */
  description?: string;
}

/**
 * 시도코드(행정구역) → 공동교육과정 포털 매핑
 * key: 표준 시도코드 ('11', '21', ...)
 */
export const REGIONAL_PORTALS: Record<string, RegionalPortal> = {
  '11': {
    code: '11',
    region: '서울',
    fullName: '서울특별시',
    portalUrl: 'https://seoulhsc.sen.go.kr',
    portalName: '서울 콜라캠퍼스/공유캠퍼스',
    description: '서울시교육청 고교학점제 공동교육과정',
  },
  '21': {
    code: '21',
    region: '부산',
    fullName: '부산광역시',
    portalUrl: 'https://co-school.pen.go.kr',
    portalName: '부산 다고른',
    description: '부산시교육청 공동교육과정',
  },
  '22': {
    code: '22',
    region: '대구',
    fullName: '대구광역시',
    portalUrl: 'https://www.dge.go.kr/gongdong',
    portalName: '대구 공동교육과정',
    description: '대구시교육청 공동교육과정',
  },
  '23': {
    code: '23',
    region: '인천',
    fullName: '인천광역시',
    portalUrl: 'https://www.ice.go.kr/hakjeom',
    portalName: '인천 꿈두레',
    description: '인천시교육청 학점제 공동교육과정',
  },
  '24': {
    code: '24',
    region: '광주',
    fullName: '광주광역시',
    portalUrl: 'https://7th.gen.go.kr/high/sugang',
    portalName: '광주 공동교육과정',
    description: '광주시교육청 공동교육과정',
  },
  '25': {
    code: '25',
    region: '대전',
    fullName: '대전광역시',
    portalUrl: 'https://djehcredit.com',
    portalName: '대전 학점제',
    description: '대전시교육청 고교학점제 공동교육과정',
  },
  '26': {
    code: '26',
    region: '울산',
    fullName: '울산광역시',
    portalUrl: 'https://use.go.kr/uscredit',
    portalName: '울산 학점제',
    description: '울산시교육청 고교학점제 공동교육과정',
  },
  '29': {
    code: '29',
    region: '세종',
    fullName: '세종특별자치시',
    portalUrl: 'https://www.sje.go.kr',
    portalName: '세종 캠퍼스형',
    description: '세종시교육청 캠퍼스형 공동교육과정',
  },
  '31': {
    code: '31',
    region: '경기',
    fullName: '경기도',
    portalUrl: 'https://hscredit.goean.kr',
    portalName: '경기 학점제',
    description: '경기도교육청 고교학점제 공동교육과정',
  },
  '32': {
    code: '32',
    region: '강원',
    fullName: '강원특별자치도',
    portalUrl: 'http://kwe-gongdong.com',
    portalName: '강원 공동교육과정',
    description: '강원도교육청 공동교육과정',
  },
  '33': {
    code: '33',
    region: '충북',
    fullName: '충청북도',
    portalUrl: 'https://hscredit.cbe.go.kr',
    portalName: '충북 학점제',
    description: '충북교육청 고교학점제 공동교육과정',
  },
  '34': {
    code: '34',
    region: '충남',
    fullName: '충청남도',
    portalUrl: 'https://onmadang.or.kr',
    portalName: '충남 온마당',
    description: '충남교육청 공동교육과정',
  },
  '35': {
    code: '35',
    region: '전북',
    fullName: '전북특별자치도',
    portalUrl: 'https://jbecredit.kr',
    portalName: '전북 학점제',
    description: '전북교육청 고교학점제 공동교육과정',
  },
  '36': {
    code: '36',
    region: '전남',
    fullName: '전라남도',
    portalUrl: 'https://hscredit.jne.go.kr',
    portalName: '전남 학점제',
    description: '전남교육청 고교학점제 공동교육과정',
  },
  '37': {
    code: '37',
    region: '경북',
    fullName: '경상북도',
    portalUrl: 'https://curri.gyo6.net',
    portalName: '경북 공동교육과정',
    description: '경북교육청 공동교육과정',
  },
  '38': {
    code: '38',
    region: '경남',
    fullName: '경상남도',
    portalUrl: 'https://charm.gne.go.kr',
    portalName: '경남 참공동교육과정',
    description: '경남교육청 공동교육과정',
  },
  '39': {
    code: '39',
    region: '제주',
    fullName: '제주특별자치도',
    portalUrl: 'https://jhscs.jje.go.kr',
    portalName: '제주 공동교육과정',
    description: '제주교육청 공동교육과정',
  },
};

/**
 * NEIS 시도교육청 코드(B10/C10/...) → 표준 시도코드(11/21/...) 매핑
 * NEIS API 결과의 ATPT_OFCDC_SC_CODE 또는 본 프로젝트의 regionCode 변환용
 */
const NEIS_TO_STANDARD: Record<string, string> = {
  B10: '11', // 서울
  C10: '21', // 부산
  D10: '22', // 대구
  E10: '23', // 인천
  F10: '24', // 광주
  G10: '25', // 대전
  H10: '26', // 울산
  I10: '29', // 세종
  J10: '31', // 경기
  K10: '32', // 강원
  M10: '33', // 충북
  N10: '34', // 충남
  P10: '35', // 전북
  Q10: '36', // 전남
  R10: '37', // 경북
  S10: '38', // 경남
  T10: '39', // 제주
};

/**
 * 시도명 → 표준 시도코드 매핑 (사용자 입력 fallback용)
 */
const NAME_TO_STANDARD: Record<string, string> = {
  서울: '11',
  부산: '21',
  대구: '22',
  인천: '23',
  광주: '24',
  대전: '25',
  울산: '26',
  세종: '29',
  경기: '31',
  강원: '32',
  충북: '33',
  충남: '34',
  전북: '35',
  전남: '36',
  경북: '37',
  경남: '38',
  제주: '39',
};

/**
 * 시도코드(표준 또는 NEIS 형식) 또는 시도명으로 포털 정보를 조회한다.
 * - '11', '21' 등 표준 시도코드
 * - 'B10', 'C10' 등 NEIS 코드
 * - '서울', '경기' 등 짧은 시도명
 * 일치하는 항목이 없으면 null 반환.
 */
export function getRegionalPortal(시도코드_or_시도명: string): RegionalPortal | null {
  if (!시도코드_or_시도명) return null;
  const key = 시도코드_or_시도명.trim();
  if (!key) return null;

  // 1) 표준 시도코드 직접 일치
  if (REGIONAL_PORTALS[key]) return REGIONAL_PORTALS[key];

  // 2) NEIS 코드 → 표준 코드
  const upper = key.toUpperCase();
  if (NEIS_TO_STANDARD[upper]) {
    return REGIONAL_PORTALS[NEIS_TO_STANDARD[upper]] ?? null;
  }

  // 3) 시도명 (정식/축약) 매칭
  const exact = NAME_TO_STANDARD[key];
  if (exact) return REGIONAL_PORTALS[exact] ?? null;
  for (const [name, std] of Object.entries(NAME_TO_STANDARD)) {
    if (key.includes(name)) return REGIONAL_PORTALS[std] ?? null;
  }

  return null;
}

/**
 * 전국 통합 온라인 공동교육과정 포털 (교실온닷)
 */
export const ONLINE_PORTAL = {
  name: '교실온닷',
  url: 'https://edu.classon.kr',
  description: '17개 시도 통합 온라인 공동교육과정',
} as const;
