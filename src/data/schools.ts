import rawData from '../../data/busan_all_subjects.json';
import type { School } from '@/types';

interface RawSchool {
  name: string;
  type: string;
  total_records: number;
  sample_records?: number;
  subjects_by_grade: Record<string, string[]>;
  all_subjects?: string[];
  subject_count?: number;
  status?: string;
}

const raw = rawData as unknown as Record<string, RawSchool>;

export const schools: School[] = Object.entries(raw)
  .filter(([, v]) => v.name && v.subjects_by_grade && Object.keys(v.subjects_by_grade).length > 0)
  .map(([id, v]) => ({
    id,
    name: v.name,
    type: v.type || '일반고',
    totalRecords: v.total_records,
    subjectsByGrade: v.subjects_by_grade,
    allSubjects: v.all_subjects || [],
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

export const schoolTypes = [...new Set(schools.map((s) => s.type))].sort();

export function getSchoolById(id: string): School | undefined {
  return schools.find((s) => s.id === id);
}
