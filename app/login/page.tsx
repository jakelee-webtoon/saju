"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initKakao, loginWithKakao, isLoggedIn } from "@/app/lib/kakao";
import SwipeBack from "@/app/components/SwipeBack";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // 리다이렉트 URL 저장 (로그인 후 돌아갈 페이지)
    const redirect = searchParams.get("redirect");
    if (redirect) {
      localStorage.setItem("loginRedirect", redirect);
    }

    // 이미 로그인되어 있으면 리다이렉트 또는 홈으로
    if (isLoggedIn()) {
      const savedRedirect = localStorage.getItem("loginRedirect");
      localStorage.removeItem("loginRedirect");
      router.replace(savedRedirect || "/");
      return;
    }

    // 에러 파라미터 확인
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        kakao_auth_failed: "카카오 로그인에 실패했어요",
        no_code: "인증 코드를 받지 못했어요",
        token_failed: "토큰 발급에 실패했어요",
        user_info_failed: "사용자 정보를 가져오지 못했어요",
        callback_failed: "로그인 처리 중 오류가 발생했어요",
        parse_failed: "데이터 처리 중 오류가 발생했어요",
        missing_params: "필요한 정보가 없어요",
      };
      setError(errorMessages[errorParam] || "로그인에 실패했어요");
    }

    // 카카오 SDK 초기화
    initKakao()
      .then(() => {
        setSdkReady(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Kakao SDK init error:", err);
        setError("카카오 SDK 초기화에 실패했어요. 환경변수를 확인해주세요.");
        setIsLoading(false);
      });
  }, [router, searchParams]);

  const handleKakaoLogin = () => {
    if (!sdkReady) {
      setError("카카오 SDK가 준비되지 않았어요");
      return;
    }
    loginWithKakao();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <SwipeBack onBack={() => router.push("/")}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-6">
        <div className="w-full max-w-sm">
          {/* 로고/타이틀 영역 */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">💘</div>
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              오늘의 사주
            </h1>
            <p className="text-purple-600 text-sm">
              연애 고민, 사주로 해결하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {/* 카카오 로그인 버튼 */}
          <button
            onClick={handleKakaoLogin}
            disabled={!sdkReady}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-[#191919] transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#FEE500" }}
          >
            {/* 카카오 로고 */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 2C5.02944 2 1 5.36816 1 9.5C1 12.0703 2.61906 14.3203 5.07031 15.6328L4.21875 18.8516C4.14062 19.1328 4.46094 19.3594 4.70312 19.2031L8.45312 16.8281C8.95312 16.9062 9.46875 16.9531 10 16.9531C14.9706 16.9531 19 13.5859 19 9.45312C19 5.32031 14.9706 2 10 2Z"
                fill="#191919"
              />
            </svg>
            <span>카카오 로그인</span>
          </button>

          {/* 안내 문구 */}
          <p className="mt-6 text-center text-xs text-gray-500">
            로그인하면 내 사주 정보와 큐피드 화살이<br />
            안전하게 저장돼요
          </p>

          {/* 둘러보기 */}
          <button
            onClick={() => router.push("/")}
            className="mt-8 w-full py-3 text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors"
          >
            로그인 없이 둘러보기 →
          </button>
        </div>
      </div>
    </SwipeBack>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
