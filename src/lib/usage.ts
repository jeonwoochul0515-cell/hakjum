const USAGE_KEY = 'hakjum_daily_usage';

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

export function canUseAI(): boolean {
  const usage = getUsage();
  return usage.count < FREE_DAILY_LIMIT;
}

export function recordAIUsage(): void {
  const usage = getUsage();
  usage.count++;
  setUsage(usage);
}

export function getRemainingUsage(): number {
  const usage = getUsage();
  return Math.max(0, FREE_DAILY_LIMIT - usage.count);
}

export function getDailyLimit(): number {
  return FREE_DAILY_LIMIT;
}
