"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKakaoUser, logout, KakaoUser } from "@/app/lib/kakao";

interface UserProfileProps {
  onLogout?: () => void;
}

export default function UserProfile({ onLogout }: UserProfileProps) {
  const router = useRouter();
  const [user, setUser] = useState<KakaoUser | null>(null);

  useEffect(() => {
    setUser(getKakaoUser());
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    onLogout?.();
    router.refresh();
  };

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 font-medium text-sm hover:bg-yellow-300 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2C5.02944 2 1 5.36816 1 9.5C1 12.0703 2.61906 14.3203 5.07031 15.6328L4.21875 18.8516C4.14062 19.1328 4.46094 19.3594 4.70312 19.2031L8.45312 16.8281C8.95312 16.9062 9.46875 16.9531 10 16.9531C14.9706 16.9531 19 13.5859 19 9.45312C19 5.32031 14.9706 2 10 2Z"
            fill="currentColor"
          />
        </svg>
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* 프로필 이미지 */}
      {user.profileImage ? (
        <img
          src={user.profileImage}
          alt={user.nickname}
          className="w-8 h-8 rounded-full border-2 border-purple-200"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
          {user.nickname.charAt(0)}
        </div>
      )}
      
      {/* 닉네임 */}
      <span className="text-sm font-medium text-gray-700">
        {user.nickname}
      </span>
      
      {/* 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}

/**
 * 로그인 필요 여부 체크 후 리다이렉트하는 훅
 */
export function useRequireAuth(redirectTo: string = "/login") {
  const router = useRouter();
  const [user, setUser] = useState<KakaoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const kakaoUser = getKakaoUser();
    if (!kakaoUser) {
      router.replace(redirectTo);
    } else {
      setUser(kakaoUser);
    }
    setIsLoading(false);
  }, [router, redirectTo]);

  return { user, isLoading };
}
