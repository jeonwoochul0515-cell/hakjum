// 도전·적정·안전 3분할 매트릭스 — 인지심리학 근거
// Bandura(1997) 자기효능감 + Gottfredson(1981) 직업포부 절충이론
// 적합도 점수만으로 줄세우는 것이 아니라, 학생이 "도전(꿈) / 적정(현실) / 안전(백업)"
// 카테고리로 사고할 수 있도록 분류해 자기효능감을 보호한다.

import { C } from '@/lib/design-tokens';

export type Tier = 'challenge' | 'fit' | 'safe';

export interface TierMeta {
  /** 한국어 라벨 (예: "도전") */
  label: string;
  /** 라벨 앞에 붙는 아이콘 글리프 (✦ ✓ ●) */
  icon: string;
  /** 배지 텍스트 색 (배경 위 흰색/짙은색) */
  color: string;
  /** 배지 배경색 */
  bg: string;
  /** 카드 보더 강조용 색 (반투명 가능) */
  border: string;
  /** 카드 보더와 어울리는 약한 배경 (섹션 헤더 등) */
  softBg: string;
  /** 한 줄 메시지 — 학생에게 보일 안내 */
  message: string;
}

/**
 * 적합도 점수(0~100)를 도전/적정/안전 티어로 분류한다.
 * - 90+ : 도전 (상위 30%) — 관심사와 가장 잘 맞아 도전해볼만함
 * - 75 ~ 89 : 적정 (중위 40%) — 현실적으로 가능성 높은 추천
 * - 60 ~ 74 : 안전 (하위 30%) — 기본기를 다지기 좋음
 * - 60 미만은 안전으로 클램프 (목록에서 제외하지 않음)
 */
export function classifyTier(matchScore: number): Tier {
  if (matchScore >= 90) return 'challenge';
  if (matchScore >= 75) return 'fit';
  return 'safe';
}

/** 정렬용 우선순위 — 도전 → 적정 → 안전 */
export const TIER_ORDER: Tier[] = ['challenge', 'fit', 'safe'];

export function tierRank(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

/**
 * 티어별 시각화 메타데이터.
 * - 적정은 디자인 토큰 C.brand 사용 (브랜드 일관성)
 * - 도전(보라) / 안전(회색)은 토큰에 없는 추가 색이라 인라인으로 정의
 */
export function tierMeta(tier: Tier): TierMeta {
  switch (tier) {
    case 'challenge':
      return {
        label: '도전',
        icon: '✦',
        color: '#ffffff',
        bg: '#7c3aed',
        border: 'rgba(124, 58, 237, 0.45)',
        softBg: '#f3eaff',
        message: '관심사와 가장 잘 맞아요. 도전해볼만해요',
      };
    case 'fit':
      return {
        label: '적정',
        icon: '✓',
        color: '#ffffff',
        bg: C.brand,
        border: 'rgba(22, 87, 214, 0.40)',
        softBg: C.brandSoft,
        message: '현실적으로 가능성 높은 추천이에요',
      };
    case 'safe':
    default:
      return {
        label: '안전',
        icon: '●',
        color: '#ffffff',
        bg: '#64748b',
        border: 'rgba(100, 116, 139, 0.40)',
        softBg: '#f1f5f9',
        message: '기본기를 다지기 좋아요',
      };
  }
}

/**
 * 대학 매트릭스용 임시 분류 — 학생 성적 입력이 없으므로
 * 일반 대학 카테고리(명문/일반/안정)를 인덱스 기반으로 임시 매핑.
 * 첫 번째 대학을 도전, 가운데를 적정, 마지막 그룹을 안전으로 시각화한다.
 */
export function classifyUniversityTier(index: number, total: number): Tier {
  if (total <= 1) return 'fit';
  const ratio = index / Math.max(total - 1, 1);
  if (ratio < 0.34) return 'challenge';
  if (ratio < 0.67) return 'fit';
  return 'safe';
}
