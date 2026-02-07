"use client";

import { type ReactNode } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  isSharing: boolean;
  shareMessage: string;
  children: ReactNode; // 미리보기 카드 (ShareableCard)
}

/**
 * 이미지 공유 바텀시트 모달
 * - 미리보기 카드 (children)
 * - 공유 버튼
 * - 닫기 버튼
 */
export default function ShareModal({
  isOpen,
  onClose,
  onShare,
  isSharing,
  shareMessage,
  children,
}: ShareModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
        <div className="mx-auto max-w-md bg-white rounded-t-3xl">
          {/* 핸들 */}
          <div className="pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
          </div>

          <div className="px-6 pb-8">
            <h3 className="text-lg font-bold text-gray-900 text-center mb-4">
              이미지로 공유하기
            </h3>

            {/* 미리보기 카드 */}
            <div className="flex justify-center mb-4 overflow-hidden rounded-2xl">
              <div className="transform scale-[0.85] origin-top">
                {children}
              </div>
            </div>

            {/* 상태 메시지 */}
            {shareMessage && (
              <p className="text-center text-sm text-purple-600 mb-4 animate-pulse">
                {shareMessage}
              </p>
            )}

            {/* 공유 버튼 */}
            <button
              onClick={onShare}
              disabled={isSharing}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all mb-3 ${
                isSharing
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-[0.98]"
              }`}
            >
              {isSharing ? "생성 중..." : "📸 이미지 공유하기"}
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              disabled={isSharing}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
