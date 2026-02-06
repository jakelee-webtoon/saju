"use client";

import { type CupidPackage, formatPrice } from "@/app/lib/cupid/arrowBalance";

interface CupidPackageCardProps {
  package_: CupidPackage;
  onPurchase: (pkg: CupidPackage) => void;
}

/**
 * 큐피드 화살 패키지 카드
 */
export default function CupidPackageCard({ package_, onPurchase }: CupidPackageCardProps) {
  const totalArrows = package_.arrows + (package_.bonusArrows || 0);
  
  return (
    <div
      className={`relative rounded-2xl p-5 transition-all ${
        package_.isRecommended
          ? "bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg"
          : "bg-white border border-gray-200 shadow-sm"
      }`}
    >
      {/* 배지 */}
      {package_.isRecommended && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-md">
            ⭐ 가장 추천
          </span>
        </div>
      )}
      {package_.isLimited && !package_.isRecommended && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold shadow-md">
            ⏰ 오늘만
          </span>
        </div>
      )}

      {/* 내용 */}
      <div className={package_.isRecommended || package_.isLimited ? "mt-2" : ""}>
        {/* 제목 */}
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          💘 큐피드 화살 {package_.arrows}개
          {package_.bonusArrows && (
            <span className="text-pink-500 ml-1">+{package_.bonusArrows}개</span>
          )}
        </h3>

        {/* 설명 */}
        <p className="text-sm text-gray-500 mb-4">
          {package_.description}
        </p>

        {/* 가격 & 버튼 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-2xl font-black text-gray-900">
              {formatPrice(package_.price)}
            </span>
            {package_.bonusArrows && (
              <span className="block text-xs text-pink-500 font-medium">
                실제 {totalArrows}개 지급!
              </span>
            )}
          </div>
          
          <button
            onClick={() => onPurchase(package_)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97] ${
              package_.isRecommended
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            충전하기
          </button>
        </div>
      </div>
    </div>
  );
}
