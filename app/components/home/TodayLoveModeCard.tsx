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
      className={`rounded-2xl ${bgGradient} p-5 border border-white/50 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm h-[120px]`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3 h-full">
        <div className="flex-1">
          <h3 className={`text-base font-bold ${todayMode.color.text} mb-3`}>
            {todayMode.homeTitle}
          </h3>
          
          {/* 모드 배지 + 요약 문장 (한 줄) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-full ${todayMode.color.accent} px-2.5 py-0.5 text-xs font-bold text-white shrink-0`}>
              {todayMode.modeEmoji} {todayMode.modeName}
            </span>
            <p className="text-sm text-gray-700 font-medium">
              {todayMode.homeSummary}
            </p>
          </div>
        </div>
        <span className={`${todayMode.color.text} opacity-60 shrink-0`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </section>
  );
}
