"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getUserData, 
  handleUserLogin,
  updateBirthInfo,
  addArrowsToDB,
  useArrowsFromDB,
  recordContentUnlock,
  type UserData 
} from "./userService";
import { getKakaoUser, logout as logoutKakao } from "../kakao";
import { getNaverUser, logoutNaver } from "../naver";

interface UseUserReturn {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  provider: "kakao" | "naver" | null;
  
  // 액션
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateBirth: (birthInfo: UserData["birthInfo"]) => Promise<boolean>;
  addArrows: (amount: number) => Promise<number>;
  useArrows: (amount: number) => Promise<{ success: boolean; newBalance: number }>;
  unlockContent: (type: "loveTendency" | "matchDetails" | "decisionGuide", contentId?: string) => Promise<boolean>;
}

// 소셜 로그인 사용자 정보 가져오기 (카카오 또는 네이버)
function getSocialUser(): { id: string; nickname: string; profileImage?: string; provider: "kakao" | "naver" } | null {
  // 네이버 먼저 확인 (최근 로그인 우선)
  const naverUser = getNaverUser();
  if (naverUser) {
    return { ...naverUser, provider: "naver" };
  }
  
  // 카카오 확인
  const kakaoUser = getKakaoUser();
  if (kakaoUser) {
    return { ...kakaoUser, provider: "kakao" };
  }
  
  return null;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<"kakao" | "naver" | null>(null);

  // 사용자 데이터 로드
  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // localStorage에서 소셜 사용자 확인 (카카오 or 네이버)
      const socialUser = getSocialUser();
      
      if (!socialUser) {
        setUser(null);
        setProvider(null);
        return;
      }
      
      setProvider(socialUser.provider);
      
      // Firebase에서 사용자 데이터 가져오기
      const userData = await getUserData(socialUser.id);
      
      if (userData) {
        setUser(userData);
      } else {
        // 새 사용자라면 생성
        const newUser = await handleUserLogin(
          socialUser.id,
          socialUser.provider,
          socialUser.nickname,
          socialUser.profileImage
        );
        setUser(newUser);
      }
    } catch (err) {
      console.error("Error loading user:", err);
      setError("사용자 정보를 불러오는데 실패했어요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // 로그인 (리다이렉트 방식이므로 여기선 로드만)
  const login = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  // 로그아웃 (두 플랫폼 모두 로그아웃)
  const logout = useCallback(() => {
    logoutKakao();
    logoutNaver();
    setUser(null);
    setProvider(null);
  }, []);

  // 사용자 새로고침
  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  // 생년월일 정보 업데이트
  const updateBirth = useCallback(async (birthInfo: UserData["birthInfo"]): Promise<boolean> => {
    if (!user) return false;
    
    const success = await updateBirthInfo(user.oderId, birthInfo);
    if (success) {
      setUser(prev => prev ? { ...prev, birthInfo, hasCompletedOnboarding: true } : null);
    }
    return success;
  }, [user]);

  // 화살 충전
  const addArrows = useCallback(async (amount: number): Promise<number> => {
    if (!user) return 0;
    
    const newBalance = await addArrowsToDB(user.oderId, amount);
    setUser(prev => prev ? { ...prev, arrowBalance: newBalance } : null);
    return newBalance;
  }, [user]);

  // 화살 사용
  const useArrows = useCallback(async (amount: number): Promise<{ success: boolean; newBalance: number }> => {
    if (!user) return { success: false, newBalance: 0 };
    
    const result = await useArrowsFromDB(user.oderId, amount);
    if (result.success) {
      setUser(prev => prev ? { ...prev, arrowBalance: result.newBalance } : null);
    }
    return result;
  }, [user]);

  // 콘텐츠 언락
  const unlockContent = useCallback(async (
    type: "loveTendency" | "matchDetails" | "decisionGuide",
    contentId?: string
  ): Promise<boolean> => {
    if (!user) return false;
    
    const success = await recordContentUnlock(user.oderId, type, contentId);
    if (success) {
      setUser(prev => {
        if (!prev) return null;
        
        const newUnlockedContent = { ...prev.unlockedContent };
        if (type === "loveTendency") {
          newUnlockedContent.loveTendency = true;
        } else if (type === "matchDetails" && contentId) {
          newUnlockedContent.matchDetails = [...newUnlockedContent.matchDetails, contentId];
        } else if (type === "decisionGuide") {
          // 오늘 날짜 저장
          const today = new Date();
          newUnlockedContent.decisionGuideDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        
        return { ...prev, unlockedContent: newUnlockedContent };
      });
    }
    return success;
  }, [user]);

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    error,
    provider,
    login,
    logout,
    refreshUser,
    updateBirth,
    addArrows,
    useArrows,
    unlockContent,
  };
}
