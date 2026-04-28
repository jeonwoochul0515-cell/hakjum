/**
 * 시즌 자동 감지 — 한국 고등학교 수강신청 cycle 기반
 *
 * 한국 고등학교의 수강신청 흐름:
 *   - 11월 ~ 12월 중반   → 학교 안내서 배포 + 학생 신청 (early-application)
 *   - 12월 후반 ~ 2월     → NEIS 부분 등록, 시간표 확정 단계 (confirmation)
 *   - 3월                 → 새 학기 시작 (new-semester)
 *   - 6월 ~ 7월           → 2학기 신청 준비 (summer-prep)
 *   - 그 외               → regular
 *
 * 학교알리미·NEIS는 신청 시즌으로부터 ~5개월 후 공시되므로 11월~다음해 4월은
 * 공식 데이터로 알 수 없는 "정보 공백 기간"이다. 이 기간에 PDF 업로드(옵션 B),
 * 시도 공동교육과정 안내, 작년 데이터 기반 예측을 강조해야 한다.
 *
 * 이 모듈은 SSR/테스트 편의를 위해 모든 함수가 선택적 `now: Date` 인자를 받는다.
 */

export type Season =
  | 'early-application'
  | 'confirmation'
  | 'new-semester'
  | 'summer-prep'
  | 'regular';

export interface SeasonInfo {
  season: Season;
  /** 0=Jan, 11=Dec */
  month: number;
  /** 1-31 */
  day: number;
  /** 사람이 읽는 라벨 (UI 표시용) */
  label: string;
  /** 카드/배너에서 쓸 짧은 설명 */
  description: string;
}

const LABELS: Record<Season, { label: string; description: string }> = {
  'early-application': {
    label: '수강신청 시즌',
    description: '학교 안내서 배포·신청이 활발한 시기예요',
  },
  'confirmation': {
    label: '신청 확정 시즌',
    description: '신청 결과·시간표가 확정되는 시기예요',
  },
  'new-semester': {
    label: '새 학기 시작',
    description: '한 해 과목이 본격 시작되는 시기예요',
  },
  'summer-prep': {
    label: '2학기 준비 시즌',
    description: '2학기 시간표·과목을 다시 점검할 시기예요',
  },
  'regular': {
    label: '평시',
    description: '추천·탐색을 자유롭게 활용해 보세요',
  },
};

/**
 * 주어진 시점(기본 현재)을 기준으로 현재 시즌을 반환한다.
 *
 * 경계 규칙 (월은 0-base = JavaScript Date 표준):
 *   - 11월 1일 ~ 12월 14일             → early-application
 *   - 12월 15일 ~ (다음해) 2월 말         → confirmation
 *   - 3월 1일 ~ 3월 31일                → new-semester
 *   - 6월 1일 ~ 7월 31일                → summer-prep
 *   - 그 외 (4월, 5월, 8월~10월)        → regular
 */
export function getCurrentSeason(now: Date = new Date()): SeasonInfo {
  const month = now.getMonth();
  const day = now.getDate();
  const season = classify(month, day);
  const meta = LABELS[season];
  return {
    season,
    month,
    day,
    label: meta.label,
    description: meta.description,
  };
}

function classify(month: number, day: number): Season {
  // 11월: 전체
  if (month === 10) return 'early-application';
  // 12월: 1~14일은 early-application, 15일 이후 confirmation
  if (month === 11) return day <= 14 ? 'early-application' : 'confirmation';
  // 1, 2월
  if (month === 0 || month === 1) return 'confirmation';
  // 3월
  if (month === 2) return 'new-semester';
  // 6, 7월
  if (month === 5 || month === 6) return 'summer-prep';
  // 4, 5, 8, 9, 10(이미 위에서 처리됨) 등
  return 'regular';
}

/**
 * 11월 ~ 12월 (전체) 동안 true.
 *
 * 학교 안내서 배포부터 신청 직후까지를 모두 포함하여 시즌 배너 노출 기준이 된다.
 * 12월 후반은 confirmation 시즌이지만 신청 안내가 여전히 유효하므로 함께 노출한다.
 */
export function isApplicationSeason(now: Date = new Date()): boolean {
  const month = now.getMonth();
  return month === 10 || month === 11;
}

/**
 * NEIS·학교알리미 공시가 비어 있는 "정보 공백" 기간 (11월 ~ 다음해 4월) 감지.
 * 다른 컴포넌트에서 "작년 데이터 기준" 안내를 띄울 때 활용 가능.
 */
export function isInformationGapSeason(now: Date = new Date()): boolean {
  const month = now.getMonth();
  return month === 10 || month === 11 || month <= 3;
}
