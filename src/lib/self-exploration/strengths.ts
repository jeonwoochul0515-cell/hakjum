/**
 * 강점 자가검사 — 한국 청소년 적합 24문항.
 *
 * 학술적 출처:
 * - Peterson, C., & Seligman, M. E. P. (2004). Character Strengths and Virtues: A Handbook and Classification.
 * - VIA(Values In Action) Character Strengths의 24강점을 한국 고등학생 맥락에 맞게 5영역으로 단순화.
 * - Bandura, A. (1997). Self-Efficacy: 학생이 자기 강점을 인지할수록 도전적 학과 선택 가능성이 높아진다는 이론적 근거.
 *
 * 5영역 × 영역당 4~5문항씩 총 24문항. 5점 척도.
 */

export type StrengthArea = 'cognitive' | 'social' | 'execution' | 'creative' | 'emotional';

export interface StrengthQuestion {
  id: string;
  area: StrengthArea;
  /** 강점 라벨 (Top N 강점 추출용) */
  strength: string;
  text: string;
}

export interface StrengthScores {
  cognitive: number;
  social: number;
  execution: number;
  creative: number;
  emotional: number;
}

export interface StrengthsResult {
  /** 영역별 0~100 점수 */
  areas: StrengthScores;
  /** 점수 상위 영역 라벨 (한국어) */
  topAreas: string[];
  /** 응답 점수가 높은 순으로 정렬한 강점 라벨 (Top 5) */
  strengths: string[];
  /** 한 줄 요약 */
  description: string;
  /** 검사 일시 */
  completedAt: string;
}

export const STRENGTH_AREA_META: Record<StrengthArea, { label: string; color: string }> = {
  cognitive: { label: '인지·학습', color: '#1657d6' },
  social: { label: '대인·소통', color: '#0891b2' },
  execution: { label: '실행·끈기', color: '#d97706' },
  creative: { label: '창의·혁신', color: '#7c3aed' },
  emotional: { label: '정서·자기조절', color: '#16a34a' },
};

/** 24문항 — 한국 고등학생 친화 문장 */
export const STRENGTH_QUESTIONS: StrengthQuestion[] = [
  // 인지·학습 (5문항)
  { id: 'CG1', area: 'cognitive', strength: '분석력', text: '복잡한 문제를 단계로 나눠 풀어내는 게 자신 있어요' },
  { id: 'CG2', area: 'cognitive', strength: '호기심', text: '새로운 것을 보면 더 알고 싶어 찾아보는 편이에요' },
  { id: 'CG3', area: 'cognitive', strength: '학습열정', text: '한 번 흥미를 가진 분야는 깊이 공부해보고 싶어져요' },
  { id: 'CG4', area: 'cognitive', strength: '비판적사고', text: '들은 정보를 그대로 믿기보다 근거를 찾아 검토해요' },
  { id: 'CG5', area: 'cognitive', strength: '문제해결력', text: '어려운 과제도 차근차근 방법을 찾아 해결하는 편이에요' },

  // 대인·소통 (5문항)
  { id: 'SO1', area: 'social', strength: '공감력', text: '친구의 표정·말투만으로도 기분을 알아채는 편이에요' },
  { id: 'SO2', area: 'social', strength: '소통력', text: '내 생각을 다른 사람이 이해하기 쉽게 전달할 수 있어요' },
  { id: 'SO3', area: 'social', strength: '협력', text: '팀 활동에서 다른 사람과 호흡 맞춰 일하는 게 즐거워요' },
  { id: 'SO4', area: 'social', strength: '리더십', text: '조별 활동에서 자연스럽게 분위기를 이끌어가는 편이에요' },
  { id: 'SO5', area: 'social', strength: '친절', text: '도움이 필요해 보이는 사람에게 먼저 다가가는 편이에요' },

  // 실행·끈기 (5문항)
  { id: 'EX1', area: 'execution', strength: '책임감', text: '맡은 일은 끝까지 마무리해야 직성이 풀려요' },
  { id: 'EX2', area: 'execution', strength: '끈기', text: '하기 싫어도 해야 할 일은 꾸준히 해내는 편이에요' },
  { id: 'EX3', area: 'execution', strength: '계획성', text: '시험·과제 일정을 미리 계획하고 실천하는 편이에요' },
  { id: 'EX4', area: 'execution', strength: '집중력', text: '하나에 몰입하면 주변이 잘 신경 쓰이지 않아요' },
  { id: 'EX5', area: 'execution', strength: '자기관리', text: '내 컨디션·시간을 스스로 잘 관리하는 편이에요' },

  // 창의·혁신 (5문항)
  { id: 'CR1', area: 'creative', strength: '상상력', text: '평범한 상황에서도 새로운 아이디어가 잘 떠올라요' },
  { id: 'CR2', area: 'creative', strength: '독창성', text: '남들과는 다른 관점으로 문제를 보는 게 자신 있어요' },
  { id: 'CR3', area: 'creative', strength: '미적감각', text: '디자인·색감·구성을 보고 좋고 나쁨을 잘 구분해요' },
  { id: 'CR4', area: 'creative', strength: '도전정신', text: '안 해본 일이라도 일단 시도해보는 편이에요' },
  { id: 'CR5', area: 'creative', strength: '융합력', text: '서로 다른 분야 지식을 연결해서 새로운 답을 찾는 게 즐거워요' },

  // 정서·자기조절 (4문항)
  { id: 'EM1', area: 'emotional', strength: '정서안정', text: '실수해도 너무 자책하지 않고 다시 시도하는 편이에요' },
  { id: 'EM2', area: 'emotional', strength: '회복탄력성', text: '힘든 일이 있어도 비교적 빨리 마음을 추스르는 편이에요' },
  { id: 'EM3', area: 'emotional', strength: '자기인식', text: '내가 어떤 상황에서 스트레스를 받는지 잘 알고 있어요' },
  { id: 'EM4', area: 'emotional', strength: '낙관성', text: '어려운 상황에서도 좋은 면을 찾으려고 노력하는 편이에요' },
];

