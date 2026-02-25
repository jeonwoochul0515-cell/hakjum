export interface EnrollmentInfo {
  schoolName: string;
  majorName: string;
  enrollmentQuota: number; // 입학정원수
  graduateCount: number; // 졸업자수
  region: string;
  schoolType: string; // 학교구분 (대학교/전문대학 등)
  mainCourses: string; // 주요교과목명
  relatedJobs: string; // 관련직업명
  duration: string; // 수업연한 (4년 등)
  category7: string; // 7대계열
}

export interface UniversityStats {
  schoolName: string;
  employmentRate?: number; // 취업률 (%)
  competitionRatio?: number; // 경쟁률
  tuition?: number; // 등록금 (만원)
  scholarship?: number; // 장학금 수혜율 (%)
}

interface RawEnrollmentItem {
  schlNm?: string;
  schl_nm?: string;
  SCHL_NM?: string;
  sbjtNm?: string;
  sbjt_nm?: string;
  SBJT_NM?: string;
  enrCnt?: string;
  entrance_cnt?: string;
  ENTRANCE_CNT?: string;
  ctpvNm?: string;
  ctpv_nm?: string;
  CTPV_NM?: string;
  [key: string]: unknown;
}

function extractField(item: RawEnrollmentItem, ...keys: string[]): string {
  for (const key of keys) {
    const val = item[key];
    if (val !== undefined && val !== null && val !== '') return String(val);
  }
  return '';
}

export async function getEnrollmentAPI(majorName: string): Promise<EnrollmentInfo[]> {
  try {
    const res = await fetch(`/api/university/enrollment?major=${encodeURIComponent(majorName)}`);
    if (!res.ok) return [];

    const data = await res.json();
    const items: RawEnrollmentItem[] = data?.items || [];

    if (items.length === 0) return [];

    return items
      .map((item) => ({
        schoolName: extractField(item, 'schlNm', 'schl_nm', 'SCHL_NM'),
        majorName: extractField(item, 'sbjtNm', 'sbjt_nm', 'SBJT_NM'),
        enrollmentQuota: parseInt(extractField(item, 'enrCnt', 'entrance_cnt', 'ENTRANCE_CNT', 'mtcltnCnt', 'MTCLTN_CNT') || '0', 10),
        graduateCount: parseInt(extractField(item, 'grdtnCnt', 'GRDTN_CNT') || '0', 10),
        region: extractField(item, 'ctpvNm', 'ctpv_nm', 'CTPV_NM'),
        schoolType: extractField(item, 'schlSeNm', 'SCHL_SE_NM'),
        mainCourses: extractField(item, 'mainCrclSbjtNm', 'MAIN_CRCL_SBJT_NM'),
        relatedJobs: extractField(item, 'rltnJobNm', 'RLTN_JOB_NM'),
        duration: extractField(item, 'clsrmYrlmt', 'CLSRM_YRLMT'),
        category7: extractField(item, 'sbjtCdNm', 'SBJT_CD_NM'),
      }))
      .filter((e) => e.schoolName)
      .sort((a, b) => {
        if (a.region.includes('부산') && !b.region.includes('부산')) return -1;
        if (!a.region.includes('부산') && b.region.includes('부산')) return 1;
        return b.enrollmentQuota - a.enrollmentQuota;
      });
  } catch {
    return [];
  }
}

// 대학알리미 API: 대학별 취업률/등록금/장학금/경쟁률
export async function getUniversityStats(schoolNames: string[]): Promise<UniversityStats[]> {
  if (schoolNames.length === 0) return [];

  try {
    // 취업률 + 등록금 + 장학금 병렬 요청
    const types = ['employment', 'tuition', 'scholarship'] as const;
    const results = await Promise.allSettled(
      types.map(async (type) => {
        const res = await fetch(`/api/university/info?type=${type}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.items || []) as Record<string, unknown>[];
      })
    );

    const [empItems, tuiItems, schItems] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : []
    );

    // 학교명 Set
    const nameSet = new Set(schoolNames.map((n) => n.replace(/대학교$|대학$/, '').trim()));

    const statsMap = new Map<string, UniversityStats>();

    const findSchoolName = (item: Record<string, unknown>): string => {
      const raw = String(item.schlKrnNm || item.SCHL_KRN_NM || item.schlNm || '');
      return raw;
    };

    const matchesAny = (name: string): boolean => {
      const short = name.replace(/대학교$|대학$/, '').trim();
      return nameSet.has(short) || schoolNames.includes(name);
    };

    // 취업률
    for (const item of empItems) {
      const name = findSchoolName(item);
      if (!name || !matchesAny(name)) continue;
      const val = parseFloat(String(item.indctVal1 || '0'));
      if (val > 0) {
        const existing = statsMap.get(name) || { schoolName: name };
        existing.employmentRate = val;
        statsMap.set(name, existing);
      }
    }

    // 등록금
    for (const item of tuiItems) {
      const name = findSchoolName(item);
      if (!name || !matchesAny(name)) continue;
      const val = parseFloat(String(item.indctVal1 || '0'));
      if (val > 0) {
        const existing = statsMap.get(name) || { schoolName: name };
        existing.tuition = Math.round(val / 10000); // 원 → 만원
        statsMap.set(name, existing);
      }
    }

    // 장학금
    for (const item of schItems) {
      const name = findSchoolName(item);
      if (!name || !matchesAny(name)) continue;
      const val = parseFloat(String(item.indctVal1 || '0'));
      if (val > 0) {
        const existing = statsMap.get(name) || { schoolName: name };
        existing.scholarship = val;
        statsMap.set(name, existing);
      }
    }

    return [...statsMap.values()];
  } catch {
    return [];
  }
}
