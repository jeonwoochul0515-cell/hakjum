const USAGE_KEY = 'hakjum_daily_usage';
const PAID_KEY = 'hakjum_paid_status';
const UNLIMITED_KEY = 'hakjum_unlimited_ai';

interface DailyUsage {
  date: string; // YYYY-MM-DD in KST
  count: number;
}

const FREE_DAILY_LIMIT = 3;

function getKSTDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function getUsage(): DailyUsage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) {
      const usage: DailyUsage = JSON.parse(raw);
      if (usage.date === getKSTDate()) return usage;
    }
  } catch { /* ignore */ }
  return { date: getKSTDate(), count: 0 };
}

function setUsage(usage: DailyUsage): void {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch { /* ignore */ }
}

/** AuthContext에서 로그인/구독 상태 변경 시 호출 */
export function setPaidStatus(isPaid: boolean): void {
  try {
    localStorage.setItem(PAID_KEY, isPaid ? '1' : '0');
  } catch { /* ignore */ }
}

export function setUnlimitedAI(unlimited: boolean): void {
  try {
    localStorage.setItem(UNLIMITED_KEY, unlimited ? '1' : '0');
  } catch { /* ignore */ }
}

function isUnlimitedAI(): boolean {
  try {
    return localStorage.getItem(UNLIMITED_KEY) === '1';
  } catch { return false; }
}

function isPaid(): boolean {
  try {
    return localStorage.getItem(PAID_KEY) === '1';
  } catch { return false; }
}

export function canUseAI(): boolean {
  if (isPaid() && isUnlimitedAI()) return true; // 올인원: 무제한
  if (isPaid()) return true; // 유료: 하루 제한 없음 (리포트 플랜도 AI는 자유)
  const usage = getUsage();
  return usage.count < FREE_DAILY_LIMIT;
}

export function recordAIUsage(): void {
  if (isPaid()) return; // 유료 사용자는 카운트 안 함
  const usage = getUsage();
  usage.count++;
  setUsage(usage);
}

export function getRemainingUsage(): number {
  if (isPaid()) return Infinity;
  const usage = getUsage();
  return Math.max(0, FREE_DAILY_LIMIT - usage.count);
}

export function getDailyLimit(): number {
  return isPaid() ? Infinity : FREE_DAILY_LIMIT;
}
