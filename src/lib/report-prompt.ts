import type { ReportInput } from '@/types/report';

/**
 * Phase 1: 학과 TOP 10 추천 + 희망 대학 매칭
 */
export function buildReportPhase1Prompt(input: ReportInput): string {
  const { school, grade, interest, tags, targetUniversities } = input;

  let prompt = `당신은 한국 대학 입시 전문가이자 고교학점제 상담 AI입니다. 학생의 관심사와 학교 정보를 분석하여 최적의 학과를 추천해주세요.

## 학생 정보
- 학교: ${school.name} (${school.type})
- 학년: ${grade}
- 관심 분야: ${interest}
- 관심 키워드: ${tags.length > 0 ? tags.join(', ') : '미선택'}
- 희망 대학: ${targetUniversities.length > 0 ? targetUniversities.join(', ') : '미입력'}

## 학교 전체 개설과목
${school.allSubjects.join(', ')}

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 설명 없이 순수 JSON만 출력하세요.

{
  "recommendations": [
    {
      "rank": 1,
      "name": "학과명",
      "category": "계열 (공학계열/자연계열/인문계열/사회계열/교육계열/의약계열/예체능계열/상경계열)",
      "matchScore": 85,
      "reason": "이 학과를 추천하는 이유 (학생의 관심사와 연결하여 2-3문장)",
      "relatedJobs": ["관련 직업1", "관련 직업2", "관련 직업3"]
    }
  ],
  "universityMatches": [
    {
      "universityName": "대학교명",
      "majorName": "학과명",
      "region": "지역",
      "difficulty": "high 또는 medium 또는 low"
    }
  ]
}

## 규칙
1. recommendations에 정확히 10개의 학과를 matchScore 내림차순으로 추천하세요
2. matchScore는 학생의 관심사·키워드와의 적합도를 0-100 점수로 표현하세요
3. relatedJobs는 현실적이고 구체적인 직업 3-5개를 나열하세요
4. reason은 학생이 입력한 관심사·키워드와 구체적으로 연결하여 설명하세요
5. category는 반드시 다음 중 하나: 공학계열, 자연계열, 인문계열, 사회계열, 교육계열, 의약계열, 예체능계열, 상경계열`;

  if (targetUniversities.length > 0) {
    prompt += `
6. universityMatches에서 희망 대학(${targetUniversities.join(', ')})별로 추천 학과 TOP 10 중 적합한 학과를 매칭하세요
7. difficulty는 해당 대학·학과의 입시 난이도입니다: high(상위권), medium(중위권), low(비교적 수월)
8. 각 희망 대학마다 최소 2~3개 학과를 매칭하세요`;
  } else {
    prompt += `
6. universityMatches는 빈 배열([])로 출력하세요`;
  }

  return prompt;
}

/**
 * Phase 2: TOP 3 학과 상세 분석 (과목 티어링, 입시 전략, 로드맵)
 */
