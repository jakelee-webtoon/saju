"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface SwipeBackProps {
  children: ReactNode;
  onBack?: () => void; // 커스텀 뒤로가기 핸들러 (없으면 router.back())
  threshold?: number; // 스와이프 감지 임계값 (기본 80px)
  edgeWidth?: number; // 왼쪽 가장자리 감지 영역 (기본 30px)
  disabled?: boolean; // 스와이프 비활성화
}

/**
 * 스와이프 백 제스처 컴포넌트
 * - 왼쪽 가장자리에서 오른쪽으로 스와이프하면 뒤로가기
 * - 모바일 앱 같은 네이티브 UX 제공
 */
export default function SwipeBack({
  children,
  onBack,
  threshold = 80,
  edgeWidth = 30,
  disabled = false,
}: SwipeBackProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isEdgeSwipe = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      
      // 왼쪽 가장자리에서 시작했는지 체크
      isEdgeSwipe.current = touch.clientX <= edgeWidth;
      
      if (isEdgeSwipe.current && overlayRef.current) {
        overlayRef.current.style.transition = "none";
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // 수직 스크롤이 더 크면 스와이프 취소
      if (deltaY > Math.abs(deltaX)) {
        isEdgeSwipe.current = false;
        if (overlayRef.current) {
          overlayRef.current.style.opacity = "0";
        }
        return;
      }

      // 오른쪽으로 스와이프할 때만 시각적 피드백
      if (deltaX > 0 && overlayRef.current) {
        const progress = Math.min(deltaX / threshold, 1);
        overlayRef.current.style.opacity = String(progress * 0.3);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;

      // 오버레이 리셋
      if (overlayRef.current) {
        overlayRef.current.style.transition = "opacity 0.2s ease";
        overlayRef.current.style.opacity = "0";
      }

      // 임계값 이상 스와이프했으면 뒤로가기
      if (deltaX >= threshold) {
        if (onBack) {
          onBack();
        } else {
          router.back();
        }
      }

      isEdgeSwipe.current = false;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, edgeWidth, threshold, onBack, router]);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* 스와이프 시각적 피드백 오버레이 */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black pointer-events-none z-[9999] opacity-0"
        style={{ transition: "opacity 0.2s ease" }}
      />
      {children}
    </div>
  );
}
