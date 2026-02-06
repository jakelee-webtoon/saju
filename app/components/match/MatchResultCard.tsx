"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type MatchResult } from "@/app/lib/match/mbti";
import { type MatchTexts } from "@/app/lib/match/texts";
import { getArrowBalanceSync, useArrowSync, canUseArrow } from "@/app/lib/cupid/arrowBalance";
import { getKakaoUser, isLoggedIn, shareToKakao } from "@/app/lib/kakao";
import { isContentUnlocked, recordContentUnlock } from "@/app/lib/firebase";

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [arrowBalance, setArrowBalance] = useState(0);
  const [isDetailUnlocked, setIsDetailUnlocked] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

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

  // 공유 텍스트 생성
  const shareText = `💕 ${nickname}님과의 궁합

상대 MBTI: ${theirMbti}
${gradeInfo.emoji} ${score}점 (${result.grade})

${texts.declaration}

✨ 좋은 점
${texts.goodPoints.map(p => `• ${p}`).join('\n')}

⚠️ 조심할 점
${texts.cautionPoints.map(p => `• ${p}`).join('\n')}

💡 오늘 추천: ${texts.action}`;

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

  // 카카오톡 네이티브 공유
  const handleKakaoShare = async () => {
    const success = await shareToKakao({
      title: `${gradeInfo.emoji} ${nickname}님과의 MBTI 궁합`,
      description: `${score}점 (${result.grade}) - ${texts.declaration}`,
      buttonTitle: "나도 궁합 보기",
    });
    
    if (!success) {
      navigator.clipboard.writeText(shareText);
      alert("텍스트가 복사되었어요!\n카카오톡에서 붙여넣기 해주세요 💬");
    }
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
          title: `${nickname}님과의 궁합`,
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
          다시 하기
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>📤</span>
          <span>공유하기</span>
        </button>
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
