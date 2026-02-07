"use client";

import { type TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateDecisionGuide,
  type DecisionGuide,
} from "@/app/lib/cupid/decisionGuide";
import { ShareableFortuneCard, ShareModal } from "@/app/components/share";
import { useImageShare } from "@/app/hooks/useImageShare";

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
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // 공유 훅
  const { showShareModal, isSharing, shareMessage, shareCardRef, handleShare, openModal, closeModal } = useImageShare();
  
  // 결정 가이드 상태
  const [decisionGuide, setDecisionGuide] = useState<DecisionGuide | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // 결정 가이드 생성
    const guide = generateDecisionGuide(todayMode);
    setDecisionGuide(guide);
  }, [todayMode]);

  if (!isMounted) return null;

  // 배경 그라데이션 클래스
  const bgGradient = `bg-gradient-to-br ${todayMode.color.bg}`;

  // 이미지로 공유하기
  const handleImageShare = () => handleShare({
    title: `${todayMode.modeName} - 오늘의 연애 운세`,
    text: "내 오늘의 연애 운세를 확인해보세요!",
    filename: `fortune-${todayMode.modeName}.png`,
  });

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

        {/* 오늘의 연애 결정 가이드 */}
        {decisionGuide && (
          <section className="mb-6">
            {/* 일일 특별 태그 */}
            {decisionGuide.dailyTag && (
              <div className="text-center mb-3">
                <span className="inline-block text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  {decisionGuide.dailyTag}
                </span>
              </div>
            )}

            {/* 결정 가이드 카드 */}
            <div className="rounded-2xl bg-white/95 backdrop-blur p-6 shadow-lg border border-white/50">
              {/* 헤더 */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{decisionGuide.question.emoji}</span>
                <h3 className="text-base font-bold text-gray-900">
                  {decisionGuide.question.question}
                </h3>
              </div>
              
              {/* 결론 */}
              <div className={`p-4 rounded-xl mb-4 ${
                decisionGuide.result.isPositive 
                  ? "bg-emerald-50 border border-emerald-100" 
                  : "bg-amber-50 border border-amber-100"
              }`}>
                <p className={`text-lg font-bold flex items-start gap-2 ${
                  decisionGuide.result.isPositive ? "text-emerald-700" : "text-amber-700"
                }`}>
                  <span>{decisionGuide.result.isPositive ? "👉" : "⚠️"}</span>
                  <span>{decisionGuide.result.conclusion}</span>
                </p>
              </div>
              
              {/* 이유 */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Why
                </h4>
                <ul className="space-y-1.5">
                  {decisionGuide.result.reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 추천 행동 */}
              <div className={`p-3 rounded-xl ${
                decisionGuide.result.isPositive ? "bg-purple-50" : "bg-gray-50"
              }`}>
                <p className={`text-sm font-medium flex items-start gap-2 ${
                  decisionGuide.result.isPositive ? "text-purple-700" : "text-gray-700"
                }`}>
                  <span>💡</span>
                  <span>{decisionGuide.result.recommendation}</span>
                </p>
              </div>
              
              {/* 하단 안내 */}
              <p className="mt-4 text-center text-[10px] text-gray-400">
                내일 다시 열면 새로운 질문이 나와요 ✨
              </p>
            </div>
          </section>
        )}

        {/* 공유 버튼 */}
        <button
          className={`w-full mb-4 rounded-xl ${todayMode.color.accent} py-4 text-[15px] font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]`}
          onClick={openModal}
        >
          <span>📤</span>
          <span>오늘의 연애 운세 공유하기</span>
        </button>

        {/* 하단 안내 */}
        <p className="text-center text-[10px] text-gray-500">
          이건 운세가 아니라, 오늘의 감정 컨디션 리포트예요 😊
        </p>
      </div>

      {/* 공유 모달 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={closeModal}
        onShare={handleImageShare}
        isSharing={isSharing}
        shareMessage={shareMessage}
      >
        <ShareableFortuneCard
          ref={shareCardRef}
          todayMode={todayMode}
          characterName={characterName}
        />
      </ShareModal>
    </div>
  );
}
