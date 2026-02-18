/**
 * 상대(Partner) 정보 localStorage + Firestore 관리 유틸리티
 * Firestore가 primary source of truth, localStorage는 캐시로 사용
 */

import type { Partner, PartnerFormData } from "./partnerTypes";
import {
  savePartnerToFirestore,
  getPartnersFromFirestore,
  updatePartnerInFirestore,
  deletePartnerFromFirestore,
  getCurrentPartnerIdFromFirestore,
  setCurrentPartnerIdInFirestore,
} from "@/app/lib/firebase/userService";
import { getKakaoUser, getNaverUser } from "@/app/lib/auth";

const STORAGE_KEY_PARTNERS = "cupid.partners";
const STORAGE_KEY_CURRENT_PARTNER_ID = "cupid.currentPartnerId";
const STORAGE_KEY_SYNCED = "cupid.partners.synced"; // 마지막 동기화 시간

// 사용자 ID 가져오기
function getUserId(): string | null {
  const kakaoUser = getKakaoUser();
  if (kakaoUser) return kakaoUser.id;
  
  const naverUser = getNaverUser();
  if (naverUser) return naverUser.id;
  
  return null;
}

// Firestore에서 partners 불러와서 localStorage에 동기화
export async function syncPartnersFromFirestore(): Promise<Partner[]> {
  const userId = getUserId();
  if (!userId) {
    // 로그인 안 된 경우 localStorage만 사용
    return getPartners();
  }
  
  try {
    const firestorePartners = await getPartnersFromFirestore(userId);
    const currentPartnerId = await getCurrentPartnerIdFromFirestore(userId);
    
    // localStorage에 저장
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(firestorePartners));
      if (currentPartnerId) {
        // firestore_ prefix가 있으면 그대로, 없으면 추가
        const idToStore = currentPartnerId.startsWith("firestore_") 
          ? currentPartnerId 
          : `firestore_${currentPartnerId}`;
        localStorage.setItem(STORAGE_KEY_CURRENT_PARTNER_ID, idToStore);
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_PARTNER_ID);
      }
      localStorage.setItem(STORAGE_KEY_SYNCED, String(Date.now()));
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent('partnerUpdated'));
    }
    
    return firestorePartners;
  } catch (error) {
    console.error("Error syncing partners from Firestore:", error);
    // 에러 발생 시 localStorage에서 불러오기
    return getPartners();
  }
}

/**
 * 모든 상대 목록 가져오기
 */
export function getPartners(): Partner[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PARTNERS);
    if (!stored) return [];
    return JSON.parse(stored) as Partner[];
  } catch (error) {
    console.error("Error loading partners:", error);
    return [];
  }
}

/**
 * 상대 목록 저장
 */
export function savePartners(partners: Partner[]): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
    // 커스텀 이벤트 발생 (같은 탭에서 변경 감지용)
    window.dispatchEvent(new CustomEvent('partnerUpdated'));
    return true;
  } catch (error) {
    console.error("Error saving partners:", error);
    return false;
  }
}

/**
 * 새 상대 추가 (Firestore + localStorage)
 * 최대 3명까지만 추가 가능
 */
