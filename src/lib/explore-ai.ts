import type { School, AIExploreResult, AIExploreRecommendation } from '@/types';
import { popularMajors } from '@/data/majors';

function buildExplorePrompt(interest: string, school?: School | null): string {
  let prompt = `당신은 한국 대학 학과 추천 전문가입니다. 고등학생의 관심사와 희망 진로를 분석하여 적합한 대학교 학과를 추천해주세요.

## 학생 정보
- 관심사/희망 진로: ${interest}`;

  if (school) {
    prompt += `
- 고등학교: ${school.name} (${school.type})
- 개설과목 수: ${school.totalRecords}개`;
  }

  prompt += `

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 설명 없이 순수 JSON만 출력하세요.

{
  "recommendations": [
    {
      "majorName": "학과명 (예: 컴퓨터공학과)",
      "category": "계열 (공학계열/자연계열/인문계열/사회계열/교육계열/의약계열/예체능계열)",
      "reason": "이 학과를 추천하는 이유를 학생의 관심사와 연결하여 2-3문장으로 설명",
      "universities": [
        { "name": "대학교명", "area": "지역 (부산/서울/대전/경기 등)" }
      ],
      "relatedJobs": ["관련 직업1", "관련 직업2", "관련 직업3"],
      "matchScore": 85
    }
  ],
  "summary": "전체적인 분석 요약 (학생의 관심사를 바탕으로 어떤 방향의 학과를 추천하는지 2-3문장)"
}

## 규칙
1. 3~5개의 학과를 추천하세요
2. matchScore는 학생의 관심사와의 적합도를 0-100 점수로 표현하세요
3. 각 학과마다 부산 지역 대학 2-3개, 서울 지역 대학 2-3개를 포함하세요
4. universities는 부산 대학을 먼저 나열하세요
5. relatedJobs는 현실적이고 구체적인 직업 3-5개를 나열하세요
6. reason은 학생이 입력한 관심사와 구체적으로 연결하여 설명하세요
7. 추천 학과는 matchScore가 높은 순서로 정렬하세요
8. category는 반드시 다음 중 하나: 공학계열, 자연계열, 인문계열, 사회계열, 교육계열, 의약계열, 예체능계열`;

  return prompt;
}

async function callExploreAI(prompt: string): Promise<AIExploreResult> {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');

  const parsed = JSON.parse(jsonMatch[0]);

  const recommendations: AIExploreRecommendation[] = (parsed.recommendations || []).map(
    (r: AIExploreRecommendation) => ({
      majorName: r.majorName || '',
      category: r.category || '',
      reason: r.reason || '',
      universities: (r.universities || []).map((u) => ({
        name: u.name || '',
        area: u.area || '',
      })),
      relatedJobs: r.relatedJobs || [],
      matchScore: typeof r.matchScore === 'number' ? r.matchScore : 70,
    })
  );

  return {
    recommendations,
    summary: parsed.summary || '',
    source: 'ai',
  };
}

