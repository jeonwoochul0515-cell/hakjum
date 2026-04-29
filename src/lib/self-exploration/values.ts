/**
 * 가치관 자가검사 — 직업 가치관 6축, 18문항.
 *
 * 학술적 출처:
 * - Schwartz, S. H. (1992). Universals in the content and structure of values.
 * - 한국직업능력연구원 직업가치관검사의 6축을 단순화: 안정·성취·자율·창의·봉사·관계.
 *
 * 가치관 일치도가 직업 만족도에 영향을 준다는 이론적 근거에 따라,
 * 학생의 상위 3가치 + 가치관 갈등(상충) 가능성을 분석한다.
 *
 * 6축 × 3문항 = 18문항. 5점 척도.
 */

export type ValueAxis = 'stability' | 'achievement' | 'autonomy' | 'creativity' | 'service' | 'relationship';

export interface ValueQuestion {
  id: string;
  axis: ValueAxis;
  text: string;
}

export interface ValueScores {
  stability: number;
  achievement: number;
  autonomy: number;
  creativity: number;
  service: number;
  relationship: number;
}

export interface ValuesResult {
  /** 6축 0~100 점수 */
  axes: ValueScores;
  /** 상위 3가치 (한국어 라벨) */
  topValues: string[];
  /** 가치관 갈등 가능성 (예: '안정' vs '도전' 동시 상위) */
  conflicts: string[];
  /** 한 줄 요약 */
  description: string;
  /** 검사 일시 */
  completedAt: string;
}

export const VALUE_META: Record<ValueAxis, { label: string; ko: string; color: string; oppositeOf?: ValueAxis }> = {
  stability: { label: 'Stability', ko: '안정', color: '#0891b2' },
  achievement: { label: 'Achievement', ko: '성취', color: '#d97706' },
  autonomy: { label: 'Autonomy', ko: '자율', color: '#1657d6' },
  creativity: { label: 'Creativity', ko: '창의', color: '#7c3aed' },
  service: { label: 'Service', ko: '봉사', color: '#16a34a' },
  relationship: { label: 'Relationship', ko: '관계', color: '#db2777' },
};

/** 18문항 — 한국 고등학생 친화 문장 */
export const VALUE_QUESTIONS: ValueQuestion[] = [
  // 안정 (3문항)
  { id: 'ST1', axis: 'stability', text: '예측 가능하고 안정적인 환경에서 일하는 게 중요해요' },
  { id: 'ST2', axis: 'stability', text: '경제적으로 보장된 직업을 갖는 게 중요해요' },
  { id: 'ST3', axis: 'stability', text: '큰 변화나 위험 없이 꾸준히 일할 수 있는 게 좋아요' },

  // 성취 (3문항)
  { id: 'AC1', axis: 'achievement', text: '내 분야에서 최고 수준에 도달하는 게 중요해요' },
  { id: 'AC2', axis: 'achievement', text: '목표를 달성해 인정받는 데서 큰 보람을 느껴요' },
  { id: 'AC3', axis: 'achievement', text: '도전적인 과제를 해결해내는 게 무엇보다 중요해요' },

  // 자율 (3문항)
  { id: 'AU1', axis: 'autonomy', text: '내 일정·내 방식대로 일하고 싶어요' },
  { id: 'AU2', axis: 'autonomy', text: '상사나 정해진 규칙에 구속받지 않고 스스로 결정하고 싶어요' },
  { id: 'AU3', axis: 'autonomy', text: '내가 하고 싶은 일을 자유롭게 선택할 수 있는 환경이 중요해요' },

  // 창의 (3문항)
  { id: 'CR1', axis: 'creativity', text: '새로운 것을 만들어내는 일을 하고 싶어요' },
  { id: 'CR2', axis: 'creativity', text: '반복적인 일보다 매번 다른 도전을 하는 게 좋아요' },
  { id: 'CR3', axis: 'creativity', text: '내 아이디어를 자유롭게 표현할 수 있는 직업이 매력적이에요' },

  // 봉사 (3문항)
  { id: 'SV1', axis: 'service', text: '다른 사람을 돕고 사회에 기여하는 일이 중요해요' },
  { id: 'SV2', axis: 'service', text: '내가 한 일이 누군가에게 도움이 되어야 보람을 느껴요' },
  { id: 'SV3', axis: 'service', text: '돈보다는 사회적 가치가 있는 일을 하고 싶어요' },

  // 관계 (3문항)
  { id: 'RE1', axis: 'relationship', text: '함께 일하는 동료들과 좋은 관계를 맺는 게 중요해요' },
  { id: 'RE2', axis: 'relationship', text: '혼자 일하는 것보다 사람들과 어울려 일하는 게 좋아요' },
  { id: 'RE3', axis: 'relationship', text: '직장의 분위기·인간관계가 일의 내용만큼 중요해요' },
];

