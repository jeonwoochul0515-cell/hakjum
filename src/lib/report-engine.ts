import type {
  ReportInput,
  ReportData,
  MajorRecommendation,
  MajorDetailItem,
  UniversityMatchItem,
  FulfillmentItem,
  SubjectTier,
  RoadmapYear,
  ProfileSection,
  MajorTop10Section,
  MajorDetailSection,
  UnivMatchSection,
  AdmissionStrategySection,
  FulfillmentSection,
  SubjectTieringSection,
  RoadmapSection,
  CompetitionSection,
  ActionPlanSection,
  SchoolInsight,
  TierMatrix,
  SchoolFitSection,
  SchoolFitItem,
  BusanInsight,
  KcueStatsSection,
  KcueStatItem,
} from '@/types/report';
import { buildReportPhase1Prompt, buildReportPhase2Prompt } from '@/lib/report-prompt';
import { getRequirementsForMajor } from '@/data/admission-requirements';
import { classifySchoolSize, sizeMeta, SIZE_DISTRIBUTION } from '@/lib/school-size';
import { classifyTier } from '@/lib/recommendation-tier';
import { analyzeSchoolFit } from '@/lib/school-context';

// ── JSON 복구 (claude-api.ts 패턴) ──

function repairJSON(raw: string): string {
  // trailing comma 제거
  let s = raw.replace(/,\s*([}\]])/g, '$1');

  // 미닫힌 괄호 자동 닫기
  const opens: string[] = [];
  for (const ch of s) {
    if (ch === '{' || ch === '[') opens.push(ch);
    else if (ch === '}' || ch === ']') opens.pop();
  }
  while (opens.length > 0) {
    const o = opens.pop();
    s += o === '{' ? '}' : ']';
  }

  return s;
}

function parseAIResponse(text: string): any {
  if (!text) throw new Error('Empty response');

  // markdown code block 제거
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format: no JSON found');

  let raw = jsonMatch[0];

  // 먼저 직접 파싱 시도
  try {
    return JSON.parse(raw);
  } catch {
    // repair 후 재시도
  }

  try {
    raw = repairJSON(raw);
    console.warn('[report-engine] JSON was repaired before parsing');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[report-engine] JSON parse error after repair:', e, '\nRaw (first 800):', raw.slice(0, 800));
    throw new Error('JSON parse failed');
  }
}

// ── API 호출 (explore-ai.ts 패턴) ──

async function callReportAPI(prompt: string): Promise<any> {
  const response = await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('[report-engine] API error:', response.status, errorText);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text || '';

  return parseAIResponse(text);
}

// ── 교과이수기준 충족률 로컬 계산 ──

function calculateFulfillment(
  input: ReportInput,
  top3: MajorRecommendation[],
): FulfillmentSection {
  const schoolSubjects = new Set(input.school.allSubjects);
  const items: FulfillmentItem[] = [];
  let totalRate = 0;

  for (const major of top3) {
    const req = getRequirementsForMajor(major.name);
    const allRequired = [...req.essential, ...req.recommended];
    const met: string[] = [];
    const unmet: string[] = [];
    const recommended: string[] = [];

    for (const subj of req.essential) {
      if (schoolSubjects.has(subj)) {
        met.push(subj);
      } else {
        unmet.push(subj);
      }
    }

    for (const subj of req.recommended) {
      if (schoolSubjects.has(subj)) {
        recommended.push(subj);
      }
    }

    const total = allRequired.length || 1;
    const metCount = met.length + recommended.length;
    const rate = Math.round((metCount / total) * 100);
    totalRate += rate;

    // 대학별로 항목 생성 (희망 대학이 있으면 각각, 없으면 일반)
    if (input.targetUniversities.length > 0) {
      for (const univ of input.targetUniversities) {
        // 해당 대학의 대학별 기준도 체크
        const univReqs = req.universitySpecific.filter(
          (u) => u.university.includes(univ) || univ.includes(u.university.replace('대학교', '')),
        );
        const univMet = [...met];
        const univUnmet = [...unmet];

        for (const ur of univReqs) {
          for (const subj of ur.requiredSubjects) {
            if (schoolSubjects.has(subj) && !univMet.includes(subj)) {
              univMet.push(subj);
            } else if (!schoolSubjects.has(subj) && !univUnmet.includes(subj)) {
              univUnmet.push(subj);
            }
          }
        }

        items.push({
          university: univ,
          major: major.name,
          fulfillmentRate: rate,
          met: univMet,
          unmet: univUnmet,
          recommended,
        });
      }
    } else {
      items.push({
        university: '일반',
        major: major.name,
        fulfillmentRate: rate,
        met,
        unmet,
        recommended,
      });
    }
  }

  const overallRate = top3.length > 0 ? Math.round(totalRate / top3.length) : 0;

  return { items, overallRate };
}

// ── 학교 규모 인사이트 ──

interface SchoolApiInfo {
  studentCount?: number;
  classCount?: number;
  avgStudentsPerClass?: number;
  totalTeachers?: number;
}

