"use client";

import { useRouter } from "next/navigation";
import type { ManseResult } from "@/app/lib/saju";
import type { CharacterType } from "@/app/lib/saju/characterTypes";
import type { TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";
import TodayLoveHeroCard from "@/app/components/home/TodayLoveHeroCard";
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
  onTabChange?: (tab: "home" | "chat" | "reply") => void;
}

export default function HomePage({
  manseResult,
  character,
  todayMode,
  formData,
  onEdit,
  onViewDetail,
  onViewLove,
  onTabChange,
}: HomePageProps) {
  const router = useRouter();

  const handleChatClick = () => {
    if (onTabChange) {
      onTabChange("chat");
    }
  };

  const handleReplyClick = () => {
    if (onTabChange) {
      onTabChange("reply");
    }
  };

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

        {/* 메인 카드: 오늘의 연애 */}
        <TodayLoveHeroCard todayMode={todayMode} onClick={onViewLove} />

        {/* 상대방과의 나의 대화분석 */}
        <div className="mb-4">
          <section
            className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border border-blue-200 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm"
            onClick={handleChatClick}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💬</span>
                  <span>상대방과의 나의 대화분석</span>
                </h3>
                <p className="text-sm text-gray-600">
                  카톡 대화로 상대 마음 읽기
                </p>
              </div>
              <span className="text-gray-400 opacity-60 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </section>
        </div>

        {/* 답장 자동 생성기 */}
        <div className="mb-4">
          <section
            className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-5 border border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm"
            onClick={handleReplyClick}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>✨</span>
                  <span>답장 자동 생성기</span>
                </h3>
                <p className="text-sm text-gray-600">
                  AI가 만들어주는 완벽한 답장
                </p>
              </div>
              <span className="text-gray-400 opacity-60 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </section>
        </div>

        {/* 궁합 미니 카드 */}
        <div className="mb-4">
          <CompatibilityMiniCard onClick={() => router.push("/match")} />
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-[10px] text-[#9ca3af]">
          매일 바뀌는 오늘의 상태 · 캐릭터로 풀어본 사주
        </p>
      </div>
    </div>
  );
}
