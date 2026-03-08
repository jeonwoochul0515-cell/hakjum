// 2028학년도 대학별 권장과목 조회
// 출처: 대교협 adiga.kr 「2028 모집단위별 반영과목 및 대학별 권장과목 자료집」

export interface DeptRecommendation {
  category: string;
  majors: string;
  core: string;
  recommended: string;
  notes: string;
}

export interface UniversityData {
  name: string;
  departments: DeptRecommendation[];
}

interface RecommendationDB {
  universities: UniversityData[];
}

let cachedData: RecommendationDB | null = null;

async function loadData(): Promise<RecommendationDB> {
  if (cachedData) return cachedData;
  const res = await fetch('/data/university-recommendations.json');
  cachedData = await res.json();
  return cachedData!;
}

// "서울대학교" → "서울대", "한국과학기술원(KAIST)" → "KAIST" 등
function normalizeUniName(name: string): string {
  return name
    .replace(/대학교$/, '대')
    .replace(/대학$/, '대')
    .replace(/\s+/g, '')
    .trim();
}

// 대학 이름 매칭 (fuzzy)
function matchUniversity(universities: UniversityData[], uniName: string): UniversityData | null {
  const normalized = normalizeUniName(uniName);

  // 1. 정확 매칭
  const exact = universities.find(u => u.name === uniName || u.name === normalized);
  if (exact) return exact;

  // 2. 정규화 매칭
  const byNorm = universities.find(u => normalizeUniName(u.name) === normalized);
  if (byNorm) return byNorm;

  // 3. 포함 매칭 (양방향)
  const byIncludes = universities.find(u =>
    normalized.includes(normalizeUniName(u.name)) ||
    normalizeUniName(u.name).includes(normalized)
  );
  if (byIncludes) return byIncludes;

  return null;
}

// 학과/모집단위 매칭 - 관련 학과들 반환
function matchDepartments(uni: UniversityData, majorName: string): DeptRecommendation[] {
  const query = majorName
    .replace(/학$/, '')
    .replace(/학과$/, '')
    .replace(/학부$/, '')
    .replace(/전공$/, '')
    .trim();

  // 키워드 토큰 생성 (예: "컴퓨터공학" → ["컴퓨터", "공학", "컴퓨터공학"])
  const tokens = [query];
  if (query.length >= 4) {
    tokens.push(query.slice(0, 2));
    tokens.push(query.slice(2));
  }

  const scored = uni.departments.map(dept => {
    const text = `${dept.category} ${dept.majors}`.toLowerCase();
    let score = 0;

    // 전체 쿼리 매칭 (가장 높은 점수)
    if (text.includes(query)) score += 10;

    // 개별 토큰 매칭
    for (const token of tokens) {
      if (token.length >= 2 && text.includes(token)) score += 3;
    }

    // core/recommended가 비어있지 않으면 보너스 (유용한 정보)
    if (dept.core || dept.recommended) score += 1;

    return { dept, score };
  });

  return scored
    .filter(s => s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .map(s => s.dept);
}

export interface RecommendationMatch {
  universityName: string;
  matches: DeptRecommendation[];
  allDepartments: DeptRecommendation[];
}

// 메인 조회 함수
export async function findRecommendations(
  universityName: string,
  majorName?: string,
): Promise<RecommendationMatch | null> {
  const data = await loadData();
  const uni = matchUniversity(data.universities, universityName);
  if (!uni) return null;

  const matches = majorName ? matchDepartments(uni, majorName) : [];

  return {
    universityName: uni.name,
    matches,
    allDepartments: uni.departments,
  };
}

// 모든 대학 이름 목록
export async function getUniversityNames(): Promise<string[]> {
  const data = await loadData();
  return data.universities.map(u => u.name);
}
