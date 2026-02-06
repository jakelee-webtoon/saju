"use client";

// 카카오 SDK 타입 선언
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Auth: {
        authorize: (options: { redirectUri: string; scope?: string }) => void;
        logout: (callback?: () => void) => void;
      };
      API: {
        request: (options: {
          url: string;
          success?: (response: KakaoUserResponse) => void;
          fail?: (error: Error) => void;
        }) => void;
      };
    };
  }
}

export interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    email?: string;
  };
}

export interface KakaoUser {
  id: string;
  nickname: string;
  profileImage?: string;
  email?: string;
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";
const REDIRECT_URI = typeof window !== "undefined" 
  ? `${window.location.origin}/api/auth/kakao/callback`
  : "";

// localStorage 키
const KAKAO_USER_KEY = "kakaoUser";
const KAKAO_ACCESS_TOKEN_KEY = "kakaoAccessToken";

/**
 * 카카오 SDK 초기화
 */
export function initKakao(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot initialize Kakao on server side"));
      return;
    }

    // 이미 초기화되어 있으면 바로 resolve
    if (window.Kakao?.isInitialized()) {
      resolve();
      return;
    }

    // SDK 스크립트가 이미 로드되어 있는지 확인
    if (window.Kakao) {
      if (!KAKAO_JS_KEY) {
        reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY is not set"));
        return;
      }
      window.Kakao.init(KAKAO_JS_KEY);
      resolve();
      return;
    }

    // SDK 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js";
    script.async = true;
    script.onload = () => {
      if (!KAKAO_JS_KEY) {
        reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY is not set"));
        return;
      }
      window.Kakao.init(KAKAO_JS_KEY);
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Kakao SDK"));
    document.head.appendChild(script);
  });
}

/**
 * 카카오 로그인 페이지로 이동
 */
export function loginWithKakao(): void {
  if (typeof window === "undefined" || !window.Kakao?.isInitialized()) {
    console.error("Kakao SDK is not initialized");
    return;
  }

  window.Kakao.Auth.authorize({
    redirectUri: REDIRECT_URI,
    scope: "profile_nickname,profile_image",
  });
}

/**
 * 로그인된 사용자 정보 저장
 */
export function saveKakaoUser(user: KakaoUser, accessToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KAKAO_USER_KEY, JSON.stringify(user));
  if (accessToken) {
    localStorage.setItem(KAKAO_ACCESS_TOKEN_KEY, accessToken);
  }
}

/**
 * 저장된 사용자 정보 가져오기
 */
export function getKakaoUser(): KakaoUser | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(KAKAO_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as KakaoUser;
  } catch {
    return null;
  }
}

/**
 * 로그인 여부 확인
 */
export function isLoggedIn(): boolean {
  return getKakaoUser() !== null;
}

/**
 * 로그아웃
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KAKAO_USER_KEY);
  localStorage.removeItem(KAKAO_ACCESS_TOKEN_KEY);
  
  // 카카오 SDK 로그아웃 (선택적)
  if (window.Kakao?.isInitialized()) {
    try {
      window.Kakao.Auth.logout();
    } catch (e) {
      // 무시
    }
  }
}
