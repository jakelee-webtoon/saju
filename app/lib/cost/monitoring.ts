/**
 * 비용 모니터링 유틸리티
 */

/**
 * 비용 한도 체크
 */
export function validateCostLimit(): {
  allowed: boolean;
  error?: string;
} {
  // 개발 환경에서는 항상 허용
  if (process.env.NODE_ENV === "development") {
    return { allowed: true };
  }

  // 프로덕션에서는 환경 변수에서 한도 확인
  const dailyLimit = process.env.DAILY_COST_LIMIT 
    ? parseFloat(process.env.DAILY_COST_LIMIT) 
    : 100; // 기본값: $100

  // TODO: 실제 비용 집계 로직 구현
  // 현재는 항상 허용 (실제 구현 필요)
  return { allowed: true };
}
