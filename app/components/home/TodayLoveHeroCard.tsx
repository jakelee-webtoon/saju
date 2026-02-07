"use client";

import { type TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";

interface TodayLoveHeroCardProps {
  todayMode: TodayModeResult;
  onClick: () => void;
}

/**
 * 오늘의 연애 프리뷰 히어로 카드
 * - 홈 탭 최상단에 노출되는 큰 카드
 * - 매일 바뀌는 연애 상태를 프리뷰로 제공
 * - 클릭 시 연애 탭 상세 페이지로 이동
 */
export default function TodayLoveHeroCard({ todayMode, onClick }: TodayLoveHeroCardProps) {
  // 배경 그라데이션 클래스
  const bgGradient = `bg-gradient-to-br ${todayMode.color.bg}`;
  
  // 날짜 포맷팅
  const today = new Date();
  const dateStr = today.toLocaleDateString("ko-KR", { 
    month: "long", 
    day: "numeric", 
    weekday: "short" 
  });

  return (
    <section
      className={`rounded-3xl ${bgGradient} p-6 border border-white/50 cursor-pointer transition-all duration-200 hover:shadow-xl active:scale-[0.99] shadow-lg mb-6`}
      onClick={onClick}
    >
      {/* 날짜 */}
      <div className="mb-4">
        <p className="text-xs font-medium text-black/70">
          {dateStr}
        </p>
      </div>

      {/* 섹션 타이틀 */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-black flex items-center gap-2">
          <span>💗</span>
          <span>오늘의 연애</span>
        </h2>
      </div>

      {/* 상태 태그 */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full ${todayMode.color.accent} px-3 py-1.5 text-sm font-bold text-white shadow-md`}>
          {todayMode.modeEmoji} {todayMode.modeName}
        </span>
      </div>

      {/* 핵심 한 줄 메시지 */}
      <div className="mb-3">
        <p className="text-base font-semibold text-black leading-relaxed">
          {todayMode.detail.main_sentence || todayMode.homeSummary}
        </p>
      </div>

      {/* 보조 안내 문장 */}
      {todayMode.detail.one_line_guide && (
        <div className="mb-5">
          <p className="text-sm text-black/80 leading-relaxed">
            {todayMode.detail.one_line_guide}
          </p>
        </div>
      )}

      {/* CTA - 고정 문구 */}
      <div className="flex items-center justify-between pt-4 border-t border-black/20">
        <span className="text-sm font-medium text-black">
          오늘, 이대로 가도 될까? →
        </span>
      </div>
    </section>
  );
}
