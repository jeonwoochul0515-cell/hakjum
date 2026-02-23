import type { WizardState, RecommendationResult, SubjectRecommendation } from '@/types';

const careerKeywords: Record<string, { keywords: string[]; essential: string[]; recommended: string[] }> = {
  '이공계열': {
    keywords: ['이공', '공학', '과학', '수학', '물리', '화학'],
    essential: ['수학Ⅰ', '수학Ⅱ', '미적분', '물리학Ⅰ', '화학Ⅰ'],
    recommended: ['물리학Ⅱ', '화학Ⅱ', '확률과 통계', '기하', '심화 수학Ⅰ'],
  },
  '의약계열': {
    keywords: ['의학', '약학', '간호', '의대', '생명', '바이오'],
    essential: ['생명과학Ⅰ', '화학Ⅰ', '수학Ⅰ', '수학Ⅱ'],
    recommended: ['생명과학Ⅱ', '화학Ⅱ', '미적분', '확률과 통계', '생활과 과학'],
  },
  '인문계열': {
    keywords: ['인문', '문학', '철학', '역사', '국어', '한국어'],
    essential: ['문학', '화법과 작문', '언어와 매체', '독서'],
    recommended: ['윤리와 사상', '한국사', '세계사', '고전 읽기', '논술'],
  },
  '사회계열': {
    keywords: ['사회', '정치', '법', '행정', '외교'],
    essential: ['사회·문화', '정치와 법', '한국사'],
    recommended: ['세계지리', '윤리와 사상', '경제', '사회문제 탐구', '논술'],
  },
  '예체능계열': {
    keywords: ['예술', '음악', '미술', '체육', '디자인', '스포츠'],
    essential: ['미술', '음악', '체육1', '운동과 건강'],
    recommended: ['스포츠 생활', '미술 감상과 비평', '음악 감상과 비평'],
  },
  '교육계열': {
    keywords: ['교육', '교사', '사범', '교직'],
    essential: ['문학', '화법과 작문', '수학Ⅰ', '영어Ⅰ'],
    recommended: ['윤리와 사상', '사회·문화', '심리학', '교육학', '논술'],
  },
  '경영/경제': {
    keywords: ['경영', '경제', '금융', '마케팅', '회계', '상경'],
    essential: ['경제', '수학Ⅰ', '사회·문화', '영어Ⅰ'],
    recommended: ['수학Ⅱ', '확률과 통계', '경제 수학', '정치와 법', '논술'],
  },
  'IT/SW': {
    keywords: ['IT', 'SW', '소프트웨어', '프로그래밍', 'AI', '컴퓨터', '정보', '인공지능'],
    essential: ['정보', '수학Ⅰ', '수학Ⅱ', '미적분'],
    recommended: ['확률과 통계', '물리학Ⅰ', '인공지능 기초', '프로그래밍', '심화 수학Ⅰ'],
  },
  '자연과학': {
    keywords: ['자연', '생물', '지구', '환경', '천문'],
    essential: ['물리학Ⅰ', '화학Ⅰ', '생명과학Ⅰ', '지구과학Ⅰ'],
    recommended: ['수학Ⅱ', '미적분', '과학사', '융합과학', '생활과 과학'],
  },
  '공학/기술': {
    keywords: ['공학', '기술', '건축', '전자', '기계', '로봇'],
    essential: ['물리학Ⅰ', '수학Ⅰ', '수학Ⅱ', '미적분'],
    recommended: ['물리학Ⅱ', '화학Ⅰ', '정보', '기하', '공학 일반'],
  },
};

function matchCategories(careerGoal: string, tags: string[]): string[] {
  const matched: string[] = [];

  for (const [category, config] of Object.entries(careerKeywords)) {
    if (tags.includes(category)) {
      matched.push(category);
      continue;
    }
    if (careerGoal && config.keywords.some((kw) => careerGoal.toLowerCase().includes(kw.toLowerCase()))) {
      matched.push(category);
    }
  }

  return matched.length > 0 ? matched : ['이공계열'];
}

function filterAvailable(subjects: string[], available: string[]): SubjectRecommendation[] {
  return subjects
    .filter((s) => available.some((a) => a.includes(s) || s.includes(a)))
    .map((name) => ({
      name: available.find((a) => a.includes(name) || name.includes(a)) || name,
      reason: '해당 진로 분야에 도움이 되는 과목입니다',
    }));
}

export function fallbackRecommend(state: WizardState): RecommendationResult {
  const { school, grade, careerGoal, tags } = state;
  if (!school) throw new Error('School required');

  const available = [
    ...(school.subjectsByGrade[grade] || []),
    ...school.allSubjects,
  ];
  const uniqueAvailable = [...new Set(available)];

  const categories = matchCategories(careerGoal, tags);

  const essentialSet = new Set<string>();
  const recommendedSet = new Set<string>();

  for (const cat of categories) {
    const config = careerKeywords[cat];
    if (!config) continue;
    config.essential.forEach((s) => essentialSet.add(s));
    config.recommended.forEach((s) => recommendedSet.add(s));
  }

  const essentialSubjects = filterAvailable([...essentialSet], uniqueAvailable).slice(0, 5);
  const recommendedSubjects = filterAvailable(
    [...recommendedSet].filter((s) => !essentialSet.has(s)),
    uniqueAvailable
  ).slice(0, 5);

  // Remaining available subjects as consider/optional
  const usedNames = new Set([
    ...essentialSubjects.map((s) => s.name),
    ...recommendedSubjects.map((s) => s.name),
  ]);

  const gradeSubjects = (school.subjectsByGrade[grade] || [])
    .filter((s) => !usedNames.has(s) && !s.includes('활동') && !s.includes('자율'))
    .map((name) => ({ name, reason: '해당 학년 개설과목입니다' }));

  return {
    tiers: [
      { tier: 'essential', label: '필수 과목', subjects: essentialSubjects },
      { tier: 'strongly_recommended', label: '적극 추천', subjects: recommendedSubjects },
      { tier: 'consider', label: '고려 과목', subjects: gradeSubjects.slice(0, 4) },
      { tier: 'optional', label: '후순위', subjects: gradeSubjects.slice(4, 7) },
    ],
    strategy: `${categories.join(', ')} 분야 진학을 위해 관련 핵심 과목을 우선 수강하고, 학교에서 제공하는 선택과목을 전략적으로 활용하는 것을 권장합니다.`,
    source: 'fallback',
  };
}
