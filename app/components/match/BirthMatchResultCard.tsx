"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type BirthMatchResult } from "@/app/lib/match/birth";
import { type BirthMatchTexts } from "@/app/lib/match/texts";
import { getArrowBalanceSync, useArrowSync, canUseArrow } from "@/app/lib/cupid/arrowBalance";
import { getKakaoUser, isLoggedIn } from "@/app/lib/kakao";
import { isContentUnlocked, recordContentUnlock } from "@/app/lib/firebase";

interface BirthMatchResultCardProps {
  nickname: string;
  myBirth: string;
  theirBirth: string;
  result: BirthMatchResult;
  texts: BirthMatchTexts;
  onReset: () => void;
}

/**
 * 생년월일 궁합 결과 카드
 */
export default function BirthMatchResultCard({
  nickname,
  myBirth,
  theirBirth,
  result,
  texts,
  onReset,
}: BirthMatchResultCardProps) {
  const router = useRouter();
  const { score, gradeInfo, comparison } = result;
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [arrowBalance, setArrowBalance] = useState(0);
  const [isDetailUnlocked, setIsDetailUnlocked] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // 궁합 고유 ID 생성
  const matchId = `birth_${theirBirth.replace(/[^0-9]/g, '')}`;

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

상대 생년월일: ${theirBirth}
${gradeInfo.emoji} ${score}점 (${result.grade})

🐾 띠 궁합: ${comparison.zodiacRelation.myZodiac}띠 × ${comparison.zodiacRelation.theirZodiac}띠
🔥 오행 관계: ${comparison.elementRelation.relation}

${texts.headline}

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

  // 띠 관계 설명
  const getZodiacRelationText = () => {
    if (comparison.zodiacRelation.isYukhap) return "육합 (천생연분)";
    if (comparison.zodiacRelation.isSamhap) return "삼합 (시너지)";
    if (comparison.zodiacRelation.isSame) return "같은 띠 (동질감)";
    if (comparison.zodiacRelation.isConflict) return "충 (주의 필요)";
    return "일반";
  };

  // 오행 관계 이모지
  const getElementRelationEmoji = () => {
    switch (comparison.elementRelation.relation) {
      case "상생": return "💚";
      case "비화": return "💙";
      case "상극": return "🔶";
      default: return "⚪";
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
          내 사주 기반 × {theirBirth}
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

      {/* 띠 & 오행 정보 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 띠 궁합 */}
        <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">띠 궁합</p>
          <p className="text-lg font-bold text-gray-800">
            🐾 {comparison.zodiacRelation.myZodiac} × {comparison.zodiacRelation.theirZodiac}
          </p>
          <p className="text-xs text-purple-600 font-medium mt-1">
            {getZodiacRelationText()}
          </p>
        </div>

        {/* 오행 관계 */}
        <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">오행 관계</p>
          <p className="text-lg font-bold text-gray-800">
            {getElementRelationEmoji()} {comparison.elementRelation.myElement} × {comparison.elementRelation.theirElement}
          </p>
          <p className="text-xs text-purple-600 font-medium mt-1">
            {comparison.elementRelation.relation}
          </p>
        </div>
      </div>

      {/* 선언문/헤드라인 */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <p className="text-center text-gray-700 font-medium leading-relaxed">
          "{texts.headline}"
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
          
          {/* 띠 궁합 상세 */}
          <div className="p-3 rounded-xl bg-white/80">
            <h4 className="text-xs font-bold text-emerald-600 mb-2">🐾 띠 궁합 분석</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {comparison.zodiacRelation.isYukhap 
                ? `${comparison.zodiacRelation.myZodiac}띠와 ${comparison.zodiacRelation.theirZodiac}띠는 육합 관계로, 천생연분이에요! 서로의 에너지가 완벽하게 맞아떨어져요.`
                : comparison.zodiacRelation.isSamhap
                ? `${comparison.zodiacRelation.myZodiac}띠와 ${comparison.zodiacRelation.theirZodiac}띠는 삼합 관계로, 함께할 때 시너지가 폭발해요!`
                : comparison.zodiacRelation.isConflict
                ? `${comparison.zodiacRelation.myZodiac}띠와 ${comparison.zodiacRelation.theirZodiac}띠는 충 관계지만, 노력하면 오히려 강한 끌림이 될 수 있어요.`
                : `${comparison.zodiacRelation.myZodiac}띠와 ${comparison.zodiacRelation.theirZodiac}띠는 안정적인 관계를 만들 수 있어요.`}
            </p>
          </div>
          
          {/* 오행 상세 */}
          <div className="p-3 rounded-xl bg-white/80">
            <h4 className="text-xs font-bold text-amber-600 mb-2">🔥 오행 에너지 분석</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {comparison.elementRelation.relation === "상생"
                ? `${comparison.elementRelation.myElement}과 ${comparison.elementRelation.theirElement}은 상생 관계! 서로를 성장시키고 지지해주는 최고의 조합이에요.`
                : comparison.elementRelation.relation === "비화"
                ? `${comparison.elementRelation.myElement}과 ${comparison.elementRelation.theirElement}은 비화 관계로, 비슷한 에너지라 편안하지만 자극이 필요할 수 있어요.`
                : `${comparison.elementRelation.myElement}과 ${comparison.elementRelation.theirElement}은 상극 관계지만, 서로 다른 점이 매력으로 작용할 수 있어요.`}
            </p>
          </div>
          
          {/* 꿀팁 */}
          <div className="p-3 rounded-xl bg-purple-100/50">
            <h4 className="text-xs font-bold text-purple-700 mb-2">💡 관계 꿀팁</h4>
            <p className="text-sm text-purple-800 leading-relaxed">
              {score >= 80 
                ? "운명적인 만남이에요! 서로의 장점을 인정하고 표현하면 더욱 깊어질 거예요."
                : score >= 60
                ? "좋은 케미를 가지고 있어요. 작은 차이점들은 대화로 해결할 수 있어요."
                : "서로 다른 점이 많지만, 그게 오히려 배움의 기회가 될 수 있어요. 열린 마음이 중요해요!"}
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
