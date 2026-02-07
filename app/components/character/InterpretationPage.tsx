"use client";

import { useState } from "react";
import type { ManseResult, Element } from "@/app/lib/saju";
import type { CharacterType } from "@/app/lib/saju/characterTypes";
import type { TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";
import TodayModeSnippet from "@/app/components/todayMode/TodayModeSnippet";
import TodayModeBottomSheet from "@/app/components/todayMode/TodayModeBottomSheet";
import Image from "next/image";
import { getCharacterImage } from "@/app/lib/saju/character-images";
import { ShareableCharacterCard, ShareModal } from "@/app/components/share";
import { useImageShare } from "@/app/hooks/useImageShare";
import type { FormData } from "@/app/types";

// ========================
// 헬퍼 함수 & 서브 컴포넌트
// ========================

/** 오행 바 퍼센트 계산 (극적으로 스케일링) */
function getElementPercent(count: number, total: number): number {
  if (total === 0 || count === 0) return 0;
  const scaleMap: Record<number, number> = { 1: 25, 2: 50, 3: 75, 4: 90, 5: 95, 6: 100, 7: 100, 8: 100 };
  return scaleMap[count] ?? Math.min(100, count * 15);
}

/** 2D 플랫 스타일 프로그레스 바 컴포넌트 */
function EnergyBar({ element, count, total }: { element: Element; count: number; total: number }) {
  const percent = count > 0 ? getElementPercent(count, total) : 0;
  
  const barColors: Record<Element, string> = {
    화: "bg-red-500",
    수: "bg-blue-500",
    목: "bg-emerald-500",
    토: "bg-amber-500",
    금: "bg-slate-400",
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 h-6 rounded-full bg-white/20 overflow-hidden">
        {count > 0 && (
          <div 
            className={`absolute left-0 top-0 h-full ${barColors[element]} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <div className={`min-w-[40px] text-right font-black text-lg ${count === 0 ? 'text-white/30' : count >= 3 ? 'text-yellow-300' : 'text-white'}`}>
        {count === 0 ? '-' : `×${count}`}
      </div>
    </div>
  );
}

/** 오행 이모지 */
const elementEmoji: Record<Element, string> = {
  화: "🔥",
  수: "🌊",
  목: "🪾",
  토: "🧱",
  금: "🧈",
};

/** 오행 설명 (툴팁용) */
const elementTooltip: Record<Element, string> = {
  화: "열정, 추진력, 표현력",
  수: "지혜, 유연함, 깊은 생각",
  목: "성장, 시작, 확장",
  토: "안정, 중심, 신뢰",
  금: "결단력, 정리, 기준",
};

/** 캐릭터 그래픽 컴포넌트 */
function CharacterGraphic({ id, color }: { id: string; color: string }) {
  const imageUrl = getCharacterImage(id);

  if (imageUrl) {
    return (
      <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full ${color} opacity-10 blur-2xl`}></div>
        <Image 
          src={imageUrl} 
          alt={id} 
          width={192}
          height={192}
          priority
          className="relative w-full h-full object-contain drop-shadow-2xl animate-float"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={`relative w-40 h-40 mx-auto mb-6 flex items-center justify-center rounded-full ${color} bg-opacity-20`}>
      <svg viewBox="0 0 100 100" className="w-32 h-32 drop-shadow-lg">
        <path 
          d={id === 'fire' ? "M30,80 Q50,20 70,80 Z" : 
             id === 'water' ? "M20,80 Q50,40 80,80 Q50,90 20,80" :
             id === 'wood' ? "M40,90 L60,90 L60,40 L40,40 Z" :
             id === 'earth' ? "M20,80 L80,80 L70,40 L30,40 Z" :
             id === 'metal' ? "M50,20 L80,50 L50,80 L20,50 Z" :
             "M30,80 A20,20 0 1,1 70,80 Z"} 
          fill="currentColor" 
          className={color.replace('bg-', 'text-')}
        />
        <circle cx="40" cy="55" r="4" fill="white" />
        <circle cx="60" cy="55" r="4" fill="white" />
        <circle cx="40" cy="55" r="1.5" fill="#1a1a2e" />
        <circle cx="60" cy="55" r="1.5" fill="#1a1a2e" />
        <path d="M45,65 Q50,70 55,65" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        {id === 'fire' && (
          <path d="M45,20 Q50,5 55,20" fill="#ef4444" />
        )}
        {id === 'wood' && (
          <path d="M50,40 L50,25 M45,30 L50,25 L55,30" stroke="#10b981" strokeWidth="3" fill="none" />
        )}
      </svg>
    </div>
  );
}

// ========================
// 메인 컴포넌트
// ========================

interface InterpretationPageProps {
  manseResult: ManseResult;
  character: CharacterType;
  todayMode: TodayModeResult;
  formData: FormData;
  onBack: () => void;
}

export default function InterpretationPage({
  manseResult,
  character,
  todayMode,
  formData,
  onBack,
}: InterpretationPageProps) {
  const { elements } = manseResult;
  
  // 바텀시트 상태
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
  // 에너지 게이지 아코디언 상태
  const [isEnergyOpen, setIsEnergyOpen] = useState(false);

  // 공유 훅
  const { showShareModal, isSharing, shareMessage, shareCardRef, handleShare, openModal, closeModal } = useImageShare();

  // 이미지로 공유하기
  const handleImageShare = () => handleShare({
    title: `${character.name} - 나의 연애 캐릭터`,
    text: "내 연애 캐릭터를 확인해보세요!",
    filename: `character-${character.id}.png`,
  });

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        
        {/* 헤더 */}
        <header className="mb-6">
          <button 
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
        </header>

        {/* [1] 캐릭터 이름 + 선언문 */}
        <section className="mb-6 rounded-3xl bg-[#1A2246] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className={`absolute top-4 right-4 w-32 h-32 rounded-full ${character.color} blur-3xl`}></div>
            <div className={`absolute bottom-4 left-4 w-24 h-24 rounded-full ${character.color} blur-2xl`}></div>
          </div>
          
          <div className="relative z-10">
            <CharacterGraphic id={character.id} color={character.color} />
            <h1 className="text-2xl font-black text-white mb-4">{character.name}</h1>
            <p className="text-lg text-white/90 font-medium leading-relaxed">
              &quot;{character.declaration}&quot;
            </p>
          </div>
        </section>

        {/* [2] 강점과 약점 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <section className="rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-1">
              <span>⚔️</span> 무기
            </h2>
            <ul className="space-y-2">
              {character.strengths.map((text, i) => (
                <li key={i} className="text-xs text-emerald-800 leading-relaxed">
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-rose-50 p-5 border border-rose-100">
            <h2 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-1">
              <span>💔</span> 약점
            </h2>
            <ul className="space-y-2">
              {character.weaknesses.map((text, i) => (
                <li key={i} className="text-xs text-rose-800 leading-relaxed">
                  {text}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* [3] 공감 문장 */}
        <section className="mb-6 rounded-2xl bg-[#f9fafb] p-6 border border-[#e5e7eb]">
          <h2 className="text-sm font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
            <span>👀</span> 이거 나야...
          </h2>
          <ul className="space-y-3">
            {character.empathy.map((text, i) => (
              <li key={i} className="text-sm text-[#374151] flex items-start gap-3 leading-relaxed">
                <span className="shrink-0 text-[#9ca3af]">•</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* [4] 에너지 분포 (능력치 바) - 아코디언 */}
        <section className="mb-6 rounded-2xl bg-[#1A2246] shadow-xl overflow-hidden">
          <button
            onClick={() => setIsEnergyOpen(!isEnergyOpen)}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <h2 className="text-sm font-bold text-white/80 tracking-wide flex items-center gap-2">
              <span>⚡</span> 에너지 게이지
            </h2>
            <span className={`text-white/60 transition-transform duration-300 ${isEnergyOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out ${isEnergyOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
            <div className="px-5 pb-5 space-y-3">
              {(["목", "화", "토", "금", "수"] as Element[]).map((el) => (
                <div key={el} className="flex items-center gap-2">
                  <span className="w-7 text-lg text-center">{elementEmoji[el]}</span>
                  <span 
                    className="w-5 text-xs font-bold text-white/60 cursor-help relative group"
                    title={elementTooltip[el]}
                  >
                    {el}
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-white text-[#1a1a2e] text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {elementTooltip[el]}
                      <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-white"></span>
                    </span>
                  </span>
                  <div className="flex-1">
                    <EnergyBar element={el} count={elements[el]} total={elements.total} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* [5] 오늘 모드 */}
        <div className="mb-6">
          <TodayModeSnippet
            todayMode={todayMode}
            characterName={character.name}
            onShowMore={() => setIsBottomSheetOpen(true)}
          />
        </div>

        {/* 공유 버튼 */}
        <button 
          className="w-full mb-6 rounded-xl bg-white py-4 text-[15px] font-bold text-[#1a1a2e] border-2 border-[#1a1a2e] transition-colors hover:bg-[#f9fafb] flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          onClick={openModal}
        >
          <span>📤</span>
          <span>이 캐릭터 공유하기</span>
        </button>

      </div>

      {/* 오늘 모드 바텀시트 */}
      <TodayModeBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        todayMode={todayMode}
        characterName={character.name}
      />

      {/* 공유 모달 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={closeModal}
        onShare={handleImageShare}
        isSharing={isSharing}
        shareMessage={shareMessage}
      >
        <ShareableCharacterCard
          ref={shareCardRef}
          character={character}
        />
      </ShareModal>
    </div>
  );
}
