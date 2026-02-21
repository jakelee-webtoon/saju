"use client";

import { getKakaoUser, getNaverUser } from "@/app/lib/auth";

/**
 * 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
 * @returns { oderId: string } | null
 */
export async function getCurrentUserProfile(): Promise<{ oderId: string } | null> {
  const kakaoUser = getKakaoUser();
  const naverUser = getNaverUser();
  
  if (!kakaoUser && !naverUser) {
    return null;
  }
  
  const oderId = kakaoUser?.id || naverUser?.id;
  
  if (!oderId) {
    return null;
  }
  
  return { oderId };
}
