/**
 * 비용 추적 유틸리티
 */

import { NextRequest } from "next/server";

/**
 * 세션 ID를 가져오거나 생성
 */
export function getOrCreateSessionId(request: NextRequest): string {
  // 요청 헤더에서 세션 ID 가져오기
  const sessionId = request.headers.get("x-session-id");
  if (sessionId) {
    return sessionId;
  }

  // 세션 ID가 없으면 생성 (간단한 UUID 생성)
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return newSessionId;
}

/**
 * 비용 추적
 */
export function trackCost(
  sessionId: string,
  feature: string,
  promptTokens: number,
  completionTokens: number,
  endpoint: string,
  identifier?: string
): void {
  // 개발 환경에서는 콘솔에만 로그
  if (process.env.NODE_ENV === "development") {
    console.log("[Cost Tracking]", {
      sessionId,
      feature,
      promptTokens,
      completionTokens,
      endpoint,
      identifier,
      totalTokens: promptTokens + completionTokens,
    });
  }
  
  // 프로덕션에서는 필요시 데이터베이스나 로깅 서비스에 저장
  // TODO: 실제 비용 추적 로직 구현
}
