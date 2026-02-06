"use client";

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

  // 공유 텍스트 생성
  const handleShare = () => {
    const shareText = `💕 ${nickname}님과의 궁합

상대 MBTI: ${theirMbti}
${gradeInfo.emoji} ${score}점 (${result.grade})

${texts.declaration}

✨ 좋은 점
${texts.goodPoints.map(p => `• ${p}`).join('\n')}

⚠️ 조심할 점
${texts.cautionPoints.map(p => `• ${p}`).join('\n')}

💡 오늘 추천: ${texts.action}`;

    if (navigator.share) {
      navigator.share({
        title: `${nickname}님과의 궁합`,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("클립보드에 복사되었어요! 📋");
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
          onClick={handleShare}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>📤</span>
          <span>공유하기</span>
        </button>
      </div>
    </div>
  );
}