export const STRENGTHS_SCALE_LABELS = ['전혀 아니다', '아니다', '보통', '그렇다', '매우 그렇다'];

/**
 * 응답을 강점 결과로 계산.
 */
export function calculateStrengths(answers: Record<string, number>): StrengthsResult {
  const sums: StrengthScores = { cognitive: 0, social: 0, execution: 0, creative: 0, emotional: 0 };
  const counts: StrengthScores = { cognitive: 0, social: 0, execution: 0, creative: 0, emotional: 0 };

  for (const q of STRENGTH_QUESTIONS) {
    const v = answers[q.id];
    if (typeof v === 'number' && v >= 1 && v <= 5) {
      sums[q.area] += v;
      counts[q.area] += 1;
    }
  }

  // 0~100 정규화
  const areas: StrengthScores = { cognitive: 0, social: 0, execution: 0, creative: 0, emotional: 0 };
  (Object.keys(sums) as StrengthArea[]).forEach((k) => {
    const n = counts[k] || 1;
    const min = n * 1;
    const max = n * 5;
    areas[k] = Math.round(((sums[k] - min) / (max - min)) * 100);
  });

  // Top 영역 (점수 70 이상 또는 상위 2개)
  const sortedAreas = (Object.keys(areas) as StrengthArea[]).sort((a, b) => areas[b] - areas[a]);
  const topAreas = sortedAreas
    .filter((a) => areas[a] >= 60)
    .slice(0, 3)
    .map((a) => STRENGTH_AREA_META[a].label);
  if (topAreas.length === 0) {
    topAreas.push(STRENGTH_AREA_META[sortedAreas[0]].label);
  }

  // Top 강점 (응답 점수 4~5인 강점만, 점수 내림차순)
  const strengthsRanked = STRENGTH_QUESTIONS
    .map((q) => ({ strength: q.strength, score: answers[q.id] || 0 }))
    .filter((s) => s.score >= 4)
    .sort((a, b) => b.score - a.score);

  // 중복 제거 후 Top 5
  const seen = new Set<string>();
  const strengths: string[] = [];
  for (const s of strengthsRanked) {
    if (!seen.has(s.strength)) {
      seen.add(s.strength);
      strengths.push(s.strength);
    }
    if (strengths.length >= 5) break;
  }
  if (strengths.length === 0) {
    // 모두 3 이하인 경우 — 상위 영역에서 한 강점이라도 선택
    const fallback = STRENGTH_QUESTIONS.find((q) => q.area === sortedAreas[0]);
    if (fallback) strengths.push(fallback.strength);
  }

  const description = `${topAreas.slice(0, 2).join('·')} 영역이 두드러지고, 대표 강점은 ${strengths.slice(0, 3).join('·')}이에요`;

  return {
    areas,
    topAreas,
    strengths,
    description,
    completedAt: new Date().toISOString(),
  };
}

export function isStrengthsComplete(answers: Record<string, number>): boolean {
  return STRENGTH_QUESTIONS.every((q) => typeof answers[q.id] === 'number');
}
