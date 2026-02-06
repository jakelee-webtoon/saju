"use client";

import html2canvas from "html2canvas";

export interface ShareOptions {
  title?: string;
  text?: string;
  filename?: string;
}

/**
 * DOM 요소를 이미지로 캡처하여 공유
 */
export async function shareAsImage(
  element: HTMLElement,
  options: ShareOptions = {}
): Promise<{ success: boolean; method: "share" | "download" | "error"; message?: string }> {
  const { title = "사주큐피드", text = "내 결과를 확인해보세요!", filename = "sajucupid.png" } = options;

  try {
    // 1. DOM을 캔버스로 변환
    const canvas = await html2canvas(element, {
      scale: 2, // 고해상도
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });

    // 2. 캔버스를 Blob으로 변환
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png", 1.0);
    });

    if (!blob) {
      return { success: false, method: "error", message: "이미지 생성에 실패했어요" };
    }

    // 3. Web Share API 지원 확인 (파일 공유)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: "image/png" });
      const shareData = { files: [file], title, text };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return { success: true, method: "share" };
        } catch (err: unknown) {
          // 사용자가 취소한 경우
          if (err instanceof Error && err.name === "AbortError") {
            return { success: false, method: "share", message: "공유가 취소됐어요" };
          }
        }
      }
    }

    // 4. Web Share API 미지원 시 다운로드
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, method: "download", message: "이미지가 저장됐어요!" };
  } catch (error) {
    console.error("Image share error:", error);
    return { success: false, method: "error", message: "이미지 생성 중 오류가 발생했어요" };
  }
}

/**
 * 캔버스를 이미지 URL로 변환 (미리보기용)
 */
export async function captureToDataUrl(element: HTMLElement): Promise<string | null> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Capture error:", error);
    return null;
  }
}
