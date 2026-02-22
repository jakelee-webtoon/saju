/**
 * 인증 관련 유틸리티
 */
export * from './kakao';
export * from './naver';

import { getKakaoUser } from './kakao';
import { getNaverUser } from './naver';

/**
 * 카카오 또는 네이버 로그인 여부 확인 (통합)
 */
export function isAnyLoggedIn(): boolean {
  return getKakaoUser() !== null || getNaverUser() !== null;
}

/**
 * 현재 로그인한 사용자 ID 가져오기 (카카오 또는 네이버)
 */
export function getCurrentUserId(): string | null {
  const kakaoUser = getKakaoUser();
  if (kakaoUser) return kakaoUser.id;
  
  const naverUser = getNaverUser();
  if (naverUser) return naverUser.id;
  
  return null;
}
