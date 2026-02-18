"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getLoveTendency,
  getLoveTendencyFull,
  isTendencyUnlocked,
  markTendencyUnlocked,
  type LoveTendency,
  type LoveTendencyFull,
} from "@/app/lib/love/loveTendency";
import { getArrowBalanceSync, useArrowSync, canUseArrow } from "@/app/lib/cupid/arrowBalance";
import { getKakaoUser, isLoggedIn } from "@/app/lib/auth";
import { isContentUnlocked, recordContentUnlock } from "@/app/lib/firebase";

interface LoveTendencyCardProps {
  characterId: string;
}

export default function LoveTendencyCard({ characterId }: LoveTendencyCardProps) {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [tendency, setTendency] = useState<LoveTendency | null>(null);
  const [fullTendency, setFullTendency] = useState<LoveTendencyFull | null>(null);
  const [arrowBalance, setArrowBalance] = useState(0);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setTendency(getLoveTendency(characterId));
      setFullTendency(getLoveTendencyFull(characterId));
      
      // Firebase에서 언락 상태 확인 (로그인된 경우)
      if (isLoggedIn()) {
        const kakaoUser = getKakaoUser();
        if (kakaoUser) {
          const unlocked = await isContentUnlocked(kakaoUser.id, "loveTendency");
          setIsUnlocked(unlocked);
          if (unlocked) markTendencyUnlocked(); // localStorage 동기화
        }
      } else {
        setIsUnlocked(isTendencyUnlocked());
      }
      
      const balance = await getArrowBalanceSync();
      setArrowBalance(balance);
    };
    loadData();
  }, [characterId]);

  const handleUnlock = async () => {
    if (!canUseArrow(1)) {
      router.push("/shop");
      return;
    }

    setShowUnlockAnimation(true);
    
    const result = await useArrowSync(1);
    if (!result.success) {
      setShowUnlockAnimation(false);
      router.push("/shop");
      return;
    }

    setArrowBalance(result.newBalance);
    markTendencyUnlocked(); // localStorage
    
    // Firebase에 언락 기록
    if (isLoggedIn()) {
      const kakaoUser = getKakaoUser();
      if (kakaoUser) {
        await recordContentUnlock(kakaoUser.id, "loveTendency");
      }
    }

    setTimeout(() => {
      setIsUnlocked(true);
      setShowUnlockAnimation(false);
    }, 500);
  };

  if (!tendency) return null;

  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>💗</span>
          <span>나의 기본 연애 성향</span>
        </h2>
      </div>

      {/* 콘텐츠 */}
      <div className="px-5 py-4">
        {/* 한 줄 요약 */}
        <p className="text-[15px] font-medium text-gray-800 mb-4 leading-relaxed">
          "{tendency.summary}"
        </p>

        {/* 핵심 키워드 3개 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-20 shrink-0">연애 속도</span>
            <span className="text-sm text-gray-700">{tendency.keywords.speed}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-20 shrink-0">감정 표현</span>
            <span className="text-sm text-gray-700">{tendency.keywords.expression}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-20 shrink-0">중요한 것</span>
            <span className="text-sm text-gray-700">{tendency.keywords.priority}</span>
          </div>
        </div>

        {/* 무료 설명 */}
        <p className="text-sm text-gray-600 leading-relaxed mb-4 p-3 bg-gray-50 rounded-xl">
          {tendency.freeDescription}
        </p>

        {/* 🔒 잠금 영역 */}
        {!isUnlocked ? (
          <div
            className={`rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 transition-all ${
              showUnlockAnimation ? "scale-95 opacity-50" : ""
            }`}
          >
            {/* 잠금 헤더 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{showUnlockAnimation ? "🔓" : "🔒"}</span>
              <span className="text-sm font-bold text-white">더 깊이 알아보기</span>
            </div>

            {/* 프리뷰 리스트 */}
            <ul className="space-y-1.5 mb-4">
              {tendency.lockedPreview.map((item, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="text-pink-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA 버튼 */}
            {canUseArrow(1) ? (
              <button
                onClick={handleUnlock}
                disabled={showUnlockAnimation}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-bold transition-all hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] disabled:opacity-70"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>💘</span>
                  <span>화살 1개로 열기</span>
                </span>
              </button>
            ) : (
              <button
                onClick={() => router.push("/shop")}
                className="w-full py-3 rounded-lg bg-white/10 text-white text-sm font-medium transition-all hover:bg-white/20"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>💘</span>
                  <span>화살 충전하러 가기 →</span>
                </span>
              </button>
            )}

            {/* 잔액 표시 */}
            <p className="mt-2 text-[10px] text-gray-500 text-center">
              내 화살 {arrowBalance}개
            </p>
          </div>
        ) : (
          /* 🔓 잠금 해제 콘텐츠 */
          fullTendency && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <h4 className="text-xs font-bold text-purple-700 mb-1.5 flex items-center gap-1">
                  <span>💔</span> 연애에서 가장 약해지는 순간
                </h4>
                <p className="text-sm text-purple-800">{fullTendency.lockedContent.weakMoment}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <h4 className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                  <span>🔄</span> 자주 반복되는 이별 패턴
                </h4>
                <p className="text-sm text-amber-800">{fullTendency.lockedContent.breakupPattern}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-700 mb-1.5 flex items-center gap-1">
                  <span>💚</span> 잘 맞는 상대의 핵심 조건
                </h4>
                <p className="text-sm text-emerald-800">{fullTendency.lockedContent.idealPartner}</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <h4 className="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1">
                  <span>📈</span> 초반 vs 안정기 변화
                </h4>
                <p className="text-sm text-blue-800">{fullTendency.lockedContent.phaseChange}</p>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
