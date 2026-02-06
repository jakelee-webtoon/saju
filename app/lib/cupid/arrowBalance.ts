/**
 * 큐피드 화살 잔액 관리 모듈
 * localStorage + Firebase Firestore 하이브리드 방식
 */

import { getKakaoUser, isLoggedIn } from "../kakao";
import { addArrowsToDB, useArrowsFromDB, getArrowBalanceFromDB } from "../firebase/userService";

const STORAGE_KEY = "cupidArrowBalance";

// ========================
// localStorage 기반 함수들 (비로그인 호환)
// ========================

/**
 * 현재 화살 잔액 조회 (localStorage)
 * @returns 현재 잔액 (없으면 0)
 */
export function getArrowBalance(): number {
  if (typeof window === "undefined") return 0;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return 0;
    
    const balance = parseInt(stored, 10);
    return isNaN(balance) ? 0 : Math.max(0, balance);
  } catch {
    return 0;
  }
}

/**
 * 화살 잔액 설정 (내부용 - localStorage)
 */
function setArrowBalance(amount: number): void {
  if (typeof window === "undefined") return;
  
  const safeAmount = Math.max(0, Math.floor(amount));
  localStorage.setItem(STORAGE_KEY, safeAmount.toString());
}

/**
 * 화살 추가 (충전) - localStorage
 * @param amount 추가할 화살 개수
 * @returns 업데이트된 잔액
 */
export function addArrow(amount: number): number {
  if (amount <= 0) return getArrowBalance();
  
  const currentBalance = getArrowBalance();
  const newBalance = currentBalance + Math.floor(amount);
  setArrowBalance(newBalance);
  
  return newBalance;
}

/**
 * 화살 사용 (차감) - localStorage
 * @param amount 사용할 화살 개수
 * @returns 업데이트된 잔액 (잔액 부족 시 -1 반환)
 */
export function useArrow(amount: number): number {
  if (amount <= 0) return getArrowBalance();
  
  const currentBalance = getArrowBalance();
  
  // 잔액 부족
  if (currentBalance < amount) {
    return -1;
  }
  
  const newBalance = currentBalance - Math.floor(amount);
  setArrowBalance(newBalance);
  
  return newBalance;
}

/**
 * 화살 잔액 초기화 (테스트/디버그용)
 */
export function resetArrowBalance(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 화살 사용 가능 여부 확인
 * @param amount 필요한 화살 개수
 * @returns 사용 가능 여부
 */
export function canUseArrow(amount: number): boolean {
  return getArrowBalance() >= amount;
}

// ========================
// Firebase + localStorage 통합 함수들
// ========================

/**
 * 화살 잔액 조회 (Firebase 우선, localStorage 폴백)
 */
export async function getArrowBalanceSync(): Promise<number> {
  if (isLoggedIn()) {
    const kakaoUser = getKakaoUser();
    if (kakaoUser) {
      const balance = await getArrowBalanceFromDB(kakaoUser.id);
      // localStorage도 동기화
      setArrowBalance(balance);
      return balance;
    }
  }
  return getArrowBalance();
}

/**
 * 화살 충전 (Firebase + localStorage 동시 업데이트)
 */
export async function addArrowSync(amount: number): Promise<number> {
  if (amount <= 0) return getArrowBalance();
  
  // localStorage 먼저 업데이트 (즉시 반영)
  const localBalance = addArrow(amount);
  
  // Firebase 업데이트 (로그인된 경우)
  if (isLoggedIn()) {
    const kakaoUser = getKakaoUser();
    if (kakaoUser) {
      const firebaseBalance = await addArrowsToDB(kakaoUser.id, amount);
      // Firebase 잔액으로 localStorage 동기화
      setArrowBalance(firebaseBalance);
      return firebaseBalance;
    }
  }
  
  return localBalance;
}

/**
 * 화살 사용 (Firebase + localStorage 동시 업데이트)
 */
export async function useArrowSync(amount: number): Promise<{ success: boolean; newBalance: number }> {
  if (amount <= 0) return { success: true, newBalance: getArrowBalance() };
  
  // 로그인된 경우 Firebase 사용
  if (isLoggedIn()) {
    const kakaoUser = getKakaoUser();
    if (kakaoUser) {
      const result = await useArrowsFromDB(kakaoUser.id, amount);
      if (result.success) {
        // localStorage도 동기화
        setArrowBalance(result.newBalance);
      }
      return result;
    }
  }
  
  // 비로그인: localStorage만 사용
  const newBalance = useArrow(amount);
  if (newBalance === -1) {
    return { success: false, newBalance: getArrowBalance() };
  }
  return { success: true, newBalance };
}

/**
 * 화살 사용 가능 여부 확인 (동기)
 */
export function canUseArrowSync(amount: number): boolean {
  return getArrowBalance() >= amount;
}

// ========================
// 패키지 데이터
// ========================

export interface CupidPackage {
  id: string;
  name: string;
  arrows: number;
  bonusArrows?: number;
  price: number;
  description: string;
  isRecommended?: boolean;
  isLimited?: boolean;
}

export const CUPID_PACKAGES: CupidPackage[] = [
  {
    id: "starter",
    name: "Starter",
    arrows: 5,
    price: 1000,
    description: "오늘 고민 몇 개 해결하기 딱 좋아요",
  },
  {
    id: "best",
    name: "Best",
    arrows: 15,
    price: 2500,
    description: "이번 주 연애 고민은 충분해요",
    isRecommended: true,
  },
  {
    id: "heavy",
    name: "Heavy",
    arrows: 40,
    price: 5900,
    description: "마음 가는 대로 써도 부족하지 않아요",
  },
  {
    id: "limited",
    name: "Limited",
    arrows: 20,
    bonusArrows: 5,
    price: 2900,
    description: "오늘만 추가 지급!",
    isLimited: true,
  },
];

/**
 * 가격 포맷팅
 */
export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}
