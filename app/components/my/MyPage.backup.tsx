"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ManseResult } from "@/app/lib/saju";
import type { CharacterType } from "@/app/lib/saju/characterTypes";
import CharacterSummaryCard from "@/app/components/home/CharacterSummaryCard";
import LoveTendencyCard from "@/app/components/home/LoveTendencyCard";
import ManseryeokAccordion from "@/app/components/home/ManseryeokAccordion";
import AccountSection from "@/app/components/account/AccountSection";
import { getArrowBalanceSync } from "@/app/lib/cupid/arrowBalance";
import type { FormData } from "@/app/types";

interface MyPageProps {
  manseResult: ManseResult;
  character: CharacterType;
  formData: FormData;
  onEdit: () => void;
  onViewDetail: () => void;
  onBack: () => void;
}

export default function MyPage({
  manseResult,
  character,
  formData,
  onEdit,
  onViewDetail,
  onBack,
}: MyPageProps) {
  const router = useRouter();
  const [arrowBalance, setArrowBalance] = useState(0);

  // 화살 잔액 로드
  useEffect(() => {
    const loadBalance = async () => {
      const balance = await getArrowBalanceSync();
      setArrowBalance(balance);
    };
    loadBalance();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-bottom-nav">
      <div className="mx-auto max-w-md px-5 py-6">
        {/* 헤더 */}
        <header className="mb-6">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#1a1a2e]">
                {formData.name ? `${formData.name}님` : "MY"}
              </h1>
              <p className="text-xs text-[#9ca3af]">
                나의 연애 설명서 + 내가 가진 것
              </p>
            </div>
            <button
              onClick={onEdit}
              className="text-xs text-[#6b7280] hover:text-[#1a1a2e] px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb]"
            >
              정보 수정
            </button>
          </div>
        </header>

        {/* 🔥 큐피드 화살 보유량 카드 */}
        <div className="mb-4">
          <div className={`rounded-2xl p-4 border-2 transition-all ${
            arrowBalance === 0 
              ? "bg-amber-50 border-amber-300" 
              : "bg-purple-50 border-purple-300"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <h2 className={`text-xs font-medium ${
                    arrowBalance === 0 ? "text-amber-700" : "text-purple-700"
                  }`}>
                    큐피드 화살
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  arrowBalance === 0 ? "text-amber-600" : "text-purple-600"
                }`}>
                  {arrowBalance}개
                </span>
                <button
                  onClick={() => router.push("/shop")}
                  className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors"
                >
                  충전
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 나의 캐릭터 요약 카드 */}
        <div className="mb-4">
          <CharacterSummaryCard
            characterId={character.id}
            characterName={character.name}
            declaration={character.declaration}
            color={character.color}
            onClick={onViewDetail}
          />
        </div>

        {/* 나의 기본 연애 성향 */}
        <div className="mb-4">
          <LoveTendencyCard characterId={character.id} />
        </div>

        {/* 나의 만세력 보기 */}
        <div className="mb-6">
          <ManseryeokAccordion manseResult={manseResult} />
        </div>

        {/* 계정 섹션 */}
        <div className="mb-6">
          <AccountSection />
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-[10px] text-[#9ca3af]">
          매일 바뀌는 오늘의 상태 · 캐릭터로 풀어본 사주
        </p>
      </div>
    </div>
  );
}
