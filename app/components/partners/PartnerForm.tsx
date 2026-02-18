"use client";

import { useState, useEffect } from "react";
import MbtiPicker from "@/app/components/mbti/MbtiPicker";
import type { Partner, PartnerFormData, RelationStage } from "@/app/lib/cupid/partnerTypes";
import type { MbtiType } from "@/app/lib/match/mbti";

interface PartnerFormProps {
  onSubmit: (data: PartnerFormData) => void | Promise<void>;
  onCancel: () => void;
  initialData?: Partner | null;
  mode?: "new" | "edit";
}

const RELATION_STAGES: RelationStage[] = ["썸", "연애", "소개팅", "친구", "기타"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function PartnerForm({ onSubmit, onCancel, initialData, mode = "new" }: PartnerFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [relationStage, setRelationStage] = useState<RelationStage | undefined>(initialData?.relationStage);
  const [mbti, setMbti] = useState<MbtiType | null>(initialData?.mbti as MbtiType || null);
  const [calendarType, setCalendarType] = useState<"양력" | "음력">(initialData?.saju?.calendarType || "양력");
  const [birthY, setBirthY] = useState(initialData?.saju?.birthY ? String(initialData.saju.birthY) : "");
  const [birthM, setBirthM] = useState(initialData?.saju?.birthM ? String(initialData.saju.birthM) : "");
  const [birthD, setBirthD] = useState(initialData?.saju?.birthD ? String(initialData.saju.birthD) : "");
  const [birthTimeKnown, setBirthTimeKnown] = useState(initialData?.saju?.birthTimeKnown || false);
  const [birthHour, setBirthHour] = useState(initialData?.saju?.birthHour !== undefined ? String(initialData.saju.birthHour) : "");
  const [birthMinute, setBirthMinute] = useState(initialData?.saju?.birthMinute !== undefined ? String(initialData.saju.birthMinute) : "");
  const [memo, setMemo] = useState(initialData?.memo || "");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // MBTI 검증
  const validateMbti = (value: string | null): boolean => {
    if (!value) return true; // 선택사항
    const mbtiRegex = /^(E|I)(S|N)(T|F)(J|P)$/i;
    return mbtiRegex.test(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // 이름 필수 검증
    if (!name.trim()) {
      setErrors({ name: "이름을 입력해주세요" });
      return;
    }
    
    // MBTI 검증
    if (mbti && !validateMbti(mbti)) {
      setErrors({ mbti: "올바른 MBTI 형식이 아닙니다" });
      return;
    }
    
    // 생년월일 검증 (입력된 경우)
    if (birthY || birthM || birthD) {
      const year = parseInt(birthY);
      const month = parseInt(birthM);
      const day = parseInt(birthD);
      
      if (!birthY || !birthM || !birthD) {
        setErrors({ saju: "생년월일을 모두 입력해주세요" });
        return;
      }
      
      if (year < 1900 || year > CURRENT_YEAR) {
        setErrors({ saju: "연도는 1900년부터 현재까지 입력 가능합니다" });
        return;
      }
      
      if (month < 1 || month > 12) {
        setErrors({ saju: "올바른 월을 입력해주세요" });
        return;
      }
      
      if (day < 1 || day > 31) {
        setErrors({ saju: "올바른 일을 입력해주세요" });
        return;
      }
    }
    
    const formData: PartnerFormData = {
      name: name.trim(),
      relationStage,
      mbti: mbti || undefined,
      saju: (birthY && birthM && birthD) ? {
        calendarType,
        birthY: parseInt(birthY),
        birthM: parseInt(birthM),
        birthD: parseInt(birthD),
        birthTimeKnown,
        birthHour: birthTimeKnown && birthHour ? parseInt(birthHour) : undefined,
        birthMinute: birthTimeKnown && birthMinute ? parseInt(birthMinute) : undefined,
      } : undefined,
      memo: memo.trim() || undefined,
    };
    
    await onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 이름 (필수) */}
      <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-gray-200">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="상대방 이름을 입력하세요"
          maxLength={20}
          className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
            errors.name 
              ? "border-red-300 focus:ring-red-400" 
              : "border-gray-200 focus:ring-purple-400"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </section>
      
      {/* 관계 단계 */}
      <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-gray-200">
        <label className="block text-sm font-bold text-gray-900 mb-3">관계 단계</label>
        <div className="flex flex-wrap gap-2">
          {RELATION_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setRelationStage(stage === relationStage ? undefined : stage)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                relationStage === stage
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </section>
      
      {/* MBTI */}
      <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-gray-200">
        <label className="block text-sm font-bold text-gray-900 mb-3">MBTI (선택)</label>
        <MbtiPicker
          value={mbti}
          onChange={(value) => setMbti(value)}
        />
        {errors.mbti && (
          <p className="mt-2 text-xs text-red-500">{errors.mbti}</p>
        )}
      </section>
      
      {/* 사주 정보 */}
      <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-gray-200">
        <label className="block text-sm font-bold text-gray-900 mb-3">사주 정보 (선택)</label>
        
        {/* 달력 종류 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setCalendarType("양력")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              calendarType === "양력"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            양력
          </button>
          <button
            type="button"
            onClick={() => setCalendarType("음력")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              calendarType === "음력"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            음력
          </button>
        </div>
        
        {/* 생년월일 */}
        <div className="flex gap-2 mb-4">
          <select
            value={birthY}
            onChange={(e) => setBirthY(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">년</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select
            value={birthM}
            onChange={(e) => setBirthM(e.target.value)}
            className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">월</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <select
            value={birthD}
            onChange={(e) => setBirthD(e.target.value)}
            className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">일</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>
        
        {/* 출생 시간 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              setBirthTimeKnown(!birthTimeKnown);
              if (!birthTimeKnown) {
                setBirthHour("");
                setBirthMinute("");
              }
            }}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              birthTimeKnown ? "bg-purple-500 border-purple-500" : "border-purple-300"
            }`}>
              {birthTimeKnown && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span>출생 시간도 입력할게요 (선택)</span>
          </button>
          
          {birthTimeKnown && (
            <div className="mt-3 flex gap-2">
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">시간</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
              <select
                value={birthMinute}
                onChange={(e) => setBirthMinute(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">분</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>{m}분</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {errors.saju && (
          <p className="text-xs text-red-500">{errors.saju}</p>
        )}
      </section>
      
      {/* 메모 */}
      <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-gray-200">
        <label className="block text-sm font-bold text-gray-900 mb-3">메모 (선택)</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="기억하고 싶은 내용을 입력하세요"
          maxLength={200}
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
        <p className="mt-1 text-xs text-gray-400 text-right">{memo.length}/200자</p>
      </section>
      
      {/* 제출 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all"
        >
          {mode === "edit" ? "수정 완료" : "추가하기"}
        </button>
      </div>
    </form>
  );
}
