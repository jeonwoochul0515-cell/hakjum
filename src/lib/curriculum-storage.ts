/**
 * 학생이 업로드한 학교 교육과정 PDF에서 AI가 추출한 과목 데이터를
 * sessionStorage에 저장/로드하는 헬퍼.
 *
 * NEIS 시간표 데이터보다 우선 사용 (= 학교가 직접 배포한 운영계획서이므로).
 */

const STORAGE_KEY = 'hakjum-uploaded-curriculum';

export interface UploadedCurriculumSubject {
  name: string;
  area: string;
  grade: number | null;
  semester: number | null;
  status: '개설' | '미개설';
}

export interface UploadedCurriculum {
  schoolName: string;
  subjects: UploadedCurriculumSubject[];
  meta: {
    source: 'hakjum-ai-pdf-extract';
    syncedAt: string; // ISO
    model?: string;
  };
}

export function saveUploadedCurriculum(data: UploadedCurriculum): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // QuotaExceeded 등 — 무시
  }
}

export function getUploadedCurriculum(): UploadedCurriculum | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UploadedCurriculum>;
    if (
      !parsed ||
      typeof parsed.schoolName !== 'string' ||
      !Array.isArray(parsed.subjects) ||
      !parsed.meta
    ) {
      return null;
    }
    return parsed as UploadedCurriculum;
  } catch {
    return null;
  }
}

export function clearUploadedCurriculum(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * RequiredSubjectsView 등에서 학교 개설과목 매칭에 사용할 수 있도록
 * "개설" 상태인 과목명 배열만 반환.
 */
export function getUploadedOpenSubjectNames(): string[] {
  const data = getUploadedCurriculum();
  if (!data) return [];
  return data.subjects.filter((s) => s.status === '개설').map((s) => s.name);
}
