"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountSection() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; nickname: string; profileImage?: string; provider?: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // 카카오 사용자 확인
    const kakaoUserStr = localStorage.getItem("kakaoUser");
    if (kakaoUserStr) {
      try {
        const kakaoUser = JSON.parse(kakaoUserStr);
        setUser({ ...kakaoUser, provider: "kakao" });
        return;
      } catch {
        // 무시
      }
    }
    
    // 네이버 사용자 확인
    const naverUserStr = localStorage.getItem("naverUser");
    if (naverUserStr) {
      try {
        const naverUser = JSON.parse(naverUserStr);
        setUser({ ...naverUser, provider: "naver" });
        return;
      } catch {
        // 무시
      }
    }
    
    setUser(null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kakaoUser");
    localStorage.removeItem("kakaoAccessToken");
    localStorage.removeItem("naverUser");
    localStorage.removeItem("naverAccessToken");
    setUser(null);
    setShowLogoutConfirm(false);
    router.refresh();
  };

  return (
    <>
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span>👤</span> 계정
          </h2>

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.nickname}
                    className="w-12 h-12 rounded-full border-2 border-purple-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                    {user.nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user.nickname}</p>
                  <p className="text-xs text-gray-500">
                    {user.provider === "naver" ? "네이버 로그인" : "카카오 로그인"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 mb-4">
                로그인하면 데이터가 안전하게 저장돼요
              </p>
              {/* 카카오 로그인 버튼 */}
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-[#191919] transition-all hover:brightness-95"
                style={{ backgroundColor: "#FEE500" }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 2C5.02944 2 1 5.36816 1 9.5C1 12.0703 2.61906 14.3203 5.07031 15.6328L4.21875 18.8516C4.14062 19.1328 4.46094 19.3594 4.70312 19.2031L8.45312 16.8281C8.95312 16.9062 9.46875 16.9531 10 16.9531C14.9706 16.9531 19 13.5859 19 9.45312C19 5.32031 14.9706 2 10 2Z"
                    fill="#191919"
                  />
                </svg>
                카카오 로그인
              </button>
              {/* 네이버 로그인 버튼 */}
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all hover:brightness-95 mt-2"
                style={{ backgroundColor: "#03C75A" }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M13.5615 10.6231L6.14231 2H2V18H6.43846V9.37692L13.8577 18H18V2H13.5615V10.6231Z"
                    fill="white"
                  />
                </svg>
                네이버 로그인
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">로그아웃</h3>
            <p className="text-sm text-gray-600 mb-6">
              정말 로그아웃 하시겠어요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
