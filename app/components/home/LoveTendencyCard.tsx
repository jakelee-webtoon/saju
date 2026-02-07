"use client";

import { useState, useEffect } from "react";
import {
  getLoveTendency,
  getLoveTendencyFull,
  type LoveTendency,
  type LoveTendencyFull,
} from "@/app/lib/love/loveTendency";

interface LoveTendencyCardProps {
  characterId: string;
}

export default function LoveTendencyCard({ characterId }: LoveTendencyCardProps) {
  const [tendency, setTendency] = useState<LoveTendency | null>(null);
  const [fullTendency, setFullTendency] = useState<LoveTendencyFull | null>(null);

  useEffect(() => {
    setTendency(getLoveTendency(characterId));
    setFullTendency(getLoveTendencyFull(characterId));
  }, [characterId]);

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

        {/* 상세 콘텐츠 (무료로 공개) */}
        {fullTendency && (
          <div className="space-y-3">
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
        )}
      </div>
    </section>
  );
}
