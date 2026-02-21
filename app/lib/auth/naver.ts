"use client";

export interface NaverUser {
  id: string;
  nickname: string;
  profileImage?: string;
  email?: string;
  provider: "naver";
}

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "";

// localStorage 키
const NAVER_USER_KEY = "naverUser";
const NAVER_ACCESS_TOKEN_KEY = "naverAccessToken";

/**
 * 네이버 로그인 URL 생성
 */
function getNaverLoginUrl(): string {
  if (typeof window === "undefined") return "";
  
  const redirectUri = `${window.location.origin}/api/auth/naver/callback`;
  const state = generateState();
  
  // state를 sessionStorage에 저장 (클라이언트 검증용)
  sessionStorage.setItem("naver_oauth_state", state);
  
  // state를 쿠키에도 저장 (서버 사이드 검증용)
  document.cookie = `naver_oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;
  
  const params = new URLSearchParams({
    response_type: "code",
    client_id: NAVER_CLIENT_ID,
    redirect_uri: redirectUri,
    state: state,
  });
  
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

/**
 * CSRF 방지용 state 생성
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 네이버 로그인 페이지로 이동
 */
export function loginWithNaver(): void {
  if (typeof window === "undefined") return;
  
  if (!NAVER_CLIENT_ID) {
    console.error("NEXT_PUBLIC_NAVER_CLIENT_ID is not set");
    alert("네이버 로그인 설정이 필요합니다.");
    return;
  }
  
  const loginUrl = getNaverLoginUrl();
  window.location.href = loginUrl;
}

/**
 * 네이버 사용자 정보 저장
 */
export function saveNaverUser(user: NaverUser, accessToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAVER_USER_KEY, JSON.stringify(user));
  if (accessToken) {
    localStorage.setItem(NAVER_ACCESS_TOKEN_KEY, accessToken);
  }
}

/**
 * 저장된 네이버 사용자 정보 가져오기
 */
export function getNaverUser(): NaverUser | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(NAVER_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as NaverUser;
  } catch {
    return null;
  }
}

/**
 * 네이버 로그인 여부 확인
 */
export function isNaverLoggedIn(): boolean {
  return getNaverUser() !== null;
}

/**
 * 네이버 로그아웃
 */
export function logoutNaver(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NAVER_USER_KEY);
  localStorage.removeItem(NAVER_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem("naver_oauth_state");
  
  // 쿠키 삭제
  document.cookie = "naver_oauth_state=; path=/; max-age=0";
  document.cookie = "oauth_user=; path=/; max-age=0";
  document.cookie = "oauth_token=; path=/; max-age=0";
}

/**
 * 네이버 로그인 캐시 완전 삭제 (다른 계정으로 로그인하기 위해)
 */
export async function clearNaverCache(): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    // Firebase Auth 로그아웃 (비동기)
    try {
      const { auth } = await import("@/app/lib/firebase/config");
      const { signOut } = await import("firebase/auth");
      if (auth.currentUser) {
        await signOut(auth);
        console.log("✅ Firebase Auth 로그아웃 완료");
      }
    } catch (firebaseError) {
      console.warn("Firebase Auth 로그아웃 실패 (무시 가능):", firebaseError);
    }
    
    // localStorage 삭제
    localStorage.removeItem(NAVER_USER_KEY);
    localStorage.removeItem(NAVER_ACCESS_TOKEN_KEY);
    localStorage.removeItem("loginRedirect");
    
    // sessionStorage 삭제
    sessionStorage.removeItem("naver_oauth_state");
    sessionStorage.removeItem("session_id");
    
    // 쿠키 삭제 (모든 가능한 경로와 도메인 조합으로 삭제)
    const cookiesToDelete = [
      "naver_oauth_state",
      "oauth_user",
      "oauth_token",
    ];
    
    cookiesToDelete.forEach(cookieName => {
      // 현재 경로로 삭제
      document.cookie = `${cookieName}=; path=/; max-age=0`;
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // 루트 경로로 삭제
      document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; max-age=0`;
      document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // localhost 특별 처리
      if (window.location.hostname === "localhost") {
        document.cookie = `${cookieName}=; path=/; domain=localhost; max-age=0`;
        document.cookie = `${cookieName}=; path=/; domain=.localhost; max-age=0`;
      }
    });
    
    console.log("✅ 네이버 로그인 캐시가 모두 삭제되었습니다.", {
      localStorage: {
        naverUser: localStorage.getItem(NAVER_USER_KEY),
        naverToken: localStorage.getItem(NAVER_ACCESS_TOKEN_KEY),
      },
      sessionStorage: {
        state: sessionStorage.getItem("naver_oauth_state"),
      },
      cookies: document.cookie,
    });
  } catch (error) {
    console.error("캐시 삭제 중 오류:", error);
  }
}

/**
 * 저장된 state 검증
 */
export function verifyState(state: string): boolean {
  if (typeof window === "undefined") return false;
  const savedState = sessionStorage.getItem("naver_oauth_state");
  sessionStorage.removeItem("naver_oauth_state");
  return savedState === state;
}
