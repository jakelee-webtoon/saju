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
          className="rounded-sm bg-white p-5 border-2 border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 active:scale-[0.99] shadow-md"
          onClick={handleClick}
        >
          <div className="flex items-center gap-4">
            {/* 프로필 아이콘 영역 */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center border-2 border-pink-200">
              <span className="text-2xl">💞</span>
            </div>
            
            {/* 컨텐츠 영역 */}
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                상대 관리
              </h3>
              <p className="text-xs text-gray-600">
                상대 정보를 저장하고 분석에 반영해요
              </p>
            </div>
            
            {/* 화살표 */}
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
        className="rounded-sm bg-white p-5 border-2 border-pink-300 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-pink-400 active:scale-[0.99] shadow-md"
        onClick={handleClick}
      >
        <div className="flex items-center gap-4">
          {/* 프로필 아이콘 영역 */}
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center border-2 border-pink-300 shadow-sm">
            <span className="text-3xl">💞</span>
          </div>
          
          {/* 컨텐츠 영역 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900">
                현재 상대
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold bg-pink-500 text-white rounded-sm">
                설정됨
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-2">
              {currentPartner.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentPartner.relationStage && (
                <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-700 rounded-sm border border-pink-200">
                  {currentPartner.relationStage}
                </span>
              )}
              {currentPartner.mbti && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-sm border border-blue-200">
                  {currentPartner.mbti}
                </span>
              )}
            </div>
          </div>
          
          {/* 화살표 */}
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
