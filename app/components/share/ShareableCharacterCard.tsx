"use client";

import { forwardRef } from "react";
import { type CharacterType } from "@/app/lib/saju/characterTypes";

interface ShareableCharacterCardProps {
  character: CharacterType;
}

/**
 * 공유용 캐릭터 카드 (이미지 캡처용)
 */
const ShareableCharacterCard = forwardRef<HTMLDivElement, ShareableCharacterCardProps>(
  ({ character }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[320px] bg-gradient-to-br from-[#1E234B] via-[#2D325A] to-[#1E234B] rounded-3xl p-6 shadow-2xl"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* 상단 라벨 */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-purple-200 text-xs">
            나의 연애 캐릭터
          </span>
        </div>

        {/* 아이콘 & 이름 */}
        <div className="text-center mb-5">
          <span className="text-6xl block mb-3">{character.emoji}</span>
          <h2 className="text-2xl font-black text-white mb-1">{character.name}</h2>
        </div>

        {/* 선언문 */}
        <div className="bg-white/10 rounded-2xl p-4 mb-5">
          <p className="text-white text-center text-sm leading-relaxed">
            &ldquo;{character.declaration}&rdquo;
          </p>
        </div>

        {/* 강점 */}
        <div className="mb-4">
          <h3 className="text-purple-300 text-xs font-semibold mb-2 flex items-center gap-1">
            <span>✨</span> 강점
          </h3>
          <div className="space-y-1">
            {character.strengths.slice(0, 2).map((strength, i) => (
              <p key={i} className="text-white/80 text-xs flex items-start gap-1">
                <span className="text-purple-400">•</span>
                <span>{strength}</span>
              </p>
            ))}
          </div>
        </div>

        {/* 약점 */}
        <div className="mb-5">
          <h3 className="text-pink-300 text-xs font-semibold mb-2 flex items-center gap-1">
            <span>💭</span> 약점
          </h3>
          <div className="space-y-1">
            {character.weaknesses.slice(0, 2).map((weakness, i) => (
              <p key={i} className="text-white/80 text-xs flex items-start gap-1">
                <span className="text-pink-400">•</span>
                <span>{weakness}</span>
              </p>
            ))}
          </div>
        </div>

        {/* 하단 브랜딩 */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💘</span>
            <span className="text-white/60 text-xs font-medium">사주큐피드</span>
          </div>
          <span className="text-white/40 text-[10px]">sajucupid.com</span>
        </div>
      </div>
    );
  }
);

ShareableCharacterCard.displayName = "ShareableCharacterCard";

export default ShareableCharacterCard;
