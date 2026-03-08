/**
 * 교과 내용 영역 기반 과목 매칭 시스템
 *
 * 기준: 2022 개정 교육과정
 * 원칙: 과목 이름이 아니라 "실제로 배우는 내용"이 같으면 동일 과목으로 판단
 *
 * 예) "미적분"(2015) = "미적분Ⅰ"(2022) → 둘 다 극한·미분·적분을 배움
 *     "물리학I"(2015) = "물리학"(2022) → 둘 다 역학·열·파동·전자기를 배움
 */

// 교과 내용 영역 (실제로 배우는 것)
type ContentArea = string;

// 내용 영역 → 해당 내용을 배우는 모든 과목명 (2015 + 2022 + NEIS 변형)
const CONTENT_AREAS: Record<ContentArea, string[]> = {
  // ── 수학 ──
  '미적분(극한·미분·적분)': [
    '미적분', '미적분Ⅰ', '미적분I', '미적분1',
  ],
  '심화미적분(다변수·급수)': [
    '미적분Ⅱ', '미적분II', '미적분2',
  ],
  '대수(다항함수·지수로그·삼각함수)': [
    '수학I', '수학Ⅰ', '수학1', '대수',
  ],
  '함수해석(수열·극한기초)': [
    '수학II', '수학Ⅱ', '수학2', '대수', // 대수가 수I+수II 통합 성격
  ],
  '확률·통계': [
    '확률과 통계', '실용 통계',
  ],
  '기하(공간벡터·이차곡선)': [
    '기하',
  ],
  '경제수학': [
    '경제 수학',
  ],
  'AI수학': [
    '인공지능 수학',
  ],

  // ── 과학: 물리 ──
  '물리(역학·열·파동·전자기)': [
    '물리학I', '물리학Ⅰ', '물리학1', '물리학',
  ],
  '심화물리(역학에너지·전자기양자)': [
    '물리학II', '물리학Ⅱ', '물리학2',
    '역학과 에너지', '전자기와 양자',
  ],

  // ── 과학: 화학 ──
  '화학(물질구조·화학반응)': [
    '화학I', '화학Ⅰ', '화학1', '화학',
  ],
  '심화화학(유기·무기·반응속도)': [
    '화학II', '화학Ⅱ', '화학2',
    '물질과 에너지', '화학 반응의 세계',
  ],

  // ── 과학: 생명과학 ──
  '생명과학(세포·유전·생태)': [
    '생명과학I', '생명과학Ⅰ', '생명과학1', '생명과학',
  ],
  '심화생명과학(분자생물·진화)': [
    '생명과학II', '생명과학Ⅱ', '생명과학2',
    '세포와 물질대사', '생물의 유전',
  ],

  // ── 과학: 지구과학 ──
  '지구과학(대기·해양·지질·천문)': [
    '지구과학I', '지구과학Ⅰ', '지구과학1', '지구과학',
  ],
  '심화지구과학(지구시스템·행성)': [
    '지구과학II', '지구과학Ⅱ', '지구과학2',
    '지구시스템과학', '행성우주과학',
  ],

  // ── 국어 ──
  '화법·작문(말하기·글쓰기)': [
    '화법과 작문', '화법과 언어', '독서와 작문',
  ],
  '독서(비문학 읽기·분석)': [
    '독서', '독서와 작문', '주제 탐구 독서',
  ],
  '문학(문학작품 감상·비평)': [
    '문학',
  ],
  '매체·언어(미디어리터러시)': [
    '언어와 매체', '매체 의사소통', '미디어 영어',
  ],

  // ── 영어 ──
  '영어기초(듣기·읽기·문법)': [
    '영어I', '영어Ⅰ',
  ],
  '영어심화(독해·작문)': [
    '영어II', '영어Ⅱ', '영어 독해와 작문',
  ],

  // ── 사회 ──
  '사회·문화(사회현상·제도)': [
    '사회·문화', '사회와 문화',
  ],
  '정치·법(민주주의·법체계)': [
    '정치와 법', '정치', '법과 사회',
  ],
  '경제(시장·재정·국제경제)': [
    '경제', '금융과 경제생활',
  ],
  '윤리사상(동서양윤리)': [
    '윤리와 사상', '인문학과 윤리',
  ],
  '생활윤리(현대윤리문제)': [
    '생활과 윤리', '현대사회와 윤리',
  ],
  '세계사': [
    '세계사', '역사로 탐구하는 현대 세계', '동아시아 역사 기행',
  ],
  '한국사': [
    '한국사',
  ],
  '한국지리': [
    '한국지리', '한국지리 탐구',
  ],
  '세계지리': [
    '세계지리', '세계시민과 지리', '여행지리',
  ],

  // ── 정보·기술 ──
  '정보(프로그래밍·알고리즘)': [
    '정보', '프로그래밍',
  ],
  'AI기초': [
    '인공지능 기초',
  ],
  '데이터과학': [
    '데이터 과학',
  ],

  // ── 예체능 ──
  '미술': ['미술', '미술 창작'],
  '음악': ['음악', '음악 연주와 창작'],
  '체육': ['체육', '운동과 건강', '스포츠 문화', '스포츠 과학'],
};

