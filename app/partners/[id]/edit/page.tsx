"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SwipeBack } from "@/app/components/common";
import PartnerForm from "@/app/components/partners/PartnerForm";
import { getPartnerById, updatePartner } from "@/app/lib/cupid/partnersStorage";
import type { Partner, PartnerFormData } from "@/app/lib/cupid/partnerTypes";

export default function EditPartnerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loaded = getPartnerById(id);
    if (loaded) {
      setPartner(loaded);
    } else {
      alert("상대 정보를 찾을 수 없습니다.");
      router.push("/partners");
    }
    setLoading(false);
  }, [id, router]);
  
  const handleSubmit = async (data: PartnerFormData) => {
    const updated = await updatePartner(id, data);
    if (updated) {
      router.push("/partners");
    } else {
      alert("상대 정보 수정에 실패했습니다. 다시 시도해주세요.");
    }
  };
  
  const handleCancel = () => {
    router.push("/partners");
  };
  
  if (loading) {
    return (
      <SwipeBack onBack={handleCancel}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-purple-700 font-medium">로딩 중...</p>
          </div>
        </div>
      </SwipeBack>
    );
  }
  
  if (!partner) {
    return null;
  }
  
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
            <div className="text-4xl mb-2">✏️</div>
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              상대 정보 수정
            </h1>
            <p className="text-sm text-purple-600">
              {partner.name}님의 정보를 수정해주세요
            </p>
          </header>
          
          {/* 폼 */}
          <PartnerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={partner}
            mode="edit"
          />
        </div>
      </div>
    </SwipeBack>
  );
}
