/**
 * 클라이언트 사이드 비용 추적 유틸리티
 */

/**
 * 세션 헤더 가져오기
 */
export async function getSessionHeaders(): Promise<HeadersInit> {
  // 클라이언트 사이드에서는 세션 ID를 생성하거나 가져오기
  let sessionId = sessionStorage.getItem("session_id");
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("session_id", sessionId);
  }
  
  return {
    "x-session-id": sessionId,
  };
}
