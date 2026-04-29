/**
 * 자가탐색 결과를 AI 추천 프롬프트에 주입할 수 있는 텍스트로 변환.
 *
 * 출력은 600자 이내로 제한해 학교 컨텍스트(1000자)와 합쳐도
 * Claude 응답 토큰을 충분히 보존할 수 있게 한다.
 *
 * 학생이 검사를 하나도 하지 않았다면 빈 문자열을 반환해
 * 호출 측이 graceful 하게 동작하게 한다.
 */
import { RIASEC_META, type RiasecResult } from './riasec';
import { type StrengthsResult } from './strengths';
import { type ValuesResult } from './values';
import type { SelfExplorationData } from './storage';

const MAX_PERSONAL_CONTEXT = 600;

export interface PersonalContextInput {
  riasec?: RiasecResult;
  strengths?: StrengthsResult;
  values?: ValuesResult;
}

/**
 * 한 줄 요약(AI 프롬프트에 삽입하지 않고 UI에 노출하기에 적합).
 * 예: "탐구형(I)+예술형(A) 복합, 강점은 분석·창의, 가치관은 자율·창의 우선"
 */
export function buildPersonalSummary(input: PersonalContextInput): string {
  const parts: string[] = [];
  if (input.riasec) {
    const p = input.riasec.primaryType;
    const s = input.riasec.secondaryType;
    parts.push(`${RIASEC_META[p].ko}(${p})+${RIASEC_META[s].ko}(${s}) 복합`);
  }
  if (input.strengths && input.strengths.strengths.length > 0) {
    parts.push(`강점은 ${input.strengths.strengths.slice(0, 3).join('·')}`);
  }
  if (input.values && input.values.topValues.length > 0) {
    parts.push(`가치관은 ${input.values.topValues.slice(0, 2).join('·')} 우선`);
  }
  return parts.join(', ');
}

/**
 * AI 추천 프롬프트 삽입용 풀 컨텍스트.
 * 학교 컨텍스트와 함께 explore-ai의 buildExplorePrompt에서 사용.
 */
export function buildPersonalContext(data: SelfExplorationData | null | undefined): string {
  if (!data) return '';
  const { riasec, strengths, values } = data;
  if (!riasec && !strengths && !values) return '';

  const lines: string[] = [];
  lines.push('## 학생 자가탐색 결과 (Holland·VIA·Schwartz 기반 자체 검사)');

  if (riasec) {
    const ranked = (Object.keys(riasec.types) as Array<keyof typeof riasec.types>)
      .map((k): { label: string; value: number } => ({
        label: `${RIASEC_META[k].ko}(${k})`,
        value: riasec.types[k],
      }))
      .sort((a, b) => b.value - a.value);
    const top3 = ranked.slice(0, 3).map((r) => `${r.label} ${r.value}`).join(', ');
    lines.push(`- RIASEC 흥미: ${top3} (1순위 ${RIASEC_META[riasec.primaryType].ko})`);
  }

  if (strengths) {
    if (strengths.topAreas.length > 0) {
      lines.push(`- 강점 영역: ${strengths.topAreas.join('·')}`);
    }
    if (strengths.strengths.length > 0) {
      lines.push(`- 대표 강점: ${strengths.strengths.slice(0, 5).join(', ')}`);
    }
  }

  if (values) {
    if (values.topValues.length > 0) {
      lines.push(`- 직업 가치관 Top 3: ${values.topValues.join('·')}`);
    }
    if (values.conflicts.length > 0) {
      lines.push(`- 가치관 갈등 가능성: ${values.conflicts[0].split(' — ')[0]}`);
    }
  }

  lines.push('');
  lines.push('## 활용 지침');
  lines.push('- 위 흥미·강점·가치관 프로필에 잘 맞는 학과를 우선 추천하고, reason에 "흥미 ◯◯·가치관 ◯◯과 부합" 형태로 1문장 첨부하세요.');
  lines.push('- 가치관 갈등이 표시되어 있다면 두 가치를 모두 충족할 수 있는 융합 진로를 1개 이상 제안하세요.');

  let text = lines.join('\n');
  if (text.length > MAX_PERSONAL_CONTEXT) {
    text = text.slice(0, MAX_PERSONAL_CONTEXT - 3) + '...';
  }
  return text;
}
