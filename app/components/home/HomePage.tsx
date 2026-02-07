"use client";

import { useRouter } from "next/navigation";
import type { ManseResult } from "@/app/lib/saju";
import type { CharacterType } from "@/app/lib/saju/characterTypes";
import type { TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";
import TodayStatusLine from "@/app/components/home/TodayStatusLine";
import CharacterSummaryCard from "@/app/components/home/CharacterSummaryCard";
import LoveTendencyCard from "@/app/components/home/LoveTendencyCard";
import TodayLoveModeCard from "@/app/components/home/TodayLoveModeCard";
import ManseryeokAccordion from "@/app/components/home/ManseryeokAccordion";
import CompatibilityMiniCard from "@/app/components/home/CompatibilityMiniCard";
import type { FormData } from "@/app/types";

interface HomePageProps {
  manseResult: ManseResult;
  character: CharacterType;
  todayMode: TodayModeResult;
  formData: FormData;
  onEdit: () => void;
  onViewDetail: () => void;
  onViewLove: () => void;
}

export default function HomePage({
  manseResult,
  character,
  todayMode,
  formData,
  onEdit,
  onViewDetail,
  onViewLove,
}: HomePageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-bottom-nav">
      <div className="mx-auto max-w-md px-5 py-6">
        {/* 헤더 */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#1a1a2e]">
              {formData.name ? `${formData.name}님` : "오늘의 나"} {todayMode.modeEmoji}
            </h1>
            <p className="text-xs text-[#9ca3af]">
              {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </p>
          </div>
          <button
            onClick={onEdit}
            className="text-xs text-[#6b7280] hover:text-[#1a1a2e] px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb]"
          >
            정보 수정
          </button>
        </header>

        {/* [1] 오늘의 한 줄 상태 */}
        <div className="mb-4">
          <TodayStatusLine statusOneLiner={todayMode.statusOneLiner} />
        </div>

        {/* [2] 나의 캐릭터 요약 카드 */}
        <div className="mb-4">
          <CharacterSummaryCard
            characterId={character.id}
            characterName={character.name}
            declaration={character.declaration}
            color={character.color}
            onClick={onViewDetail}
          />
        </div>

        {/* [3] 나의 기본 연애 성향 */}
        <div className="mb-4">
          <LoveTendencyCard characterId={character.id} />
        </div>

        {/* [4] 오늘의 연애 모드 카드 */}
        <div className="mb-4">
          <TodayLoveModeCard todayMode={todayMode} onClick={onViewLove} />
        </div>

        {/* [5] 궁합 미니 카드 */}
        <div className="mb-4">
          <CompatibilityMiniCard onClick={() => router.push("/match")} />
        </div>

        {/* [6] 나의 만세력 보기 */}
        <div className="mb-8">
          <ManseryeokAccordion manseResult={manseResult} />
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-[10px] text-[#9ca3af]">
          매일 바뀌는 오늘의 상태 · 캐릭터로 풀어본 사주
        </p>
      </div>
    </div>
  );
}
