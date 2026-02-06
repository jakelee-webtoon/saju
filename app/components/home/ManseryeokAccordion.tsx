"use client";

import { useState } from "react";
import { type ManseResult, type Element } from "@/app/lib/saju";

interface ManseryeokAccordionProps {
  manseResult: ManseResult;
}

const elementStyles: Record<Element, { bg: string; text: string; cellBg: string; cellText: string; barColor: string }> = {
  목: { bg: "bg-emerald-50", text: "text-emerald-600", cellBg: "bg-emerald-500", cellText: "text-white", barColor: "bg-emerald-500" },
  화: { bg: "bg-red-50", text: "text-red-500", cellBg: "bg-red-500", cellText: "text-white", barColor: "bg-red-500" },
  토: { bg: "bg-amber-50", text: "text-amber-600", cellBg: "bg-amber-400", cellText: "text-amber-900", barColor: "bg-amber-500" },
  금: { bg: "bg-slate-100", text: "text-slate-500", cellBg: "bg-slate-300", cellText: "text-slate-700", barColor: "bg-slate-400" },
  수: { bg: "bg-blue-50", text: "text-blue-500", cellBg: "bg-blue-500", cellText: "text-white", barColor: "bg-blue-500" },
};

const elementEmoji: Record<Element, string> = {
  화: "🔥",
  수: "🌊",
  목: "🪾",
  토: "🧱",
  금: "🧈",
};

const pillarDescriptions: Record<string, { 
  title: string; 
  emoji: string;
  tagline: string; 
  cheonganRole: string;
  jijiRole: string;
}> = {
  hour: { 
    title: "시주", 
    emoji: "🌙",
    tagline: "내면의 나, 말년운",
    cheonganRole: "숨겨진 생각 방식",
    jijiRole: "말년운 · 자녀운"
  },
  day: { 
    title: "일주", 
    emoji: "⭐",
    tagline: "핵심! 나 자신",
    cheonganRole: "나의 본질 · 핵심 성격",
    jijiRole: "배우자운 · 관계 스타일"
  },
  month: { 
    title: "월주", 
    emoji: "🏠",
    tagline: "사회적 나, 환경",
    cheonganRole: "사회적 이미지",
    jijiRole: "부모 영향 · 형제운"
  },
  year: { 
    title: "년주", 
    emoji: "🌳",
    tagline: "뿌리, 첫인상",
    cheonganRole: "조상 기운 · 첫인상",
    jijiRole: "어린 시절 · 초년운"
  },
};

// 오행별 의미 설명 (각 오행이 뭘 의미하는지)
const elementMeanings: Record<Element, {
  keyword: string;
  personality: string;
  strength: string;
}> = {
  목: {
    keyword: "성장 · 시작",
    personality: "새로운 걸 시작하고 뻗어나가려는 기운",
    strength: "추진력, 성장 욕구, 도전 정신"
  },
  화: {
    keyword: "열정 · 표현",
    personality: "뜨겁게 표현하고 밖으로 드러내는 기운",
    strength: "표현력, 열정, 사교성"
  },
  토: {
    keyword: "안정 · 중심",
    personality: "중심을 잡고 조율하는 기운",
    strength: "신뢰감, 포용력, 현실 감각"
  },
  금: {
    keyword: "결단 · 정리",
    personality: "깔끔하게 정리하고 결정하는 기운",
    strength: "판단력, 기준, 실행력"
  },
  수: {
    keyword: "지혜 · 유연",
    personality: "깊이 생각하고 유연하게 흐르는 기운",
    strength: "통찰력, 적응력, 깊은 사고"
  },
};

/** 오행 바 퍼센트 계산 */
function getElementPercent(count: number, total: number): number {
  if (total === 0 || count === 0) return 0;
  const scaleMap: Record<number, number> = { 1: 25, 2: 50, 3: 75, 4: 90, 5: 95, 6: 100, 7: 100, 8: 100 };
  return scaleMap[count] ?? Math.min(100, count * 15);
}

/**
 * 나의 만세력 보기 (아코디언)
 * - 홈 최하단에 접힌 상태로 배치
 * - 클릭 시 만세력 정보 표시
 * - 주(柱) 클릭 시 상세 설명
 */
