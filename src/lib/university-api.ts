export interface EnrollmentInfo {
  schoolName: string;
  majorName: string;
  enrollmentQuota: number; // 입학정원수
  region: string;
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
        enrollmentQuota: parseInt(extractField(item, 'enrCnt', 'entrance_cnt', 'ENTRANCE_CNT') || '0', 10),
        region: extractField(item, 'ctpvNm', 'ctpv_nm', 'CTPV_NM'),
      }))
      .filter((e) => e.schoolName && e.enrollmentQuota > 0)
      .sort((a, b) => {
        if (a.region.includes('부산') && !b.region.includes('부산')) return -1;
        if (!a.region.includes('부산') && b.region.includes('부산')) return 1;
        return b.enrollmentQuota - a.enrollmentQuota;
      });
  } catch {
    return [];
  }
}
