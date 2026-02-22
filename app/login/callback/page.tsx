"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  saveKakaoUser,
  type KakaoUser,
  saveNaverUser,
  verifyState,
  type NaverUser,
} from "@/app/lib/auth";
import {
  handleUserLogin,
  incrementLoginCount,
} from "@/app/lib/firebase/userService";
import { hasCompletedOnboarding as checkLocalOnboarding } from "@/app/lib/onboarding";
import { syncPartnersFromFirestore } from "@/app/lib/cupid/partnersStorage";

type SocialUser = KakaoUser | NaverUser;
type Provider = "kakao" | "naver";

/**
 * 안전한 JSON 파싱 유틸리티
 */
function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * 쿠키 읽기 유틸리티
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

/**
 * Provider 값 정규화 (화이트리스트 검증)
 */
function normalizeProvider(p: string | null): Provider {
  return p === "naver" ? "naver" : "kakao";
}

/**
 * OAuth 쿠키 정리
 */
function clearOauthCookies() {
  // path를 맞춰야 확실히 지워집니다 (domain도 썼다면 domain도 맞춰야 함)
  document.cookie = "oauth_user=; path=/; max-age=0";
  document.cookie = "oauth_token=; path=/; max-age=0";
}

/**
 * User 객체 유효성 검증 (Provider별 필드 체크)
 */
function isValidUser(u: unknown, p: Provider): u is SocialUser {
  if (!u || typeof u !== "object") return false;
  const obj = u as Record<string, unknown>;
  
  // 필수 필드 체크
  if (!obj.id || typeof obj.id !== "string") return false;
  if (!obj.nickname || typeof obj.nickname !== "string") return false;
  
  // Naver는 provider 필드가 있어야 함
  if (p === "naver") {
    if (obj.provider !== "naver") return false;
  }
  
  return true;
}

/**
 * NaverUser 타입 가드
 */
function isNaverUser(u: SocialUser): u is NaverUser {
  return "provider" in u && u.provider === "naver";
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("로그인 중...");
  const ranRef = useRef(false);

  // searchParams는 객체라 deps로 넣으면 미묘하게 재실행될 수 있어 string으로 고정
  const query = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    // React StrictMode에서 중복 실행 방지
    if (ranRef.current) return;
    ranRef.current = true;

    async function processLogin() {
      try {
        const sp = new URLSearchParams(query);
        const provider = normalizeProvider(sp.get("provider"));
        const state = sp.get("state");

        const userCookie = getCookie("oauth_user");
        const tokenCookie = getCookie("oauth_token");

        const userParam = sp.get("user");
        const tokenParam = sp.get("token");

        const userStrRaw = userCookie ?? (userParam ? decodeURIComponent(userParam) : null);
        const token = tokenCookie ?? (tokenParam ? decodeURIComponent(tokenParam) : null);

        if (!userStrRaw || !token) {
          router.replace("/login?error=missing_params");
          return;
        }

        const user = safeParseJson<SocialUser>(userStrRaw);
        if (!user || !isValidUser(user, provider)) {
          router.replace("/login?error=parse_failed");
          return;
        }

        // 쿠키에서 왔든 아니든, 가능하면 정리
        if (userCookie || tokenCookie) clearOauthCookies();

        // 네이버 state 검증 (※ 이상적으로는 서버에서 해야 함)
        if (provider === "naver") {
          if (!state) {
            router.replace("/login?error=missing_state");
            return;
          }
          if (!verifyState(state)) {
            console.warn("⚠️ State verification failed - possible CSRF");
            router.replace("/login?error=invalid_state");
            return;
          }
        }

        // localStorage 저장 (타입 가드 사용)
        if (provider === "naver") {
          if (isNaverUser(user)) {
            saveNaverUser(user, token);
          } else {
            router.replace("/login?error=invalid_user_type");
            return;
          }
        } else {
          saveKakaoUser(user, token);
        }

        setStatus("데이터 동기화 중...");
        const firebaseUser = await handleUserLogin(
          user.id,
          provider,
          user.nickname,
          user.profileImage,
          user.email
        );

        if (firebaseUser) {
          await incrementLoginCount(firebaseUser.oderId);

          setStatus("상대 정보 불러오는 중...");
          await syncPartnersFromFirestore();
        }

        const savedRedirect = localStorage.getItem("loginRedirect");
        localStorage.removeItem("loginRedirect");

        const localOnboardingDone = checkLocalOnboarding();
        const firebaseOnboardingDone = firebaseUser?.hasCompletedOnboarding ?? false;

        // Firebase에 사주 정보가 있으면 온보딩 완료로 간주
        // 로컬 온보딩 상태와 Firebase 상태가 불일치하는 경우, Firebase 우선
        if (!firebaseOnboardingDone) {
          router.replace("/?newUser=true");
        } else {
          router.replace(savedRedirect || "/");
        }
      } catch (e) {
        console.error("Login callback error:", e);
        // 에러 타입별 처리
        const errorCode = e instanceof Error 
          ? (e.message.includes("network") || e.message.includes("fetch") 
              ? "network_error" 
              : "unknown")
          : "unknown";
        router.replace(`/login?error=${errorCode}`);
      }
    }

    processLogin();
  }, [query, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
        <p className="text-purple-700 font-medium">{status}</p>
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-purple-700 font-medium">로딩 중...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