export default function ManseryeokAccordion({ manseResult }: ManseryeokAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const { pillars, elements } = manseResult;

  const pillarArray = [
    { ...pillars.hour, key: "hour", label: "시주" },
    { ...pillars.day, key: "day", label: "일주" },
    { ...pillars.month, key: "month", label: "월주" },
    { ...pillars.year, key: "year", label: "년주" },
  ];

  const selectedPillarData = pillarArray.find(p => p.key === selectedPillar);

  return (
    <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      {/* 헤더 (토글 버튼) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <span>📜</span>
          <span>내 만세력 보기</span>
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 컨텐츠 */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {/* 사주 그리드 - 클릭 가능 */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {pillarArray.map((pillar) => (
              <button
                key={pillar.key}
                onClick={() => setSelectedPillar(selectedPillar === pillar.key ? null : pillar.key)}
                disabled={!pillar.isAvailable}
                className={`text-center transition-all duration-200 rounded-xl overflow-hidden ${
                  selectedPillar === pillar.key
                    ? "ring-2 ring-[#1a1a2e] ring-offset-1 scale-[1.02]"
                    : pillar.isAvailable
                    ? "hover:scale-[1.01]"
                    : "opacity-50"
                }`}
              >
                <div className={`text-xs py-1.5 ${
                  selectedPillar === pillar.key ? "bg-[#1a1a2e] text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {pillar.label}
                </div>
                {pillar.isAvailable ? (
                  <>
                    <div className={`py-2.5 ${elementStyles[pillar.오행천간].cellBg}`}>
                      <span className={`text-xl font-bold ${elementStyles[pillar.오행천간].cellText}`}>
                        {pillar.천간}
                      </span>
                      <div className={`text-[10px] ${elementStyles[pillar.오행천간].cellText} opacity-70`}>
                        {pillar.천간읽기}
                      </div>
                    </div>
                    <div className={`py-2.5 ${elementStyles[pillar.오행지지].cellBg}`}>
                      <span className={`text-xl font-bold ${elementStyles[pillar.오행지지].cellText}`}>
                        {pillar.지지}
                      </span>
                      <div className={`text-[10px] ${elementStyles[pillar.오행지지].cellText} opacity-70`}>
                        {pillar.지지읽기}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-5 bg-slate-100">
                    <span className="text-xl text-slate-300">?</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* 선택된 주 설명 */}
          {selectedPillarData && selectedPillarData.isAvailable && (
            <div className="mt-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 overflow-hidden">
              {/* 헤더 */}
              <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pillarDescriptions[selectedPillarData.key].emoji}</span>
                  <span className="text-sm font-bold text-indigo-900">
                    {pillarDescriptions[selectedPillarData.key].title}
                  </span>
                </div>
                <span className="text-xs text-indigo-600 font-medium">
                  {pillarDescriptions[selectedPillarData.key].tagline}
                </span>
              </div>

              {/* 천간/지지 카드 */}
              <div className="p-3 space-y-2">
                {/* 천간 */}
                <div className={`p-3 rounded-xl ${elementStyles[selectedPillarData.오행천간].bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${elementStyles[selectedPillarData.오행천간].text}`}>
                        {selectedPillarData.천간}
                      </span>
                      <div>
                        <div className={`text-sm font-bold ${elementStyles[selectedPillarData.오행천간].text}`}>
                          {selectedPillarData.천간읽기} ({selectedPillarData.오행천간})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          천간 · {pillarDescriptions[selectedPillarData.key].cheonganRole}
                        </div>
                      </div>
                    </div>
                    <span className="text-lg">{elementEmoji[selectedPillarData.오행천간]}</span>
                  </div>
                  <div className="text-xs text-slate-700 bg-white/60 rounded-lg px-2.5 py-2">
                    <span className="font-semibold text-slate-800">{elementMeanings[selectedPillarData.오행천간].keyword}</span>
                    <span className="mx-1">·</span>
                    {elementMeanings[selectedPillarData.오행천간].personality}
                  </div>
                </div>

                {/* 지지 */}
                <div className={`p-3 rounded-xl ${elementStyles[selectedPillarData.오행지지].bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${elementStyles[selectedPillarData.오행지지].text}`}>
                        {selectedPillarData.지지}
                      </span>
                      <div>
                        <div className={`text-sm font-bold ${elementStyles[selectedPillarData.오행지지].text}`}>
                          {selectedPillarData.지지읽기} ({selectedPillarData.오행지지})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          지지 · {pillarDescriptions[selectedPillarData.key].jijiRole}
                        </div>
                      </div>
                    </div>
                    <span className="text-lg">{elementEmoji[selectedPillarData.오행지지]}</span>
                  </div>
                  <div className="text-xs text-slate-700 bg-white/60 rounded-lg px-2.5 py-2">
                    <span className="font-semibold text-slate-800">{elementMeanings[selectedPillarData.오행지지].keyword}</span>
                    <span className="mx-1">·</span>
                    {elementMeanings[selectedPillarData.오행지지].personality}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 오행 분포 - 2D 게이지 형태 */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#1a1a2e]">⚡ 오행 에너지 분포</h4>
              <span className="text-[10px] text-slate-400">총 {elements.total}개</span>
            </div>
            
            <div className="space-y-3">
              {(["목", "화", "토", "금", "수"] as Element[]).map((el) => {
                const count = elements[el];
                const percent = getElementPercent(count, elements.total);
                
                return (
                  <div key={el} className="flex items-center gap-3">
                    {/* 이모지 + 오행명 */}
                    <div className="flex items-center gap-1.5 w-14 shrink-0">
                      <span className="text-base">{elementEmoji[el]}</span>
                      <span className={`text-xs font-semibold ${elementStyles[el].text}`}>{el}</span>
                    </div>
                    
                    {/* 2D 프로그레스 바 */}
                    <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden relative">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full ${elementStyles[el].barColor} transition-all duration-500 ease-out`}
                        style={{ width: `${percent}%` }}
                      >
                        {/* 광택 효과 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
                      </div>
                    </div>
                    
                    {/* 카운트 */}
                    <div className={`w-8 text-right text-sm font-bold ${
                      count === 0 ? "text-slate-300" : count >= 3 ? "text-amber-500" : "text-slate-600"
                    }`}>
                      {count === 0 ? "-" : `×${count}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-4 text-[10px] text-slate-400 text-center">
            천간/지지 각 1점씩 합산 · 지장간 미포함
          </p>
        </div>
      )}
    </section>
  );
}
