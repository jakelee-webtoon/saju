// Firebase Firestore 사용자 서비스
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from "firebase/firestore";
import { db } from "./config";

// 결제 내역 타입
export interface PaymentRecord {
  id?: string;
  oderId: string;
  packageId: string;
  packageName: string;
  amount: number;
  arrows: number;
  paymentMethod: string;
  impUid: string;
  merchantUid: string;
  status: "completed" | "failed" | "refunded";
  createdAt: Timestamp | null;
}

// 궁합 히스토리 타입
export interface MatchHistoryRecord {
  id?: string;
  oderId: string;
  matchType: "mbti" | "birth";
  partnerNickname: string;
  partnerInfo: {
    mbti?: string;
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    birthHour?: number; // 출생 시간 추가
  };
  compatibilityScore?: number;
  createdAt: Timestamp | null;
}

// 오늘 운세 캐시 타입
export interface DailyFortuneCache {
  oderId: string;
  date: string; // YYYY-MM-DD
  fortuneData: {
    loveScore: number;
    actionTip: string;
    luckyTime: string;
    warningTime: string;
    todayKeyword: string;
    detailedFortune: string;
  };
  createdAt: Timestamp | null;
}

// 사용 통계 타입
export interface UsageStats {
  oderId: string;
  totalLogins: number;
  totalMatchChecks: number;
  totalDecisionMade: number;
  totalArrowsUsed: number;
  totalArrowsPurchased: number;
  lastActiveAt: Timestamp | null;
  featureUsage: {
    todayFortune: number;
    mbtiMatch: number;
    birthMatch: number;
    decisionGuide: number;
    shop: number;
  };
}

// 사용자 데이터 타입
export interface UserData {
  oderId: string;
  provider: "kakao" | "naver";
  nickname: string;
  profileImage?: string | null;
  email?: string | null;
  
  // 사주 정보
  birthInfo: {
    name: string;
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    calendarType: "양력" | "음력";
    hasTime: boolean;
  } | null;
  
  // 화살 잔액
  arrowBalance: number;
  
  // 언락한 콘텐츠
  unlockedContent: {
    loveTendency: boolean;           // 영구 유지
    matchDetails: string[];          // 영구 유지 (궁합 ID 배열)
    decisionGuideDate: string | null; // 오늘 날짜면 유지 (YYYY-MM-DD)
  };
  
  // 메타 정보
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
  hasCompletedOnboarding: boolean;
}

// 기본 사용자 데이터 생성
export function createDefaultUserData(
  oderId: string,
  provider: "kakao" | "naver",
  nickname: string,
  profileImage?: string,
  email?: string
): Record<string, unknown> {
  // Firestore는 undefined를 허용하지 않으므로 null 또는 생략
  const data: Record<string, unknown> = {
    oderId,
    provider,
    nickname,
    arrowBalance: 0,
    unlockedContent: {
      loveTendency: false,
      matchDetails: [],
      decisionGuideDate: null,
    },
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    hasCompletedOnboarding: false,
    birthInfo: null, // undefined 대신 null 사용
  };
  
  // optional 필드는 값이 있을 때만 추가
  if (profileImage) data.profileImage = profileImage;
  if (email) data.email = email;
  
  return data;
}

// 사용자 존재 여부 확인
export async function checkUserExists(oderId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", oderId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
}

