import type { WizardState, RecommendationResult, SubjectRecommendation } from '@/types';

interface CategoryConfig {
  keywords: string[];
  essential: string[];
  recommended: string[];
  reasons: Record<string, string>;
}

const careerKeywords: Record<string, CategoryConfig> = {
  '이공계열': {
    keywords: ['이공', '공학', '과학', '수학'],
    essential: ['수학Ⅰ', '수학Ⅱ', '미적분', '물리학Ⅰ', '화학Ⅰ'],
    recommended: ['물리학Ⅱ', '화학Ⅱ', '확률과 통계', '기하', '심화 수학Ⅰ'],
    reasons: {
      '수학Ⅰ': '이공계열 기초 수리 역량에 필수적인 과목입니다',
      '수학Ⅱ': '미적분 기반의 공학 사고력 형성에 중요합니다',
      '미적분': '공학·자연과학 전공 수학의 핵심입니다',
      '물리학Ⅰ': '자연현상의 원리를 이해하는 기초 과목입니다',
      '화학Ⅰ': '물질의 성질과 변화를 다루는 필수 과목입니다',
      '물리학Ⅱ': '심화된 물리 개념으로 전공 적응력을 높여줍니다',
      '화학Ⅱ': '화학 반응의 원리를 깊이 이해할 수 있습니다',
      '확률과 통계': '데이터 분석과 실험 설계에 필요합니다',
      '기하': '공간 추론 능력을 키워 공학에 활용됩니다',
    },
  },
  '의약계열': {
    keywords: ['의학', '약학', '간호', '의대', '생명', '바이오', '의사', '약사', '치과', '한의', '물리치료', '재활', '보건', '치료', '임상', '의료', '병원'],
    essential: ['생명과학Ⅰ', '화학Ⅰ', '수학Ⅰ', '수학Ⅱ'],
    recommended: ['생명과학Ⅱ', '화학Ⅱ', '미적분', '확률과 통계', '물리학Ⅰ'],
    reasons: {
      '생명과학Ⅰ': '인체와 생명현상의 기초를 배우는 핵심 과목입니다',
      '화학Ⅰ': '약물 작용과 생화학 반응 이해에 필수입니다',
      '수학Ⅰ': '의약계열 입시에서 수학 성적이 중요합니다',
      '수학Ⅱ': '과학적 사고와 논리적 분석력의 기반입니다',
      '생명과학Ⅱ': '세포·유전·진화 심화 학습으로 전공 기초를 다집니다',
      '화학Ⅱ': '유기화학·생화학 기초로 전공 적응력을 높입니다',
      '미적분': '의학통계와 연구 방법론에 활용됩니다',
      '확률과 통계': '임상 연구와 의학 통계의 기초입니다',
      '물리학Ⅰ': '물리치료·영상의학 등 의료물리 기초입니다',
    },
  },
  '인문계열': {
    keywords: ['인문', '문학', '철학', '역사', '국어', '한국어', '어문', '언어'],
    essential: ['문학', '화법과 작문', '언어와 매체', '독서'],
    recommended: ['윤리와 사상', '한국사', '세계사', '고전 읽기', '논술'],
    reasons: {
      '문학': '텍스트 분석과 비판적 사고력의 핵심입니다',
      '화법과 작문': '논리적 글쓰기와 발표 역량을 키웁니다',
      '언어와 매체': '언어 구조와 미디어 리터러시를 배웁니다',
      '독서': '다양한 분야의 독해력과 사고력을 확장합니다',
      '윤리와 사상': '인문학적 사유의 깊이를 더합니다',
      '한국사': '역사적 맥락 이해로 인문 소양을 넓힙니다',
    },
  },
  '사회계열': {
    keywords: ['사회', '정치', '법', '행정', '외교', '공무원', '공공'],
    essential: ['사회·문화', '정치와 법', '한국사'],
    recommended: ['세계지리', '윤리와 사상', '경제', '사회문제 탐구', '논술'],
    reasons: {
      '사회·문화': '사회 현상을 체계적으로 분석하는 기초입니다',
      '정치와 법': '법과 제도의 원리를 이해하는 핵심 과목입니다',
      '한국사': '역사적 맥락에서 사회 변화를 이해합니다',
      '경제': '경제 원리와 정책을 분석하는 역량을 키웁니다',
    },
  },
  '예체능계열': {
    keywords: ['예술', '음악', '미술', '체육', '디자인', '스포츠', '무용', '연기'],
    essential: ['미술', '음악', '체육', '운동과 건강'],
    recommended: ['스포츠 생활', '미술 감상과 비평', '음악 감상과 비평', '미술 창작'],
    reasons: {
      '미술': '시각적 표현력과 창의성의 기초입니다',
      '음악': '음악적 감수성과 이론적 기초를 다집니다',
      '체육': '신체 능력과 스포츠 과학의 기초입니다',
      '운동과 건강': '신체 활동과 건강관리 역량을 키웁니다',
    },
  },
  '교육계열': {
    keywords: ['교육', '교사', '사범', '교직', '선생님', '가르치'],
    essential: ['문학', '화법과 작문', '수학Ⅰ', '영어Ⅰ'],
    recommended: ['윤리와 사상', '사회·문화', '심리학', '교육학', '논술'],
    reasons: {
      '문학': '국어 교육의 핵심 영역으로 필수적입니다',
      '화법과 작문': '의사소통 능력과 교수법의 기초입니다',
      '수학Ⅰ': '논리적 사고와 교육과정 이해에 중요합니다',
      '영어Ⅰ': '외국어 역량과 교양 확장에 도움됩니다',
    },
  },
  '경영/경제': {
    keywords: ['경영', '경제', '금융', '마케팅', '회계', '상경', '무역', '통상'],
    essential: ['경제', '수학Ⅰ', '사회·문화', '영어Ⅰ'],
    recommended: ['수학Ⅱ', '확률과 통계', '경제 수학', '정치와 법', '논술'],
    reasons: {
      '경제': '시장 원리와 경제 분석의 핵심 과목입니다',
      '수학Ⅰ': '경영·경제 분석의 수리적 기반입니다',
      '사회·문화': '사회 현상과 소비자 행동을 이해합니다',
      '영어Ⅰ': '국제 비즈니스와 원서 독해에 필수입니다',
    },
  },
  'IT/SW': {
    keywords: ['IT', 'SW', '소프트웨어', '프로그래밍', 'AI', '컴퓨터', '정보', '인공지능', '코딩', '개발'],
    essential: ['정보', '수학Ⅰ', '수학Ⅱ', '미적분'],
    recommended: ['확률과 통계', '물리학Ⅰ', '인공지능 기초', '프로그래밍', '심화 수학Ⅰ'],
    reasons: {
      '정보': '프로그래밍과 알고리즘의 기초를 배웁니다',
      '수학Ⅰ': '논리적 사고와 알고리즘 설계의 기반입니다',
      '수학Ⅱ': '수학적 모델링과 최적화에 활용됩니다',
      '미적분': 'AI·머신러닝의 수학적 기초입니다',
      '확률과 통계': '데이터 분석과 AI 모델 이해에 필수입니다',
    },
  },
  '자연과학': {
    keywords: ['자연', '생물', '지구', '환경', '천문', '생태'],
    essential: ['물리학Ⅰ', '화학Ⅰ', '생명과학Ⅰ', '지구과학Ⅰ'],
    recommended: ['수학Ⅱ', '미적분', '과학사', '융합과학', '생활과 과학'],
    reasons: {
      '물리학Ⅰ': '자연현상의 물리적 원리를 탐구합니다',
      '화학Ⅰ': '물질의 구조와 반응 원리를 이해합니다',
      '생명과학Ⅰ': '생명현상의 기본 원리를 학습합니다',
      '지구과학Ⅰ': '지구 시스템과 우주를 이해합니다',
    },
  },
  '공학/기술': {
    keywords: ['공학', '기술', '건축', '전자', '기계', '로봇', '전기', '토목'],
    essential: ['물리학Ⅰ', '수학Ⅰ', '수학Ⅱ', '미적분'],
    recommended: ['물리학Ⅱ', '화학Ⅰ', '정보', '기하', '공학 일반'],
    reasons: {
      '물리학Ⅰ': '공학의 근본 원리인 역학·전기 기초입니다',
      '수학Ⅰ': '공학 계산과 모델링의 기반입니다',
      '수학Ⅱ': '심화 공학 수학으로 전공 적응에 중요합니다',
      '미적분': '공학 전공 수학의 핵심입니다',
    },
  },
};

