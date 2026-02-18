"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentPartner } from "@/app/lib/cupid/partnersStorage";
import type { Partner } from "@/app/lib/cupid/partnerTypes";

interface CurrentPartnerCardProps {
  onClick: () => void;
}

export default function CurrentPartnerCard({ onClick }: CurrentPartnerCardProps) {
  const router = useRouter();
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
  
  useEffect(() => {
    setCurrentPartner(getCurrentPartner());
    
    // localStorage 변경 감지
    const handleStorageChange = () => {
      setCurrentPartner(getCurrentPartner());
    };
    
    window.addEventListener('storage', handleStorageChange);
    // 커스텀 이벤트로 같은 탭에서의 변경도 감지
    window.addEventListener('partnerUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('partnerUpdated', handleStorageChange);
    };
  }, []);
  
  const handleClick = () => {
    onClick();
    router.push("/partners");
  };
  
  if (!currentPartner) {
    return (
      <div className="mb-4">
        <section
          className="rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 p-5 border border-pink-200 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm"
          onClick={handleClick}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span>💞</span>
                <span>상대 관리</span>
              </h3>
              <p className="text-sm text-gray-600">
                상대 정보를 저장하고 분석에 반영해요
              </p>
            </div>
            <span className="text-gray-400 opacity-60 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </section>
      </div>
    );
  }
  
  return (
    <div className="mb-4">
      <section
        className="rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 p-5 border border-pink-200 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] shadow-sm"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>💞</span>
                <span>현재 상대</span>
              </h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-pink-200 text-pink-700 rounded-full">
                설정됨
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {currentPartner.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentPartner.relationStage && (
                <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-700 rounded-full">
                  {currentPartner.relationStage}
                </span>
              )}
              {currentPartner.mbti && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {currentPartner.mbti}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              탭하여 상대 정보 관리하기
            </p>
          </div>
          <span className="text-gray-400 opacity-60 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </section>
    </div>
  );
}