// 사용자 데이터 가져오기
export async function getUserData(oderId: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, "users", oderId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

// 새 사용자 생성
export async function createUser(
  oderId: string,
  provider: "kakao" | "naver",
  nickname: string,
  profileImage?: string,
  email?: string
): Promise<UserData | null> {
  try {
    const userRef = doc(db, "users", oderId);
    const userData = createDefaultUserData(oderId, provider, nickname, profileImage, email);
    
    await setDoc(userRef, userData);
    
    // 생성된 데이터 반환
    const createdUser = await getUserData(oderId);
    return createdUser;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

// 사용자 로그인 처리 (존재하면 lastLoginAt 업데이트, 없으면 생성)
export async function handleUserLogin(
  oderId: string,
  provider: "kakao" | "naver",
  nickname: string,
  profileImage?: string,
  email?: string
): Promise<UserData | null> {
  try {
    const exists = await checkUserExists(oderId);
    
    if (exists) {
      // 기존 사용자 - 로그인 시간 업데이트
      const userRef = doc(db, "users", oderId);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        nickname, // 닉네임 변경 가능성
        profileImage, // 프로필 이미지 변경 가능성
      });
      return await getUserData(oderId);
    } else {
      // 새 사용자 생성
      return await createUser(oderId, provider, nickname, profileImage, email);
    }
  } catch (error) {
    console.error("Error handling user login:", error);
    return null;
  }
}

// 사주 정보 업데이트
export async function updateBirthInfo(
  oderId: string,
  birthInfo: UserData["birthInfo"]
): Promise<boolean> {
  try {
    console.log("📝 updateBirthInfo 시작");
    console.log("oderId:", oderId);
    console.log("birthInfo:", birthInfo);
    
    const userRef = doc(db, "users", oderId);
    console.log("userRef 경로:", `users/${oderId}`);
    
    await updateDoc(userRef, {
      birthInfo,
      hasCompletedOnboarding: true,
    });
    
    console.log("✅ Firestore updateDoc 완료");
    return true;
  } catch (error) {
    console.error("❌ Error updating birth info:", error);
    console.error("에러 상세:", JSON.stringify(error, null, 2));
    return false;
  }
}

// 화살 잔액 가져오기
export async function getArrowBalanceFromDB(oderId: string): Promise<number> {
  try {
    const userData = await getUserData(oderId);
    return userData?.arrowBalance ?? 0;
  } catch (error) {
    console.error("Error getting arrow balance:", error);
    return 0;
  }
}

// 화살 충전 (추가)
export async function addArrowsToDB(oderId: string, amount: number): Promise<number> {
  try {
    const userData = await getUserData(oderId);
    if (!userData) return 0;
    
    const newBalance = userData.arrowBalance + amount;
    const userRef = doc(db, "users", oderId);
    await updateDoc(userRef, {
      arrowBalance: newBalance,
    });
    
    return newBalance;
  } catch (error) {
    console.error("Error adding arrows:", error);
    return 0;
  }
}

// 화살 사용 (차감)
export async function useArrowsFromDB(oderId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
  try {
    const userData = await getUserData(oderId);
    if (!userData) return { success: false, newBalance: 0 };
    
    if (userData.arrowBalance < amount) {
      return { success: false, newBalance: userData.arrowBalance };
    }
    
    const newBalance = userData.arrowBalance - amount;
    const userRef = doc(db, "users", oderId);
    await updateDoc(userRef, {
      arrowBalance: newBalance,
    });
    
    return { success: true, newBalance };
  } catch (error) {
    console.error("Error using arrows:", error);
    return { success: false, newBalance: 0 };
  }
}

// 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayDateString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// 콘텐츠 언락 기록
export async function recordContentUnlock(
  oderId: string,
  contentType: "loveTendency" | "matchDetails" | "decisionGuide",
  contentId?: string
): Promise<boolean> {
  try {
    const userRef = doc(db, "users", oderId);
    
    if (contentType === "loveTendency") {
      // 영구 언락
      await updateDoc(userRef, {
        "unlockedContent.loveTendency": true,
      });
    } else if (contentType === "matchDetails" && contentId) {
      // 궁합 상세: ID 배열에 추가 (영구)
      await updateDoc(userRef, {
        "unlockedContent.matchDetails": arrayUnion(contentId),
      });
    } else if (contentType === "decisionGuide") {
      // 결정 가이드: 오늘 날짜 저장 (하루 유지)
      await updateDoc(userRef, {
        "unlockedContent.decisionGuideDate": getTodayDateString(),
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error recording content unlock:", error);
    return false;
  }
}

// 콘텐츠 언락 여부 확인
export async function isContentUnlocked(
  oderId: string,
  contentType: "loveTendency" | "matchDetails" | "decisionGuide",
  contentId?: string
): Promise<boolean> {
  try {
    const userData = await getUserData(oderId);
    if (!userData) return false;
    
    if (contentType === "loveTendency") {
      return userData.unlockedContent.loveTendency;
    } else if (contentType === "matchDetails" && contentId) {
      return userData.unlockedContent.matchDetails.includes(contentId);
    } else if (contentType === "decisionGuide") {
      // 오늘 날짜와 비교
      return userData.unlockedContent.decisionGuideDate === getTodayDateString();
    }
    
    return false;
  } catch (error) {
    console.error("Error checking content unlock:", error);
    return false;
  }
}

// 온보딩 완료 상태 업데이트
export async function markOnboardingCompleteInDB(oderId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", oderId);
    await updateDoc(userRef, {
      hasCompletedOnboarding: true,
    });
    return true;
  } catch (error) {
    console.error("Error marking onboarding complete:", error);
    return false;
  }
}

// ============================================
// 결제 내역 관련 함수
// ============================================

// 결제 내역 저장
export async function savePaymentRecord(
  record: Omit<PaymentRecord, "id" | "createdAt">
): Promise<string | null> {
  try {
    const paymentsRef = collection(db, "payments");
    const docRef = await addDoc(paymentsRef, {
      ...record,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving payment record:", error);
    return null;
  }
}

// 사용자 결제 내역 조회
export async function getPaymentHistory(
  oderId: string,
  limitCount: number = 10
): Promise<PaymentRecord[]> {
  try {
    const paymentsRef = collection(db, "payments");
    const q = query(
      paymentsRef,
      where("oderId", "==", oderId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PaymentRecord));
  } catch (error) {
    console.error("Error getting payment history:", error);
    return [];
  }
}

// ============================================
// 궁합 히스토리 관련 함수
// ============================================

// 궁합 기록 저장
export async function saveMatchHistory(
  record: Omit<MatchHistoryRecord, "id" | "createdAt">
): Promise<string | null> {
  try {
    const matchesRef = collection(db, "matchHistory");
    const docRef = await addDoc(matchesRef, {
      ...record,
      createdAt: serverTimestamp(),
    });
    
    // 사용 통계 업데이트
    await incrementFeatureUsage(record.oderId, record.matchType === "mbti" ? "mbtiMatch" : "birthMatch");
    
    return docRef.id;
  } catch (error) {
    console.error("Error saving match history:", error);
    return null;
  }
}

// 사용자 궁합 히스토리 조회
export async function getMatchHistory(
  oderId: string,
  limitCount: number = 10
): Promise<MatchHistoryRecord[]> {
  try {
    const matchesRef = collection(db, "matchHistory");
    const q = query(
      matchesRef,
      where("oderId", "==", oderId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MatchHistoryRecord));
  } catch (error) {
    console.error("Error getting match history:", error);
    return [];
  }
}

// 상대방 정보 저장 (별도 관리)
export interface PartnerInfo {
  id?: string;
  oderId: string;
  partnerNickname: string;
  partnerInfo: {
    mbti?: string;
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    birthHour?: number;
  };
  lastMatchedAt: Timestamp | null;
  matchCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// 상대방 정보 저장 또는 업데이트
export async function savePartnerInfo(
  oderId: string,
  partnerNickname: string,
  partnerInfo: PartnerInfo["partnerInfo"]
): Promise<string | null> {
  try {
    // 같은 별명의 상대방이 이미 있는지 확인
    const partnersRef = collection(db, "partners");
    const q = query(
      partnersRef,
      where("oderId", "==", oderId),
      where("partnerNickname", "==", partnerNickname)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // 기존 상대방 정보 업데이트
      const existingDoc = snapshot.docs[0];
      await updateDoc(existingDoc.ref, {
        partnerInfo,
        lastMatchedAt: serverTimestamp(),
        matchCount: (existingDoc.data().matchCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
      return existingDoc.id;
    } else {
      // 새로운 상대방 정보 저장
      const docRef = await addDoc(partnersRef, {
        oderId,
        partnerNickname,
        partnerInfo,
        lastMatchedAt: serverTimestamp(),
        matchCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving partner info:", error);
    return null;
  }
}

// 사용자의 상대방 목록 조회
export async function getPartners(
  oderId: string,
  limitCount: number = 20
): Promise<PartnerInfo[]> {
  try {
    const partnersRef = collection(db, "partners");
    // 인덱스 없이도 작동하도록 oderId만으로 필터링 후 클라이언트에서 정렬
    const q = query(
      partnersRef,
      where("oderId", "==", oderId)
    );
    
    const snapshot = await getDocs(q);
    const partners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PartnerInfo));
    
    // 클라이언트에서 날짜순 정렬 (최신순)
    partners.sort((a, b) => {
      if (!a.lastMatchedAt || !b.lastMatchedAt) return 0;
      return b.lastMatchedAt.toMillis() - a.lastMatchedAt.toMillis();
    });
    
    // limitCount만큼만 반환
    return partners.slice(0, limitCount);
  } catch (error) {
    console.error("Error getting partners:", error);
    return [];
  }
}

// ============================================
// Partner Management (상대 관리) 관련 함수
// ============================================

import type { Partner, PartnerSaju } from "@/app/lib/cupid/partnerTypes";

// Firestore에 저장할 Partner 데이터 구조
export interface FirestorePartner {
  id?: string; // Document ID
  oderId: string; // User ID
  name: string;
  relationStage?: "썸" | "연애" | "소개팅" | "친구" | "기타";
  mbti?: string;
  saju?: {
    calendarType: "양력" | "음력";
    birthY: number;
    birthM: number;
    birthD: number;
    birthTimeKnown: boolean;
    birthHour?: number;
    birthMinute?: number;
  };
  memo?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// Partner를 Firestore 형식으로 변환 (undefined 필드 제거)
function partnerToFirestore(partner: Partner, oderId: string): Omit<FirestorePartner, "id"> {
  const result: any = {
    oderId,
    name: partner.name,
    createdAt: Timestamp.fromMillis(partner.createdAt),
    updatedAt: Timestamp.fromMillis(partner.updatedAt),
  };
  
  // undefined가 아닌 필드만 추가
  if (partner.relationStage !== undefined) {
    result.relationStage = partner.relationStage;
  }
  if (partner.mbti !== undefined) {
    result.mbti = partner.mbti;
  }
  if (partner.saju) {
    const sajuData: any = {
      calendarType: partner.saju.calendarType,
      birthY: partner.saju.birthY,
      birthM: partner.saju.birthM,
      birthD: partner.saju.birthD,
      birthTimeKnown: partner.saju.birthTimeKnown,
    };
    if (partner.saju.birthHour !== undefined) {
      sajuData.birthHour = partner.saju.birthHour;
    }
    if (partner.saju.birthMinute !== undefined) {
      sajuData.birthMinute = partner.saju.birthMinute;
    }
    result.saju = sajuData;
  }
  if (partner.memo !== undefined) {
    result.memo = partner.memo;
  }
  
  return result;
}

// Firestore 데이터를 Partner 형식으로 변환
function firestoreToPartner(doc: any): Partner {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    relationStage: data.relationStage,
    mbti: data.mbti,
    saju: data.saju ? {
      calendarType: data.saju.calendarType,
      birthY: data.saju.birthY,
      birthM: data.saju.birthM,
      birthD: data.saju.birthD,
      birthTimeKnown: data.saju.birthTimeKnown,
      birthHour: data.saju.birthHour,
      birthMinute: data.saju.birthMinute,
    } : undefined,
    memo: data.memo,
    createdAt: data.createdAt?.toMillis() || Date.now(),
    updatedAt: data.updatedAt?.toMillis() || Date.now(),
  };
}

// Firestore에 Partner 저장 (최대 3명 제한)
export async function savePartnerToFirestore(
  oderId: string,
  partner: Partner
): Promise<string | null> {
  try {
    const partnersRef = collection(db, "cupidPartners");
    
    if (partner.id && partner.id.startsWith("firestore_")) {
      // 기존 파트너 업데이트 (firestore_ prefix가 있으면 Firestore에서 온 것)
      const docId = partner.id.replace("firestore_", "");
      const docRef = doc(db, "cupidPartners", docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...partnerToFirestore(partner, oderId),
          updatedAt: serverTimestamp(),
        });
        return docId;
      }
    }
    
    // 새 파트너 추가 전에 3명 제한 체크
    const existingPartners = await getPartnersFromFirestore(oderId);
    if (existingPartners.length >= 3) {
      throw new Error("최대 3명까지만 추가할 수 있어요");
    }
    
    // 새 파트너 추가
    const firestoreData = partnerToFirestore(partner, oderId);
    const docRef = await addDoc(partnersRef, firestoreData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving partner to Firestore:", error);
    // 3명 제한 에러는 재throw
    if (error instanceof Error && error.message.includes("최대 3명")) {
      throw error;
    }
    return null;
  }
}

// Firestore에서 사용자의 모든 Partner 불러오기
export async function getPartnersFromFirestore(oderId: string): Promise<Partner[]> {
  try {
    const partnersRef = collection(db, "cupidPartners");
    const q = query(
      partnersRef,
      where("oderId", "==", oderId)
    );
    
    const snapshot = await getDocs(q);
    const partners = snapshot.docs.map(doc => {
      const partner = firestoreToPartner(doc);
      // Firestore에서 온 것임을 표시하기 위해 ID에 prefix 추가
      return {
        ...partner,
        id: `firestore_${partner.id}`,
      };
    });
    
    // updatedAt 기준 최신순 정렬
    partners.sort((a, b) => b.updatedAt - a.updatedAt);
    
    return partners;
  } catch (error) {
    console.error("Error getting partners from Firestore:", error);
    return [];
  }
}

// Firestore에서 Partner 업데이트
export async function updatePartnerInFirestore(
  oderId: string,
  partnerId: string,
  updates: Partial<Partner>
): Promise<boolean> {
  try {
    // firestore_ prefix 제거
    const docId = partnerId.replace("firestore_", "");
    const docRef = doc(db, "cupidPartners", docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error("Partner not found in Firestore");
      return false;
    }
    
    const existingData = docSnap.data();
    if (existingData.oderId !== oderId) {
      console.error("Unauthorized: Partner does not belong to user");
      return false;
    }
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.relationStage !== undefined) updateData.relationStage = updates.relationStage;
    if (updates.mbti !== undefined) updateData.mbti = updates.mbti;
    if (updates.saju !== undefined) {
      if (updates.saju) {
        const sajuData: any = {
          calendarType: updates.saju.calendarType,
          birthY: updates.saju.birthY,
          birthM: updates.saju.birthM,
          birthD: updates.saju.birthD,
          birthTimeKnown: updates.saju.birthTimeKnown,
        };
        if (updates.saju.birthHour !== undefined) {
          sajuData.birthHour = updates.saju.birthHour;
        }
        if (updates.saju.birthMinute !== undefined) {
          sajuData.birthMinute = updates.saju.birthMinute;
        }
        updateData.saju = sajuData;
      } else {
        // saju를 null로 설정하여 삭제
        updateData.saju = null;
      }
    }
    if (updates.memo !== undefined) updateData.memo = updates.memo;
    
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating partner in Firestore:", error);
    return false;
  }
}

// Firestore에서 Partner 삭제
export async function deletePartnerFromFirestore(
  oderId: string,
  partnerId: string
): Promise<boolean> {
  try {
    const docId = partnerId.replace("firestore_", "");
    const docRef = doc(db, "cupidPartners", docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error("Partner not found in Firestore");
      return false;
    }
    
    const data = docSnap.data();
    if (data.oderId !== oderId) {
      console.error("Unauthorized: Partner does not belong to user");
      return false;
    }
    
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting partner from Firestore:", error);
    return false;
  }
}

// Firestore에서 현재 상대 ID 가져오기
export async function getCurrentPartnerIdFromFirestore(oderId: string): Promise<string | null> {
  try {
    const userRef = doc(db, "users", oderId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.currentPartnerId || null;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting current partner ID from Firestore:", error);
    return null;
  }
}

// Firestore에 현재 상대 ID 저장
export async function setCurrentPartnerIdInFirestore(
  oderId: string,
  partnerId: string | null
): Promise<boolean> {
  try {
    const userRef = doc(db, "users", oderId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        currentPartnerId: partnerId,
      });
    } else {
      // 사용자가 없으면 생성 (일반적으로는 이미 존재해야 함)
      await setDoc(userRef, {
        currentPartnerId: partnerId,
      }, { merge: true });
    }
    
    return true;
  } catch (error) {
    console.error("Error setting current partner ID in Firestore:", error);
    return false;
  }
}

// ============================================
// 오늘 운세 캐시 관련 함수
// ============================================

// 오늘 운세 캐시 저장
export async function saveDailyFortuneCache(
  oderId: string,
  fortuneData: DailyFortuneCache["fortuneData"]
): Promise<boolean> {
  try {
    const today = getTodayDateString();
    const cacheRef = doc(db, "dailyFortuneCache", `${oderId}_${today}`);
    
    await setDoc(cacheRef, {
      oderId,
      date: today,
      fortuneData,
      createdAt: serverTimestamp(),
    });
    
    // 사용 통계 업데이트
    await incrementFeatureUsage(oderId, "todayFortune");
    
    return true;
  } catch (error) {
    console.error("Error saving daily fortune cache:", error);
    return false;
  }
}

// 오늘 운세 캐시 조회
export async function getDailyFortuneCache(
  oderId: string
): Promise<DailyFortuneCache["fortuneData"] | null> {
  try {
    const today = getTodayDateString();
    const cacheRef = doc(db, "dailyFortuneCache", `${oderId}_${today}`);
    const cacheSnap = await getDoc(cacheRef);
    
    if (cacheSnap.exists()) {
      const data = cacheSnap.data() as DailyFortuneCache;
      return data.fortuneData;
    }
    return null;
  } catch (error) {
    console.error("Error getting daily fortune cache:", error);
    return null;
  }
}

// ============================================
// 사용 통계 관련 함수
// ============================================

// 사용 통계 초기화/가져오기
export async function getOrCreateUsageStats(oderId: string): Promise<UsageStats | null> {
  try {
    const statsRef = doc(db, "usageStats", oderId);
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      return statsSnap.data() as UsageStats;
    }
    
    // 새로 생성
    const defaultStats: Omit<UsageStats, "lastActiveAt"> & { lastActiveAt: ReturnType<typeof serverTimestamp> } = {
      oderId,
      totalLogins: 0,
      totalMatchChecks: 0,
      totalDecisionMade: 0,
      totalArrowsUsed: 0,
      totalArrowsPurchased: 0,
      lastActiveAt: serverTimestamp(),
      featureUsage: {
        todayFortune: 0,
        mbtiMatch: 0,
        birthMatch: 0,
        decisionGuide: 0,
        shop: 0,
      },
    };
    
    await setDoc(statsRef, defaultStats);
    return await getDoc(statsRef).then(snap => snap.data() as UsageStats);
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return null;
  }
}

// 기능 사용 횟수 증가
export async function incrementFeatureUsage(
  oderId: string,
  feature: keyof UsageStats["featureUsage"]
): Promise<boolean> {
  try {
    const statsRef = doc(db, "usageStats", oderId);
    const statsSnap = await getDoc(statsRef);
    
    if (!statsSnap.exists()) {
      await getOrCreateUsageStats(oderId);
    }
    
    await updateDoc(statsRef, {
      [`featureUsage.${feature}`]: (statsSnap.data()?.featureUsage?.[feature] || 0) + 1,
      lastActiveAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Error incrementing feature usage:", error);
    return false;
  }
}

// 로그인 횟수 증가
export async function incrementLoginCount(oderId: string): Promise<boolean> {
  try {
    const statsRef = doc(db, "usageStats", oderId);
    const statsSnap = await getDoc(statsRef);
    
    if (!statsSnap.exists()) {
      await getOrCreateUsageStats(oderId);
    }
    
    const currentCount = statsSnap.data()?.totalLogins || 0;
    await updateDoc(statsRef, {
      totalLogins: currentCount + 1,
      lastActiveAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Error incrementing login count:", error);
    return false;
  }
}

// 화살 사용/구매 통계 업데이트
export async function updateArrowStats(
  oderId: string,
  type: "used" | "purchased",
  amount: number
): Promise<boolean> {
  try {
    const statsRef = doc(db, "usageStats", oderId);
    const statsSnap = await getDoc(statsRef);
    
    if (!statsSnap.exists()) {
      await getOrCreateUsageStats(oderId);
    }
    
    const field = type === "used" ? "totalArrowsUsed" : "totalArrowsPurchased";
    const currentAmount = statsSnap.data()?.[field] || 0;
    
    await updateDoc(statsRef, {
      [field]: currentAmount + amount,
      lastActiveAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Error updating arrow stats:", error);
    return false;
  }
}

// 결정 횟수 증가
export async function incrementDecisionCount(oderId: string): Promise<boolean> {
  try {
    const statsRef = doc(db, "usageStats", oderId);
    const statsSnap = await getDoc(statsRef);
    
    if (!statsSnap.exists()) {
      await getOrCreateUsageStats(oderId);
    }
    
    const currentCount = statsSnap.data()?.totalDecisionMade || 0;
    await updateDoc(statsRef, {
      totalDecisionMade: currentCount + 1,
      lastActiveAt: serverTimestamp(),
    });
    
    // 기능 사용 통계도 업데이트
    await incrementFeatureUsage(oderId, "decisionGuide");
    
    return true;
  } catch (error) {
    console.error("Error incrementing decision count:", error);
    return false;
  }
}
