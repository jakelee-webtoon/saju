"use client";

import type { Partner } from "@/app/lib/cupid/partnerTypes";
import { setCurrentPartnerId, deletePartner, getCurrentPartnerId } from "@/app/lib/cupid/partnersStorage";

interface PartnerCardProps {
  partner: Partner;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetCurrent: (id: string) => void;
}

export default function PartnerCard({ partner, onEdit, onDelete, onSetCurrent }: PartnerCardProps) {
  const isCurrent = getCurrentPartnerId() === partner.id;
  
  // 카드 클릭 시 바로 현재 상대로 설정
  const handleCardClick = async (e: React.MouseEvent) => {
    // 버튼 클릭이면 무시
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (!isCurrent) {
      await setCurrentPartnerId(partner.id);
      onSetCurrent(partner.id);
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    if (confirm(`정말 ${partner.name}님의 정보를 삭제하시겠어요?`)) {
      await deletePartner(partner.id);
      onDelete(partner.id);
    }
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    onEdit(partner.id);
  };
  
  const hasSaju = partner.saju !== undefined;
  const hasMbti = partner.mbti !== undefined;
  
  return (
    <div 
      onClick={handleCardClick}
      className={`rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border cursor-pointer transition-all ${
        isCurrent ? "border-purple-300 ring-2 ring-purple-200" : "border-gray-200 hover:border-purple-200 hover:shadow-md"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
            {isCurrent && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                현재 상대
              </span>
            )}
          </div>
          {partner.relationStage && (
            <span className="inline-block px-2.5 py-1 text-xs font-medium bg-pink-100 text-pink-700 rounded-full">
              {partner.relationStage}
            </span>
          )}
        </div>
      </div>
      
      {/* 정보 배지 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {hasMbti && (
          <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            MBTI: {partner.mbti}
          </span>
        )}
        {hasSaju && (
          <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            사주 입력됨
          </span>
        )}
        {!hasSaju && (
          <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
            사주 미입력
          </span>
        )}
      </div>
      
      {/* 메모 */}
      {partner.memo && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{partner.memo}</p>
      )}
      
      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleEdit}
          className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          수정
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 py-2 px-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
