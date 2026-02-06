"use client";

import { TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";

interface TodayModeSnippetProps {
  todayMode: TodayModeResult;
  characterName: string;
  onShowMore: () => void;
}

/**
 * 캐릭터 화면에 짧게 노출되는 오늘 모드 스니펫
 * - 연애 모드와 동일한 모드 사용, 색상 매핑
 * - 일반적인 기분/컨디션 표현 (연애 특화 X)
 * - "오늘 모드 더보기" 버튼 포함
 */
export default function TodayModeSnippet({
  todayMode,
  characterName,
  onShowMore,
}: TodayModeSnippetProps) {
  // 모드별 배경 그라데이션
  const bgGradient = `bg-gradient-to-br ${todayMode.color.bg}`;
  
  // 모드별 버튼 색상 (accent를 배경으로, 흰 텍스트)
  const buttonBg = todayMode.color.accent.replace('bg-', 'bg-').replace('-400', '-100').replace('-500', '-100');
  
  return (
    <section className={`rounded-2xl ${bgGradient} p-5 border border-white/50 shadow-sm`}>
      {/* 제목 - 모드명 포함 */}
      <h3 className={`text-base font-bold ${todayMode.color.text} mb-3 flex items-center gap-2`}>
        <span className="text-lg">⚡ 오늘 모드: {todayMode.modeName}</span>
      </h3>
      
      {/* 상태 요약 - 일반적 기분 표현 */}
      <p className="text-sm text-gray-800 leading-relaxed mb-2">
        {todayMode.detail.main_sentence}
      </p>
      
      {/* 팁 */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {todayMode.detail.one_line_guide}
      </p>
      
      {/* 더보기 버튼 - 모드별 색상 적용 */}
      <button
        onClick={onShowMore}
        className={`w-full py-3 rounded-xl ${todayMode.color.accent} hover:opacity-90 text-white text-sm font-medium transition-all flex items-center justify-center gap-2`}
      >
        <span>👉</span>
        <span>오늘 모드 더보기</span>
      </button>
    </section>
  );
}
