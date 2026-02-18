"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SwipeBack } from "@/app/components/common";
import PartnerCard from "@/app/components/partners/PartnerCard";
import {
  getPartners,
  getCurrentPartner,
  setCurrentPartnerId,
  syncPartnersFromFirestore,
} from "@/app/lib/cupid/partnersStorage";
import type { Partner } from "@/app/lib/cupid/partnerTypes";

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [currentPartner, setCurrentPartnerState] = useState<Partner | null>(null);
  
  const loadPartners = () => {
    const loaded = getPartners();
    setPartners(loaded);
    setCurrentPartnerState(getCurrentPartner());
  };
  
  useEffect(() => {
    // 로그인된 경우 Firestore에서 동기화
    const syncAndLoad = async () => {
      await syncPartnersFromFirestore();
      loadPartners();
    };
    syncAndLoad();
  }, []);
  
  const handleEdit = (id: string) => {
    router.push(`/partners/${id}/edit`);
  };
  
  const handleDelete = (id: string) => {
    loadPartners(); // 리스트 새로고침
  };
  
  const handleSetCurrent = async (id: string) => {
    await setCurrentPartnerId(id);
    setCurrentPartnerState(getCurrentPartner());
  };
  
  return (
    <SwipeBack onBack={() => router.push("/")}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
        <div className="mx-auto max-w-md px-5 py-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
          
          {/* 헤더 */}
          <header className="mb-6">
            <div className="text-4xl mb-2">💞</div>
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              상대 관리
            </h1>
            <p className="text-sm text-purple-600">
              상대 정보를 저장하고 분석에 반영해요
            </p>
          </header>
          
          {/* 상대 리스트 */}
          {partners.length === 0 ? (
            <div className="rounded-2xl bg-white/90 backdrop-blur p-8 shadow-lg border border-gray-200 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                저장된 상대가 없어요
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                상대 정보를 추가하면 대화 분석/추천이<br />
                더 정확해져요
              </p>
              <button
                onClick={() => router.push("/partners/new")}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all"
              >
                상대 추가하기
              </button>
            </div>
          ) : (
            <>
              {/* 상대 리스트 */}
              <div className="space-y-4 mb-6">
                {partners.map((partner) => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSetCurrent={handleSetCurrent}
                  />
                ))}
              </div>
              
              {/* 상대 추가 버튼 (리스트 아래) - 최대 3명 제한 */}
              {partners.length >= 3 ? (
                <div className="w-full py-4 rounded-xl font-bold bg-gray-200 text-gray-500 text-center shadow-lg">
                  최대 3명까지만 추가할 수 있어요
                </div>
              ) : (
                <button
                  onClick={() => router.push("/partners/new")}
                  className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all"
                >
                  새로운 상대방 추가하기
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </SwipeBack>
  );
}
