/**
 * 학교 규모 분류 — 학생수 기준
 * 전국 2,419개 고교 학생수 분포 기반 (2025학년도):
 *   상위 25% = 754명 / 중앙값 = 540명 / 하위 25% = 302명
 */

import { C } from '@/lib/design-tokens';

export type SchoolSize = 'large' | 'medium' | 'small' | 'tiny';

export interface SchoolSizeMeta {
  label: string;
  description: string;
  color: string;
  bg: string;
  icon: string;
  /** 2022 개정 선택과목 운영 다양성 예상 */
  diversityHint: string;
}

export function classifySchoolSize(studentCount: number | undefined | null): SchoolSize {
  if (!studentCount) return 'tiny';
  if (studentCount >= 700) return 'large';
  if (studentCount >= 300) return 'medium';
  if (studentCount >= 100) return 'small';
  return 'tiny';
}

export function sizeMeta(size: SchoolSize): SchoolSizeMeta {
  switch (size) {
    case 'large':
      return {
        label: '대형 학교',
        description: '학생 700명 이상',
        color: '#7c3aed',
        bg: '#f3e8ff',
        icon: '◆',
        diversityHint: '다양한 선택과목 운영, 과목 선택 폭이 넓어요',
      };
    case 'medium':
      return {
        label: '중형 학교',
        description: '학생 300~700명',
        color: C.brand,
        bg: C.brandSoft,
        icon: '●',
        diversityHint: '일반적인 선택과목 운영',
      };
    case 'small':
      return {
        label: '소형 학교',
        description: '학생 100~300명',
        color: '#0891b2',
        bg: '#cffafe',
        icon: '○',
        diversityHint: '선택과목 제한적 — 공동교육과정·온라인 활용 권장',
      };
    case 'tiny':
      return {
        label: '극소형 학교',
        description: '학생 100명 미만',
        color: '#64748b',
        bg: '#f1f5f9',
        icon: '·',
        diversityHint: '핵심 과목 위주 운영 — 거점학교·온라인 필수',
      };
  }
}

/** 전국 분포 비율 (2025) */
export const SIZE_DISTRIBUTION = {
  large: 31.0,
  medium: 44.3,
  small: 17.8,
  tiny: 6.9,
} as const;
