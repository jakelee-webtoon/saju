"use client";

import { TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";

interface TodayModeSnippetProps {
  todayMode: TodayModeResult;
  characterName: string;
  onShowMore: () => void;
}

/**
 * 캐릭터 화면에 짧게 노출되는 오늘 모드 스니펫
 * - 3줄 구조: 제목 / 상태 요약 / 팁
 * - "오늘 모드 더보기" 버튼 포함
 */
export default function TodayModeSnippet({
  todayMode,
  characterName,
  onShowMore,
}: TodayModeSnippetProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 border border-amber-100 shadow-sm">
      {/* 제목 */}
      <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center gap-2">
        <span className="text-lg">{todayMode.titleLine}</span>
      </h3>
      
      {/* 상태 요약 */}
      <p className="text-sm text-amber-800 leading-relaxed mb-2">
        {todayMode.statusLine}
      </p>
      
      {/* 팁 */}
      <p className="text-sm text-amber-700/80 leading-relaxed mb-4">
        {todayMode.tipLine}
      </p>
      
      {/* 더보기 버튼 */}
      <button
        onClick={onShowMore}
        className="w-full py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span>👉</span>
        <span>오늘 모드 더보기</span>
      </button>
    </section>
  );
}
