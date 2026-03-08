// 커리어넷 적성검사 API 클라이언트

import type { AptitudeQuestion, AptitudeResult } from '@/types';

// 검사 문항 조회
export async function fetchAptitudeQuestions(testCode = '31'): Promise<AptitudeQuestion[]> {
  const res = await fetch(`/api/career/aptitude-questions?q=${testCode}`);
  if (!res.ok) throw new Error('Failed to fetch aptitude questions');

  const data = await res.json();

  // 커리어넷 API 응답 파싱: RESULT 배열에서 문항 추출
  const rows = data?.RESULT || [];

  return rows.map((row: Record<string, string | number>) => ({
    questionNo: Number(row.qitemNo || row.QITEM_NO || 0),
    question: String(row.question || row.QUESTION || ''),
    answers: parseAnswers(row),
  }));
}

function parseAnswers(row: Record<string, string | number>): { answerNo: number; answer: string }[] {
  const answers: { answerNo: number; answer: string }[] = [];

  // 커리어넷 v1: answer01 ~ answer09 형태
  for (let i = 1; i <= 9; i++) {
    const key = `answer${String(i).padStart(2, '0')}`;
    const altKey = `ANSWER${String(i).padStart(2, '0')}`;
    const val = row[key] || row[altKey];
    if (val && String(val).trim()) {
      answers.push({ answerNo: i, answer: String(val).trim() });
    }
  }

  // answerScore01 ~ answerScore09 형태인 경우 (점수형)
  if (answers.length === 0) {
    for (let i = 1; i <= 9; i++) {
      const scoreKey = `answerScore${String(i).padStart(2, '0')}`;
      const val = row[scoreKey];
      if (val !== undefined && val !== null && val !== '') {
        answers.push({ answerNo: Number(val), answer: String(val) });
      }
    }
  }

  return answers;
}

// 검사 결과 제출
export async function submitAptitudeAnswers(payload: {
  qestrnSeq: string;
  trgetSe: string;
  gender: string;
  grade: string;
  startDtm: number;
  answers: string; // "1=3 2=5 3=2 ..." 형식
}): Promise<AptitudeResult> {
  const res = await fetch('/api/career/aptitude-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to submit aptitude answers');

  const data = await res.json();

  if (data?.SUCC_YN !== 'Y') {
    throw new Error(data?.ERROR_REASON || 'Aptitude submission failed');
  }

  return {
    url: data.RESULT?.url || '',
    inspctSeq: String(data.RESULT?.inspctSeq || ''),
  };
}
