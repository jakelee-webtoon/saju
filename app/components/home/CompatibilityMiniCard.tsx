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
          
          {savedPartner ? (
            // 저장된 상대가 있는 경우
            <p className="text-sm text-purple-600 leading-relaxed font-medium">
              {savedPartner.nickname}님과의 궁합을 확인해보세요
            </p>
          ) : (
            // 저장된 상대가 없는 경우
            <p className="text-sm text-gray-600 leading-relaxed">
              상대 정보를 넣으면 오늘 모드 기준으로 궁합을 보여줘요
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className="text-purple-500 text-lg">→</span>
          <span className="text-xs text-purple-500 font-medium whitespace-nowrap">
            {savedPartner ? `${savedPartner.nickname}랑 궁합 보기` : "상대 넣어보기"}
          </span>
        </div>
      </div>
    </section>
  );
}
