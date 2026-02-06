"use client";

import { type TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";
import { useEffect, useState } from "react";

interface TodayLovePageProps {
  todayMode: TodayModeResult;
  characterName: string;
  onBack: () => void;
}

export default function TodayLovePage({
  todayMode,
  characterName,
  onBack,
}: TodayLovePageProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // 배경 그라데이션 클래스
  const bgGradient = `bg-gradient-to-br ${todayMode.color.bg}`;

  return (
    <div className={`min-h-screen ${bgGradient} pb-20`}>
      <div className="mx-auto max-w-md px-5 py-8">
        {/* 헤더 */}
        <header className="mb-6">
          <button
            onClick={onBack}
            className={`mb-4 flex items-center gap-1 text-sm ${todayMode.color.text} hover:opacity-70 transition-colors`}
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          </h1>
          <p className={`text-lg font-semibold ${todayMode.color.text}`}>
            오늘의 연애 운세
          </p>
        </header>

        {/* 캐릭터 기준 */}
        <section className="mb-6 rounded-xl bg-white/80 backdrop-blur p-4 shadow-sm border border-white/50">
          <p className={`text-xs ${todayMode.color.text} text-center`}>
            {characterName} 캐릭터 기준
          </p>
        </section>

        {/* 모드 배지 */}
        <section className="mb-6 text-center">
          <span className={`inline-flex items-center gap-2 rounded-full ${todayMode.color.accent} px-5 py-2.5 text-base font-bold text-white shadow-lg`}>
            {todayMode.modeEmoji} {todayMode.modeName}
          </span>
        </section>

        {/* 상태 요약 + 팁 */}
        <section className="mb-6 rounded-2xl bg-white/90 backdrop-blur p-6 shadow-lg border border-white/50">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {todayMode.detail.main_sentence}
          </h2>
          <p className={`text-sm ${todayMode.color.text} leading-relaxed`}>
            {todayMode.homeSummary}
          </p>
        </section>

        {/* 상세 설명 섹션 */}
        <section className="mb-6 rounded-2xl bg-white/90 backdrop-blur p-6 shadow-lg border border-white/50">
          {/* 오늘 왜 이런 모드냐면 */}
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className={todayMode.color.text}>📌</span> 오늘 왜 이런 모드냐면
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-5">
            {todayMode.detail.reason}
          </p>

          {/* 오늘 이럴 때 특히 흔들릴 수 있어 */}
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className={todayMode.color.text}>💬</span> 오늘 이럴 때 특히 흔들릴 수 있어
          </h3>
          <ul className="space-y-2 mb-5">
            {todayMode.detail.triggers.map((trigger, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className={`${todayMode.color.text} opacity-70`}>•</span>
                <span>{trigger}</span>
              </li>
            ))}
          </ul>

          {/* 오늘의 한 줄 가이드 */}
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className={todayMode.color.text}>🧠</span> 오늘의 한 줄 가이드
          </h3>
          <p className={`text-sm ${todayMode.color.text} font-medium leading-relaxed p-3 rounded-xl bg-gray-50`}>
            &ldquo;{todayMode.detail.one_line_guide}&rdquo;
          </p>
        </section>

        {/* 공유 버튼 */}
        <button
          className={`w-full mb-4 rounded-xl ${todayMode.color.accent} py-4 text-[15px] font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]`}
          onClick={() => {
            const shareText = `[오늘의 연애 운세: ${characterName}]\n${todayMode.modeLabel}\n\n${todayMode.detail.main_sentence}\n\n${todayMode.detail.one_line_guide}`;
            if (navigator.share) {
              navigator.share({
                title: `오늘의 연애 운세: ${characterName}`,
                text: shareText,
              });
            } else {
              navigator.clipboard.writeText(shareText);
              alert("클립보드에 복사됨!\n" + shareText);
            }
          }}
        >
          <span>📤</span>
          <span>오늘의 연애 운세 공유하기</span>
        </button>

        {/* 하단 안내 */}
        <p className="text-center text-[10px] text-gray-500">
          이건 운세가 아니라, 오늘의 감정 컨디션 리포트예요 😊
        </p>
      </div>
    </div>
  );
}
