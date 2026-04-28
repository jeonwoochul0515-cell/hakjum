/**
 * 학교 컨텍스트 빌더 — AI 학과 추천 프롬프트에 학생 학교의 실제 데이터를 주입.
 *
 * 데이터 출처:
 * - NEIS 학교 시간표 (state.school.allSubjects) — 실제 개설 과목
 * - 학교알리미 인덱스 (/api/school/subjects) — 과목별 교사 수, 학교 규모
 * - 부산 PDF 추출 (/api/busan/curriculum-info) — 부산 한정 공동교육과정·진로 가이드
 *
 * 출력은 1000자 이내로 제한해 Claude 응답 토큰을 보존합니다.
 * 학교 미선택 시 빈 문자열을 반환해 호출 측이 graceful 하게 동작합니다.
 */
import type { School } from '@/types';
import { classifySchoolSize, sizeMeta } from '@/lib/school-size';

interface SchoolSubjectsResponse {
  data: {
    schoolName: string;
    schoolType: string;
    region: string;
    sigungu: string;
    subjects: Record<string, number>;
    subjectCount: number;
    totalTeachers: number;
    studentCount?: number;
    teacherCountTotal?: number;
    avgStudentsPerClass?: number;
    classCount?: number;
  } | null;
}

interface BusanCurriculumResponse {
  data: {
    isBusan: boolean;
    schoolMatched: { name: string; location?: string; roles: string[] } | null;
    relatedGuides: { topic: string; content: string; source: string }[];
    jointCurriculumSchools: { name: string; location?: string; role: string }[];
  } | null;
}

export interface SchoolContextData {
  /** 프롬프트 삽입용 텍스트 (1000자 이내) */
  promptText: string;
  /** 실제 개설 과목 (학교알리미 + NEIS 합집합, 정규화된 이름) */
  availableSubjects: string[];
  /** 학교명 (UI 표시용) */
  schoolName?: string;
  /** 부산 학교 여부 (공동교육과정 권장 표시용) */
  isBusan: boolean;
}

const MAX_CONTEXT_LENGTH = 1000;

/** 핵심 과목 키워드 — 진로 추천에 영향이 큰 과목만 우선 노출 */
const CORE_SUBJECT_KEYWORDS = [
  '대수', '미적분', '확률과통계', '기하',
  '물리학', '화학', '생명과학', '지구과학',
  '한국지리', '세계지리', '한국사', '세계사', '동아시아사',
  '정치', '법과사회', '경제', '사회와문화', '윤리',
  '정보', '인공지능', '데이터과학',
  '독서와작문', '문학', '영어', '제2외국어',
  '음악', '미술', '체육',
];

function pickCoreSubjects(subjects: string[]): string[] {
  const uniq = Array.from(new Set(subjects));
  const core = uniq.filter((s) => CORE_SUBJECT_KEYWORDS.some((kw) => s.includes(kw)));
  // 핵심이 너무 적으면 일반 과목으로 보충
  if (core.length < 8) {
    const extras = uniq.filter((s) => !core.includes(s)).slice(0, 12 - core.length);
    return [...core, ...extras];
  }
  return core.slice(0, 20);
}

/** 교사 수 상위 과목 — 학교가 안정적으로 운영하는 영역 */
function pickStableSubjects(subjects: Record<string, number> | undefined, top = 5): { name: string; teachers: number }[] {
  if (!subjects) return [];
  return Object.entries(subjects)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, teachers]) => ({ name, teachers }));
}