export const VALUES_SCALE_LABELS = ['전혀 아니다', '아니다', '보통', '그렇다', '매우 그렇다'];

/** 가치관 상충 페어 — 동시 상위인 경우 갈등 가능성을 안내 */
const CONFLICT_PAIRS: { a: ValueAxis; b: ValueAxis; message: string }[] = [
  { a: 'stability', b: 'creativity', message: '안정 vs 창의 — 안정적 직업과 새로운 시도를 동시에 원해요. 안정 분야 안에서 혁신할 수 있는 경로(예: 공무원 데이터 분석, 대기업 R&D)를 고려해보세요.' },
  { a: 'stability', b: 'autonomy', message: '안정 vs 자율 — 보장된 환경과 자유로운 결정을 동시에 원해요. 전문직(약사·회계사)이나 안정적 프리랜서 경로를 살펴보세요.' },
  { a: 'achievement', b: 'relationship', message: '성취 vs 관계 — 경쟁과 인간관계가 모두 중요해요. 협업이 핵심인 성취 환경(컨설팅·교육·의료팀)이 잘 맞을 수 있어요.' },
  { a: 'service', b: 'achievement', message: '봉사 vs 성취 — 사회 기여와 개인 성취 모두 중요해요. 사회적 임팩트가 큰 전문직(의료·교육·정책 연구)이 어울려요.' },
];

export function calculateValues(answers: Record<string, number>): ValuesResult {
  const sums: ValueScores = { stability: 0, achievement: 0, autonomy: 0, creativity: 0, service: 0, relationship: 0 };
  const counts: ValueScores = { stability: 0, achievement: 0, autonomy: 0, creativity: 0, service: 0, relationship: 0 };

  for (const q of VALUE_QUESTIONS) {
    const v = answers[q.id];
    if (typeof v === 'number' && v >= 1 && v <= 5) {
      sums[q.axis] += v;
      counts[q.axis] += 1;
    }
  }

  const axes: ValueScores = { stability: 0, achievement: 0, autonomy: 0, creativity: 0, service: 0, relationship: 0 };
  (Object.keys(sums) as ValueAxis[]).forEach((k) => {
    const n = counts[k] || 1;
    const min = n * 1;
    const max = n * 5;
    axes[k] = Math.round(((sums[k] - min) / (max - min)) * 100);
  });

  // Top 3
  const sorted = (Object.keys(axes) as ValueAxis[]).sort((a, b) => axes[b] - axes[a]);
  const topValues = sorted.slice(0, 3).map((a) => VALUE_META[a].ko);

  // Conflicts: 상위 3 안에 갈등 페어가 모두 들어있고 둘 다 60+ 이면 안내
  const top3 = new Set(sorted.slice(0, 3));
  const conflicts: string[] = [];
  for (const pair of CONFLICT_PAIRS) {
    if (top3.has(pair.a) && top3.has(pair.b) && axes[pair.a] >= 60 && axes[pair.b] >= 60) {
      conflicts.push(pair.message);
    }
  }

  const description = `가장 중요한 직업 가치는 ${topValues.join('·')}이에요`;

  return {
    axes,
    topValues,
    conflicts,
    description,
    completedAt: new Date().toISOString(),
  };
}

export function isValuesComplete(answers: Record<string, number>): boolean {
  return VALUE_QUESTIONS.every((q) => typeof answers[q.id] === 'number');
}