export function buildReportPhase2Prompt(input: ReportInput, phase1Data: any): string {
  const { school, grade, interest, tags, targetUniversities } = input;

  // Phase 1 결과에서 TOP 3 추출
  const top3 = (phase1Data.recommendations || []).slice(0, 3);
  const top3Names = top3.map((r: any) => r.name).join(', ');

  let prompt = `당신은 한국 대학 입시 전문가이자 고교학점제 과목 추천 AI입니다. 학생에게 최적화된 상세 분석 보고서를 작성해주세요.

## 학생 정보
- 학교: ${school.name} (${school.type})
- 학년: ${grade}
- 관심 분야: ${interest}
- 관심 키워드: ${tags.length > 0 ? tags.join(', ') : '미선택'}
- 희망 대학: ${targetUniversities.length > 0 ? targetUniversities.join(', ') : '미입력'}

## AI가 추천한 TOP 3 학과
${top3.map((r: any, i: number) => `${i + 1}. ${r.name} (${r.category}) - 적합도 ${r.matchScore}점: ${r.reason}`).join('\n')}

## 학교 전체 개설과목 (이 목록에서만 과목을 추천하세요!)
${school.allSubjects.join(', ')}

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 설명 없이 순수 JSON만 출력하세요.

{
  "majorDetails": [
    {
      "name": "학과명",
      "category": "계열",
      "description": "학과 소개 (3-4문장)",
      "curriculum": ["주요 전공과목1", "주요 전공과목2", "주요 전공과목3"],
      "careerPaths": ["진출 분야1", "진출 분야2"],
      "aiReason": "이 학생에게 이 학과를 추천하는 구체적인 이유 (2-3문장)"
    }
  ],
  "subjectTiering": {
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
  },
  "admissionStrategy": {
    "earlyAdmission": "수시 전형 전략 (학생부교과/학생부종합/논술 등) 3-4문장",
    "regularAdmission": "정시 전형 전략 (수능 영역별 가중치, 준비 방법) 3-4문장",
    "recommendedType": "수시 또는 정시 중 추천 전형",
    "detailByUniversity": [
      {
        "university": "대학교명",
        "strategy": "해당 대학 맞춤 전략 (2-3문장)"
      }
    ]
  },
  "roadmap": {
    "roadmap": [
      {
        "year": "1학년",
        "semester1": ["과목명1", "과목명2"],
        "semester2": ["과목명1", "과목명2"],
        "note": "이 학년에서 주의할 점"
      },
      {
        "year": "2학년",
        "semester1": ["과목명1", "과목명2"],
        "semester2": ["과목명1", "과목명2"],
        "note": "이 학년에서 주의할 점"
      },
      {
        "year": "3학년",
        "semester1": ["과목명1", "과목명2"],
        "semester2": ["과목명1", "과목명2"],
        "note": "이 학년에서 주의할 점"
      }
    ],
    "summary": "3년 로드맵 전체 요약 (2-3문장)"
  },
  "competition": [
    {
      "university": "대학교명",
      "major": "학과명",
      "admissionType": "학생부교과 또는 정시 등",
      "competitionRate": 12.3,
      "cutlineAvg": 2.8,
      "trend": "최근 3년 경쟁률 추이 설명 (1문장)"
    }
  ],
  "actionPlan": {
    "summary": "종합 의견 (3-4문장)",
    "immediate": ["즉시 실행할 액션1", "즉시 실행할 액션2"],
    "shortTerm": ["단기(1-3개월) 액션1", "단기 액션2"],
    "longTerm": ["장기(6개월-1년) 액션1", "장기 액션2"]
  }
}

## 규칙
1. majorDetails에 TOP 3 학과(${top3Names})에 대한 상세 정보를 작성하세요
2. subjectTiering의 모든 과목은 반드시 학교 개설과목 목록에 있는 과목만 추천하세요
   - 학교에 없는 과목은 절대 포함하지 마세요
   - 각 tier에 2~5개 과목을 추천하세요
3. roadmap의 모든 과목도 반드시 학교 개설과목 목록에서만 선택하세요
   - 1학년~3학년 각 학기별 3~5개 과목을 배치하세요
4. admissionStrategy는 TOP 3 학과 진학에 특화된 구체적인 전략을 제시하세요
5. 수시는 학생부교과/학생부종합/논술 전형별 전략, 정시는 수능 과목별 준비 전략을 포함하세요`;

  if (targetUniversities.length > 0) {
    prompt += `
6. detailByUniversity에서 희망 대학(${targetUniversities.join(', ')})별 맞춤 전략을 작성하세요
7. 2022 개정 교육과정 과목명 변경에 유의하세요:
   미적분->미적분I/II, 수학I->대수, 화법과작문->독서와작문, 물리학I->물리학, 화학I->화학, 생명과학I->생명과학, 지구과학I->지구과학, 사회·문화->사회와문화, 정치와법->정치/법과사회`;
  } else {
    prompt += `
6. detailByUniversity는 빈 배열([])로 출력하세요`;
  }

  prompt += `
8. actionPlan의 immediate는 이번 주 안에 할 수 있는 것, shortTerm은 1-3개월 내, longTerm은 6개월-1년 계획을 작성하세요
9. 학생의 현재 학년(${grade})을 고려하여 현실적인 조언을 하세요`;

  return prompt;
}
