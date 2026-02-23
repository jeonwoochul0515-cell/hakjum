import type { WizardState } from '@/types';

export function buildPrompt(state: WizardState): string {
  const { school, grade, careerGoal, tags } = state;
  if (!school) throw new Error('School is required');

  const gradeSubjects = school.subjectsByGrade[grade] || [];
  const allSubjects = school.allSubjects;

  return `당신은 고교학점제 과목 추천 전문가입니다. 학생의 진로 희망과 학교의 실제 개설과목을 분석하여 최적의 과목 조합을 추천해주세요.

## 학생 정보
- 학교: ${school.name} (${school.type})
- 수강 학년: ${grade}
- 희망 진로: ${careerGoal || '미입력'}
- 관심 분야: ${tags.length > 0 ? tags.join(', ') : '미선택'}

## 해당 학년 개설과목
${gradeSubjects.join(', ')}

## 학교 전체 개설과목
${allSubjects.join(', ')}

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 설명 없이 순수 JSON만 출력하세요.

{
  "tiers": [
    {
      "tier": "essential",
      "label": "필수 과목",
      "subjects": [
        { "name": "과목명", "reason": "추천 이유 (1문장)" }
      ]
    },
    {
      "tier": "strongly_recommended",
      "label": "적극 추천",
      "subjects": [
        { "name": "과목명", "reason": "추천 이유" }
      ]
    },
    {
      "tier": "consider",
      "label": "고려 과목",
      "subjects": [
        { "name": "과목명", "reason": "추천 이유" }
      ]
    },
    {
      "tier": "optional",
      "label": "후순위",
      "subjects": [
        { "name": "과목명", "reason": "추천 이유" }
      ]
    }
  ],
  "strategy": "전체적인 수강 전략 요약 (2-3문장)"
}

## 규칙
1. 반드시 해당 학교에 실제로 개설된 과목만 추천하세요
2. ${grade} 개설과목을 우선하되, 다른 학년의 과목도 수강 가능하다면 포함하세요
3. 각 tier에 2~5개 과목을 추천하세요
4. 학생의 진로와 관심 분야에 맞는 과목을 우선 배치하세요
5. 추천 이유는 학생 진로와의 연관성을 구체적으로 설명하세요`;
}
