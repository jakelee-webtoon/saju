"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SwipeBack } from "@/app/components/common";
import PartnerForm from "@/app/components/partners/PartnerForm";
import { addPartner, setCurrentPartnerId } from "@/app/lib/cupid/partnersStorage";
import type { PartnerFormData } from "@/app/lib/cupid/partnerTypes";

function NewPartnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  
  const handleSubmit = async (data: PartnerFormData) => {
    try {
      const partner = await addPartner(data);
      if (partner) {
        // 현재 상대로 자동 설정
        await setCurrentPartnerId(partner.id);
        
        // returnTo 파라미터가 있으면 해당 페이지로, 없으면 상대 관리 페이지로
        if (returnTo === "match") {
          router.push("/match");
        } else {
          router.push("/partners");
        }
      } else {
        alert("상대 추가에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("최대 3명")) {
        alert("최대 3명까지만 추가할 수 있어요");
      } else {
        alert("상대 추가에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };
  
  const handleCancel = () => {
    // returnTo 파라미터가 있으면 해당 페이지로, 없으면 상대 관리 페이지로
    if (returnTo === "match") {
      router.push("/match");
    } else {
      router.push("/partners");
    }
  };
  
  return (
    <SwipeBack onBack={handleCancel}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
        <div className="mx-auto max-w-md px-5 py-8">
          {/* 뒤로가기 */}
          <button
            onClick={handleCancel}
            className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
          
          {/* 헤더 */}
          <header className="mb-6">
            <div className="text-4xl mb-2">➕</div>
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              상대 추가
            </h1>
            <p className="text-sm text-purple-600">
              상대방 정보를 입력해주세요
            </p>
          </header>
          
          {/* 폼 */}
          <PartnerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            mode="new"
          />
        </div>
      </div>
    </SwipeBack>
  );
}

export default function NewPartnerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <p className="text-purple-700">로딩 중...</p>
      </div>
    }>
      <NewPartnerContent />
    </Suspense>
  );
}
