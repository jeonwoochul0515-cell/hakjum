/**
 * GET /api/school/subjects?schoolName={학교명}
 *
 * 학교알리미 학교 × 과목 인덱스에서 학교 과목 정보 반환.
 * 학교알리미 출처: KERIS apiType=24 depthNo=20 (표시과목별 교원)
 * 데이터: 2022 개정 명칭만 (2015 명칭 + 메타 라벨 제거됨)
 *
 * 응답:
 * {
 *   data: {
 *     schoolName, schoolType, region, sigungu,
 *     subjects: { [과목명]: 교사수 },
 *     subjectCount, totalTeachers
 *   } | null,
 *   _meta: { source, license, syncedAt, schoolCount, ... }
 * }
 */

interface SchoolSubjectEntry {
  schoolName: string;
  schoolType: string;
  region: string;
  sigungu: string;
  subjectCount: number;
  totalTeachers: number;
  subjects: Record<string, number>;
  // 학교 규모 (api10·api08·api09 보강)
  studentCount?: number;
  studentByGrade?: { grade1: number; grade2: number; grade3: number };
  teacherCountTotal?: number;
  weeklyHours?: number;
  classCount?: number;
  avgStudentsPerClass?: number;
  teacherCount?: number;
}

interface IndexFile {
  _meta: {
    source: string;
    license: string;
    syncedAt: string;
    schoolCount: number;
    subjectCount: number;
    curriculum: string;
  };
  bySchool: Record<string, SchoolSubjectEntry>;
  bySubject: Record<string, { schoolCount: number; totalTeachers: number }>;
}

// 학교명 정규화 — 캠퍼스·괄호·공백 등 제거 후 비교
function normalizeName(s: string): string {
  return s
    .replace(/\([^)]*\)/g, '') // 괄호 제거
    .replace(/\s+/g, '') // 공백 제거
    .replace(/[·•・]/g, '') // 중점 제거
    .toLowerCase();
}

// 학교알리미 ↔ NEIS 학교명 약칭 매핑 (필요 시 보강)
const ALIAS: Record<string, string[]> = {
  카이스트: ['한국과학기술원'],
  포스텍: ['포항공과대학교'],
};

let cached: IndexFile | null = null;
async function loadIndex(): Promise<IndexFile | null> {
  if (cached) return cached;
  try {
    // Cloudflare Pages Functions: 정적 import 가능 (JSON)
    // dynamic import로 graceful fallback
    const mod = await import('../../../data/schoolinfo/school-subject-index.json', {
      with: { type: 'json' },
    });
    cached = (mod as any).default ?? mod;
    return cached;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const schoolName = url.searchParams.get('schoolName')?.trim() ?? '';

  if (!schoolName) {
    return Response.json(
      { error: 'schoolName parameter required' },
      { status: 400 },
    );
  }

  const idx = await loadIndex();
  if (!idx) {
    return Response.json(
      {
        data: null,
        _meta: { error: 'index unavailable', source: '학교알리미_KERIS' },
      },
      { status: 200 },
    );
  }

  const target = normalizeName(schoolName);
  const aliases = ALIAS[schoolName] ?? [];
  const allTargets = [target, ...aliases.map(normalizeName)];

  // 정확 일치
  let matched: SchoolSubjectEntry | null = null;
  let matchedCode: string | null = null;
  for (const [code, entry] of Object.entries(idx.bySchool)) {
    if (allTargets.includes(normalizeName(entry.schoolName))) {
      matched = entry;
      matchedCode = code;
      break;
    }
  }

  // 부분 일치 (정확 일치 실패 시)
  if (!matched) {
    for (const [code, entry] of Object.entries(idx.bySchool)) {
      const norm = normalizeName(entry.schoolName);
      if (allTargets.some((t) => t.length >= 3 && (norm.includes(t) || t.includes(norm)))) {
        matched = entry;
        matchedCode = code;
        break;
      }
    }
  }

  return Response.json(
    {
      data: matched
        ? {
            schoolCode: matchedCode,
            ...matched,
          }
        : null,
      _meta: {
        source: idx._meta.source,
        license: idx._meta.license,
        syncedAt: idx._meta.syncedAt,
        curriculum: idx._meta.curriculum,
        organization: '한국교육학술정보원(KERIS)',
        upstreamUrl: 'https://www.schoolinfo.go.kr',
        totalSchoolsInIndex: idx._meta.schoolCount,
        matched: !!matched,
        searchQuery: schoolName,
      },
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=3600' },
    },
  );
};
