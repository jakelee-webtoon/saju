"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CupidPackageCard from "@/app/components/shop/CupidPackageCard";
import {
  getArrowBalanceSync,
  addArrowSync,
  CUPID_PACKAGES,
  type CupidPackage,
} from "@/app/lib/cupid/arrowBalance";
import { getKakaoUser } from "@/app/lib/kakao";
import { getNaverUser } from "@/app/lib/naver";
import { initPortOne, requestPayment, verifyPayment } from "@/app/lib/portone";
import { savePaymentRecord, updateArrowStats, incrementFeatureUsage } from "@/app/lib/firebase/userService";
import BottomNav, { TabId } from "@/app/components/BottomNav";
import SwipeBack from "@/app/components/SwipeBack";

// 로그인 상태 확인 (카카오 or 네이버)
function checkLoggedIn() {
  return !!getKakaoUser() || !!getNaverUser();
}

// 로그인된 사용자 ID 가져오기
function getUserId(): string | null {
  const kakaoUser = getKakaoUser();
  if (kakaoUser) return kakaoUser.id;
  
  const naverUser = getNaverUser();
  if (naverUser) return naverUser.id;
  
  return null;
}

// 로그인된 사용자 이름 가져오기
function getUserName(): string {
  const kakaoUser = getKakaoUser();
  if (kakaoUser) return kakaoUser.nickname;
  
  const naverUser = getNaverUser();
  if (naverUser) return naverUser.nickname;
  
  return "사용자";
}

export default function ShopPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [portoneReady, setPortoneReady] = useState(false);

  // 초기 잔액 로드 & PortOne SDK 초기화
  useEffect(() => {
    const init = async () => {
      // 잔액 로드
      const currentBalance = await getArrowBalanceSync();
      setBalance(currentBalance);
      setIsLoggedIn(checkLoggedIn());
      
      // PortOne SDK 초기화
      try {
        await initPortOne();
        setPortoneReady(true);
      } catch (error) {
        console.error("PortOne init error:", error);
        // SDK 초기화 실패해도 테스트 모드로 동작 가능
      }
    };
    init();
  }, []);

  // 패키지 구매 (결제 연동)
  const handlePurchase = async (pkg: CupidPackage) => {
    // 로그인 체크 - 바로 이동 (딜레이 제거)
    if (!checkLoggedIn()) {
      router.push("/login?redirect=/shop");
      return;
    }

    setIsPurchasing(true);
    const totalArrows = pkg.arrows + (pkg.bonusArrows || 0);
    
    try {
      // 모바일 결제를 위해 결제 정보 저장
      localStorage.setItem("pendingPayment", JSON.stringify({
        amount: pkg.price,
        arrows: totalArrows,
        packageName: pkg.name,
        packageId: pkg.id,
      }));
      
      // 결제 요청
      const response = await requestPayment({
        name: `큐피드 화살 ${pkg.name}`,
        amount: pkg.price,
        pay_method: "card",
        buyer_name: getUserName(),
        pgType: "KAKAOPAY", // 기본 카카오페이
      });

      if (response.success) {
        // 결제 검증
        const verification = await verifyPayment(
          response.imp_uid,
          response.merchant_uid,
          pkg.price
        );

        if (verification.success) {
          // 화살 충전
          const newBalance = await addArrowSync(totalArrows);
          setBalance(newBalance);
          localStorage.removeItem("pendingPayment");
          
          // 결제 내역 저장
          const userId = getUserId();
          if (userId) {
            await savePaymentRecord({
              oderId: userId,
              packageId: pkg.id,
              packageName: pkg.name,
              amount: pkg.price,
              arrows: totalArrows,
              paymentMethod: "kakaopay",
              impUid: response.imp_uid,
              merchantUid: response.merchant_uid,
              status: "completed",
            });
            
            // 화살 구매 통계 업데이트
            await updateArrowStats(userId, "purchased", totalArrows);
            
            // 상점 사용 통계 업데이트
            await incrementFeatureUsage(userId, "shop");
          }
          
          setToast(`💘 화살 ${totalArrows}개가 충전됐어요!`);
          setTimeout(() => setToast(null), 2500);
        } else {
          setToast(verification.message || "결제 검증에 실패했어요 😢");
          setTimeout(() => setToast(null), 2500);
        }
      } else {
        // 결제 취소 or 실패
        localStorage.removeItem("pendingPayment");
        if (response.error_msg) {
          setToast(`${response.error_msg}`);
        } else {
          setToast("결제가 취소되었어요");
        }
        setTimeout(() => setToast(null), 2500);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      localStorage.removeItem("pendingPayment");
      setToast("결제 중 오류가 발생했어요 😢");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setIsPurchasing(false);
    }
  };

  // 탭 변경 시 홈으로 이동 (쿼리 파라미터로 탭 전달)
  const handleTabChange = (tab: TabId) => {
    router.push(`/?tab=${tab}`);
  };

  return (
    <SwipeBack onBack={() => router.push("/?tab=my")}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
        <div className="mx-auto max-w-md px-5 py-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/?tab=my")}
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
          {portoneReady ? "카카오페이로 간편하게 결제하세요 💳" : "결제 시스템 로딩 중..."}
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
          activeTab="my" 
          onTabChange={handleTabChange}
        />
      </div>
    </SwipeBack>
  );
}
