/**
 * 자가탐색 결과 저장소.
 *
 * 비인증 사용자: sessionStorage (브라우저 탭 종료 시 삭제)
 * 인증 사용자: Firestore + sessionStorage 동기화
 *
 * Firestore 경로: users/{uid}/selfExploration/latest
 *
 * 라이브러리 추가 없이 firebase/firestore의 기존 임포트를 사용한다.
 */
import { db, firebaseEnabled } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { RiasecResult } from './riasec';
import type { StrengthsResult } from './strengths';
import type { ValuesResult } from './values';

export interface SelfExplorationData {
  riasec?: RiasecResult;
  strengths?: StrengthsResult;
  values?: ValuesResult;
  /** 마지막 갱신 시각 (ISO) */
  updatedAt: string;
}

const SESSION_KEY = 'hakjum_self_exploration';

export function loadFromSession(): SelfExplorationData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SelfExplorationData;
  } catch {
    return null;
  }
}

export function saveToSession(data: SelfExplorationData) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage quota — graceful 무시
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function loadFromFirestore(uid: string): Promise<SelfExplorationData | null> {
  if (!firebaseEnabled || !db) return null;
  try {
    const ref = doc(db, 'users', uid, 'selfExploration', 'latest');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as SelfExplorationData;
  } catch {
    return null;
  }
}

export async function saveToFirestore(uid: string, data: SelfExplorationData): Promise<void> {
  if (!firebaseEnabled || !db) return;
  try {
    const ref = doc(db, 'users', uid, 'selfExploration', 'latest');
    await setDoc(ref, data, { merge: true });
  } catch {
    // 네트워크/권한 실패는 sessionStorage 폴백으로 처리
  }
}

/**
 * 부분 업데이트 — 한 개 검사 결과만 갱신.
 * @param uid 인증 사용자 UID (없으면 sessionStorage만)
 * @param partial 갱신할 검사 결과
 */
export async function updateSelfExploration(
  uid: string | null | undefined,
  partial: Partial<Omit<SelfExplorationData, 'updatedAt'>>,
): Promise<SelfExplorationData> {
  const current = loadFromSession() ?? { updatedAt: new Date().toISOString() };
  const next: SelfExplorationData = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveToSession(next);
  if (uid) await saveToFirestore(uid, next);
  return next;
}

/**
 * 인증 사용자: Firestore 우선 로드 → sessionStorage 동기화.
 * 비인증: sessionStorage만 로드.
 */
export async function loadSelfExploration(uid: string | null | undefined): Promise<SelfExplorationData | null> {
  if (uid) {
    const remote = await loadFromFirestore(uid);
    if (remote) {
      saveToSession(remote);
      return remote;
    }
  }
  return loadFromSession();
}