// 역 매핑: 과목명 → 내용 영역들
const _subjectToAreas = new Map<string, Set<ContentArea>>();

for (const [area, subjects] of Object.entries(CONTENT_AREAS)) {
  for (const subj of subjects) {
    if (!_subjectToAreas.has(subj)) _subjectToAreas.set(subj, new Set());
    _subjectToAreas.get(subj)!.add(area);
  }
}

/** 과목명 → 해당 과목이 다루는 내용 영역들 */
function getContentAreas(subjectName: string): Set<ContentArea> {
  // 정확한 매칭
  const exact = _subjectToAreas.get(subjectName);
  if (exact) return exact;

  // 접미사 제거 후 매칭 (NEIS에서 오는 변형 대응)
  const base = subjectName.replace(/[IⅠⅡ1234]+$/, '').trim();
  for (const [name, areas] of _subjectToAreas.entries()) {
    if (name === base || name.replace(/[IⅠⅡ1234]+$/, '').trim() === base) {
      return areas;
    }
  }

  return new Set();
}

/**
 * 필수/권장 과목이 학교 개설과목에 있는지 내용 기준으로 판단
 *
 * @param required - 요구되는 과목명 (대교협 기준, 2015/2022 이름 모두 가능)
 * @param schoolSubjects - 학교 전체 개설과목 배열
 * @returns 'available' | 'missing' | 'partial'(학교 데이터 없음)
 */
export function checkSubjectAvailability(
  required: string,
  schoolSubjects: string[],
): 'available' | 'missing' | 'partial' {
  if (schoolSubjects.length === 0) return 'partial';

  // 1. 정확한 이름 매칭 (가장 빠름)
  if (schoolSubjects.includes(required)) return 'available';

  // 2. 내용 영역 기반 매칭
  const requiredAreas = getContentAreas(required);
  if (requiredAreas.size > 0) {
    for (const schoolSubj of schoolSubjects) {
      const schoolAreas = getContentAreas(schoolSubj);
      for (const area of requiredAreas) {
        if (schoolAreas.has(area)) return 'available';
      }
    }
  }

  // 3. 포괄적 과목 표현 처리 ("과학I 2과목 이상" 등)
  if (/과학I?\s*\d*과목/.test(required) || /과학\s*(I|Ⅰ)?\s*\d/.test(required)) {
    const scienceAreas = ['물리', '화학', '생명과학', '지구과학'];
    const found = scienceAreas.filter((sci) =>
      schoolSubjects.some((s) => s.includes(sci))
    );
    if (found.length > 0) return 'available';
  }

  if (/사회\s*(교과|과목)?\s*\d/.test(required) || /사회교과/.test(required)) {
    const socialAreas = ['사회', '문화', '정치', '법', '경제', '윤리', '지리', '역사'];
    const found = socialAreas.filter((soc) =>
      schoolSubjects.some((s) => s.includes(soc))
    );
    if (found.length > 0) return 'available';
  }

  // 4. 부분 문자열 매칭 (위에서 안 잡힌 경우 최후 수단)
  const base = required.replace(/[IⅠⅡ1234]+$/, '').trim();
  if (base.length >= 2 && schoolSubjects.some((s) => s.includes(base) || base.includes(s))) {
    return 'available';
  }

  return 'missing';
}

/**
 * 폴백 엔진용: 과목명이 학교 개설과목 중 어떤 것과 매칭되는지 찾기
 * 내용이 같은 과목의 학교 측 이름을 반환
 */
export function findMatchingSubject(subjectName: string, schoolSubjects: string[]): string | null {
  // 정확한 매칭
  if (schoolSubjects.includes(subjectName)) return subjectName;

  // 내용 영역 기반 매칭
  const requiredAreas = getContentAreas(subjectName);
  if (requiredAreas.size > 0) {
    for (const schoolSubj of schoolSubjects) {
      const schoolAreas = getContentAreas(schoolSubj);
      for (const area of requiredAreas) {
        if (schoolAreas.has(area)) return schoolSubj;
      }
    }
  }

  // 부분 문자열 매칭
  const base = subjectName.replace(/[IⅠⅡ1234]+$/, '').trim();
  const match = schoolSubjects.find((s) => s.includes(base) || base.includes(s));
  return match || null;
}
