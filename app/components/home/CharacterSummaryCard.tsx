"use client";

import Image from "next/image";
import { getCharacterImage } from "@/app/lib/saju/character-images";

interface CharacterSummaryCardProps {
  characterId: string;
  characterName: string;
  declaration: string;
  color: string;
  onClick: () => void;
}

/**
 * 나의 캐릭터 요약 카드 (홈 전용)
 * - 능력치/무기/약점 없이 이미지 + 이름 + 선언문만
 * - 클릭 시 상세 페이지로 이동
 */
export default function CharacterSummaryCard({
  characterId,
  characterName,
  declaration,
  color,
  onClick,
}: CharacterSummaryCardProps) {
  const imageUrl = getCharacterImage(characterId);

  return (
    <section
      onClick={onClick}
      className="rounded-3xl bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] p-6 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
    >
      {/* 배경 이펙트 */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-4 right-4 w-24 h-24 rounded-full ${color} blur-3xl`}></div>
        <div className={`absolute bottom-4 left-4 w-16 h-16 rounded-full ${color} blur-2xl`}></div>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        {/* 캐릭터 이미지 */}
        <div className="relative w-24 h-24 shrink-0">
          <div className={`absolute inset-0 rounded-full ${color} opacity-20 blur-xl`}></div>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={characterName}
              width={96}
              height={96}
              className="relative w-full h-full object-contain drop-shadow-lg"
              unoptimized
            />
          ) : (
            <div className={`w-full h-full rounded-full ${color} opacity-30 flex items-center justify-center`}>
              <span className="text-3xl">✨</span>
            </div>
          )}
        </div>

        {/* 텍스트 영역 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white mb-2">{characterName}</h2>
          <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
            "{declaration}"
          </p>
        </div>

        {/* 화살표 */}
        <div className="shrink-0 text-white/40">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
