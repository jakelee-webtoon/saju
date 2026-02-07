"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type MatchResult } from "@/app/lib/match/mbti";
import { type MatchTexts } from "@/app/lib/match/texts";
import { getArrowBalanceSync, useArrowSync, canUseArrow } from "@/app/lib/cupid/arrowBalance";
import { getKakaoUser, isLoggedIn } from "@/app/lib/kakao";
import { isContentUnlocked, recordContentUnlock } from "@/app/lib/firebase";
import { ShareableMatchCard, ShareModal } from "@/app/components/share";
import { useImageShare } from "@/app/hooks/useImageShare";

interface MatchResultCardProps {
  nickname: string;
  myMbti: string;
  theirMbti: string;
  result: MatchResult;
  texts: MatchTexts;
  onReset: () => void;
}

/**
 * MBTI 궁합 결과 카드
 */
export default function MatchResultCard({
  nickname,
  myMbti,
  theirMbti,
  result,
  texts,
  onReset,
}: MatchResultCardProps) {
  const router = useRouter();
  const { score, gradeInfo } = result;
  const [arrowBalance, setArrowBalance] = useState(0);
  const [isDetailUnlocked, setIsDetailUnlocked] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  
  // 공유 훅
  const { showShareModal, isSharing, shareMessage, shareCardRef, handleShare, openModal, closeModal } = useImageShare();

  // 궁합 고유 ID 생성
  const matchId = `mbti_${myMbti}_${theirMbti}`;

  useEffect(() => {
    const loadData = async () => {
      const balance = await getArrowBalanceSync();
      setArrowBalance(balance);
      
      // Firebase에서 언락 상태 확인
      if (isLoggedIn()) {
        const kakaoUser = getKakaoUser();
        if (kakaoUser) {
          const unlocked = await isContentUnlocked(kakaoUser.id, "matchDetails", matchId);
          setIsDetailUnlocked(unlocked);
        }
      }
    };
    loadData();
  }, [matchId]);

  // 이미지로 공유하기
  const handleImageShare = () => handleShare({
    title: `${nickname}님과의 MBTI 궁합`,
    text: `${score}점 (${result.grade})`,
    filename: `match-mbti-${myMbti}-${theirMbti}.png`,
  });

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {nickname}님과의 궁합
        </h2>
        <p className="text-sm text-gray-500">
          내 사주 기반 × {theirMbti}
        </p>
      </div>

      {/* 점수 카드 */}
      <div className={`rounded-2xl ${gradeInfo.bgColor} p-6 text-center`}>
        <div className="text-4xl mb-2">{gradeInfo.emoji}</div>
        <div className={`text-5xl font-black ${gradeInfo.color} mb-2`}>
          {score}
          <span className="text-2xl">점</span>
        </div>
        <div className={`text-lg font-bold ${gradeInfo.color}`}>
          {result.grade}
        </div>
      </div>

      {/* 선언문 */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <p className="text-center text-gray-700 font-medium leading-relaxed">
          "{texts.declaration}"
        </p>
      </div>

      {/* 좋은 포인트 */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
        <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
          <span>✨</span> 좋은 점
        </h3>
        <ul className="space-y-2">
          {texts.goodPoints.map((point, i) => (
            <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
              <span className="text-emerald-500">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 조심 포인트 */}
      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
        <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
          <span>⚠️</span> 조심할 점
        </h3>
        <ul className="space-y-2">
          {texts.cautionPoints.map((point, i) => (
            <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 오늘 추천 행동 */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 p-5">
        <h3 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
          <span>💡</span> 오늘 추천
        </h3>
        <p className="text-sm text-purple-800 font-medium">
          {texts.action}
        </p>
      </div>

      {/* 🔒 유료 영역: 상세 분석 */}
      {!isDetailUnlocked ? (
        <button
          onClick={async () => {
            if (canUseArrow(2)) {
              setShowUnlockAnimation(true);
              const result = await useArrowSync(2);
              if (result.success) {
                setArrowBalance(result.newBalance);
                
                // Firebase에 언락 기록 (영구)
                if (isLoggedIn()) {
                  const kakaoUser = getKakaoUser();
                  if (kakaoUser) {
                    await recordContentUnlock(kakaoUser.id, "matchDetails", matchId);
                  }
                }
                
                setTimeout(() => {
                  setIsDetailUnlocked(true);
                  setShowUnlockAnimation(false);
                }, 500);
              } else {
                setShowUnlockAnimation(false);
                router.push("/shop");
              }
            } else {
              router.push("/shop");
            }
          }}
          className={`w-full rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-5 text-left transition-all hover:from-gray-700 hover:to-gray-800 active:scale-[0.98] ${
            showUnlockAnimation ? "scale-95 opacity-50" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{showUnlockAnimation ? "🔓" : "🔒"}</span>
              <div>
                <p className="text-sm font-bold text-white mb-0.5">
                  왜 잘 맞는지, 어디서 어긋나는지
                </p>
                <p className="text-xs text-gray-400">
                  자세히 보기
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-pink-400 text-sm font-medium">
              <span>💘</span>
              <span>화살 2개</span>
              <span>→</span>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-gray-500 text-right">
            내 화살 {arrowBalance}개
          </p>
        </button>
      ) : (
        /* 🔓 언락된 상세 분석 */
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔓</span>
            <h3 className="text-sm font-bold text-purple-800">상세 궁합 분석</h3>
          </div>
          
          {/* 왜 잘 맞는지 */}
          <div className="p-3 rounded-xl bg-white/80">
            <h4 className="text-xs font-bold text-emerald-600 mb-2">💚 왜 잘 맞나면</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {myMbti}의 {myMbti.includes("E") ? "외향적 에너지" : "내향적 깊이"}와 
              {theirMbti}의 {theirMbti.includes("E") ? "활발함" : "차분함"}이 
              서로를 {score >= 70 ? "완벽하게 보완" : "적절히 균형"}해줘요.
              {score >= 80 && " 특히 대화할 때 서로의 관점이 시너지를 내요."}
            </p>
          </div>
          
          {/* 어디서 어긋나는지 */}
          <div className="p-3 rounded-xl bg-white/80">
            <h4 className="text-xs font-bold text-amber-600 mb-2">⚡ 주의할 포인트</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {myMbti.includes("J") !== theirMbti.includes("J") 
                ? "계획 vs 즉흥 스타일 차이가 있어서, 여행이나 데이트 계획 시 미리 조율이 필요해요."
                : myMbti.includes("T") !== theirMbti.includes("T")
                ? "감정 표현 방식이 달라서, 서로의 사랑 표현 방식을 이해하는 게 중요해요."
                : "비슷한 성향이라 편하지만, 가끔 새로운 자극이 필요할 수 있어요."}
            </p>
          </div>
          
          {/* 꿀팁 */}
          <div className="p-3 rounded-xl bg-purple-100/50">
            <h4 className="text-xs font-bold text-purple-700 mb-2">💡 관계 꿀팁</h4>
            <p className="text-sm text-purple-800 leading-relaxed">
              {score >= 80 
                ? "이미 좋은 케미! 서로의 장점을 자주 말해주면 더 깊어져요."
                : score >= 60
                ? "차이점을 인정하고, 서로 다른 부분에서 배우려는 자세가 중요해요."
                : "노력이 필요하지만, 그만큼 성장할 수 있는 관계예요. 소통이 핵심!"}
            </p>
          </div>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onReset}
          className="flex-1 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          다른 사람과 궁합 보기
        </button>
        <button
          onClick={openModal}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>📤</span>
          <span>공유하기</span>
        </button>
      </div>
      
      {/* 추가 CTA */}
      <button
        onClick={() => router.push("/?tab=love")}
        className="w-full py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span>💗</span>
        <span>오늘의 연애 운세도 확인하기</span>
      </button>

      {/* 공유 모달 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={closeModal}
        onShare={handleImageShare}
        isSharing={isSharing}
        shareMessage={shareMessage}
      >
        <ShareableMatchCard
          ref={shareCardRef}
          type="mbti"
          nickname={nickname}
          myValue={myMbti}
          theirValue={theirMbti}
          score={score}
          grade={result.grade}
          gradeEmoji={gradeInfo.emoji}
          headline={texts.declaration}
        />
      </ShareModal>
    </div>
  );
}
