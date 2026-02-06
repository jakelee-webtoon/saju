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
  
  // state를 sessionStorage에 저장 (CSRF 방지)
  sessionStorage.setItem("naver_oauth_state", state);
  
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
