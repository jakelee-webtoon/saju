"use client";

import { forwardRef } from "react";

interface ShareableMatchCardProps {
  type: "mbti" | "birth";
  nickname: string;
  myValue: string; // MBTI or birth date
  theirValue: string;
  score: number;
  grade: string;
  gradeEmoji: string;
  headline: string;
}

/**
 * 공유용 궁합 결과 카드 (이미지 캡처용)
 */
const ShareableMatchCard = forwardRef<HTMLDivElement, ShareableMatchCardProps>(
  ({ type, nickname, myValue, theirValue, score, grade, gradeEmoji, headline }, ref) => {
    // 점수에 따른 색상
    const getScoreGradient = (s: number) => {
      if (s >= 85) return "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)";
      if (s >= 70) return "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)";
      if (s >= 55) return "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)";
      if (s >= 40) return "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)";
      return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)";
    };

    const getScoreColor = (s: number) => {
      if (s >= 85) return "#ec4899";
      if (s >= 70) return "#8b5cf6";
      if (s >= 55) return "#3b82f6";
      if (s >= 40) return "#f59e0b";
      return "#6b7280";
    };

    return (
      <div
        ref={ref}
        className="w-[320px] bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-3xl p-6 shadow-2xl"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* 상단 라벨 */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-purple-100 rounded-full text-purple-600 text-xs font-medium">
            {type === "mbti" ? "MBTI 궁합" : "사주 궁합"}
          </span>
        </div>

        {/* VS 섹션 */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="text-center">
            <p className="text-gray-400 text-[10px] mb-1">나</p>
            <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">{myValue}</span>
            </div>
          </div>
          <span className="text-2xl">💕</span>
          <div className="text-center">
            <p className="text-gray-400 text-[10px] mb-1">{nickname}</p>
            <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
              <span className="text-pink-600 font-bold text-sm">{theirValue}</span>
            </div>
          </div>
        </div>

        {/* 점수 */}
        <div className="text-center mb-4">
          <span 
            className="text-5xl font-black bg-clip-text text-transparent"
            style={{ backgroundImage: getScoreGradient(score) }}
          >
            {score}
          </span>
          <span className="text-xl text-purple-400 font-bold ml-1">점</span>
        </div>

        {/* 점수 게이지 */}
        <div className="mb-4 px-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${score}%`,
                background: getScoreGradient(score)
              }}
            />
          </div>
        </div>

        {/* 등급 배지 */}
        <div className="text-center mb-4">
          <span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md text-sm font-bold"
            style={{ color: getScoreColor(score) }}
          >
            <span>{gradeEmoji}</span>
            <span>{grade}</span>
          </span>
        </div>

        {/* 헤드라인 */}
        <div className="bg-white/80 rounded-2xl p-4 mb-5 shadow-sm">
          <p className="text-gray-700 text-center text-sm leading-relaxed">
            &ldquo;{headline}&rdquo;
          </p>
        </div>

        {/* 하단 브랜딩 */}
        <div className="border-t border-purple-100 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💘</span>
            <span className="text-purple-400 text-xs font-medium">사주큐피드</span>
          </div>
          <span className="text-purple-300 text-[10px]">sajucupid.com</span>
        </div>
      </div>
    );
  }
);

ShareableMatchCard.displayName = "ShareableMatchCard";

export default ShareableMatchCard;
