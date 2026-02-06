"use client";

import { type TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateDecisionGuide,
  isUnlockedToday,
  markUnlockedToday,
  type DecisionGuide,
} from "@/app/lib/cupid/decisionGuide";
import { getArrowBalanceSync, useArrowSync, canUseArrow } from "@/app/lib/cupid/arrowBalance";
import { getKakaoUser, isLoggedIn } from "@/app/lib/kakao";
import { isContentUnlocked, recordContentUnlock } from "@/app/lib/firebase";

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // 결정 가이드 상태
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [decisionGuide, setDecisionGuide] = useState<DecisionGuide | null>(null);
  const [arrowBalance, setArrowBalance] = useState(0);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // 결정 가이드 생성
    const guide = generateDecisionGuide(todayMode);
    setDecisionGuide(guide);
    
    // 잠금 해제 상태 확인 (Firebase 우선)
    const loadData = async () => {
      if (isLoggedIn()) {
        const kakaoUser = getKakaoUser();
        if (kakaoUser) {
          const unlocked = await isContentUnlocked(kakaoUser.id, "decisionGuide");
          setIsUnlocked(unlocked);
          if (unlocked) markUnlockedToday(); // localStorage 동기화
        }
      } else {
        setIsUnlocked(isUnlockedToday());
      }
      
      const balance = await getArrowBalanceSync();
      setArrowBalance(balance);
    };
    loadData();
  }, [todayMode]);

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

  // 카카오톡 공유
  const handleKakaoShare = () => {
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

  // 네이티브 공유
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

  // 결정 가이드 잠금 해제
  const handleUnlock = async () => {
    // 화살 부족 시 샵으로 이동
    if (!canUseArrow(1)) {
      router.push("/shop");
      return;
    }
    
    setShowUnlockAnimation(true);
    
    // 화살 1개 사용 (Firebase 동기화)
    const result = await useArrowSync(1);
    if (!result.success) {
      setShowUnlockAnimation(false);
      router.push("/shop");
      return;
    }
    
    setArrowBalance(result.newBalance);
    markUnlockedToday(); // localStorage
    
    // Firebase에 언락 기록 (하루 유지)
    if (isLoggedIn()) {
      const kakaoUser = getKakaoUser();
      if (kakaoUser) {
        await recordContentUnlock(kakaoUser.id, "decisionGuide");
      }
    }
    
    setTimeout(() => {
      setIsUnlocked(true);
      setShowUnlockAnimation(false);
    }, 600);
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

        {/* ========================================
            💘 유료 영역: 오늘의 연애 결정 가이드
        ======================================== */}
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

            {!isUnlocked ? (
              /* 🔒 잠금 상태 카드 */
              <div 
                className={`relative rounded-2xl overflow-hidden shadow-lg border border-white/50 transition-all duration-300 ${
                  showUnlockAnimation ? "scale-95 opacity-50" : ""
                }`}
              >
                {/* 블러 배경 */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-pink-900/80 backdrop-blur-sm" />
                
                {/* 콘텐츠 */}
                <div className="relative p-6 text-center">
                  {/* 자물쇠 아이콘 */}
                  <div className="mb-4">
                    <span className="text-5xl">{showUnlockAnimation ? "🔓" : "🔒"}</span>
                  </div>
                  
                  {/* 타이틀 */}
                  <h3 className="text-lg font-bold text-white mb-2">
                    오늘의 연애 결정 가이드
                  </h3>
                  
                  {/* 오늘의 질문 미리보기 */}
                  <p className="text-white/80 text-sm mb-1">
                    {decisionGuide.question.emoji} &ldquo;{decisionGuide.question.question}&rdquo;
                  </p>
                  
                  {/* 설명 */}
                  <p className="text-white/60 text-xs mb-5">
                    오늘 운세 기준으로 지금 이 행동, 해도 될지 알려드려요
                  </p>
                  
                  {/* CTA 버튼 */}
                  {canUseArrow(1) ? (
                    <button
                      onClick={handleUnlock}
                      disabled={showUnlockAnimation}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm transition-all hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] shadow-lg disabled:opacity-70"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>🔓</span>
                        <span>화살 1개로 열기</span>
                        <span className="text-white/70">💘</span>
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-white/80 text-xs">
                        화살이 있으면 바로 볼 수 있어요
                      </p>
                      <button
                        onClick={() => router.push("/shop")}
                        className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm transition-all hover:bg-white/30 active:scale-[0.98]"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span>💘</span>
                          <span>화살 충전하러 가기 →</span>
                        </span>
                      </button>
                    </div>
                  )}
                  
                  {/* 잔액 표시 */}
                  <p className="mt-3 text-white/50 text-xs">
                    내 화살 {arrowBalance}개
                  </p>
                </div>
              </div>
            ) : (
              /* 🔓 잠금 해제 카드 */
              <div className="rounded-2xl bg-white/95 backdrop-blur p-6 shadow-lg border border-white/50 animate-fadeIn">
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
            )}
          </section>
        )}

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
                    <div className="w-14 h-14 rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-md">
                      <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                        <path d="M24 7C13.5 7 5 13.94 5 22.5C5 28.08 8.56 32.92 14 35.75L12.15 43.28C12 43.87 12.67 44.33 13.19 44L22.15 38.22C22.75 38.31 23.37 38.36 24 38.36C34.5 38.36 43 31.42 43 22.86C43 14.3 34.5 7 24 7Z" fill="#3C1E1E"/>
                        <text x="24" y="27" textAnchor="middle" fill="#FEE500" fontSize="11" fontWeight="bold" fontFamily="Arial">TALK</text>
                      </svg>
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
