/**
 * 보고서 영속성 — Firestore CRUD 헬퍼.
 *
 * 컬렉션 구조:
 *   reports/{userId}/items/{reportId}
 *
 * 인메모리 보고서가 새로고침으로 소실되지 않도록 인증된 사용자에 한해
 * Firestore 에 저장한다. 비인증·Firebase 비활성 환경에서는 graceful no-op.
 *
 * 만료 정책:
 *   생성일 + 30 일이 경과한 항목은 listReports 호출 시 자동 정리(best-effort).
 *
 * 결제 후에는 isPaid=true 상태로 다시 저장되어 사용자 마이페이지에서 영구 조회 가능.
 */
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit as fbLimit,
} from 'firebase/firestore';
import { db, firebaseEnabled } from '@/lib/firebase';
import type { ReportData } from '@/types/report';

const ROOT = 'reports';
const ITEMS = 'items';
const EXPIRE_DAYS = 30;

export interface SavedReportSummary {
  id: string;
  createdAt: string;
  schoolName: string;
  interest: string;
  topMajor?: string;
  isPaid: boolean;
}

function isExpired(createdAt: string): boolean {
  try {
    const t = new Date(createdAt).getTime();
    if (!Number.isFinite(t)) return false;
    const now = Date.now();
    return now - t > EXPIRE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** 보고서 1건 저장 (id 가 같으면 덮어쓰기) */
export async function saveReport(userId: string, report: ReportData): Promise<void> {
  if (!firebaseEnabled || !db || !userId || !report?.id) return;
  try {
    const ref = doc(db, ROOT, userId, ITEMS, report.id);
    // Firestore 는 undefined 를 허용하지 않으므로 JSON 직렬화로 정리
    const safe = JSON.parse(JSON.stringify(report)) as ReportData;
    await setDoc(ref, {
      ...safe,
      _createdAt: report.createdAt,
      _updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[report-storage] saveReport failed', err);
  }
}

/** 결제 완료 후 isPaid 만 업데이트 (전체 다시 저장) */
export async function markReportPaid(userId: string, report: ReportData): Promise<void> {
  if (!report) return;
  await saveReport(userId, { ...report, isPaid: true });
}

/** 단일 조회 — 새로고침 복원용 */
export async function getReport(userId: string, reportId: string): Promise<ReportData | null> {
  if (!firebaseEnabled || !db || !userId || !reportId) return null;
  try {
    const snap = await getDoc(doc(db, ROOT, userId, ITEMS, reportId));
    if (!snap.exists()) return null;
    return snap.data() as ReportData;
  } catch (err) {
    console.warn('[report-storage] getReport failed', err);
    return null;
  }
}

/** 가장 최근 보고서 1건 — 새로고침 시 자동 복원 */
export async function getLatestReport(userId: string): Promise<ReportData | null> {
  if (!firebaseEnabled || !db || !userId) return null;
  try {
    const colRef = collection(db, ROOT, userId, ITEMS);
    const q = query(colRef, orderBy('_createdAt', 'desc'), fbLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = snap.docs[0].data() as ReportData;
    if (isExpired(data.createdAt)) {
      // best-effort 만료 정리
      deleteDoc(snap.docs[0].ref).catch(() => undefined);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[report-storage] getLatestReport failed', err);
    return null;
  }
}

/** 사용자 보고서 목록 (마이페이지 용) — 만료 항목 자동 정리 */
export async function listReports(userId: string): Promise<SavedReportSummary[]> {
  if (!firebaseEnabled || !db || !userId) return [];
  try {
    const colRef = collection(db, ROOT, userId, ITEMS);
    const q = query(colRef, orderBy('_createdAt', 'desc'), fbLimit(20));
    const snap = await getDocs(q);
    const out: SavedReportSummary[] = [];
    for (const d of snap.docs) {
      const data = d.data() as ReportData;
      if (isExpired(data.createdAt)) {
        // 만료 — 결제분(isPaid)은 보존, 무료 미리보기만 정리
        if (!data.isPaid) {
          deleteDoc(d.ref).catch(() => undefined);
          continue;
        }
      }
      out.push({
        id: d.id,
        createdAt: data.createdAt,
        schoolName: data.input?.school?.name ?? '',
        interest: data.input?.interest ?? '',
        topMajor: data.sections?.majorTop10?.recommendations?.[0]?.name,
        isPaid: !!data.isPaid,
      });
    }
    return out;
  } catch (err) {
    console.warn('[report-storage] listReports failed', err);
    return [];
  }
}

/** 보고서 삭제 */
export async function deleteReport(userId: string, reportId: string): Promise<void> {
  if (!firebaseEnabled || !db || !userId || !reportId) return;
  try {
    await deleteDoc(doc(db, ROOT, userId, ITEMS, reportId));
  } catch (err) {
    console.warn('[report-storage] deleteReport failed', err);
  }
}
