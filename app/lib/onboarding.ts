/**
 * 온보딩 상태 관리 유틸리티
 */

const ONBOARDING_KEY = "hasCompletedOnboarding";
const FIRST_CHARACTER_REVEAL_KEY = "hasSeenCharacterReveal";

/**
 * 온보딩 완료 여부 확인
 */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true; // SSR에서는 true 반환
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

/**
 * 온보딩 완료 처리
 */
export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_KEY, "true");
}

/**
 * 온보딩 리셋 (디버그용)
 */
export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(FIRST_CHARACTER_REVEAL_KEY);
}

/**
 * 캐릭터 리빌 본 적 있는지 확인
 */
export function hasSeenCharacterReveal(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(FIRST_CHARACTER_REVEAL_KEY) === "true";
}

/**
 * 캐릭터 리빌 완료 처리
 */
export function markCharacterRevealSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIRST_CHARACTER_REVEAL_KEY, "true");
}