function matchCategories(careerGoal: string, tags: string[]): string[] {
  const matched: string[] = [];
  const goal = careerGoal.toLowerCase();

  for (const [category, config] of Object.entries(careerKeywords)) {
    if (tags.includes(category)) {
      matched.push(category);
      continue;
    }
    if (careerGoal && config.keywords.some((kw) => goal.includes(kw.toLowerCase()))) {
      matched.push(category);
    }
  }

  return matched.length > 0 ? matched : ['이공계열'];
}

function findAvailable(subjectName: string, available: string[]): string | null {
  // 정확히 일치
  if (available.includes(subjectName)) return subjectName;
  // 부분 포함 매칭
  const match = available.find((a) => a.includes(subjectName) || subjectName.includes(a));
  return match || null;
}

function getReason(subjectName: string, categories: string[]): string {
  for (const cat of categories) {
    const config = careerKeywords[cat];
    if (config?.reasons[subjectName]) return config.reasons[subjectName];
  }
  return `${categories[0] || '관련'} 진학에 도움이 되는 과목입니다`;
}

export function fallbackRecommend(state: WizardState): RecommendationResult {
  const { school, grade, careerGoal, tags, targetMajor } = state;
  if (!school) throw new Error('School required');

  const gradeSubjects = school.subjectsByGrade[grade] || [];
  const allSubjects = school.allSubjects;
  const uniqueAvailable = [...new Set([...gradeSubjects, ...allSubjects])];

  // targetMajor 관련 과목도 매칭에 활용
  const categories = matchCategories(careerGoal, tags);

  // 필수/추천 과목 수집 (중복 제거)
  const essentialCandidates: string[] = [];
  const recommendedCandidates: string[] = [];

  // targetMajor가 있으면 그 과목을 최우선
  if (targetMajor) {
    const majorSubjects = [
      ...targetMajor.relateSubject.common.split(',').map((s) => s.trim()),
      ...targetMajor.relateSubject.general.split(',').map((s) => s.trim()),
    ].filter(Boolean);
    const careerSubjects = [
      ...targetMajor.relateSubject.career.split(',').map((s) => s.trim()),
      ...(targetMajor.relateSubject.professional || '').split(',').map((s) => s.trim()),
    ].filter(Boolean);
    essentialCandidates.push(...majorSubjects);
    recommendedCandidates.push(...careerSubjects);
  }

  for (const cat of categories) {
    const config = careerKeywords[cat];
    if (!config) continue;
    essentialCandidates.push(...config.essential);
    recommendedCandidates.push(...config.recommended);
  }

  // 중복 제거하며 available 과목만 필터
  const usedNames = new Set<string>();

  const essentialSubjects: SubjectRecommendation[] = [];
  for (const name of essentialCandidates) {
    if (usedNames.has(name)) continue;
    const found = findAvailable(name, uniqueAvailable);
    if (!found || usedNames.has(found)) continue;
    usedNames.add(name);
    usedNames.add(found);
    essentialSubjects.push({
      name: found,
      reason: getReason(name, categories),
    });
    if (essentialSubjects.length >= 5) break;
  }

  const recommendedSubjects: SubjectRecommendation[] = [];
  for (const name of recommendedCandidates) {
    if (usedNames.has(name)) continue;
    const found = findAvailable(name, uniqueAvailable);
    if (!found || usedNames.has(found)) continue;
    usedNames.add(name);
    usedNames.add(found);
    recommendedSubjects.push({
      name: found,
      reason: getReason(name, categories),
    });
    if (recommendedSubjects.length >= 5) break;
  }

  // 남은 과목 중 관련성 있는 것 우선 (과학/수학 관련 키워드)
  const relevantKeywords = categories.some((c) =>
    ['이공계열', '의약계열', '자연과학', '공학/기술', 'IT/SW'].includes(c)
  )
    ? ['과학', '수학', '물리', '화학', '생명', '생활과 과학', '정보', '통계']
    : ['사회', '문화', '윤리', '역사', '경제', '문학', '영어', '독서', '논술'];

  const gradeFiltered = gradeSubjects
    .filter((s) => !usedNames.has(s) && !s.includes('활동') && !s.includes('자율') && !s.includes('창의적'));

  // 관련 과목을 먼저, 무관한 과목은 후순위
  const relevant = gradeFiltered.filter((s) => relevantKeywords.some((kw) => s.includes(kw)));
  const others = gradeFiltered.filter((s) => !relevantKeywords.some((kw) => s.includes(kw)));
  const sortedRemaining = [...relevant, ...others];

  const considerSubjects = sortedRemaining.slice(0, 4).map((name) => ({
    name,
    reason: relevant.includes(name)
      ? `${categories[0]} 관련 보조 과목으로 도움이 됩니다`
      : `${grade} 개설과목으로 교양을 넓혀줍니다`,
  }));

  const optionalSubjects = sortedRemaining.slice(4, 7).map((name) => ({
    name,
    reason: `${grade} 개설과목으로 다양한 학습 경험을 제공합니다`,
  }));

  const majorLabel = targetMajor ? targetMajor.name : categories.join(', ');

  return {
    tiers: [
      { tier: 'essential', label: '필수 과목', subjects: essentialSubjects },
      { tier: 'strongly_recommended', label: '적극 추천', subjects: recommendedSubjects },
      { tier: 'consider', label: '고려 과목', subjects: considerSubjects },
      { tier: 'optional', label: '후순위', subjects: optionalSubjects },
    ],
    strategy: `${majorLabel} 진학을 위해 핵심 과목을 우선 수강하세요. ${school.name}에서 제공하는 선택과목을 전략적으로 활용하여 전공 적합성을 높이는 것이 중요합니다.`,
    source: 'fallback',
  };
}
