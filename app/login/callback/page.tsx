"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveKakaoUser, KakaoUser } from "@/app/lib/kakao";
import { handleUserLogin } from "@/app/lib/firebase/userService";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("로그인 중...");

  useEffect(() => {
    async function processLogin() {
      const userParam = searchParams.get("user");
      const tokenParam = searchParams.get("token");

      if (userParam && tokenParam) {
        try {
          const user: KakaoUser = JSON.parse(decodeURIComponent(userParam));
          const token = decodeURIComponent(tokenParam);
          
          // localStorage에 저장 (기존 호환성)
          saveKakaoUser(user, token);
          
          // Firebase Firestore에 사용자 생성/업데이트
          setStatus("데이터 동기화 중...");
          const firebaseUser = await handleUserLogin(
            user.id,
            "kakao",
            user.nickname,
            user.profileImage,
            user.email
          );
          
          if (firebaseUser) {
            console.log("Firebase user synced:", firebaseUser.oderId);
          }
          
          // 저장된 리다이렉트 URL로 이동 (없으면 홈)
          const savedRedirect = localStorage.getItem("loginRedirect");
          localStorage.removeItem("loginRedirect");
          
          // 온보딩 완료 여부에 따라 분기
          if (firebaseUser && !firebaseUser.hasCompletedOnboarding) {
            // 온보딩 미완료 → 온보딩 플로우
            router.replace("/?newUser=true");
          } else {
            router.replace(savedRedirect || "/");
          }
        } catch (error) {
          console.error("Failed to process login:", error);
          router.replace("/login?error=parse_failed");
        }
      } else {
        router.replace("/login?error=missing_params");
      }
    }
    
    processLogin();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
        <p className="text-purple-700 font-medium">{status}</p>
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
