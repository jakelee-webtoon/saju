/**
 * 답장 생성기 일일 사용량 관리
 */

const STORAGE_KEY = "reply_daily_usage";
const FREE_DAILY_LIMIT = 3;

interface DailyUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

// 오늘 날짜 (YYYY-MM-DD)
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// 저장된 사용량 가져오기
function getStoredUsage(): DailyUsage {
  if (typeof window === "undefined") {
    return { date: getTodayDate(), count: 0 };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { date: getTodayDate(), count: 0 };
    }
    
    const usage: DailyUsage = JSON.parse(stored);
    
    // 날짜가 다르면 리셋
    if (usage.date !== getTodayDate()) {
      return { date: getTodayDate(), count: 0 };
    }
    
    return usage;
  } catch {
    return { date: getTodayDate(), count: 0 };
  }
}

// 사용량 저장
function saveUsage(usage: DailyUsage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

/**
 * 오늘 남은 무료 횟수 가져오기
 */
export function getRemainingFreeCount(): number {
  const usage = getStoredUsage();
  return Math.max(0, FREE_DAILY_LIMIT - usage.count);
}

/**
 * 오늘 사용한 횟수 가져오기
 */
export function getTodayUsageCount(): number {
  return getStoredUsage().count;
}

/**
 * 무료로 사용 가능한지 확인
 */
export function canUseForFree(): boolean {
  return getRemainingFreeCount() > 0;
}

/**
 * 사용량 1 증가 (생성 시 호출)
 */
export function incrementUsage(): void {
  const usage = getStoredUsage();
  usage.count += 1;
  saveUsage(usage);
}

/**
 * 일일 무료 한도
 */
export const DAILY_FREE_LIMIT = FREE_DAILY_LIMIT;

/**
 * 화살 비용 (무료 소진 후)
 */
export const ARROW_COST_PER_REPLY = 1;
