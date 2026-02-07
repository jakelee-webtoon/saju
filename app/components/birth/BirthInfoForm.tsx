"use client";

import { useState } from "react";
import type { FormData } from "@/app/types";

// Static arrays - 컴포넌트 외부에 선언하여 매 렌더링마다 재생성 방지
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

interface BirthInfoFormProps {
  onSubmit: (data: FormData) => void;
  initialData?: FormData | null;
  onBack?: () => void;
  isFirstVisit?: boolean;
}

export default function BirthInfoForm({ 
  onSubmit, 
  initialData,
  onBack,
  isFirstVisit = false 
}: BirthInfoFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [calendarType, setCalendarType] = useState<"양력" | "음력">(initialData?.calendarType || "양력");
  const [year, setYear] = useState(initialData?.year || "");
  const [month, setMonth] = useState(initialData?.month || "");
  const [day, setDay] = useState(initialData?.day || "");
  const [hour, setHour] = useState(initialData?.hour || "");
  const [minute, setMinute] = useState(initialData?.minute || "");
  const [hasTime, setHasTime] = useState(initialData?.hasTime ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !month || !day) return;
    
    onSubmit({ name, calendarType, year, month, day, hour, minute, hasTime });
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        {/* 뒤로가기 버튼 */}
        {onBack && (
          <button 
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
        )}
        
        <header className="mb-8 text-center">
          {isFirstVisit ? (
            <>
              <div className="text-4xl mb-3">👋</div>
              <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">환영해요!</h1>
              <p className="mt-2 text-sm text-[#6b7280]">나를 알아가는 첫 단계,<br/>생년월일을 알려주세요</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">내 사주 정보</h1>
              <p className="mt-2 text-sm text-[#6b7280]">생년월일시를 입력해주세요</p>
            </>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 입력 */}
          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-3">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="닉네임을 입력해주세요 (선택)"
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
                {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">월</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">일</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}일</option>)}
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
                  {HOURS.map((h) => <option key={h} value={h}>{h}시</option>)}
                </select>
                <select value={minute} onChange={(e) => setMinute(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm">
                  <option value="">분</option>
                  {MINUTES.map((m) => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}분</option>)}
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
            {isFirstVisit ? "내 캐릭터 확인하기 ✨" : "저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
