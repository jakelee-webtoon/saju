"use client";

import { useEffect, useState } from "react";

interface SavedPartner {
  nickname: string;
  type: "mbti" | "birth";
  mbti?: string;
  birthDate?: string;
}

interface CompatibilityMiniCardProps {
  onClick: () => void;
}

/**
 * 홈 화면 궁합 미니 카드
 * - 상대 정보 입력 유도
 * - 저장된 상대가 있으면 "{nickname}랑 궁합 보기" 표시
 * - 클릭 시 /match 페이지로 이동
 */
export default function CompatibilityMiniCard({ onClick }: CompatibilityMiniCardProps) {
  const [savedPartner, setSavedPartner] = useState<SavedPartner | null>(null);

  useEffect(() => {
    // localStorage에서 저장된 상대 정보 읽기
    const saved = localStorage.getItem("savedPartner");
    if (saved) {
      try {
        setSavedPartner(JSON.parse(saved));
      } catch {
        // 파싱 오류 시 무시
      }
    }
  }, []);

  return (
    <section
      className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-5 border border-purple-100 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-purple-700 mb-2">
            💞 궁합 보기
          </h3>
          
          <p className="text-sm text-gray-600 leading-relaxed">
            상대방과의 궁합을 확인해보세요
          </p>
        </div>
        
        <span className="text-purple-500 opacity-60">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </section>
  );
}
