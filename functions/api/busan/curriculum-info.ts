/**
 * GET /api/busan/curriculum-info?schoolName={학교명}
 *
 * 부산 고교학점제 PDF 추출 데이터 (data/busan/busan-curriculum-index.json) 기반.
 *
 * 입력 schoolName 이 부산 학교(공동교육과정 운영 안내서·우수사례집·운영 개선 방안 등에서 식별된 학교)
 * 인 경우 isBusan=true 와 함께 매칭된 학교 정보·관련 진로가이드·추천 공동교육과정 학교 목록을 반환.
 * 비부산 학교는 isBusan=false 만 반환하여 클라이언트가 BusanCurriculumPanel 을 자동 숨김.
 *
 * 응답:
 * {
 *   data: {
 *     isBusan: boolean,
 *     schoolMatched: { name, location, roles[], descriptions[] } | null,
 *     relatedGuides: [{ topic, content, source }] (3-5개),
 *     jointCurriculumSchools: [{ name, location, role }] (5개 추천)
 *   } | null,
 *   _meta: { source, license, syncedAt, totalGuides, totalSchools, ... }
 * }
 */

interface SubjectEntry {
  name: string;
  area: string;
  descriptions: string[];
  referencedIn: string[];
}
interface MajorEntry {
  name: string;
  recommendedSubjects: string[];
  notes: string[];
  referencedIn: string[];
}
interface SchoolEntry {
  name: string;
  location?: string;
  roles: string[];
  descriptions: string[];
  referencedIn: string[];
}
interface CareerGuideEntry {
  topic: string;
  content: string;
  source: string;
}

interface BusanIndex {
  _meta: {
    source: string;
    license: string;
    organization: string;
    upstreamUrl: string;
    extractedAt: string;
    syncedAt: string;
    totals: {
      uniqueSubjects: number;
      uniqueMajors: number;
      uniqueSchools: number;
      careerGuides: number;
    };
  };
  subjects: Record<string, SubjectEntry>;
  majors: Record<string, MajorEntry>;
  schools: Record<string, SchoolEntry>;
  careerGuides: CareerGuideEntry[];
}

// 부산 광역 키워드 (학교명 또는 location 매칭)
// 추출 데이터의 school.location 은 "남부Ⅰ", "북부", "해운대", "강서구", "기장군", "북구" 등 권역/구 단위.
// 클라이언트에서 넘어오는 schoolName 이 부산 인덱스에 있는지로 1차 판별,
// 보조로 학교명에 부산 지역 키워드가 포함되는지 검사.
const BUSAN_NAME_HINTS = [
  '부산',
  '해운대', '동래', '사상', '사하', '연제', '수영', '강서', '금정', '기장',
  '남구', '동구', '중구', '서구', '북구', '영도',
];

function normalizeName(s: string): string {
  return s
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, '')
    .replace(/[·•・]/g, '')
    .replace(/고등학교$/, '고')
    .toLowerCase();
}

function nameMatches(query: string, candidate: string): boolean {
  const a = normalizeName(query);
  const b = normalizeName(candidate);
  if (!a || !b) return false;
  if (a === b) return true;
  // 한쪽이 약칭("부산고") 다른쪽이 풀네임("부산고등학교") 인 경우 정규화로 같아짐.
  // 추가로 한쪽이 다른 쪽을 포함하는지 (3자 이상)
  if (a.length >= 3 && b.includes(a)) return true;
  if (b.length >= 3 && a.includes(b)) return true;
  return false;
}

function looksLikeBusanByName(schoolName: string): boolean {
  const n = schoolName.replace(/\s+/g, '');
  return BUSAN_NAME_HINTS.some((h) => n.includes(h));
}

let cached: BusanIndex | null = null;
async function loadIndex(): Promise<BusanIndex | null> {
  if (cached) return cached;
  try {
    const mod = await import('../../../data/busan/busan-curriculum-index.json', {
      with: { type: 'json' },
    });
    cached = ((mod as { default?: BusanIndex }).default ?? (mod as unknown as BusanIndex));
    return cached;
  } catch {
    return null;
  }
}

