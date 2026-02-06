// Firebase Firestore 사용자 서비스
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
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
    const userRef = doc(db, "users", oderId);
    await updateDoc(userRef, {
      birthInfo,
      hasCompletedOnboarding: true,
    });
    return true;
  } catch (error) {
    console.error("Error updating birth info:", error);
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
