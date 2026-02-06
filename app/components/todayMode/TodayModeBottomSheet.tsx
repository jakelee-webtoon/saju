"use client";

import { useEffect } from "react";
import { TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";

interface TodayModeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  todayMode: TodayModeResult;
  characterName: string;
}

/**
 * 오늘 모드 상세 보기 바텀시트
 * - 연애 모드와 동일한 모드, 색상 매핑
 * - 일반적인 기분/컨디션 중심 표현
 */
export default function TodayModeBottomSheet({
  isOpen,
  onClose,
  todayMode,
  characterName,
}: TodayModeBottomSheetProps) {
  // 바텀시트 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const today = new Date();
  const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[today.getDay()];

  // 배경 그라데이션 (헤더용)
  const bgGradient = `bg-gradient-to-br ${todayMode.color.bg}`;

  const handleShare = () => {
    const shareText = `[${characterName}의 오늘 모드]
${todayMode.modeLabel}

${todayMode.detail.main_sentence}

💡 ${todayMode.detail.one_line_guide}`;

    if (navigator.share) {
      navigator.share({
        title: `${characterName}의 오늘 모드`,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("클립보드에 복사되었어요!");
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
        <div className="mx-auto max-w-md bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
          {/* 핸들 */}
          <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-3xl">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
          </div>

          <div className="px-6 pb-8">
            {/* 헤더 - 모드별 색상 적용 */}
            <header className={`mb-6 text-center rounded-2xl ${bgGradient} p-5 -mx-2`}>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                오늘의 컨디션 자세히 보기
              </h2>
              <p className="text-sm text-gray-600">
                {characterName} · {dateString} ({dayName})
              </p>
              {/* 모드 뱃지 */}
              <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full ${todayMode.color.accent} text-white font-medium shadow-md`}>
                {todayMode.modeEmoji} {todayMode.modeName}
              </div>
            </header>

            {/* 섹션 1: 왜 이런 모드냐면 */}
            <section className="mb-6">
              <h3 className={`text-sm font-bold ${todayMode.color.text} mb-3 flex items-center gap-2`}>
                <span>📌</span>
                <span>오늘 왜 이런 상태냐면</span>
              </h3>
              <div className={`rounded-xl ${bgGradient} p-4`}>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {todayMode.detail.reason}
                </p>
              </div>
            </section>

            {/* 섹션 2: 이럴 때 흔들릴 수 있어 */}
            <section className="mb-6">
              <h3 className={`text-sm font-bold ${todayMode.color.text} mb-3 flex items-center gap-2`}>
                <span>💬</span>
                <span>오늘 이럴 때 조심하면 좋아</span>
              </h3>
              <ul className="space-y-2">
                {todayMode.detail.triggers.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"
                  >
                    <span className={`shrink-0 w-5 h-5 rounded-full ${todayMode.color.accent} text-white flex items-center justify-center text-xs font-medium`}>
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 섹션 3: 오늘의 한 줄 가이드 */}
            <section className="mb-8">
              <h3 className={`text-sm font-bold ${todayMode.color.text} mb-3 flex items-center gap-2`}>
                <span>🧠</span>
                <span>오늘의 한 줄 가이드</span>
              </h3>
              <div className={`rounded-xl ${todayMode.color.accent} p-5 shadow-lg`}>
                <p className="text-white text-sm leading-relaxed text-center font-medium">
                  &ldquo;{todayMode.detail.one_line_guide}&rdquo;
                </p>
              </div>
            </section>

            {/* 버튼 영역 */}
            <div className="flex gap-3 pb-6">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleShare}
                className={`flex-1 py-3.5 rounded-xl ${todayMode.color.accent} hover:opacity-90 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2`}
              >
                <span>📤</span>
                <span>공유하기</span>
              </button>
            </div>
          </div>
          
          {/* 하단 Safe Area */}
          <div className="h-8 bg-white" />
        </div>
      </div>
    </>
  );
}