export async function addPartner(partnerData: PartnerFormData): Promise<Partner | null> {
  const userId = getUserId();
  
  // 현재 파트너 수 확인 (최대 3명 제한)
  const currentPartners = getPartners();
  if (currentPartners.length >= 3) {
    throw new Error("최대 3명까지만 추가할 수 있어요");
  }
  
  const newPartner: Partner = {
    id: crypto.randomUUID(), // 임시 ID, Firestore에서 실제 ID로 교체됨
    name: partnerData.name.trim(),
    relationStage: partnerData.relationStage,
    mbti: partnerData.mbti?.trim().toUpperCase(),
    saju: partnerData.saju,
    memo: partnerData.memo?.trim().substring(0, 200),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Firestore에 저장 (로그인된 경우)
  if (userId) {
    try {
      // Firestore에서도 현재 파트너 수 확인
      const firestorePartners = await getPartnersFromFirestore(userId);
      if (firestorePartners.length >= 3) {
        throw new Error("최대 3명까지만 추가할 수 있어요");
      }
      
      const firestoreId = await savePartnerToFirestore(userId, newPartner);
      if (firestoreId) {
        // Firestore ID로 업데이트
        newPartner.id = `firestore_${firestoreId}`;
      }
    } catch (error) {
      console.error("Error saving partner to Firestore:", error);
      // Firestore 저장 실패 시 에러 재throw
      if (error instanceof Error && error.message.includes("최대 3명")) {
        throw error;
      }
      // Firestore 저장 실패해도 localStorage에는 저장 (네트워크 오류 등)
    }
  }
  
  // localStorage에 저장
  const partners = getPartners();
  partners.push(newPartner);
  
  if (savePartners(partners)) {
    return newPartner;
  }
  
  return null;
}

/**
 * 상대 정보 수정 (Firestore + localStorage)
 */
export async function updatePartner(id: string, patch: Partial<PartnerFormData>): Promise<Partner | null> {
  const userId = getUserId();
  const partners = getPartners();
  const index = partners.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  const updated: Partner = {
    ...partners[index],
    ...(patch.name !== undefined && { name: patch.name.trim() }),
    ...(patch.relationStage !== undefined && { relationStage: patch.relationStage }),
    ...(patch.mbti !== undefined && { mbti: patch.mbti.trim().toUpperCase() || undefined }),
    ...(patch.saju !== undefined && { saju: patch.saju }),
    ...(patch.memo !== undefined && { memo: patch.memo.trim().substring(0, 200) || undefined }),
    updatedAt: Date.now(),
  };
  
  // Firestore에 업데이트 (로그인된 경우, Firestore에서 온 데이터인 경우)
  if (userId && id.startsWith("firestore_")) {
    try {
      await updatePartnerInFirestore(userId, id, updated);
    } catch (error) {
      console.error("Error updating partner in Firestore:", error);
      // Firestore 업데이트 실패해도 localStorage에는 저장
    }
  }
  
  // localStorage에 저장
  partners[index] = updated;
  
  if (savePartners(partners)) {
    return updated;
  }
  
  return null;
}

/**
 * 상대 삭제 (Firestore + localStorage)
 */
export async function deletePartner(id: string): Promise<boolean> {
  const userId = getUserId();
  const partners = getPartners();
  const filtered = partners.filter(p => p.id !== id);
  
  // 현재 상대로 설정된 상대를 삭제하면 현재 상대도 초기화
  const currentId = getCurrentPartnerId();
  if (currentId === id) {
    await setCurrentPartnerId(null);
  }
  
  // Firestore에서 삭제 (로그인된 경우, Firestore에서 온 데이터인 경우)
  if (userId && id.startsWith("firestore_")) {
    try {
      await deletePartnerFromFirestore(userId, id);
    } catch (error) {
      console.error("Error deleting partner from Firestore:", error);
      // Firestore 삭제 실패해도 localStorage에서는 삭제
    }
  }
  
  return savePartners(filtered);
}

/**
 * 현재 상대 ID 가져오기
 */
export function getCurrentPartnerId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(STORAGE_KEY_CURRENT_PARTNER_ID) || null;
  } catch (error) {
    console.error("Error loading current partner ID:", error);
    return null;
  }
}

/**
 * 현재 상대 ID 설정 (Firestore + localStorage)
 */
export async function setCurrentPartnerId(id: string | null): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  const userId = getUserId();
  
  // Firestore에 저장 (로그인된 경우)
  if (userId) {
    try {
      // firestore_ prefix 제거해서 저장
      const firestoreId = id?.startsWith("firestore_") 
        ? id.replace("firestore_", "") 
        : id;
      await setCurrentPartnerIdInFirestore(userId, firestoreId);
    } catch (error) {
      console.error("Error setting current partner ID in Firestore:", error);
      // Firestore 저장 실패해도 localStorage에는 저장
    }
  }
  
  // localStorage에 저장
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY_CURRENT_PARTNER_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_PARTNER_ID);
    }
    // 커스텀 이벤트 발생 (같은 탭에서 변경 감지용)
    window.dispatchEvent(new CustomEvent('partnerUpdated'));
    return true;
  } catch (error) {
    console.error("Error saving current partner ID:", error);
    return false;
  }
}

/**
 * 현재 상대 정보 가져오기
 */
export function getCurrentPartner(): Partner | null {
  const currentId = getCurrentPartnerId();
  if (!currentId) return null;
  
  const partners = getPartners();
  return partners.find(p => p.id === currentId) || null;
}

/**
 * ID로 상대 찾기
 */
export function getPartnerById(id: string): Partner | null {
  const partners = getPartners();
  return partners.find(p => p.id === id) || null;
}
