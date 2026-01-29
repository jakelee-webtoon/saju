"use client";

import { useState, useEffect } from "react";
import { calculateManse, type ManseResult, type BirthInput, type LunarApiResponse, type Element, type TrustLevel } from "./lib/saju";

// ========================
// 오행 UI 스타일
// ========================
const elementStyles: Record<Element, { bg: string; text: string; cellBg: string; cellText: string }> = {
  목: { bg: "bg-emerald-50", text: "text-emerald-600", cellBg: "bg-emerald-500", cellText: "text-white" },
  화: { bg: "bg-red-50", text: "text-red-500", cellBg: "bg-red-500", cellText: "text-white" },
  토: { bg: "bg-amber-50", text: "text-amber-600", cellBg: "bg-amber-400", cellText: "text-amber-900" },
  금: { bg: "bg-slate-100", text: "text-slate-500", cellBg: "bg-slate-200", cellText: "text-slate-700" },
  수: { bg: "bg-blue-50", text: "text-blue-500", cellBg: "bg-blue-500", cellText: "text-white" },
};

// ========================
// API 호출 함수
// ========================
async function fetchLunarData(year: number, month: number, day: number): Promise<LunarApiResponse> {
  try {
    const response = await fetch(`/api/lunar?year=${year}&month=${month}&day=${day}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("음력 API 호출 오류:", error);
    return { success: false, error: "API 호출 실패" };
  }
}

// ========================
// 입력 폼 컴포넌트
// ========================
interface FormData {
  name: string;
  calendarType: "양력" | "음력";
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  hasTime: boolean;
}

function BirthInfoForm({ 
  onSubmit, 
  initialData 
}: { 
  onSubmit: (data: FormData) => void;
  initialData?: FormData | null;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [calendarType, setCalendarType] = useState<"양력" | "음력">(initialData?.calendarType || "양력");
  const [year, setYear] = useState(initialData?.year || "");
  const [month, setMonth] = useState(initialData?.month || "");
  const [day, setDay] = useState(initialData?.day || "");
  const [hour, setHour] = useState(initialData?.hour || "");
  const [minute, setMinute] = useState(initialData?.minute || "");
  const [hasTime, setHasTime] = useState(initialData?.hasTime ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !month || !day) return;
    
    onSubmit({ name, calendarType, year, month, day, hour, minute, hasTime });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">만세력 계산기</h1>
          <p className="mt-2 text-sm text-[#6b7280]">생년월일시를 입력하여 사주를 확인하세요</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 입력 */}
          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-3">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요 (선택)"
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b5998] focus:border-transparent"
            />
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-3">달력 종류</label>
            <div className="flex gap-3">
              {(["양력", "음력"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCalendarType(type)}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                    calendarType === type ? "bg-[#3b5998] text-white" : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-3">
              생년월일 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">년도</option>
                {years.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">월</option>
                {months.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">일</option>
                {days.map((d) => <option key={d} value={d}>{d}일</option>)}
              </select>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[#1a1a2e]">태어난 시간</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-xs text-[#6b7280]">시간을 알고 있어요</span>
              </label>
            </div>
            {hasTime ? (
              <div className="grid grid-cols-2 gap-3">
                <select value={hour} onChange={(e) => setHour(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm">
                  <option value="">시</option>
                  {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
                </select>
                <select value={minute} onChange={(e) => setMinute(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm">
                  <option value="">분</option>
                  {minutes.map((m) => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}분</option>)}
                </select>
              </div>
            ) : (
              <div className="rounded-lg bg-[#f9fafb] p-3 border border-[#f3f4f6]">
                <p className="text-xs text-[#9ca3af] text-center">시간을 모르면 시주는 계산되지 않습니다</p>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={!year || !month || !day}
            className="w-full rounded-xl bg-[#1a1a2e] py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#2d2d44] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
          >
            만세력 계산하기
          </button>
        </form>
      </div>
    </div>
  );
}

// ========================
// 일간 중심 해석 페이지 컴포넌트
// ========================

/** 월지 → 계절 매핑 */
const jijiToSeason: Record<string, { season: string; description: string }> = {
  인: { season: "초봄", description: "새싹이 움트기 시작하는" },
  묘: { season: "봄", description: "목 기운이 왕성한" },
  진: { season: "늦봄", description: "봄에서 여름으로 전환되는" },
  사: { season: "초여름", description: "화 기운이 시작되는" },
  오: { season: "여름", description: "화 기운이 왕성한" },
  미: { season: "늦여름", description: "여름에서 가을로 전환되는" },
  신: { season: "초가을", description: "금 기운이 시작되는" },
  유: { season: "가을", description: "금 기운이 왕성한" },
  술: { season: "늦가을", description: "가을에서 겨울로 전환되는" },
  해: { season: "초겨울", description: "수 기운이 시작되는" },
  자: { season: "겨울", description: "수 기운이 왕성한" },
  축: { season: "늦겨울", description: "겨울에서 봄으로 전환되는" },
};

/** 오행 분포 분석 */
function analyzeElementBalance(elements: { 목: number; 화: number; 토: number; 금: number; 수: number; total: number }) {
  const sorted = (["목", "화", "토", "금", "수"] as Element[])
    .map((el) => ({ element: el, count: elements[el] }))
    .sort((a, b) => b.count - a.count);
  
  const dominant = sorted.filter(e => e.count >= 2);
  const lacking = sorted.filter(e => e.count === 0);
  const average = elements.total / 5;
  
  return { dominant, lacking, sorted, average };
}

/** 구조 키워드 생성 */
function generateStructureKeywords(
  analysis: ReturnType<typeof analyzeElementBalance>,
  hasHourPillar: boolean
): string[] {
  const keywords: string[] = [];
  
  // 균형 분석
  const range = analysis.sorted[0].count - analysis.sorted[analysis.sorted.length - 1].count;
  if (range <= 1) {
    keywords.push("균형");
  } else if (range >= 3) {
    keywords.push("집중");
  } else {
    keywords.push("흐름");
  }
  
  // 결핍 분석
  if (analysis.lacking.length >= 2) {
    keywords.push("조절");
  } else if (analysis.lacking.length === 0) {
    keywords.push("순환");
  }
  
  // 시주 여부
  if (!hasHourPillar) {
    keywords.push("부분 구조");
  } else {
    keywords.push("전체 구조");
  }
  
  return keywords.slice(0, 3);
}

function InterpretationPage({
  manseResult,
  formData,
  onBack,
}: {
  manseResult: ManseResult;
  formData: FormData;
  onBack: () => void;
}) {
  const { pillars, ilgan, elements, calculationMeta, warnings } = manseResult;
  
  // 월지 계절 정보
  const monthJiji = pillars.month.지지읽기;
  const seasonInfo = jijiToSeason[monthJiji] || { season: "?", description: "" };
  const isMonthConfirmed = calculationMeta.monthPillarBasis.trustLevel === "confirmed";
  
  // 오행 분석
  const elementAnalysis = analyzeElementBalance(elements);
  
  // 구조 키워드
  const structureKeywords = generateStructureKeywords(
    elementAnalysis,
    calculationMeta.hourPillarStatus.isAvailable
  );
  
  // 일간 오행 설명
  const ilganElementDescription: Record<Element, string> = {
    목: "성장과 확장의 방향성을 가진",
    화: "발산과 표현의 방향성을 가진",
    토: "중심과 조화의 방향성을 가진",
    금: "수렴과 결실의 방향성을 가진",
    수: "저장과 흐름의 방향성을 가진",
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        
        {/* [1] 페이지 헤더 */}
        <header className="mb-8">
          <button 
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
          >
            <span>←</span>
            <span>만세력으로 돌아가기</span>
          </button>
          <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
            이 사주의 구조 요약
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            일간을 기준으로 한 전체 구조 설명입니다
          </p>
        </header>

        {/* [2] 일간 선언 영역 (가장 중요) */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm border-2 border-[#1a1a2e]">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${elementStyles[ilgan.오행].cellBg}`}>
              <span className={`text-4xl font-bold ${elementStyles[ilgan.오행].cellText}`}>
                {pillars.day.천간}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-[#1a1a2e]">{ilgan.천간읽기}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${elementStyles[ilgan.오행].bg} ${elementStyles[ilgan.오행].text}`}>
                  {ilgan.오행}
                </span>
              </div>
              <p className="text-sm text-[#6b7280]">일간 (日干)</p>
            </div>
          </div>
          
          <div className="bg-[#f9fafb] rounded-xl p-4">
            <p className="text-sm text-[#374151] leading-relaxed">
              이 사주는 <strong className="text-[#1a1a2e]">{ilgan.천간읽기}({pillars.day.천간})</strong> 일간을 기준으로 해석됩니다.
              {ilganElementDescription[ilgan.오행]} 기준점입니다.
            </p>
            <p className="mt-2 text-xs text-[#9ca3af]">
              일간은 사주 해석의 중심 기준점입니다.
            </p>
          </div>
        </section>

        {/* [3] 환경 요약 (월령/계절) */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1a1a2e]">환경 (월령)</h2>
            {!isMonthConfirmed && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">참고 정보</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${elementStyles[pillars.month.오행지지].cellBg}`}>
              <span className={`text-xl font-bold ${elementStyles[pillars.month.오행지지].cellText}`}>
                {pillars.month.지지}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">
                {seasonInfo.season} ({pillars.month.지지읽기}월)
              </p>
              <p className="text-xs text-[#6b7280]">월지 기준 계절</p>
            </div>
          </div>
          
          <div className="bg-[#f9fafb] rounded-lg p-3">
            {isMonthConfirmed ? (
              <p className="text-sm text-[#374151]">
                이 사주는 <strong>{seasonInfo.description}</strong> 계절 환경에서 작동합니다.
              </p>
            ) : (
              <div>
                <p className="text-sm text-[#374151]">
                  이 사주는 <strong>{seasonInfo.description}</strong> 계절 환경에서 작동합니다.
                </p>
                <p className="mt-2 text-xs text-amber-600">
                  ※ 월주가 절기 기준으로 확정되지 않아 환경 해석은 참고 정보로 제공됩니다.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* [4] 오행 균형 요약 */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
          <h2 className="text-sm font-semibold text-[#1a1a2e] mb-4">오행 균형</h2>
          
          {/* 오행 그래프 */}
          <div className="space-y-2 mb-5">
            {(["목", "화", "토", "금", "수"] as Element[]).map((el) => {
              const count = elements[el];
              const percentage = elements.total > 0 ? (count / elements.total) * 100 : 0;
              const isDominant = elementAnalysis.dominant.some(d => d.element === el);
              const isLacking = count === 0;
              
              return (
                <div key={el} className="flex items-center gap-3">
                  <div className="w-8 flex items-center justify-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      isDominant ? elementStyles[el].cellBg + " " + elementStyles[el].cellText :
                      isLacking ? "bg-gray-100 text-gray-400" :
                      elementStyles[el].bg + " " + elementStyles[el].text
                    }`}>
                      {el}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-[#f3f4f6] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLacking ? "bg-gray-200" : elementStyles[el].cellBg
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className={`w-6 text-right text-xs ${
                    isDominant ? "font-bold text-[#1a1a2e]" : 
                    isLacking ? "text-gray-400" : "text-[#6b7280]"
                  }`}>{count}</span>
                </div>
              );
            })}
          </div>
          
          {/* 균형 분석 문장 */}
          <div className="bg-[#f9fafb] rounded-lg p-4 space-y-2">
            {elementAnalysis.dominant.length > 0 && (
              <p className="text-sm text-[#374151]">
                <span className="font-medium">
                  {elementAnalysis.dominant.map(d => d.element).join(", ")}
                </span> 기운이 구조상 두드러집니다.
              </p>
            )}
            {elementAnalysis.lacking.length > 0 && (
              <p className="text-sm text-[#374151]">
                <span className="font-medium">
                  {elementAnalysis.lacking.map(l => l.element).join(", ")}
                </span> 기운은 구조상 드러나지 않습니다.
              </p>
            )}
            {elementAnalysis.dominant.length === 0 && elementAnalysis.lacking.length === 0 && (
              <p className="text-sm text-[#374151]">
                오행이 비교적 고르게 분포되어 있습니다.
              </p>
            )}
          </div>
        </section>

        {/* [5] 구조 키워드 요약 */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
          <h2 className="text-sm font-semibold text-[#1a1a2e] mb-4">구조 키워드</h2>
          
          <div className="flex flex-wrap gap-2">
            {structureKeywords.map((keyword, index) => (
              <span 
                key={index}
                className="inline-flex items-center rounded-full bg-[#f0f4ff] px-4 py-2 text-sm font-medium text-[#3b5998]"
              >
                {keyword}
              </span>
            ))}
          </div>
          
          <p className="mt-4 text-xs text-[#9ca3af]">
            키워드는 사주 구조의 특징을 나타내며, 성격이나 운명을 의미하지 않습니다.
          </p>
        </section>

        {/* [6] 안내 문구 (고정) */}
        <section className="mb-8 rounded-xl bg-[#f9fafb] p-4 border border-[#e5e7eb]">
          <p className="text-xs text-[#6b7280] text-center leading-relaxed">
            이 설명은 사주 구조 이해를 위한 정보이며,<br />
            종합 해석은 이후 단계에서 제공됩니다.
          </p>
        </section>

        {/* CTA 버튼 */}
        <button 
          className="w-full rounded-xl bg-[#1a1a2e] py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#2d2d44]"
          onClick={() => alert("다음 단계 구현 예정")}
        >
          이 구조를 기준으로 더 살펴보기
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}

// ========================
// 메인 컴포넌트
// ========================
const defaultFormData: FormData = {
  name: "",
  calendarType: "양력",
  year: "1990",
  month: "8",
  day: "20",
  hour: "9",
  minute: "00",
  hasTime: true,
};

export default function ManseryeokPage() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [view, setView] = useState<"result" | "edit" | "interpret">("result");
  const [manseResult, setManseResult] = useState<ManseResult | null>(null);

  if (view === "edit") {
    return (
      <BirthInfoForm
        initialData={formData}
        onSubmit={(data) => {
          setFormData(data);
          setView("result");
        }}
      />
    );
  }

  if (view === "interpret" && manseResult) {
    return (
      <InterpretationPage
        manseResult={manseResult}
        formData={formData}
        onBack={() => setView("result")}
      />
    );
  }

  return (
    <SajuResultWithCallback
      formData={formData} 
      onEdit={() => setView("edit")}
      onInterpret={(result) => {
        setManseResult(result);
        setView("interpret");
      }}
    />
  );
}

// SajuResult에서 결과를 전달하기 위한 래퍼 컴포넌트
function SajuResultWithCallback({ 
  formData, 
  onEdit,
  onInterpret,
}: { 
  formData: FormData;
  onEdit: () => void;
  onInterpret: (result: ManseResult) => void;
}) {
  // 모든 useState는 최상위에서 호출
  const [manseResult, setManseResult] = useState<ManseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<number | null>(null);
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);
  const [isWarningExpanded, setIsWarningExpanded] = useState(false);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      
      const birthInput: BirthInput = {
        calendarType: formData.calendarType,
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        day: parseInt(formData.day),
        hour: formData.hasTime && formData.hour ? parseInt(formData.hour) : undefined,
        minute: formData.hasTime && formData.minute ? parseInt(formData.minute) : undefined,
      };
      
      const lunarResponse = await fetchLunarData(birthInput.year, birthInput.month, birthInput.day);
      const result = calculateManse(birthInput, lunarResponse);
      setManseResult(result);
      setLoading(false);
    };
    
    calculate();
  }, [formData]);

  if (loading || !manseResult) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-[#3b5998] border-t-transparent rounded-full mb-4"></div>
          <p className="text-[#6b7280]">만세력 계산 중...</p>
        </div>
      </div>
    );
  }

  // 기존 SajuResult 로직
  const { birthSummary, pillars, ilgan, elements, warnings, calculationMeta } = manseResult;
  
  const trustLevelLabel: Record<string, { text: string; color: string }> = {
    confirmed: { text: "확정", color: "text-emerald-600" },
    reference: { text: "참고값", color: "text-amber-600" },
    unavailable: { text: "미확정", color: "text-gray-400" },
  };
  
  const pillarDescriptions: Record<string, string> = {
    hour: "태어난 시간으로 정해지는 기둥이에요. 위는 천간, 아래는 지지라고 불러요.",
    day: "태어난 날로 정해지는 기둥이에요. 위의 천간은 '나'를 나타내는 중심이에요.",
    month: "태어난 달로 정해지는 기둥이에요. 계절의 흐름을 담고 있어요.",
    year: "태어난 해로 정해지는 기둥이에요. 12년마다 같은 띠가 돌아와요.",
  };

  const pillarArray = [
    { ...pillars.hour, key: "hour" },
    { ...pillars.day, key: "day" },
    { ...pillars.month, key: "month" },
    { ...pillars.year, key: "year" },
  ];
  
  const selectedData = selectedPillar !== null ? pillarArray[selectedPillar] : null;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
            {formData.name ? `${formData.name}님의 만세력` : "당신의 만세력"}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">입력하신 정보를 기준으로 계산된 사주 구조입니다</p>
        </header>

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#f0f4ff] px-2 py-0.5 text-xs font-medium text-[#3b5998]">양력</span>
                <span className="text-[15px] font-medium text-[#1a1a2e]">
                  {birthSummary.solar.year}년 {birthSummary.solar.month}월 {birthSummary.solar.day}일
                  {birthSummary.time && (
                    <span className="ml-2 text-[#6b7280] font-normal">
                      {birthSummary.time.hour}시 {birthSummary.time.minute.toString().padStart(2, '0')}분
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#fef3c7] px-2 py-0.5 text-xs font-medium text-[#92400e]">음력</span>
                <span className="text-sm text-[#6b7280]">
                  {birthSummary.lunar.year}년 
                  {birthSummary.lunar.isLeapMonth && <span className="text-[#f59e0b]">(윤)</span>}
                  {birthSummary.lunar.month}월 {birthSummary.lunar.day}일
                </span>
              </div>
              {!birthSummary.time && (
                <p className="text-xs text-[#9ca3af]">※ 시간 미입력 - 시주 제외</p>
              )}
            </div>
            <button onClick={onEdit} className="text-xs text-[#3b5998] hover:text-[#2d4a8a] font-medium">정보 수정</button>
          </div>
        </section>

        {/* 계산 기준 - 클릭하면 펼쳐짐 */}
        <section className="mb-6 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] overflow-hidden">
          <button 
            onClick={() => setIsMetaExpanded(!isMetaExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#f3f4f6] transition-colors"
          >
            <h3 className="text-xs font-medium text-[#6b7280]">계산 기준</h3>
            <span className={`text-[#9ca3af] transition-transform duration-200 ${isMetaExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {isMetaExpanded && (
            <div className="px-4 pb-4 space-y-2 text-xs border-t border-[#e5e7eb] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">월주 기준</span>
                <span className={trustLevelLabel[calculationMeta.monthPillarBasis.trustLevel].color}>
                  {calculationMeta.monthPillarBasis.type === "jeolgi" ? "절기 기준" : "음력월 기준"} 
                  <span className="ml-1">({trustLevelLabel[calculationMeta.monthPillarBasis.trustLevel].text})</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">시주 상태</span>
                <span className={trustLevelLabel[calculationMeta.hourPillarStatus.trustLevel].color}>
                  {calculationMeta.hourPillarStatus.isAvailable ? "계산됨" : "미입력"} 
                  <span className="ml-1">({trustLevelLabel[calculationMeta.hourPillarStatus.trustLevel].text})</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">데이터 소스</span>
                <span className="text-[#6b7280]">한국천문연구원 API</span>
              </div>
            </div>
          )}
        </section>

        {/* 경고 메시지 - 클릭하면 펼쳐짐 */}
        {warnings.length > 0 && (
          <section className="mb-6 rounded-xl bg-amber-50 border border-amber-200 overflow-hidden">
            <button 
              onClick={() => setIsWarningExpanded(!isWarningExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-500">⚠️</span>
                <span className="text-xs font-medium text-amber-700">참고 사항 ({warnings.length})</span>
              </div>
              <span className={`text-amber-400 transition-transform duration-200 ${isWarningExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {isWarningExpanded && (
              <div className="px-4 pb-4 border-t border-amber-200 pt-3">
                <div className="text-xs text-amber-700 space-y-2">
                  {warnings.map((w, i) => <p key={i}>• {w}</p>)}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {pillarArray.map((pillar, index) => (
              <button 
                key={pillar.key}
                onClick={() => setSelectedPillar(selectedPillar === index ? null : index)}
                disabled={!pillar.isAvailable}
                className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                  selectedPillar === index 
                    ? 'ring-2 ring-[#1a1a2e] ring-offset-2 scale-[1.02]' 
                    : pillar.isAvailable ? 'hover:scale-[1.01]' : 'opacity-50'
                }`}
              >
                <div className={`py-2.5 text-center ${
                  selectedPillar === index ? 'bg-[#1a1a2e]' : 'bg-[#e5e7eb]'
                }`}>
                  <span className={`text-xs font-semibold ${
                    selectedPillar === index ? 'text-white' : 'text-[#6b7280]'
                  }`}>
                    {pillar.label}
                  </span>
                </div>
                
                {pillar.isAvailable ? (
                  <>
                    <div className={`py-4 text-center ${elementStyles[pillar.오행천간].cellBg}`}>
                      <span className={`text-2xl font-bold ${elementStyles[pillar.오행천간].cellText}`}>{pillar.천간}</span>
                      <div className="mt-1">
                        <span className={`text-[10px] ${elementStyles[pillar.오행천간].cellText} opacity-70`}>{pillar.천간읽기}</span>
                      </div>
                    </div>
                    <div className={`py-4 text-center ${elementStyles[pillar.오행지지].cellBg}`}>
                      <span className={`text-2xl font-bold ${elementStyles[pillar.오행지지].cellText}`}>{pillar.지지}</span>
                      <div className="mt-1">
                        <span className={`text-[10px] ${elementStyles[pillar.오행지지].cellText} opacity-70`}>{pillar.지지읽기}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center bg-gray-100">
                    <span className="text-2xl text-gray-400">?</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {selectedData && selectedData.isAvailable && (
          <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border-2 border-[#1a1a2e]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1a1a2e]">{selectedData.label} 상세</h3>
              <span className="text-xs text-[#9ca3af]">클릭하여 다른 주 확인</span>
            </div>
            
            <div className="flex justify-center gap-6">
              <div className={`flex flex-col items-center p-4 rounded-xl border-2 border-[#1a1a2e] ${elementStyles[selectedData.오행천간].cellBg}`}>
                <span className="text-xs font-medium text-[#1a1a2e] mb-2 bg-white/90 px-2 py-0.5 rounded">천간</span>
                <span className={`text-5xl font-bold ${elementStyles[selectedData.오행천간].cellText}`}>{selectedData.천간}</span>
                <span className={`text-lg mt-2 ${elementStyles[selectedData.오행천간].cellText}`}>{selectedData.천간읽기}</span>
                <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold bg-white/95 ${elementStyles[selectedData.오행천간].text}`}>
                  {selectedData.오행천간}
                </span>
              </div>
              
              <div className={`flex flex-col items-center p-4 rounded-xl border-2 border-[#1a1a2e] ${elementStyles[selectedData.오행지지].cellBg}`}>
                <span className="text-xs font-medium text-[#1a1a2e] mb-2 bg-white/90 px-2 py-0.5 rounded">지지</span>
                <span className={`text-5xl font-bold ${elementStyles[selectedData.오행지지].cellText}`}>{selectedData.지지}</span>
                <span className={`text-lg mt-2 ${elementStyles[selectedData.오행지지].cellText}`}>{selectedData.지지읽기}</span>
                <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold bg-white/95 ${elementStyles[selectedData.오행지지].text}`}>
                  {selectedData.오행지지}
                </span>
              </div>
            </div>
            
            <p className="mt-4 text-xs text-[#6b7280] text-center bg-[#f9fafb] rounded-lg py-3 px-4 leading-relaxed">
              {pillarDescriptions[selectedData.key]}
            </p>
          </section>
        )}

        <section className="mb-8 rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#1a1a2e]">오행 분포</h3>
            <span className="text-[11px] text-[#9ca3af]">총 {elements.total}개</span>
          </div>
          
          <div className="space-y-3">
            {(["목", "화", "토", "금", "수"] as Element[]).map((el) => {
              const count = elements[el];
              const percentage = elements.total > 0 ? (count / elements.total) * 100 : 0;
              return (
                <div key={el} className="flex items-center gap-3">
                  <div className="w-8 flex items-center justify-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${elementStyles[el].bg} ${elementStyles[el].text}`}>
                      {el}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${elementStyles[el].cellBg}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right text-xs text-[#6b7280]">{count}</span>
                </div>
              );
            })}
          </div>
          
          <p className="mt-4 text-[11px] text-[#9ca3af] text-center">
            오행 분포는 천간/지지 각 1점씩 합산 (지장간 미포함)
          </p>
        </section>

        <button 
          onClick={() => onInterpret(manseResult)}
          className="w-full rounded-xl bg-[#1a1a2e] py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#2d2d44]"
        >
          구조 해석 보기
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
