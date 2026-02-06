"use client";

import Link from "next/link";

interface ShopLinkProps {
  className?: string;
  variant?: "button" | "text";
}

/**
 * 큐피드 샵으로 이동하는 링크
 * - 화살 부족 시 등 다양한 곳에서 사용 가능
 */
export default function ShopLink({ className, variant = "text" }: ShopLinkProps) {
  if (variant === "button") {
    return (
      <Link
        href="/shop"
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97] ${className || ""}`}
      >
        <span>💘</span>
        <span>화살 충전하러 가기</span>
      </Link>
    );
  }

  return (
    <Link
      href="/shop"
      className={`inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors font-medium ${className || ""}`}
    >
      <span>화살 충전하러 가기 →</span>
    </Link>
  );
}

/**
 * 화살 부족 안내 컴포넌트
 */
export function ArrowShortageNotice({ needed = 1 }: { needed?: number }) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
      <p className="text-sm text-amber-700 mb-3">
        ⚠️ 화살이 부족해요 (필요: {needed}개)
      </p>
      <ShopLink variant="button" />
    </div>
  );
}
