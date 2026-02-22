"use client";

import { forwardRef } from "react";
import { type TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";

interface ShareableFortuneCardProps {
  todayMode: TodayModeResult;
  characterName: string;
}

/**
 * 공유용 오늘의 연애 운세 카드 (이미지 캡처용)
 */
const ShareableFortuneCard = forwardRef<HTMLDivElement, ShareableFortuneCardProps>(
  ({ todayMode, characterName }, ref) => {
    // 배경색 매핑
    const bgColors: Record<string, string> = {
      "from-pink-100": "linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #fce7f3 100%)",
      "from-orange-100": "linear-gradient(135deg, #ffedd5 0%, #fff7ed 50%, #ffedd5 100%)",
      "from-indigo-100": "linear-gradient(135deg, #e0e7ff 0%, #eef2ff 50%, #e0e7ff 100%)",
      "from-emerald-100": "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 50%, #d1fae5 100%)",
      "from-blue-100": "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #dbeafe 100%)",
      "from-gray-100": "linear-gradient(135deg, #f3f4f6 0%, #f9fafb 50%, #f3f4f6 100%)",
    };

    const bgKey = todayMode.color.bg.split(" ")[0];
    const background = bgColors[bgKey] || bgColors["from-pink-100"];

    // 액센트 색상 매핑
    const accentColors: Record<string, string> = {
      "bg-pink-500": "#ec4899",
      "bg-orange-500": "#f97316",
      "bg-indigo-500": "#6366f1",
      "bg-emerald-500": "#10b981",
      "bg-blue-500": "#3b82f6",
      "bg-gray-500": "#6b7280",
    };
    const accentKey = todayMode.color.accent;
    const accentColor = accentColors[accentKey] || "#ec4899";

    return (
      <div
        ref={ref}
        className="w-[320px] rounded-3xl p-6 shadow-2xl"
        style={{ 
          background,
          fontFamily: "system-ui, -apple-system, sans-serif" 
        }}
      >
        {/* 날짜 */}
        <div className="text-center mb-4">
          <span className="text-gray-500 text-xs">
            {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          </span>
        </div>

        {/* 모드 이모지 & 이름 */}
        <div className="text-center mb-5">
          <span className="text-6xl block mb-3">{todayMode.modeEmoji}</span>
          <div 
            className="inline-block px-4 py-2 rounded-full text-white font-bold"
            style={{ backgroundColor: accentColor }}
          >
            {todayMode.modeName}
          </div>
        </div>

        {/* 메인 메시지 */}
        <div className="bg-white/80 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 text-center text-sm leading-relaxed">
            {todayMode.detail.main_sentence}
          </p>
        </div>

        {/* 한 줄 가이드 */}
        <div 
          className="rounded-xl p-3 mb-5"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <p className="text-center text-xs" style={{ color: accentColor }}>
            💡 {todayMode.detail.one_line_guide}
          </p>
        </div>

        {/* 하단 브랜딩 */}
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💘</span>
            <span className="text-gray-500 text-xs font-medium">사주큐피드</span>
          </div>
          <span className="text-gray-400 text-[10px]">sajucupid.com</span>
        </div>
      </div>
    );
  }
);

ShareableFortuneCard.displayName = "ShareableFortuneCard";

export default ShareableFortuneCard;