function fallbackExploreRecommend(interest: string): AIExploreResult {
  const query = interest.toLowerCase();

  const scored = popularMajors.map((major) => {
    let score = 30; // base

    // Match against major name
    if (major.name.toLowerCase().includes(query) || query.includes(major.name.replace(/[()·]/g, '').toLowerCase())) {
      score += 40;
    }

    // Match against jobs
    const jobs = major.jobs.toLowerCase();
    const words = query.split(/[\s,]+/).filter((w) => w.length >= 2);
    for (const word of words) {
      if (jobs.includes(word)) score += 15;
      if (major.name.toLowerCase().includes(word)) score += 20;
      if (major.category.toLowerCase().includes(word)) score += 10;
    }

    // Keyword matching (직접 매칭)
    const keywordMap: Record<string, string[]> = {
      '컴퓨터공학과': ['코딩', '프로그래밍', '개발', 'ai', '인공지능', '소프트웨어', '앱', '게임', '해킹', '보안', '데이터', '컴퓨터', '웹', '서버', '알고리즘'],
      '간호학과': ['간호', '병원', '환자', '돌봄', '의료', '건강', '헌신', '봉사'],
      '의예과(의학과)': ['의사', '의대', '의학', '수술', '치료', '생명', '진단'],
      '경영학과': ['경영', '사업', '창업', '마케팅', '회사', '기업', 'ceo', '비즈니스', '리더', '장교', '군인', '지휘', '관리', '조직', '인사', '전략'],
      '법학과': ['법', '변호사', '판사', '검사', '법률', '정의', '인권', '범죄', '수사', '공무원', '공직', '장교', '군법'],
      '교육학과': ['교사', '선생님', '교육', '가르치', '아이', '학생', '훈련', '교관'],
      '전기·전자공학과': ['전자', '반도체', '전기', '회로', '로봇', '자동차', '드론', '무기', '통신', '레이더'],
      '약학과': ['약사', '약학', '제약', '약', '신약'],
      '국어국문학과': ['글쓰기', '문학', '작가', '소설', '시', '국어', '한국어', '기자', '언론', '방송'],
      '디자인학과(시각/산업)': ['디자인', '미술', '그림', '예술', 'ux', 'ui', '브랜드', '영상', '일러스트', '만화'],
    };

    // 간접 키워드 매칭 (popularMajors에 없는 분야 → 관련 학과로 연결)
    const indirectKeywords: { keywords: string[]; boostMajors: Record<string, number> }[] = [
      {
        keywords: ['장교', '군인', '군대', '국방', '육군', '해군', '공군', '사관', '안보', '군사'],
        boostMajors: { '경영학과': 20, '법학과': 15, '전기·전자공학과': 15, '컴퓨터공학과': 10, '교육학과': 10 },
      },
      {
        keywords: ['공무원', '공직', '행정', '정부', '정책', '외교', '국제'],
        boostMajors: { '법학과': 25, '경영학과': 15, '교육학과': 10 },
      },
      {
        keywords: ['연구', '과학자', '실험', '탐구', '발견', '노벨'],
        boostMajors: { '의예과(의학과)': 15, '약학과': 15, '컴퓨터공학과': 10 },
      },
      {
        keywords: ['운동', '체육', '스포츠', '축구', '야구', '농구', '선수', '트레이너', '피트니스'],
        boostMajors: { '교육학과': 15, '간호학과': 10 },
      },
      {
        keywords: ['돈', '투자', '주식', '부자', '재테크', '금융', '은행', '증권'],
        boostMajors: { '경영학과': 25, '법학과': 10 },
      },
      {
        keywords: ['유튜브', '크리에이터', '인플루언서', '콘텐츠', '영상', '미디어', '방송', '연예'],
        boostMajors: { '디자인학과(시각/산업)': 20, '경영학과': 15, '국어국문학과': 15 },
      },
      {
        keywords: ['심리', '상담', '멘탈', '정신', '마음'],
        boostMajors: { '교육학과': 20, '간호학과': 10 },
      },
      {
        keywords: ['환경', '기후', '에너지', '지구', '생태', '동물', '식물'],
        boostMajors: { '전기·전자공학과': 15, '약학과': 10 },
      },
    ];

    for (const { keywords: kws, boostMajors } of indirectKeywords) {
      if (kws.some((kw) => query.includes(kw))) {
        const boost = boostMajors[major.name];
        if (boost) score += boost;
      }
    }

    for (const [majorName, keywords] of Object.entries(keywordMap)) {
      if (major.name === majorName) {
        for (const kw of keywords) {
          if (query.includes(kw)) score += 25;
        }
      }
    }

    return { major, score: Math.min(score, 98) };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 4).filter((s) => s.score >= 30);

  const recommendations: AIExploreRecommendation[] = top.map(({ major, score }) => ({
    majorName: major.name,
    category: major.category,
    reason: `"${interest}" 관심사와 관련된 학과입니다. ${major.jobs.split(',').slice(0, 2).join(', ')} 등의 직업으로 진출할 수 있어요.`,
    universities: major.universities.slice(0, 6).map((u) => ({ name: u.name, area: u.area })),
    relatedJobs: major.jobs.split(',').map((j) => j.trim()).filter(Boolean).slice(0, 4),
    matchScore: score,
  }));

  return {
    recommendations,
    summary: `"${interest}" 관심사를 바탕으로 관련 학과를 찾아봤어요. 학과를 선택하면 상세 정보를 확인할 수 있어요.`,
    source: 'fallback',
  };
}

export async function getExploreRecommendations(
  interest: string,
  school?: School | null
): Promise<AIExploreResult> {
  try {
    const prompt = buildExplorePrompt(interest, school);
    return await callExploreAI(prompt);
  } catch {
    return fallbackExploreRecommend(interest);
  }
}
