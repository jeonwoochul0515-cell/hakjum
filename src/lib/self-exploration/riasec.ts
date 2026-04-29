/**
 * RIASEC 자가검사 (Holland 6유형 기반).
 *
 * 학술적 출처:
 * - Holland, J. L. (1997). Making Vocational Choices: A Theory of Vocational Personalities and Work Environments.
 * - 한국직업능력연구원 커리어넷 직업흥미검사(K형) — 본 검사는 비공식 단순화 버전입니다.
 *
 * 6유형: Realistic(실재형), Investigative(탐구형), Artistic(예술형),
 *         Social(사회형), Enterprising(기업형), Conventional(관습형).
 *
 * 문항: 6유형 × 5문항 = 총 30문항. 5점 척도(1=전혀 아니다 ~ 5=매우 그렇다).
 */

export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RiasecQuestion {
  id: string;
  type: RiasecType;
  text: string;
}

export interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface RiasecResult {
  /** 6유형 원점수 합계 (각 유형 5문항 × 1~5점, 5~25점) */
  scores: RiasecScores;
  /** 6유형 0~100 정규화 점수 (UI 시각화용) */
  types: RiasecScores;
  /** 1순위 유형 */
  primaryType: RiasecType;
  /** 2순위 유형 */
  secondaryType: RiasecType;
  /** 3순위 유형 */
  tertiaryType: RiasecType;
  /** 한국어 한 줄 요약 */
  description: string;
  /** 검사 일시 (ISO) */
  completedAt: string;
}

/** 6유형 한국어 라벨 + 설명 */
export const RIASEC_META: Record<RiasecType, { label: string; ko: string; short: string; color: string }> = {
  R: { label: 'Realistic', ko: '실재형', short: '손과 도구로 만들고 움직이는 활동을 좋아해요', color: '#1657d6' },
  I: { label: 'Investigative', ko: '탐구형', short: '관찰하고 분석해 원리를 알아내는 활동을 좋아해요', color: '#1457a8' },
  A: { label: 'Artistic', ko: '예술형', short: '창의적으로 표현하고 새로운 아이디어를 내는 활동을 좋아해요', color: '#7c3aed' },
  S: { label: 'Social', ko: '사회형', short: '사람을 돕고 가르치고 소통하는 활동을 좋아해요', color: '#0891b2' },
  E: { label: 'Enterprising', ko: '기업형', short: '리드하고 설득하고 목표를 달성하는 활동을 좋아해요', color: '#d97706' },
  C: { label: 'Conventional', ko: '관습형', short: '체계적으로 정리하고 규칙을 지키는 활동을 좋아해요', color: '#475569' },
};

