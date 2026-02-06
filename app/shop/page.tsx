"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CupidPackageCard from "@/app/components/shop/CupidPackageCard";
import {
  getArrowBalance,
  addArrow,
  CUPID_PACKAGES,
  type CupidPackage,
} from "@/app/lib/cupid/arrowBalance";
import { getKakaoUser } from "@/app/lib/kakao";
import BottomNav, { TabId } from "@/app/components/BottomNav";

export default function ShopPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 초기 잔액 로드 & 로그인 상태 확인
  useEffect(() => {
    setBalance(getArrowBalance());
    setIsLoggedIn(!!getKakaoUser());
  }, []);

  // 패키지 구매 (Stub)
  const handlePurchase = (pkg: CupidPackage) => {
    // 로그인 체크
    if (!getKakaoUser()) {
      // 로그인 안 됐으면 로그인 페이지로 이동
      setToast("로그인이 필요해요! 🔐");
      setTimeout(() => {
        router.push("/login?redirect=/shop");
      }, 1000);
      return;
    }

    const totalArrows = pkg.arrows + (pkg.bonusArrows || 0);
    const newBalance = addArrow(totalArrows);
    setBalance(newBalance);
    
    // 토스트 표시
    setToast(`💘 화살 ${totalArrows}개가 충전됐어요!`);
    setTimeout(() => setToast(null), 2500);
  };

  // 탭 변경 시 홈으로 이동 (쿼리 파라미터로 탭 전달)
  const handleTabChange = (tab: TabId) => {
    router.push(`/?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
      <div className="mx-auto max-w-md px-5 py-8">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
        >
          <span>←</span>
          <span>돌아가기</span>
        </button>

        {/* 헤더 */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-purple-900 mb-2">
            💘 큐피드 샵
          </h1>
          <p className="text-sm text-purple-600">
            망설이는 순간, 화살 하나로 결정하세요
          </p>
        </header>

        {/* 잔액 뱃지 */}
        <div className={`rounded-2xl p-4 mb-6 ${
          balance === 0 
            ? "bg-amber-50 border border-amber-200" 
            : "bg-white border border-purple-100 shadow-sm"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">내 큐피드 화살</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className={`text-xl font-black ${
                balance === 0 ? "text-amber-500" : "text-purple-600"
              }`}>
                {balance}개
              </span>
            </div>
          </div>
          {balance === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ 화살이 없어요! 아래에서 충전해보세요
            </p>
          )}
        </div>

        {/* 패키지 카드 영역 */}
        <section className="space-y-4 mb-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            화살 패키지
          </h2>
          {CUPID_PACKAGES.map((pkg) => (
            <CupidPackageCard
              key={pkg.id}
              package_={pkg}
              onPurchase={handlePurchase}
            />
          ))}
        </section>

        {/* 사용처 설명 */}
        <section className="rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 p-5 mb-6">
          <h2 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
            <span>🎯</span>
            큐피드 화살은 어디에 쓰나요?
          </h2>
          <ul className="space-y-2">
            {[
              "오늘 먼저 연락해도 될까?",
              "이 고민, 말해도 괜찮을까?",
              "오늘 고백하면 부담일까?",
              "지금 거리 좁혀도 될까?",
            ].map((item, i) => (
              <li key={i} className="text-sm text-purple-700 flex items-start gap-2">
                <span className="text-purple-500">•</span>
                <span>"{item}"</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-sm font-medium text-purple-600">
            궁합은 무료, 결정은 화살로 ✨
          </p>
        </section>

        {/* FAQ */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>❓</span>
            자주 묻는 질문
          </h2>
          
          <details className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
              화살은 언제까지 쓸 수 있나요?
            </summary>
            <div className="px-4 pb-3 text-sm text-gray-500">
              유효기간 없이 언제든 사용 가능해요.
            </div>
          </details>
          
          <details className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
              화살은 어디에 쓰이나요?
            </summary>
            <div className="px-4 pb-3 text-sm text-gray-500">
              오늘의 연애 질문이나 행동 결정에 사용돼요.
            </div>
          </details>
          
          <details className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
              결과가 매번 똑같지 않나요?
            </summary>
            <div className="px-4 pb-3 text-sm text-gray-500">
              날짜와 상황에 따라 달라져요. 규칙 기반으로 매일 새로운 결과를 제공해요.
            </div>
          </details>
        </section>

        {/* 안내 문구 */}
        <p className="mt-8 text-center text-xs text-purple-400">
          결제는 추후 연동 예정이에요. 지금은 무료 체험! 🎁
        </p>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium">
            {toast}
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <BottomNav 
        activeTab="home" 
        onTabChange={handleTabChange}
        isShopActive={true}
      />
    </div>
  );
}
