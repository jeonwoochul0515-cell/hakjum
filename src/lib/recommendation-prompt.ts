import type { WizardState } from '@/types';

export function buildPrompt(state: WizardState): string {
  const { school, grade, careerGoal, tags, targetMajor } = state;
  if (!school) throw new Error('School is required');

  const gradeSubjects = school.subjectsByGrade[grade] || [];
  const allSubjects = school.allSubjects;

  let prompt = `당신은 고교학점제 과목 추천 전문가이자 대학 입시 상담 AI입니다. 학생의 진로 희망과 학교의 실제 개설과목을 분석하여 최적의 과목 조합을 추천해주세요.

## 학생 정보
- 학교: ${school.name} (${school.type})
- 수강 학년: ${grade}
- 희망 진로: ${careerGoal || '미입력'}
- 관심 분야: ${tags.length > 0 ? tags.join(', ') : '미선택'}
- 적성검사: ${state.aptitudeResult ? '커리어넷 직업흥미검사 완료 (학생이 자신의 흥미와 적성을 파악했으므로, 입력한 관심사가 검사 결과를 반영한 것으로 판단하세요)' : '미실시 (관심사가 아직 탐색 단계일 수 있습니다)'}`;

  // 목표 대학·학과 정보 추가
  if (targetMajor) {
    prompt += `

## 목표 학과: ${targetMajor.name} (${targetMajor.category})
- 설치 대학: ${targetMajor.universities.map((u) => `${u.name}(${u.area})`).join(', ')}
- 관련 직업: ${targetMajor.jobs}
- 관련 자격증: ${targetMajor.qualifications}

## 학과가 요구하는 관련 고교 과목
- 공통과목: ${targetMajor.relateSubject.common}
- 일반선택과목: ${targetMajor.relateSubject.general}
- 진로선택과목: ${targetMajor.relateSubject.career}
${targetMajor.relateSubject.professional ? `- 전문교과Ⅰ: ${targetMajor.relateSubject.professional}` : ''}`;
  }

  prompt += `

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
  "strategy": "전체적인 수강 전략 요약 (2-3문장)"`;

  // 목표 대학이 있으면 교차 분석 + 입시 정보도 요청
  if (targetMajor) {
    prompt += `,
  "subjectMatches": [
    {
      "subject": "학과가 요구하는 과목명",
      "status": "available 또는 missing 또는 similar",
      "note": "이 학교에 있음/없음/유사과목 안내 (1문장)"
    }
  ],
  "admissionInfo": {
    "earlyAdmission": "이 학과 수시 전형 전략 (학생부교과/학생부종합/논술 등) 2-3문장",
    "regularAdmission": "정시 전형 전략 (수능 영역별 가중치, 준비 방법) 2-3문장",
    "relatedCerts": "재학 중 취득 가능한 관련 자격증과 도움이 되는 이유",
    "relatedJobs": "졸업 후 진출 가능한 직업과 전망"
  }`;
  }

  prompt += `
}

## 규칙
1. 반드시 해당 학교에 실제로 개설된 과목만 추천하세요
2. ${grade} 개설과목을 우선하되, 다른 학년의 과목도 수강 가능하다면 포함하세요
3. 각 tier에 2~5개 과목을 추천하세요
4. 학생의 진로와 관심 분야에 맞는 과목을 우선 배치하세요
5. 추천 이유는 학생 진로와의 연관성을 구체적으로 설명하세요`;

  if (targetMajor) {
    prompt += `
6. subjectMatches에서 학과가 요구하는 모든 과목을 학교 개설과목과 교차 대조하세요
   - 2022 개정 교육과정에서 과목명이 변경되었으니 유의하세요:
     미적분→미적분Ⅰ/Ⅱ, 수학I→대수, 화법과작문→독서와작문, 물리학I→물리학, 화학I→화학, 생명과학I→생명과학, 지구과학I→지구과학, 사회·문화→사회와문화, 정치와법→정치/법과사회
   - "available": 학교에 해당 과목 또는 2022 교육과정 대응 과목이 개설되어 있음 → 반드시 수강 권장
   - "missing": 학교에 해당 과목이 없음 → 온라인 공동교육과정 등 대체 방법 안내
   - "similar": 정확히 같진 않지만 유사 과목이 있음 → 유사 과목명과 함께 안내
7. admissionInfo는 ${targetMajor.name} 입시에 특화된 구체적인 전략을 제시하세요
8. 수시는 학생부교과/학생부종합/논술 전형별 전략, 정시는 수능 과목별 준비 전략을 포함하세요`;
  }

  if (state.aptitudeResult) {
    const ruleNum = targetMajor ? 9 : 6;
    prompt += `\n${ruleNum}. 학생이 적성검사를 완료했으므로 입력한 진로 희망이 충분히 검증된 것으로 보고, 해당 진로에 특화된 과목을 적극적으로 추천하세요`;
  }

  return prompt;
}