async function fetchSchoolApiInfo(schoolName: string): Promise<SchoolApiInfo | null> {
  try {
    const res = await fetch(`/api/school/subjects?schoolName=${encodeURIComponent(schoolName)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

function buildSchoolInsight(info: SchoolApiInfo | null): SchoolInsight {
  const studentCount = info?.studentCount;
  const size = classifySchoolSize(studentCount);
  const meta = sizeMeta(size);
  const distributionPct = SIZE_DISTRIBUTION[size];

  let recommendation = meta.diversityHint;
  if (size === 'large') {
    recommendation = '선택과목 폭이 넓어요. 진로별 심화과목까지 다양하게 활용하세요.';
  } else if (size === 'medium') {
    recommendation = '안정적 운영. 핵심 과목은 학교 수업으로, 심화는 공동교육과정으로 보완하세요.';
  } else if (size === 'small') {
    recommendation = '공동교육과정·온라인 학교 활용을 적극 권장합니다 (희망 과목 미개설 시).';
  } else {
    recommendation = '거점학교 공동교육과정 또는 온라인 수강이 거의 필수입니다.';
  }

  return {
    size,
    label: meta.label,
    studentCount,
    classCount: info?.classCount,
    avgPerClass: info?.avgStudentsPerClass,
    distributionPct,
    recommendation,
    diversityHint: meta.diversityHint,
  };
}

// ── 도전·적정·안전 매트릭스 ──

function buildTierMatrix(recommendations: MajorRecommendation[]): TierMatrix {
  const challenge: TierMatrix['challenge'] = [];
  const fit: TierMatrix['fit'] = [];
  const safe: TierMatrix['safe'] = [];
  for (const rec of recommendations) {
    const tier = classifyTier(rec.matchScore);
    const item = { name: rec.name, rank: rec.rank, matchScore: rec.matchScore };
    if (tier === 'challenge') challenge.push(item);
    else if (tier === 'fit') fit.push(item);
    else safe.push(item);
  }
  const summary = `도전 ${challenge.length}개 · 적정 ${fit.length}개 · 안전 ${safe.length}개로 구성되었어요.`;
  return { challenge, fit, safe, summary };
}

// ── 학교 적합도 (TOP 5 학과) ──

function buildSchoolFit(input: ReportInput, top: MajorRecommendation[]): SchoolFitSection {
  const subjects = input.school.allSubjects ?? [];
  const items: SchoolFitItem[] = top.slice(0, 5).map((r) => {
    const fit = analyzeSchoolFit(r.name, subjects);
    return {
      majorName: r.name,
      schoolFitScore: fit.schoolFitScore,
      matched: fit.matchedSubjects,
      missing: fit.missingSubjects,
    };
  });
  const avg =
    items.length > 0
      ? Math.round(items.reduce((s, x) => s + x.schoolFitScore, 0) / items.length)
      : 0;
  return { items, avgScore: avg };
}

// ── 부산 학생 특화 ──

async function fetchBusanInsight(schoolName: string): Promise<BusanInsight> {
  const empty: BusanInsight = {
    isBusan: false,
    jointCurriculumSchools: [],
    guides: [],
  };
  try {
    const res = await fetch(`/api/busan/curriculum-info?schoolName=${encodeURIComponent(schoolName)}`);
    if (!res.ok) return empty;
    const json = await res.json();
    const d = json?.data;
    if (!d?.isBusan) return empty;
    return {
      isBusan: true,
      matchedLocation: d.schoolMatched?.location ?? '부산광역시',
      jointCurriculumSchools: (d.jointCurriculumSchools ?? []).slice(0, 5),
      guides: (d.relatedGuides ?? []).slice(0, 3).map((g: { topic?: string; content?: string }) => ({
        topic: g.topic ?? '',
        content: (g.content ?? '').slice(0, 200),
      })),
    };
  } catch {
    return empty;
  }
}

// ── KCUE 학과 통계 ──

async function fetchKcueStat(majorName: string): Promise<KcueStatItem | null> {
  try {
    const res = await fetch(
      `/api/search/major?q=${encodeURIComponent(majorName)}&limit=1&stats=1`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const item = json?.data?.[0];
    if (!item) return null;
    return {
      majorName: item.majorName ?? majorName,
      schoolCount: item.schoolCount ?? 0,
      quotaAvg: item.quotaStats?.avg ?? item.quota ?? 0,
      tuitionAvgWon: item.tuitionAvgWon ?? 0,
      scholarshipAvgPerUniv: item.scholarshipAvgPerUniv ?? 0,
    };
  } catch {
    return null;
  }
}

async function buildKcueStats(top: MajorRecommendation[]): Promise<KcueStatsSection> {
  const limited = top.slice(0, 3);
  const items = await Promise.all(limited.map((r) => fetchKcueStat(r.name)));
  return { items: items.filter((x): x is KcueStatItem => x !== null) };
}

// ── 고유 ID 생성 ──

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 타임스탬프 기반 폴백
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── 메인 보고서 생성 함수 ──

export async function generateReport(input: ReportInput): Promise<ReportData> {
  // ── Phase 1: 학과 TOP 10 추천 ──
  const phase1Prompt = buildReportPhase1Prompt(input);
  const phase1Data = await callReportAPI(phase1Prompt);

  // Phase 1 결과 정규화
  const recommendations: MajorRecommendation[] = (phase1Data.recommendations || []).map(
    (r: any, i: number) => ({
      rank: r.rank || i + 1,
      name: r.name || '',
      category: r.category || '',
      matchScore: typeof r.matchScore === 'number' ? r.matchScore : 70,
      reason: r.reason || '',
      relatedJobs: r.relatedJobs || [],
    }),
  );

  const universityMatches: UniversityMatchItem[] = (phase1Data.universityMatches || []).map(
    (m: any) => ({
      universityName: m.universityName || '',
      majorName: m.majorName || '',
      region: m.region || '',
      difficulty: (['high', 'medium', 'low'].includes(m.difficulty) ? m.difficulty : 'medium') as 'high' | 'medium' | 'low',
      competitionRate: m.competitionRate,
      cutline: m.cutline,
    }),
  );

  // ── 교과이수기준 충족률 (로컬 계산) ──
  const top3 = recommendations.slice(0, 3);
  const fulfillmentRate = calculateFulfillment(input, top3);

  // ── Phase 2: 상세 분석 ──
  const phase2Prompt = buildReportPhase2Prompt(input, phase1Data);
  const phase2Data = await callReportAPI(phase2Prompt);

  // Phase 2 결과 정규화
  const majorDetails: MajorDetailItem[] = (phase2Data.majorDetails || []).map((d: any) => ({
    name: d.name || '',
    category: d.category || '',
    description: d.description || '',
    curriculum: d.curriculum || [],
    careerPaths: d.careerPaths || [],
    aiReason: d.aiReason || '',
  }));

  const subjectTiers: SubjectTier[] = (phase2Data.subjectTiering?.tiers || []).map((t: any) => ({
    tier: t.tier || 'optional',
    label: t.label || '',
    subjects: (t.subjects || []).map((s: any) => ({
      name: s.name || '',
      reason: s.reason || '',
    })),
  }));

  const roadmapYears: RoadmapYear[] = (phase2Data.roadmap?.roadmap || []).map((r: any) => ({
    year: r.year || '',
    semester1: r.semester1 || [],
    semester2: r.semester2 || [],
    note: r.note || '',
  }));

  const admissionStrategy: AdmissionStrategySection = {
    earlyAdmission: phase2Data.admissionStrategy?.earlyAdmission || '',
    regularAdmission: phase2Data.admissionStrategy?.regularAdmission || '',
    recommendedType: phase2Data.admissionStrategy?.recommendedType || '',
    detailByUniversity: (phase2Data.admissionStrategy?.detailByUniversity || []).map((d: any) => ({
      university: d.university || '',
      strategy: d.strategy || '',
    })),
  };

  const actionPlan: ActionPlanSection = {
    summary: phase2Data.actionPlan?.summary || '',
    immediate: phase2Data.actionPlan?.immediate || [],
    shortTerm: phase2Data.actionPlan?.shortTerm || [],
    longTerm: phase2Data.actionPlan?.longTerm || [],
  };

  // ── Profile 섹션 조립 ──
  const profile: ProfileSection = {
    schoolName: input.school.name,
    schoolType: input.school.type,
    grade: input.grade,
    interest: input.interest,
    tags: input.tags,
    targetUniversities: input.targetUniversities,
    totalSubjects: input.school.allSubjects.length,
  };

  // ── 인사이트 보강 (병렬 fetch) ──
  const [schoolApiInfo, busanInsight, kcueStats] = await Promise.all([
    fetchSchoolApiInfo(input.school.name),
    fetchBusanInsight(input.school.name),
    buildKcueStats(top3),
  ]);

  const schoolInsight = buildSchoolInsight(schoolApiInfo);
  const tierMatrix = buildTierMatrix(recommendations);
  const schoolFit = buildSchoolFit(input, recommendations);

  // ── 10개 섹션 조립 ──
  const reportData: ReportData = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    input,
    sections: {
      profile,
      majorTop10: { recommendations } as MajorTop10Section,
      majorDetail: { details: majorDetails } as MajorDetailSection,
      universityMatch: { matches: universityMatches } as UnivMatchSection,
      admissionStrategy,
      fulfillmentRate,
      subjectTiering: {
        tiers: subjectTiers,
        strategy: phase2Data.subjectTiering?.strategy || '',
      } as SubjectTieringSection,
      roadmap: {
        roadmap: roadmapYears,
        summary: phase2Data.roadmap?.summary || '',
      } as RoadmapSection,
      competition: {
        data: (phase2Data.competition || []).map((c: any) => ({
          university: c.university || '',
          major: c.major || '',
          admissionType: c.admissionType || '',
          competitionRate: c.competitionRate || 0,
          cutlineAvg: c.cutlineAvg || 0,
          trend: c.trend || '',
        })),
      } as CompetitionSection,
      actionPlan,
      schoolInsight,
      tierMatrix,
      schoolFit,
      busanInsight,
      kcueStats,
    },
    isPaid: false,
  };

  return reportData;
}
