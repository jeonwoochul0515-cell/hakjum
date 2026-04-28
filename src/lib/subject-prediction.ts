/**
 * 작년 데이터 기반 내년 과목 개설 예측
 *
 * 한국 고등학교 과목 운영의 안정성 가정:
 *  - 작년에 교사 1명+ 있던 과목 → 95% 내년에도 운영 (인사 변동 빼고는 거의 유지)
 *  - 작년에 교사 0명 → 90% 내년에도 미개설 (특별한 신설 결정 없으면)
 *  - 학교 규모(학생수)가 클수록 신설 가능성 약간 증가
 *
 * 출처: 학교알리미(KERIS) 2025학년도 교사 자격 정보 기반.
 *       이 모듈은 정적 휴리스틱이며 ANTHROPIC API를 호출하지 않습니다.
 */

import { classifySchoolSize } from '@/lib/school-size';
import type { SchoolSize } from '@/lib/school-size';

export type PredictionLevel =
  | 'very-high'
  | 'high'
  | 'possible'
  | 'low'
  | 'very-low';

export interface SubjectPrediction {
  subjectName: string;
  prevYearTeachers: number;
  schoolSize: SchoolSize;
  prediction: PredictionLevel;
  /** 0-100 신뢰도(%) */
  confidence: number;
  /** 학생에게 보여줄 한 줄 메시지 */
  message: string;
}

export interface PredictionMeta {
  level: PredictionLevel;
  label: string;
  /** 텍스트/아이콘 색상 */
  color: string;
  /** 칩 배경색 */
  bg: string;
  /** 짧은 아이콘 (이모지 대신 도형 문자) */
  icon: string;
}

/**
 * 예측 단계별 시각 토큰. 디자인 토큰만 사용한다는 원칙을 지키되,
 * 의미 색상(초록/노랑/빨강)은 시맨틱 신호 표현이라 직접 지정.
 */
export function predictionMeta(level: PredictionLevel): PredictionMeta {
  switch (level) {
    case 'very-high':
      return {
        level,
        label: '안정 운영',
        color: '#15803d',
        bg: '#dcfce7',
        icon: '✓',
      };
    case 'high':
      return {
        level,
        label: '운영 중',
        color: '#166534',
        bg: '#ecfdf5',
        icon: '✓',
      };
    case 'possible':
      return {
        level,
        label: '신설 가능성',
        color: '#a16207',
        bg: '#fef9c3',
        icon: '?',
      };
    case 'low':
      return {
        level,
        label: '미개설 우려',
        color: '#b91c1c',
        bg: '#fee2e2',
        icon: '!',
      };
    case 'very-low':
      return {
        level,
        label: '공동교육과정 권장',
        color: '#991b1b',
        bg: '#fecaca',
        icon: '!',
      };
  }
}

/**
 * 작년 교사 수 + 학교 규모 → 내년 개설 예측.
 *
 * 분류표:
 *   2+ 교사 / 모든 규모     → very-high (95%) "안정 운영"
 *   1  교사 / 모든 규모     → high      (85%) "운영 중"
 *   0  교사 / 대형          → possible  (40%) "신설 가능성"
 *   0  교사 / 중형·소형     → low       (10%) "미개설 우려"
 *   0  교사 / 극소형        → very-low  (5%)  "공동교육과정 권장"
 */
export function predictNextYearOpening(
  subjectName: string,
  prevYearTeacherCount: number,
  studentCount: number,
): SubjectPrediction {
  const schoolSize = classifySchoolSize(studentCount);
  const teachers = Math.max(0, Math.floor(prevYearTeacherCount || 0));

  if (teachers >= 2) {
    return {
      subjectName,
      prevYearTeachers: teachers,
      schoolSize,
      prediction: 'very-high',
      confidence: 95,
      message: `작년 담당 교사 ${teachers}명 — 내년에도 안정적으로 운영될 가능성이 매우 높아요`,
    };
  }

  if (teachers === 1) {
    return {
      subjectName,
      prevYearTeachers: teachers,
      schoolSize,
      prediction: 'high',
      confidence: 85,
      message: '작년 담당 교사 1명 — 내년에도 운영될 가능성이 높아요',
    };
  }

  // teachers === 0
  if (schoolSize === 'large') {
    return {
      subjectName,
      prevYearTeachers: 0,
      schoolSize,
      prediction: 'possible',
      confidence: 40,
      message: '작년 미운영이지만, 대형 학교는 신설 가능성이 있어요',
    };
  }

  if (schoolSize === 'tiny') {
    return {
      subjectName,
      prevYearTeachers: 0,
      schoolSize,
      prediction: 'very-low',
      confidence: 5,
      message: '작년 미운영, 극소형 학교 — 공동교육과정·온라인 수강을 권장해요',
    };
  }

  return {
    subjectName,
    prevYearTeachers: 0,
    schoolSize,
    prediction: 'low',
    confidence: 10,
    message: '작년 미운영 — 내년에도 미개설될 가능성이 높아요',
  };
}

/** 예측 결과 다수에 대한 요약 통계. */
export interface PredictionSummary {
  total: number;
  stable: number;   // very-high + high
  possible: number; // possible
  risky: number;    // low + very-low
}

export function summarizePredictions(
  predictions: readonly SubjectPrediction[],
): PredictionSummary {
  const summary: PredictionSummary = {
    total: predictions.length,
    stable: 0,
    possible: 0,
    risky: 0,
  };
  for (const p of predictions) {
    if (p.prediction === 'very-high' || p.prediction === 'high') summary.stable += 1;
    else if (p.prediction === 'possible') summary.possible += 1;
    else summary.risky += 1;
  }
  return summary;
}
