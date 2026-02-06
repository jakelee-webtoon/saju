"use client";

import { useState } from "react";
import { type MatchResult } from "@/app/lib/match/mbti";
import { type MatchTexts } from "@/app/lib/match/texts";

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
  const { score, gradeInfo } = result;
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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