// 진로가이드 우선순위: '공동교육과정', '과목 선택', '진로', '학점이수' 등 키워드 기반 가중치
const GUIDE_PRIORITY_KEYWORDS = [
  '공동교육과정',
  '과목 선택',
  '과목선택',
  '진로',
  '수강',
  '학점이수',
  '플러스',
  '바로교실',
  '온공교실',
];

function scoreGuide(g: CareerGuideEntry): number {
  let score = 0;
  const text = `${g.topic} ${g.content}`;
  for (const kw of GUIDE_PRIORITY_KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }
  return score;
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
        _meta: { error: 'busan index unavailable', source: '부산교육청 고교학점제 지원센터' },
      },
      { status: 200 },
    );
  }

  // 1) 인덱스 학교 매칭
  let matched: SchoolEntry | null = null;
  for (const entry of Object.values(idx.schools)) {
    if (nameMatches(schoolName, entry.name)) {
      matched = entry;
      break;
    }
  }

  // 2) 부산 여부 판별
  const isBusan = !!matched || looksLikeBusanByName(schoolName);

  if (!isBusan) {
    return Response.json(
      {
        data: {
          isBusan: false,
          schoolMatched: null,
          relatedGuides: [],
          jointCurriculumSchools: [],
        },
        _meta: {
          source: idx._meta.source,
          license: idx._meta.license,
          organization: idx._meta.organization,
          upstreamUrl: idx._meta.upstreamUrl,
          syncedAt: idx._meta.syncedAt,
          totalGuides: idx._meta.totals.careerGuides,
          totalSchools: idx._meta.totals.uniqueSchools,
          searchQuery: schoolName,
        },
      },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=3600' } },
    );
  }

  // 3) 관련 진로가이드 (우선순위 정렬 → 상위 5개)
  const sortedGuides = [...idx.careerGuides]
    .sort((a, b) => scoreGuide(b) - scoreGuide(a))
    .slice(0, 5);

  // 4) 공동교육과정 추천 학교 5개
  //    매칭된 학교 자기 자신은 제외. role 에 '플러스 교육과정 협력단위' 또는 '거점' 포함된 학교 우선.
  const allSchools = Object.values(idx.schools).filter((s) =>
    !matched || s.name !== matched.name,
  );

  function priority(s: SchoolEntry): number {
    const roleText = s.roles.join(' ');
    if (roleText.includes('거점')) return 3;
    if (roleText.includes('플러스')) return 2;
    if (roleText.includes('공동교육과정')) return 1;
    return 0;
  }

  // 같은 권역 학교 우선 노출 (있으면)
  const targetLocation = matched?.location;
  const recommendedSchools = allSchools
    .sort((a, b) => {
      const sameRegionA = targetLocation && a.location === targetLocation ? 1 : 0;
      const sameRegionB = targetLocation && b.location === targetLocation ? 1 : 0;
      if (sameRegionA !== sameRegionB) return sameRegionB - sameRegionA;
      return priority(b) - priority(a);
    })
    .slice(0, 5)
    .map((s) => ({
      name: s.name,
      location: s.location,
      role: s.roles[0] ?? '',
    }));

  return Response.json(
    {
      data: {
        isBusan: true,
        schoolMatched: matched
          ? {
              name: matched.name,
              location: matched.location,
              roles: matched.roles,
              descriptions: matched.descriptions,
            }
          : null,
        relatedGuides: sortedGuides.map((g) => ({
          topic: g.topic,
          content: g.content,
          source: g.source,
        })),
        jointCurriculumSchools: recommendedSchools,
      },
      _meta: {
        source: idx._meta.source,
        license: idx._meta.license,
        organization: idx._meta.organization,
        upstreamUrl: idx._meta.upstreamUrl,
        syncedAt: idx._meta.syncedAt,
        totalGuides: idx._meta.totals.careerGuides,
        totalSchools: idx._meta.totals.uniqueSchools,
        totalSubjects: idx._meta.totals.uniqueSubjects,
        searchQuery: schoolName,
        matched: !!matched,
      },
    },
    { status: 200, headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
};
