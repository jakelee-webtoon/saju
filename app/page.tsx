"use client";

import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { calculateManseWithLibrary, type ManseResult, type BirthInput } from "./lib/saju";
import { generateCharacterType } from "./lib/saju/characterTypes";
import { computeTodayMode } from "./lib/todayMode/computeTodayMode";
import { BottomNav, type TabId } from "./components/common";
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
  hasSeenCharacterReveal,
  markCharacterRevealSeen,
} from "./lib/onboarding";
import { getKakaoUser, getNaverUser, isAnyLoggedIn, getCurrentUserId } from "./lib/auth";
import { getUserData, updateBirthInfo, type UserData } from "./lib/firebase";
// 즉시 필요한 컴포넌트만 정적 import
import HomePage from "./components/home/HomePage";
import type { FormData } from "./types";

// ========================
// 지연 로딩 (Code Splitting)
// 탭별/뷰별 컴포넌트는 필요할 때만 로드
// ========================
const TabLoadingFallback = () => (
  <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-3" />
      <p className="text-[#9ca3af] text-sm">로딩 중...</p>
    </div>
  </div>
);

const TodayLovePage = dynamic(() => import("./components/todayMode/TodayLovePage"), {
  loading: TabLoadingFallback,
});
const InterpretationPage = dynamic(() => import("./components/character/InterpretationPage"), {
  loading: TabLoadingFallback,
});
const ReplyGenerator = dynamic(
  () => import("./components/reply").then((mod) => ({ default: mod.ReplyGenerator })),
  { loading: TabLoadingFallback }
);
const ChatAnalysisPage = dynamic(() => import("./components/chat/ChatAnalysisPage"), {
  loading: TabLoadingFallback,
});
const MyPage = dynamic(() => import("./components/my/MyPage"), {
  loading: TabLoadingFallback,
});
const BirthInfoForm = dynamic(() => import("./components/birth/BirthInfoForm"), {
  loading: TabLoadingFallback,
});
const OnboardingFlow = dynamic(
  () => import("./components/onboarding").then((mod) => ({ default: mod.OnboardingFlow })),
  { loading: TabLoadingFallback }
);
const CharacterReveal = dynamic(
  () => import("./components/onboarding").then((mod) => ({ default: mod.CharacterReveal })),
  { loading: TabLoadingFallback }
);

// ========================
// 메인 컴포넌트
// ========================
const defaultFormData: FormData = {
  name: "",
  calendarType: "양력",
  year: "",
  month: "",
  day: "",
  hour: "",
  minute: "",
  hasTime: false,
};

function ManseryeokPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [view, setView] = useState<"home" | "edit" | "detail" | "love">("home");
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [manseResult, setManseResult] = useState<ManseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChatBadge] = useState(false);
  
  // 온보딩 상태
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCharacterReveal, setShowCharacterReveal] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  // Firebase 사용자 상태
  const [firebaseUser, setFirebaseUser] = useState<UserData | null>(null);

  // 비용이 큰 계산은 useMemo로 캐싱 (매 렌더마다 중복 호출 방지)
  const character = useMemo(
    () => manseResult ? generateCharacterType(manseResult.elements) : null,
    [manseResult]
  );
  
  // 한국 시간 기준 오늘 날짜 (매일 고정, 같은 날은 같은 결과)
  const todayKST = useMemo(() => {
    const now = new Date();
    // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
    const kstOffset = 9 * 60; // 한국은 UTC+9
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (kstOffset * 60000));
    // 시간을 제거하고 날짜만 반환 (00:00:00)
    return new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 계산 (같은 날은 같은 결과 보장)
  
  // 오늘 날짜 문자열 (의존성으로 사용)
  const todayDateString = useMemo(
    () => todayKST.toISOString().split('T')[0], // YYYY-MM-DD 형식
    [todayKST]
  );
  
  const todayMode = useMemo(
    () => character ? computeTodayMode(character.id, todayKST) : null,
    [character, todayDateString] // 날짜 문자열을 의존성으로 사용 (같은 날은 같은 결과)
  );

  // Firebase 사용자 데이터 로드 (카카오 + 네이버 모두 지원)
  const loadFirebaseUser = useCallback(async () => {
    console.log("🔍 loadFirebaseUser 시작");
    if (isAnyLoggedIn()) {
      console.log("✅ 로그인 상태 확인됨");
      
      const userId = getCurrentUserId();
      console.log("userId:", userId);
      
      if (userId) {
        console.log("🔄 Firestore에서 사용자 데이터 조회 중...");
        const userData = await getUserData(userId);
        console.log("userData:", userData);
        
        if (userData) {
          setFirebaseUser(userData);
          console.log("✅ firebaseUser 설정됨");
          
          // Firestore에 저장된 사주 정보가 있으면 불러오기
          if (userData.birthInfo) {
            console.log("🎂 birthInfo 발견:", userData.birthInfo);
            setFormData({
              name: userData.birthInfo.name,
              calendarType: userData.birthInfo.calendarType,
              year: String(userData.birthInfo.year),
              month: String(userData.birthInfo.month),
              day: String(userData.birthInfo.day),
              hour: userData.birthInfo.hour !== undefined ? String(userData.birthInfo.hour) : "",
              minute: userData.birthInfo.minute !== undefined ? String(userData.birthInfo.minute) : "",
              hasTime: userData.birthInfo.hasTime,
            });
            console.log("✅ formData 업데이트 완료");
          } else {
            console.log("⚠️ birthInfo가 null입니다");
          }
          
          if (userData.hasCompletedOnboarding) {
            markOnboardingComplete();
            console.log("✅ 온보딩 완료 마크");
          }
        } else {
          console.log("⚠️ Firestore에서 사용자 데이터를 찾을 수 없습니다");
        }
      } else {
        console.log("⚠️ userId가 없습니다");
      }
    } else {
      console.log("⚠️ 로그인 상태가 아닙니다");
    }
  }, []);

  // 앱 시작 시 Firebase 사용자 로드
  useEffect(() => {
    loadFirebaseUser();
  }, [loadFirebaseUser]);

  // 만세력 계산
  useEffect(() => {
    const birthInput: BirthInput = {
      year: parseInt(formData.year),
      month: parseInt(formData.month),
      day: parseInt(formData.day),
      hour: formData.hasTime && formData.hour ? parseInt(formData.hour) : undefined,
      minute: formData.hasTime && formData.minute ? parseInt(formData.minute) : undefined,
      isLunar: formData.calendarType === "음력",
    };
    const result = calculateManseWithLibrary(birthInput);
    setManseResult(result);
    setLoading(false);
  }, [formData]);

  // URL 쿼리 파라미터로 탭 복원 (샵/궁합 등에서 돌아올 때)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["home", "chat", "reply", "my"].includes(tabParam)) {
      setActiveTab(tabParam as TabId);
      setView("home");
      router.replace("/", { scroll: false });
    }
    
    // view 파라미터 처리
    const viewParam = searchParams.get("view");
    if (viewParam === "detail") {
      setView("detail");
    }
  }, [searchParams, router]);

  // 온보딩 체크 (첫 방문 시) + 리셋 파라미터 처리
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam === "onboarding") {
      localStorage.removeItem("hasCompletedOnboarding");
      localStorage.removeItem("hasSeenCharacterReveal");
      router.replace("/", { scroll: false });
      setShowOnboarding(true);
      setIsFirstVisit(true);
      return;
    }
    
    if (isLoggedIn() && firebaseUser?.birthInfo) {
      markOnboardingComplete();
      setShowOnboarding(false);
      setIsFirstVisit(false);
      return;
    }
    
    if (isLoggedIn() && firebaseUser && !firebaseUser.birthInfo) {
      markOnboardingComplete();
      setShowOnboarding(false);
      setIsFirstVisit(true);
      setView("edit");
      return;
    }
    
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
      setIsFirstVisit(true);
    }
  }, [searchParams, router, firebaseUser]);

  // 온보딩 완료 핸들러
  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    setShowOnboarding(false);
    setView("edit");
  };

  // 캐릭터 리빌 완료 핸들러
  const handleCharacterRevealComplete = () => {
    markCharacterRevealSeen();
    setShowCharacterReveal(false);
    setIsFirstVisit(false);
    setView("home");
    setActiveTab("home");
  };

  // 폼 제출 핸들러 (캐릭터 리빌 포함 + Firebase 저장)
  const handleFormSubmitWithReveal = async (data: FormData) => {
    console.log("🔥 handleFormSubmitWithReveal 시작");
    console.log("입력된 데이터:", data);
    
    setFormData(data);
    
    if (isAnyLoggedIn()) {
      console.log("✅ 로그인 상태 확인");
      
      const userId = getCurrentUserId();
      console.log("userId:", userId);
      
      if (userId) {
        const birthInfoForDB = {
          name: data.name,
          year: parseInt(data.year),
          month: parseInt(data.month),
          day: parseInt(data.day),
          hour: data.hasTime && data.hour ? parseInt(data.hour) : undefined,
          minute: data.hasTime && data.minute ? parseInt(data.minute) : undefined,
          calendarType: data.calendarType,
          hasTime: data.hasTime,
        };
        
        console.log("💾 Firestore에 저장할 데이터:", birthInfoForDB);
        
        try {
          const result = await updateBirthInfo(userId, birthInfoForDB);
          console.log("✅ updateBirthInfo 결과:", result);
          
          if (result) {
            console.log("✅ birthInfo saved to Firestore");
            
            setFirebaseUser(prev => prev ? { 
              ...prev, 
              birthInfo: birthInfoForDB,
              hasCompletedOnboarding: true 
            } : null);
            console.log("✅ firebaseUser 상태 업데이트 완료");
            
            // 저장 성공 알림
            alert("사주 정보가 저장되었습니다! ✅");
          } else {
            console.error("❌ updateBirthInfo가 false를 반환했습니다");
            alert("저장에 실패했습니다. 다시 시도해주세요.");
          }
        } catch (error) {
          console.error("❌ updateBirthInfo 중 오류 발생:", error);
          alert("저장 중 오류가 발생했습니다: " + (error as Error).message);
        }
      } else {
        console.error("❌ userId가 없습니다");
        alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      }
    } else {
      console.log("⚠️ 로그인 상태가 아닙니다");
      alert("로그인이 필요합니다.");
    }
    
    if (isFirstVisit && !hasSeenCharacterReveal()) {
      setShowCharacterReveal(true);
    } else {
      setView("home");
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "home") {
      setView("home");
    } else {
      setView("home");
    }
  };

  // ========================
  // 렌더링
  // ========================

  // 온보딩 화면
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // 캐릭터 리빌 화면
  if (showCharacterReveal && manseResult && character) {
    return (
      <CharacterReveal
        character={character}
        userName={formData.name || undefined}
        onComplete={handleCharacterRevealComplete}
      />
    );
  }

  // 로딩
  if (loading || !manseResult) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">💫</div>
          <div className="animate-spin inline-block w-8 h-8 border-2 border-[#3b5998] border-t-transparent rounded-full mb-4"></div>
          <p className="text-[#6b7280] font-medium">사주 분석 중...</p>
          <p className="text-[#9ca3af] text-sm mt-1">캐릭터를 불러오고 있어요</p>
        </div>
      </div>
    );
  }

  // 편집 모드 (BottomNav 없이)
  if (view === "edit") {
    return (
      <BirthInfoForm
        initialData={isFirstVisit ? null : formData}
        isFirstVisit={isFirstVisit}
        onSubmit={async (data) => {
          await handleFormSubmitWithReveal(data);
          if (!isFirstVisit) {
            setActiveTab("home");
          }
        }}
        onBack={isFirstVisit ? undefined : () => {
          setView("home");
          setActiveTab("home");
        }}
      />
    );
  }

  // 캐릭터 상세
  if (view === "detail") {
    return (
      <>
        <div className="pb-bottom-nav">
          <InterpretationPage
            manseResult={manseResult}
            character={character!}
            todayMode={todayMode!}
            formData={formData}
            onBack={() => {
              setView("home");
              setActiveTab("home");
            }}
          />
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
      </>
    );
  }

  // 연애 운세 상세 페이지 (홈에서 메인 카드 클릭 시)
  if (view === "love" && character && todayMode) {
    return (
      <>
        <TodayLovePage
          todayMode={todayMode}
          characterName={character.name}
          onBack={() => {
            setView("home");
            setActiveTab("home");
          }}
        />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
      </>
    );
  }

  // 대화 분석 탭
  if (activeTab === "chat") {
    return (
      <>
        <ChatAnalysisPage 
          onBack={() => handleTabChange("home")} 
          character={character}
          onViewDetail={() => {
            console.log("onViewDetail 호출됨 - view를 detail로 변경");
            setView("detail");
            // activeTab도 home으로 변경하여 InterpretationPage가 제대로 보이도록
            setActiveTab("home");
          }}
        />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
      </>
    );
  }

  // 답장 생성기 탭
  if (activeTab === "reply" && character) {
    return (
      <>
        <ReplyGenerator
          characterName={character.name}
          characterId={character.id}
          onBack={() => handleTabChange("home")}
        />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
      </>
    );
  }

  // MY 탭
  if (activeTab === "my" && character && manseResult) {
    return (
      <>
        <MyPage
          manseResult={manseResult}
          character={character}
          formData={formData}
          onEdit={() => setView("edit")}
          onBack={() => handleTabChange("home")}
          onViewDetail={() => {
            console.log("MyPage onViewDetail 호출됨 - view를 detail로 변경");
            setView("detail");
            setActiveTab("home");
          }}
        />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
      </>
    );
  }

  // 기본: 홈 화면
  return (
    <>
      <HomePage
        manseResult={manseResult}
        character={character!}
        todayMode={todayMode!}
        formData={formData}
        onEdit={() => setView("edit")}
        onViewDetail={() => setView("detail")}
        onViewLove={() => {
          setView("love");
          setActiveTab("home");
        }}
        onTabChange={handleTabChange}
      />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
    </>
  );
}

// 로딩 컴포넌트
function PageLoading() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">💘</div>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
        <p className="text-purple-700 font-medium">사주큐피드 준비 중...</p>
      </div>
    </div>
  );
}

// Suspense로 감싸기 (useSearchParams 사용)
export default function ManseryeokPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ManseryeokPageContent />
    </Suspense>
  );
}
