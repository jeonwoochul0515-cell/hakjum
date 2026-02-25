// 공공데이터 표준 #157 대학별학과정보
export interface EnrollmentInfo {
  schoolName: string;
  majorName: string;
  enrollmentQuota: number; // 입학정원수 (mtcltnFxnoCnt)
  graduateCount: number; // 졸업자수 (graCnt)
  region: string; // 시도명 (ctpvNm)
  schoolType: string; // 학교구분명 (schlSeNm)
  mainCourses: string; // 주요교과목명 (mainSubjNm)
  relatedJobs: string; // 관련직업명 (relatCrNm)
  duration: string; // 수업연한 (lssnTerm)
  category7: string; // 학과코드명 7대계열 (scsbjtCdNm)
  collegeName: string; // 단과대학명 (collegeNm)
  degreeType: string; // 학위과정명 (degCrseCrsNm)
}

// 공공데이터 표준 #158 대학별평균등록금정보 + #159 대학별장학금정보
export interface UniversityStats {
  schoolName: string;
  tuitionAvg?: number; // 평균등록금 (원) (avgRegAmt)
  entranceFee?: number; // 평균입학금 (원) (avgMtcltnAmt)
  scholarshipTotal?: number; // 장학금 총액 (원) (합산)
  foundationType?: string; // 설립형태 (fndnFormSeNm)
}

interface RawItem {
  [key: string]: unknown;
}

function field(item: RawItem, ...keys: string[]): string {
  for (const key of keys) {
    const val = item[key];
    if (val !== undefined && val !== null && val !== '') return String(val);
  }
  return '';
}

// #157 대학별학과정보 API
export async function getEnrollmentAPI(majorName: string): Promise<EnrollmentInfo[]> {
  try {
    const res = await fetch(`/api/university/enrollment?major=${encodeURIComponent(majorName)}`);
    if (!res.ok) return [];

    const data = await res.json();
    const items: RawItem[] = data?.items || [];
    if (items.length === 0) return [];

    return items
      .map((item) => ({
        schoolName: field(item, 'schlNm'),
        majorName: field(item, 'scsbjtNm'),
        enrollmentQuota: parseInt(field(item, 'mtcltnFxnoCnt') || '0', 10),
        graduateCount: parseInt(field(item, 'graCnt') || '0', 10),
        region: field(item, 'ctpvNm'),
        schoolType: field(item, 'schlSeNm'),
        mainCourses: field(item, 'mainSubjNm'),
        relatedJobs: field(item, 'relatCrNm'),
        duration: field(item, 'lssnTerm'),
        category7: field(item, 'scsbjtCdNm'),
        collegeName: field(item, 'collegeNm'),
        degreeType: field(item, 'degCrseCrsNm'),
      }))
      .filter((e) => e.schoolName && e.schoolType === '대학교')
      .sort((a, b) => {
        if (a.region.includes('부산') && !b.region.includes('부산')) return -1;
        if (!a.region.includes('부산') && b.region.includes('부산')) return 1;
        return b.enrollmentQuota - a.enrollmentQuota;
      });
  } catch {
    return [];
  }
}

// #158 등록금 + #159 장학금 API (표준 공공데이터)
export async function getUniversityStats(schoolNames: string[]): Promise<UniversityStats[]> {
  if (schoolNames.length === 0) return [];

  try {
    const [tuiRes, schRes] = await Promise.allSettled([
      fetch('/api/university/tuition'),
      fetch('/api/university/scholarship'),
    ]);

    const tuiItems: RawItem[] = tuiRes.status === 'fulfilled' && tuiRes.value.ok
      ? (await tuiRes.value.json())?.items || []
      : [];
    const schItems: RawItem[] = schRes.status === 'fulfilled' && schRes.value.ok
      ? (await schRes.value.json())?.items || []
      : [];

    // 학교명 매칭용 (간략화)
    const nameSet = new Set(schoolNames.map((n) => n.replace(/\s*\(.*\)$/, '').trim()));
    const matches = (name: string): boolean => {
      return nameSet.has(name) || schoolNames.includes(name);
    };

    const statsMap = new Map<string, UniversityStats>();

    // 등록금
    for (const item of tuiItems) {
      const name = field(item, 'univNm');
      const univType = field(item, 'univSeNm');
      if (!name || !matches(name) || univType !== '대학') continue;
      const avgReg = parseInt(field(item, 'avgRegAmt') || '0', 10);
      const avgEntrance = parseInt(field(item, 'avgMtcltnAmt') || '0', 10);
      if (avgReg > 0) {
        const existing = statsMap.get(name) || { schoolName: name };
        existing.tuitionAvg = avgReg;
        existing.entranceFee = avgEntrance;
        existing.foundationType = field(item, 'fndnFormSeNm');
        statsMap.set(name, existing);
      }
    }

    // 장학금 (학교별 합산)
    for (const item of schItems) {
      const name = field(item, 'univNm');
      const univType = field(item, 'univSeNm');
      if (!name || !matches(name) || univType !== '대학') continue;
      const amount = parseInt(field(item, 'schlship') || '0', 10);
      if (amount > 0) {
        const existing = statsMap.get(name) || { schoolName: name };
        existing.scholarshipTotal = (existing.scholarshipTotal || 0) + amount;
        statsMap.set(name, existing);
      }
    }

    return [...statsMap.values()];
  } catch {
    return [];
  }
}
