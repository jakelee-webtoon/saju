"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveKakaoUser, KakaoUser } from "@/app/lib/kakao";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userParam = searchParams.get("user");
    const tokenParam = searchParams.get("token");

    if (userParam && tokenParam) {
      try {
        const user: KakaoUser = JSON.parse(decodeURIComponent(userParam));
        const token = decodeURIComponent(tokenParam);
        
        // localStorage에 저장
        saveKakaoUser(user, token);
        
        // 저장된 리다이렉트 URL로 이동 (없으면 홈)
        const savedRedirect = localStorage.getItem("loginRedirect");
        localStorage.removeItem("loginRedirect");
        router.replace(savedRedirect || "/");
      } catch (error) {
        console.error("Failed to parse user data:", error);
        router.replace("/login?error=parse_failed");
      }
    } else {
      router.replace("/login?error=missing_params");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
        <p className="text-purple-700 font-medium">로그인 중...</p>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
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