async function fetchSchoolInfo(schoolName: string): Promise<SchoolSubjectsResponse['data']> {
  try {
    const res = await fetch(`/api/school/subjects?schoolName=${encodeURIComponent(schoolName)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as SchoolSubjectsResponse;
    return json.data;
  } catch {
    return null;
  }
}

async function fetchBusanInfo(schoolName: string): Promise<BusanCurriculumResponse['data']> {
  try {
    const res = await fetch(`/api/busan/curriculum-info?schoolName=${encodeURIComponent(schoolName)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as BusanCurriculumResponse;
    return json.data;
  } catch {
    return null;
  }
}

/**
 * 학교 컨텍스트를 빌드하여 프롬프트 삽입용 텍스트로 반환.
 * 학교 미선택 시 graceful 하게 빈 컨텍스트를 반환.
 */
export async function buildSchoolContext(school: School | null | undefined): Promise<SchoolContextData> {
  if (!school) {
    return { promptText: '', availableSubjects: [], isBusan: false };
  }

  const [info, busan] = await Promise.all([
    fetchSchoolInfo(school.name),
    fetchBusanInfo(school.name),
  ]);

  // 1) 학교 규모 분류
  const studentCount = info?.studentCount;
  const size = classifySchoolSize(studentCount);
  const sizeLabel = sizeMeta(size).label;

  // 2) 개설 과목 합집합 (학교알리미 + NEIS)
  const schoolinfoSubjects = info?.subjects ? Object.keys(info.subjects) : [];
  const merged = Array.from(new Set([...(school.allSubjects ?? []), ...schoolinfoSubjects]));
  const coreOpen = pickCoreSubjects(merged);

  // 3) 교사 수 안정적 운영 과목
  const stable = pickStableSubjects(info?.subjects, 5);

  // 4) 텍스트 구성
  const lines: string[] = [];
  lines.push('## 학생 학교 데이터 (NEIS·학교알리미 실측)');
  lines.push(`- 학교명: ${school.name} (${school.type})`);
  if (studentCount) {
    lines.push(`- 학교 규모: ${sizeLabel} (학생 ${studentCount}명${info?.avgStudentsPerClass ? `, 학급당 ${info.avgStudentsPerClass.toFixed(1)}명` : ''})`);
  } else {
    lines.push(`- 학교 규모: ${sizeLabel}`);
  }
  if (coreOpen.length > 0) {
    lines.push(`- 우리 학교 핵심 개설 과목: ${coreOpen.join(', ')}`);
  }
  if (stable.length > 0) {
    lines.push(`- 교사 수가 많은 과목 (운영 안정): ${stable.map((s) => `${s.name} ${s.teachers}명`).join(', ')}`);
  }
  if (busan?.isBusan) {
    const guideTopics = (busan.relatedGuides ?? []).slice(0, 2).map((g) => g.topic).filter(Boolean);
    lines.push(
      `- 부산 공동교육과정 운영 권역: ${busan.schoolMatched?.location ?? '부산광역시'}`
        + (guideTopics.length > 0 ? ` / 관련 가이드: ${guideTopics.join(', ')}` : ''),
    );
  }
  lines.push('');
  lines.push('## 활용 지침');
  lines.push('- 위 학교에 실제 개설된 과목을 우선 활용한 학과를 우선 추천하세요.');
  lines.push('- 학과별 reason 끝에 "우리 학교 ◯◯·◯◯ 과목으로 준비 가능" 형태로 학교 매칭을 1문장 첨부하세요.');
  if (size === 'small' || size === 'tiny') {
    lines.push('- 학교 규모가 작으므로 공동교육과정·온라인 수강 가능성을 고려해 추천하세요.');
  }

  let promptText = lines.join('\n');
  if (promptText.length > MAX_CONTEXT_LENGTH) {
    promptText = promptText.slice(0, MAX_CONTEXT_LENGTH - 3) + '...';
  }

  return {
    promptText,
    availableSubjects: merged,
    schoolName: school.name,
    isBusan: !!busan?.isBusan,
  };
}

/**
 * 학과별 "우리 학교에서 준비 가능성" 분석 — 추천 응답 후처리에 사용.
 *
 * 학과명에서 키워드를 추출해 학교 개설 과목과 매칭한다.
 * 부족한 핵심 과목(학교 미개설)은 자동 식별해 반환.
 */
export interface SchoolFitAnalysis {
  /** 매칭된 개설 과목 (3개까지) */
  matchedSubjects: string[];
  /** 부족한 (학교 미개설) 핵심 과목 */
  missingSubjects: string[];
  /** 0-100 적합도: 매칭/(매칭+부족) 비율 */
  schoolFitScore: number;
}

const MAJOR_SUBJECT_HINTS: { keywords: string[]; required: string[] }[] = [
  { keywords: ['컴퓨터', '소프트웨어', 'AI', '인공지능', '정보', '데이터'], required: ['정보', '미적분', '확률과통계'] },
  { keywords: ['전자', '전기', '반도체', '기계', '로봇'], required: ['물리학', '미적분', '기하'] },
  { keywords: ['화학', '생명', '바이오', '의예', '의학', '약학', '간호', '치의'], required: ['화학', '생명과학', '미적분'] },
  { keywords: ['건축', '토목', '환경'], required: ['물리학', '지구과학', '미적분'] },
  { keywords: ['수학', '통계', '물리', '천문'], required: ['미적분', '기하', '확률과통계', '물리학'] },
  { keywords: ['경영', '경제', '금융', '회계', '무역'], required: ['경제', '확률과통계', '사회와문화'] },
  { keywords: ['법', '행정', '정치'], required: ['정치', '법과사회', '사회와문화'] },
  { keywords: ['국어', '문예', '문학', '언론', '미디어'], required: ['독서와작문', '문학'] },
  { keywords: ['영어', '영문', '외국어'], required: ['영어'] },
  { keywords: ['지리', '관광', '국제'], required: ['한국지리', '세계지리', '세계사'] },
  { keywords: ['역사', '사학'], required: ['한국사', '세계사', '동아시아사'] },
  { keywords: ['교육'], required: ['윤리', '문학'] },
  { keywords: ['디자인', '미술', '예술'], required: ['미술'] },
  { keywords: ['음악', '실용음악'], required: ['음악'] },
  { keywords: ['체육', '스포츠'], required: ['체육'] },
];

export function analyzeSchoolFit(majorName: string, availableSubjects: string[]): SchoolFitAnalysis {
  const lcMajor = majorName.toLowerCase();
  const hint = MAJOR_SUBJECT_HINTS.find((h) =>
    h.keywords.some((kw) => lcMajor.includes(kw.toLowerCase())),
  );
  if (!hint) {
    return { matchedSubjects: [], missingSubjects: [], schoolFitScore: 70 };
  }

  const matched: string[] = [];
  const missing: string[] = [];
  for (const req of hint.required) {
    const hit = availableSubjects.find((s) => s.includes(req));
    if (hit) matched.push(hit);
    else missing.push(req);
  }

  const total = hint.required.length;
  const score = total === 0 ? 70 : Math.round((matched.length / total) * 100);

  return {
    matchedSubjects: matched.slice(0, 3),
    missingSubjects: missing,
    schoolFitScore: Math.max(40, score),
  };
}
