"use client";

import { type TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";

interface TodayLoveModeCardProps {
  todayMode: TodayModeResult;
  onClick: () => void;
}

/**
 * 오늘의 연애 모드 카드
 * - 연애 상황에만 초점
 * - 애매 + 공감 + 해석 여지
 * - 확정/미래예측 없이 가능성/흐름만 표현
 * - 각 모드별 색상 적용
 */
export default function TodayLoveModeCard({ todayMode, onClick }: TodayLoveModeCardProps) {
  // 배경 그라데이션 클래스
  const bgGradient = `bg-gradient-to-r ${todayMode.color.bg}`;
  
  return (
    <section
      className={`rounded-2xl ${bgGradient} p-5 border border-white/50 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <h3 className={`text-base font-bold ${todayMode.color.text} mb-2`}>
            {todayMode.homeTitle}
          </h3>
          
          {/* 모드 배지 */}
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full ${todayMode.color.accent} px-3 py-1 text-xs font-bold text-white`}>
              {todayMode.modeEmoji} {todayMode.modeName}
            </span>
          </div>
          
          {/* 요약 문장 */}
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            {todayMode.homeSummary}
          </p>
        </div>
        <span className={`${todayMode.color.text} text-lg opacity-60`}>→</span>
      </div>
    </section>
  );
}
