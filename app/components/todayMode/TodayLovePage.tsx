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
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // 배경 그라데이션 클래스
  const bgGradient = `bg-gradient-to-br ${todayMode.color.bg}`;

  // 공유 텍스트 생성
  const shareText = `[오늘의 연애 운세: ${characterName}]
${todayMode.modeEmoji} ${todayMode.modeName}

${todayMode.detail.main_sentence}

💡 ${todayMode.detail.one_line_guide}`;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // 클립보드 복사
  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareModal(false);
      }, 1500);
    } catch {
      alert("복사에 실패했어요. 다시 시도해주세요.");
    }
  };

  // 카카오톡 공유 (웹 공유 URL 방식)
  const handleKakaoShare = () => {
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=javascript_key&text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    // 카카오 SDK 없이 간단하게 메시지 복사 후 카카오톡 열기
    navigator.clipboard.writeText(shareText);
    alert("텍스트가 복사되었어요!\n카카오톡에서 붙여넣기 해주세요 💬");
    setShowShareModal(false);
  };

  // 트위터 공유
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  // 네이티브 공유 (모바일)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `오늘의 연애 운세: ${characterName}`,
          text: shareText,
          url: shareUrl,
        });
        setShowShareModal(false);
      } catch {
        // 사용자가 취소한 경우
      }
    }
  };

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
          onClick={() => setShowShareModal(true)}
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
      {showShareModal && (
        <>
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={() => setShowShareModal(false)}
          />
          
          {/* 모달 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
            <div className="mx-auto max-w-md bg-white rounded-t-3xl">
              {/* 핸들 */}
              <div className="pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
              </div>

              <div className="px-6 pb-8">
                <h3 className="text-lg font-bold text-gray-900 text-center mb-6">
                  공유하기
                </h3>

                {/* 공유 옵션들 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {/* 카카오톡 */}
                  <button 
                    onClick={handleKakaoShare}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#FEE500] flex items-center justify-center shadow-md">
                      <span className="text-2xl">💬</span>
                    </div>
                    <span className="text-xs text-gray-600">카카오톡</span>
                  </button>

                  {/* 트위터/X */}
                  <button 
                    onClick={handleTwitterShare}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-md">
                      <span className="text-2xl text-white">𝕏</span>
                    </div>
                    <span className="text-xs text-gray-600">X (트위터)</span>
                  </button>

                  {/* 더보기 (네이티브 공유) */}
                  {'share' in navigator && (
                    <button 
                      onClick={handleNativeShare}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shadow-md">
                        <span className="text-2xl">📱</span>
                      </div>
                      <span className="text-xs text-gray-600">더보기</span>
                    </button>
                  )}

                  {/* 클립보드 복사 */}
                  <button 
                    onClick={handleCopyClipboard}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-colors ${
                      copySuccess ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <span className="text-2xl">{copySuccess ? '✅' : '📋'}</span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {copySuccess ? '복사됨!' : '링크 복사'}
                    </span>
                  </button>
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
