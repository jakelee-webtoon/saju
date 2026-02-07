"use client";

import { useState, useRef, useCallback } from "react";
import { shareAsImage, type ShareOptions } from "@/app/lib/share/imageShare";

/**
 * 이미지 공유 로직을 캡슐화하는 커스텀 훅
 * - showShareModal, isSharing, shareMessage 상태 관리
 * - shareCardRef (캡처할 DOM 요소)
 * - handleShare(options) 실행
 */
export function useImageShare() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const shareCardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async (options: ShareOptions) => {
    if (!shareCardRef.current || isSharing) return;

    setIsSharing(true);
    setShareMessage("이미지 생성 중...");

    const result = await shareAsImage(shareCardRef.current, options);

    if (result.success) {
      setShareMessage(
        result.method === "download" ? "이미지가 저장됐어요! 📸" : "공유 완료! 🎉"
      );
      setTimeout(() => {
        setShowShareModal(false);
        setShareMessage("");
      }, 2500);
    } else {
      setShareMessage(result.message || "공유에 실패했어요");
      setTimeout(() => setShareMessage(""), 2000);
    }

    setIsSharing(false);
  }, [isSharing]);

  const openModal = useCallback(() => setShowShareModal(true), []);
  const closeModal = useCallback(() => {
    if (!isSharing) setShowShareModal(false);
  }, [isSharing]);

  return {
    showShareModal,
    isSharing,
    shareMessage,
    shareCardRef,
    handleShare,
    openModal,
    closeModal,
  };
}
