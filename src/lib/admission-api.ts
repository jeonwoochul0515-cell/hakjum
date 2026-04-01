import type { AdmissionResult } from '@/types';

export async function getAdmissionResults(
  university: string,
  major: string,
): Promise<AdmissionResult[]> {
  try {
    const params = new URLSearchParams({ university, major });
    const res = await fetch(`/api/admission/results?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}
