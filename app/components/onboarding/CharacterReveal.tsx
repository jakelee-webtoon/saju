"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getCharacterImage } from "@/app/lib/saju/character-images";
import { type CharacterType } from "@/app/lib/saju/characterTypes";

interface CharacterRevealProps {
  character: CharacterType;
  userName?: string;
  onComplete: () => void;
}

export default function CharacterReveal({
  character,
  userName,
  onComplete,
}: CharacterRevealProps) {
  const [phase, setPhase] = useState<"loading" | "reveal" | "detail">("loading");
  const [showConfetti, setShowConfetti] = useState(false);
  const imageUrl = getCharacterImage(character.id);

  useEffect(() => {
    // 로딩 페이즈 (1.5초)
    const timer1 = setTimeout(() => {
      setPhase("reveal");
      setShowConfetti(true);
    }, 1500);

    // 디테일 페이즈 (추가 1초 후)
    const timer2 = setTimeout(() => {
      setPhase("detail");
    }, 2500);

    // Confetti 종료
    const timer3 = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a1a2e] flex flex-col items-center justify-center overflow-hidden">
      {/* Confetti 이펙트 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span
                className="text-2xl"
                style={{
                  filter: `hue-rotate(${Math.random() * 360}deg)`,
                }}
              >
                {["✨", "💫", "⭐", "💗", "🎉", "🔥"][Math.floor(Math.random() * 6)]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 로딩 페이즈 */}
      {phase === "loading" && (
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
            <span className="text-4xl">🔮</span>
          </div>
          <p className="text-white/80 text-lg font-medium">
            당신의 캐릭터를 분석 중...
          </p>
          <div className="mt-4 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 리빌 페이즈 */}
      {(phase === "reveal" || phase === "detail") && (
        <div className="flex flex-col items-center px-8 max-w-md">
          {/* 캐릭터 이미지 */}
          <div
            className={`relative mb-6 transition-all duration-700 ${
              phase === "reveal" ? "scale-0 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{
              animation: phase === "reveal" ? "none" : "popIn 0.6s ease-out forwards",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl scale-150" />
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={character.name}
                width={160}
                height={160}
                className="relative w-40 h-40 object-contain drop-shadow-2xl"
                unoptimized
              />
            )}
          </div>

          {/* 캐릭터 이름 */}
          <div
            className={`text-center transition-all duration-500 delay-300 ${
              phase === "detail" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {userName && (
              <p className="text-white/60 text-sm mb-2">{userName}님은</p>
            )}
            <h1 className="text-3xl font-bold text-white mb-3">
              {character.name}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              "{character.declaration}"
            </p>
          </div>

          {/* 캐릭터 특성 뱃지 */}
          <div
            className={`flex flex-wrap justify-center gap-2 mt-6 transition-all duration-500 delay-500 ${
              phase === "detail" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {character.strengths.slice(0, 2).map((strength, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium"
              >
                ✨ {strength}
              </span>
            ))}
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={onComplete}
            className={`mt-10 w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base hover:shadow-lg active:scale-[0.98] transition-all duration-500 delay-700 ${
              phase === "detail" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            내 캐릭터 자세히 보기 💫
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
