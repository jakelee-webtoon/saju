"use client";

import { getKakaoUser, getNaverUser } from "@/app/lib/auth";
import { auth } from "@/app/lib/firebase/config";
import { signInWithCustomToken, getIdToken as getFirebaseIdToken } from "firebase/auth";

/**
 * Firebase ID 토큰을 가져옵니다.
 * 서버에서 커스텀 토큰을 생성하고, 클라이언트에서 Firebase Auth로 로그인한 후 ID 토큰을 반환합니다.
 */
export async function getIdToken(): Promise<string> {
  // 현재 로그인한 사용자 정보 가져오기
  const kakaoUser = getKakaoUser();
  const naverUser = getNaverUser();
  
  if (!kakaoUser && !naverUser) {
    throw new Error("로그인이 필요합니다");
  }
  
  const userId = kakaoUser?.id || naverUser?.id;
  const provider = kakaoUser ? "kakao" : "naver";
  
  // 서버에서 커스텀 토큰 생성 API 호출
  const response = await fetch("/api/auth/custom-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, provider }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "토큰 생성 실패" }));
    throw new Error(error.error || "토큰 생성 실패");
  }
  
  const data = await response.json();
  const customToken = data.token;
  
  // 커스텀 토큰으로 Firebase Auth 로그인
  const userCredential = await signInWithCustomToken(auth, customToken);
  
  // ID 토큰 가져오기
  const idToken = await getFirebaseIdToken(userCredential.user);
  
  return idToken;
}
