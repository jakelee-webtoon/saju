"use client";

import { MBTI_TYPES, type MbtiType } from "@/app/lib/match/mbti";

interface MbtiPickerProps {
  value: string | null;
  onChange: (mbti: MbtiType) => void;
  label?: string;
}

/**
 * MBTI 16개 선택 컴포넌트
 * 4x4 그리드로 표시
 */
export default function MbtiPicker({ value, onChange, label }: MbtiPickerProps) {
  // MBTI 그룹별 색상
  const getGroupColor = (mbti: string): string => {
    const type = mbti.substring(0, 2);
    switch (type) {
      case "IN": return "border-purple-300 hover:border-purple-400"; // 분석형
      case "EN": return "border-teal-300 hover:border-teal-400";     // 외교형
      case "IS": return "border-blue-300 hover:border-blue-400";     // 관리형
      case "ES": return "border-amber-300 hover:border-amber-400";   // 탐험형
      default: return "border-gray-300";
    }
  };

  const getSelectedColor = (mbti: string): string => {
    const type = mbti.substring(0, 2);
    switch (type) {
      case "IN": return "bg-purple-500 border-purple-500 text-white"; // 분석형
      case "EN": return "bg-teal-500 border-teal-500 text-white";     // 외교형
      case "IS": return "bg-blue-500 border-blue-500 text-white";     // 관리형
      case "ES": return "bg-amber-500 border-amber-500 text-white";   // 탐험형
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
      )}
      <div className="grid grid-cols-4 gap-2">
        {MBTI_TYPES.map((mbti) => {
          const isSelected = value === mbti;
          return (
            <button
              key={mbti}
              type="button"
              onClick={() => onChange(mbti)}
              className={`
                py-2.5 px-1 rounded-xl text-sm font-bold border-2 transition-all duration-200
                ${isSelected 
                  ? getSelectedColor(mbti)
                  : `bg-white ${getGroupColor(mbti)} text-gray-700 hover:bg-gray-50`
                }
                active:scale-95
              `}
            >
              {mbti}
            </button>
          );
        })}
      </div>
      
      {/* MBTI 그룹 범례 */}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          분석형(IN)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          외교형(EN)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          관리형(IS)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          탐험형(ES)
        </span>
      </div>
    </div>
  );
}