/** 30문항 — 한국 고등학생 친화 문장 (존댓말 + 친근) */
export const RIASEC_QUESTIONS: RiasecQuestion[] = [
  // R 실재형
  { id: 'R1', type: 'R', text: '몸을 움직이거나 도구를 다루는 활동이 즐거워요' },
  { id: 'R2', type: 'R', text: '기계·전자제품의 작동 원리가 궁금해서 분해해보고 싶어요' },
  { id: 'R3', type: 'R', text: '레고·공예·DIY처럼 직접 만드는 활동을 좋아해요' },
  { id: 'R4', type: 'R', text: '운동·등산·캠핑처럼 야외에서 활동하는 것이 편해요' },
  { id: 'R5', type: 'R', text: '말보다는 손으로 보여주는 게 더 자신 있어요' },

  // I 탐구형
  { id: 'I1', type: 'I', text: '복잡한 문제를 끝까지 파고들어 답을 찾는 게 흥미로워요' },
  { id: 'I2', type: 'I', text: '과학·수학 다큐멘터리나 책을 읽으면 시간 가는 줄 몰라요' },
  { id: 'I3', type: 'I', text: '실험하고 데이터를 분석하는 활동이 재미있어요' },
  { id: 'I4', type: 'I', text: '왜 그런지 이유를 끝까지 따져보는 편이에요' },
  { id: 'I5', type: 'I', text: '새로운 지식을 혼자서도 깊이 공부하는 게 즐거워요' },

  // A 예술형
  { id: 'A1', type: 'A', text: '글짓기·그림 그리기·음악 같은 창작 활동이 즐거워요' },
  { id: 'A2', type: 'A', text: '나만의 스타일·아이디어로 표현하는 게 자신 있어요' },
  { id: 'A3', type: 'A', text: '정해진 규칙보다는 자유롭게 상상하는 것을 더 좋아해요' },
  { id: 'A4', type: 'A', text: '감정과 분위기를 작품·글·영상으로 담아내고 싶어요' },
  { id: 'A5', type: 'A', text: '미술관·공연·영화에서 큰 영감을 받아요' },

  // S 사회형
  { id: 'S1', type: 'S', text: '친구·후배가 어려워하면 먼저 도와주고 싶어요' },
  { id: 'S2', type: 'S', text: '내가 아는 것을 알기 쉽게 설명해주는 일이 즐거워요' },
  { id: 'S3', type: 'S', text: '사람들의 이야기를 잘 들어주는 편이에요' },
  { id: 'S4', type: 'S', text: '봉사활동·기부·동아리에서 보람을 자주 느껴요' },
  { id: 'S5', type: 'S', text: '갈등이 생기면 중재해서 분위기를 풀어주는 편이에요' },

  // E 기업형
  { id: 'E1', type: 'E', text: '조별 활동에서 리더 역할을 맡는 게 부담되지 않아요' },
  { id: 'E2', type: 'E', text: '내 의견을 설득력 있게 말해서 사람들이 따라오게 만들고 싶어요' },
  { id: 'E3', type: 'E', text: '경쟁이 있는 상황이 지루하지 않고 오히려 자극이 돼요' },
  { id: 'E4', type: 'E', text: '새로운 기획이나 사업 아이디어를 떠올리는 게 즐거워요' },
  { id: 'E5', type: 'E', text: '도전적인 목표를 세우고 달성해내는 데서 성취감을 느껴요' },

  // C 관습형
  { id: 'C1', type: 'C', text: '계획을 세우고 일정대로 일을 처리하는 게 편해요' },
  { id: 'C2', type: 'C', text: '자료·노트·파일을 깔끔하게 정리해두는 것을 좋아해요' },
  { id: 'C3', type: 'C', text: '규칙과 절차를 정확하게 지키는 편이에요' },
  { id: 'C4', type: 'C', text: '숫자·표·통계를 다루는 활동이 어렵지 않아요' },
  { id: 'C5', type: 'C', text: '꼼꼼하게 확인하고 실수를 줄이는 일을 잘해요' },
];

export const RIASEC_SCALE_LABELS = ['전혀 아니다', '아니다', '보통', '그렇다', '매우 그렇다'];

/**
 * 응답을 RIASEC 결과로 계산.
 * @param answers 문항 id → 1~5점 (모든 문항 응답 필요)
 */
export function calculateRiasecResult(answers: Record<string, number>): RiasecResult {
  const sums: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const q of RIASEC_QUESTIONS) {
    const v = answers[q.id];
    if (typeof v === 'number' && v >= 1 && v <= 5) {
      sums[q.type] += v;
      counts[q.type] += 1;
    }
  }

  // 0~100 정규화: (합계 - 최소) / (최대 - 최소) * 100
  // 각 유형 5문항 × 1~5 = 5~25점
  const types: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  (Object.keys(sums) as RiasecType[]).forEach((k) => {
    const n = counts[k] || 1;
    const min = n * 1;
    const max = n * 5;
    types[k] = Math.round(((sums[k] - min) / (max - min)) * 100);
  });

  const ranked = (Object.keys(types) as RiasecType[]).sort((a, b) => types[b] - types[a]);
  const [primary, secondary, tertiary] = ranked;

  const description = `${RIASEC_META[primary].ko}(${primary}) + ${RIASEC_META[secondary].ko}(${secondary}) 복합형. ${RIASEC_META[primary].short}`;

  return {
    scores: sums,
    types,
    primaryType: primary,
    secondaryType: secondary,
    tertiaryType: tertiary,
    description,
    completedAt: new Date().toISOString(),
  };
}

/** 모든 문항 응답 여부 */
export function isRiasecComplete(answers: Record<string, number>): boolean {
  return RIASEC_QUESTIONS.every((q) => typeof answers[q.id] === 'number');
}
