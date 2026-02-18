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
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
        sendCustom: (options: { templateId: number; templateArgs?: Record<string, string> }) => void;
      };
    };
  }
}

// 카카오 공유 옵션 타입
export interface KakaoShareOptions {
  objectType: "feed" | "list" | "location" | "commerce" | "text";
  content?: {
    title: string;
    description?: string;
    imageUrl?: string;
    link: {
      mobileWebUrl?: string;
      webUrl?: string;
    };
  };
  itemContent?: {
    profileText?: string;
    profileImageUrl?: string;
    titleImageText?: string;
    titleImageUrl?: string;
    titleImageCategory?: string;
    items?: Array<{ item: string; itemOp: string }>;
    sum?: string;
    sumOp?: string;
  };
  social?: {
    likeCount?: number;
    commentCount?: number;
    sharedCount?: number;
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl?: string;
      webUrl?: string;
    };
  }>;
  text?: string;
  link?: {
    mobileWebUrl?: string;
    webUrl?: string;
  };
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
 * CSRF 방지용 state 생성
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * 카카오 로그인 페이지로 이동 (CSRF 보호 포함)
 */
export function loginWithKakao(): void {
  if (typeof window === "undefined" || !window.Kakao?.isInitialized()) {
    console.error("Kakao SDK is not initialized");
    return;
  }

  // CSRF 방지를 위한 state 생성 및 저장
  const state = generateState();
  sessionStorage.setItem("kakao_oauth_state", state);

  // Kakao SDK는 state를 직접 지원하지 않으므로, 
  // 서버 사이드에서 state를 검증할 수 있도록 쿠키에도 저장
  document.cookie = `kakao_oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;

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

/**
 * 카카오톡 공유하기 (Feed 타입)
 */
export interface KakaoShareParams {
  title: string;
  description: string;
  imageUrl?: string;
  buttonTitle?: string;
  webUrl?: string;
}

export async function shareToKakao(params: KakaoShareParams): Promise<boolean> {
  try {
    // SDK 초기화 확인
    if (typeof window === "undefined") {
      console.error("Cannot share on server side");
      return false;
    }

    // SDK가 초기화되지 않았으면 초기화
    if (!window.Kakao?.isInitialized()) {
      await initKakao();
    }

    const webUrl = params.webUrl || window.location.href;
    
    // Feed 타입 공유
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: params.title,
        description: params.description,
        imageUrl: params.imageUrl || "https://saju-kuum.vercel.app/og-image.png",
        link: {
          mobileWebUrl: webUrl,
          webUrl: webUrl,
        },
      },
      buttons: [
        {
          title: params.buttonTitle || "나도 해보기",
          link: {
            mobileWebUrl: webUrl,
            webUrl: webUrl,
          },
        },
      ],
    });

    return true;
  } catch (error) {
    console.error("Kakao share failed:", error);
    return false;
  }
}

/**
 * 텍스트 타입 카카오톡 공유 (간단한 텍스트)
 */
export async function shareTextToKakao(text: string, webUrl?: string): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;

    if (!window.Kakao?.isInitialized()) {
      await initKakao();
    }

    const url = webUrl || window.location.href;

    window.Kakao.Share.sendDefault({
      objectType: "text",
      text: text,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    });

    return true;
  } catch (error) {
    console.error("Kakao text share failed:", error);
    return false;
  }
}
