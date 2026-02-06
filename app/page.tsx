"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateManseWithLibrary, type ManseResult, type BirthInput, type Element } from "./lib/saju";
import { generateCharacterType, CHARACTER_DB } from "./lib/saju/characterTypes";
import { computeTodayMode, type TodayModeResult } from "./lib/todayMode/computeTodayMode";
import TodayModeSnippet from "./components/todayMode/TodayModeSnippet";
import TodayModeBottomSheet from "./components/todayMode/TodayModeBottomSheet";
import TodayLovePage from "./components/todayMode/TodayLovePage";
import BottomNav, { type TabId } from "./components/BottomNav";
// 홈 화면 컴포넌트
import TodayStatusLine from "./components/home/TodayStatusLine";
import CharacterSummaryCard from "./components/home/CharacterSummaryCard";
import LoveTendencyCard from "./components/home/LoveTendencyCard";
import TodayLoveModeCard from "./components/home/TodayLoveModeCard";
import ManseryeokAccordion from "./components/home/ManseryeokAccordion";
import CompatibilityMiniCard from "./components/home/CompatibilityMiniCard";
// 온보딩 컴포넌트
import { OnboardingFlow, CharacterReveal } from "./components/onboarding";
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
  hasSeenCharacterReveal,
  markCharacterRevealSeen,
} from "./lib/onboarding";
// Firebase
import { getKakaoUser, isLoggedIn } from "./lib/kakao";
import { getUserData, updateBirthInfo, type UserData } from "./lib/firebase";

// ========================
// 입력 폼 컴포넌트
// ========================
interface FormData {
  name: string;
  calendarType: "양력" | "음력";
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  hasTime: boolean;
}

// Static arrays - 컴포넌트 외부에 선언하여 매 렌더링마다 재생성 방지
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function BirthInfoForm({ 
  onSubmit, 
  initialData,
  onBack 
}: { 
  onSubmit: (data: FormData) => void;
  initialData?: FormData | null;
  onBack?: () => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [calendarType, setCalendarType] = useState<"양력" | "음력">(initialData?.calendarType || "양력");
  const [year, setYear] = useState(initialData?.year || "");
  const [month, setMonth] = useState(initialData?.month || "");
  const [day, setDay] = useState(initialData?.day || "");
  const [hour, setHour] = useState(initialData?.hour || "");
  const [minute, setMinute] = useState(initialData?.minute || "");
  const [hasTime, setHasTime] = useState(initialData?.hasTime ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !month || !day) return;
    
    onSubmit({ name, calendarType, year, month, day, hour, minute, hasTime });
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        {/* 뒤로가기 버튼 */}
        {onBack && (
          <button 
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
        )}
        
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">만세력 계산기</h1>
          <p className="mt-2 text-sm text-[#6b7280]">생년월일시를 입력하여 사주를 확인하세요</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 입력 */}
          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-3">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요 (선택)"
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b5998] focus:border-transparent"
            />
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-3">달력 종류</label>
            <div className="flex gap-3">
              {(["양력", "음력"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCalendarType(type)}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                    calendarType === type ? "bg-[#3b5998] text-white" : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-3">
              생년월일 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">년도</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">월</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">일</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}일</option>)}
              </select>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[#1a1a2e]">태어난 시간</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-xs text-[#6b7280]">시간을 알고 있어요</span>
              </label>
            </div>
            {hasTime ? (
              <div className="grid grid-cols-2 gap-3">
                <select value={hour} onChange={(e) => setHour(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm">
                  <option value="">시</option>
                  {HOURS.map((h) => <option key={h} value={h}>{h}시</option>)}
                </select>
                <select value={minute} onChange={(e) => setMinute(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm">
                  <option value="">분</option>
                  {MINUTES.map((m) => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}분</option>)}
                </select>
              </div>
            ) : (
              <div className="rounded-lg bg-[#f9fafb] p-3 border border-[#f3f4f6]">
                <p className="text-xs text-[#9ca3af] text-center">시간을 모르면 시주는 계산되지 않습니다</p>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={!year || !month || !day}
            className="w-full rounded-xl bg-[#1a1a2e] py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#2d2d44] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
          >
            만세력 계산하기
          </button>
        </form>
      </div>
    </div>
  );
}

// ========================
// 일간 중심 해석 페이지 컴포넌트
// ========================

/** 오행 바 퍼센트 계산 (극적으로 스케일링) */
function getElementPercent(count: number, total: number): number {
  if (total === 0 || count === 0) return 0;
  // 극적인 스케일링: 1개=25%, 2개=50%, 3개=75%, 4개+=95%
  const scaleMap: Record<number, number> = { 1: 25, 2: 50, 3: 75, 4: 90, 5: 95, 6: 100, 7: 100, 8: 100 };
  return scaleMap[count] ?? Math.min(100, count * 15);
}

/** 2D 플랫 스타일 프로그레스 바 컴포넌트 */
function EnergyBar({ element, count, total }: { element: Element; count: number; total: number }) {
  const percent = count > 0 ? getElementPercent(count, total) : 0;
  
  const barColors: Record<Element, string> = {
    화: "bg-red-500",
    수: "bg-blue-500",
    목: "bg-emerald-500",
    토: "bg-amber-500",
    금: "bg-slate-400",
  };
  
  return (
    <div className="flex items-center gap-3">
      {/* 프로그레스 바 */}
      <div className="relative flex-1 h-6 rounded-full bg-white/20 overflow-hidden">
        {count > 0 && (
          <div 
            className={`absolute left-0 top-0 h-full ${barColors[element]} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      
      {/* 수치 표시 (바 오른쪽) */}
      <div className={`min-w-[40px] text-right font-black text-lg ${count === 0 ? 'text-white/30' : count >= 3 ? 'text-yellow-300' : 'text-white'}`}>
        {count === 0 ? '-' : `×${count}`}
      </div>
    </div>
  );
}

/** 오행 이모지 */
const elementEmoji: Record<Element, string> = {
  화: "🔥",
  수: "🌊",
  목: "🪾",
  토: "🧱",
  금: "🧈",
};

/** 오행 설명 (툴팁용) */
const elementTooltip: Record<Element, string> = {
  화: "열정, 추진력, 표현력",
  수: "지혜, 유연함, 깊은 생각",
  목: "성장, 시작, 확장",
  토: "안정, 중심, 신뢰",
  금: "결단력, 정리, 기준",
};

import Image from "next/image";
import { getCharacterImage } from "./lib/saju/character-images";

/** 캐릭터 그래픽 컴포넌트 */
function CharacterGraphic({ id, color }: { id: string; color: string }) {
  // AI 생성 이미지가 있는 경우 이미지를 사용하고, 없으면 SVG를 사용합니다.
  const imageUrl = getCharacterImage(id);

  if (imageUrl) {
    return (
      <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full ${color} opacity-10 blur-2xl`}></div>
        <Image 
          src={imageUrl} 
          alt={id} 
          width={192}
          height={192}
          priority
          className="relative w-full h-full object-contain drop-shadow-2xl animate-float"
          unoptimized // 로컬 파일 로드 문제 해결을 위해 최적화 일시 해제
        />
      </div>
    );
  }

  // 인사이드 아웃 스타일의 단순화된 캐릭터 그래픽 (SVG)
  return (
    <div className={`relative w-40 h-40 mx-auto mb-6 flex items-center justify-center rounded-full ${color} bg-opacity-20`}>
      <svg viewBox="0 0 100 100" className="w-32 h-32 drop-shadow-lg">
        {/* ... 기존 SVG 코드 ... */}
        <path 
          d={id === 'fire' ? "M30,80 Q50,20 70,80 Z" : 
             id === 'water' ? "M20,80 Q50,40 80,80 Q50,90 20,80" :
             id === 'wood' ? "M40,90 L60,90 L60,40 L40,40 Z" :
             id === 'earth' ? "M20,80 L80,80 L70,40 L30,40 Z" :
             id === 'metal' ? "M50,20 L80,50 L50,80 L20,50 Z" :
             "M30,80 A20,20 0 1,1 70,80 Z"} 
          fill="currentColor" 
          className={color.replace('bg-', 'text-')}
        />
        <circle cx="40" cy="55" r="4" fill="white" />
        <circle cx="60" cy="55" r="4" fill="white" />
        <circle cx="40" cy="55" r="1.5" fill="#1a1a2e" />
        <circle cx="60" cy="55" r="1.5" fill="#1a1a2e" />
        <path d="M45,65 Q50,70 55,65" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        {id === 'fire' && (
          <path d="M45,20 Q50,5 55,20" fill="#ef4444" />
        )}
        {id === 'wood' && (
          <path d="M50,40 L50,25 M45,30 L50,25 L55,30" stroke="#10b981" strokeWidth="3" fill="none" />
        )}
      </svg>
    </div>
  );
}

// ========================
// 계정 섹션 컴포넌트 (나 탭 내부용)
// ========================
function AccountSection() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; nickname: string; profileImage?: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("kakaoUser");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kakaoUser");
    localStorage.removeItem("kakaoAccessToken");
    setUser(null);
    setShowLogoutConfirm(false);
    router.refresh();
  };

  return (
    <>
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span>👤</span> 계정
          </h2>

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.nickname}
                    className="w-12 h-12 rounded-full border-2 border-purple-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                    {user.nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user.nickname}</p>
                  <p className="text-xs text-gray-500">카카오 로그인</p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 mb-4">
                로그인하면 데이터가 안전하게 저장돼요
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-[#191919] transition-all hover:brightness-95"
                style={{ backgroundColor: "#FEE500" }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 2C5.02944 2 1 5.36816 1 9.5C1 12.0703 2.61906 14.3203 5.07031 15.6328L4.21875 18.8516C4.14062 19.1328 4.46094 19.3594 4.70312 19.2031L8.45312 16.8281C8.95312 16.9062 9.46875 16.9531 10 16.9531C14.9706 16.9531 19 13.5859 19 9.45312C19 5.32031 14.9706 2 10 2Z"
                    fill="#191919"
                  />
                </svg>
                카카오 로그인
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">로그아웃</h3>
            <p className="text-sm text-gray-600 mb-6">
              정말 로그아웃 하시겠어요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InterpretationPage({
  manseResult,
  formData,
  onBack,
}: {
  manseResult: ManseResult;
  formData: FormData;
  onBack: () => void;
}) {
  const { pillars, ilgan, elements } = manseResult;
  
  // 캐릭터 타입 생성
  const character = generateCharacterType(elements);
  
  // 오늘 모드 계산
  const todayMode: TodayModeResult = computeTodayMode(character.id);
  
  // 바텀시트 상태
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
  // 에너지 게이지 아코디언 상태
  const [isEnergyOpen, setIsEnergyOpen] = useState(false);

  // 공유 모달 상태
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 공유 텍스트 생성
  const shareText = `[${character.name}]
${character.declaration}

✨ 강점
${character.strengths.map((s: string) => `• ${s}`).join('\n')}

💭 약점
${character.weaknesses.map((w: string) => `• ${w}`).join('\n')}`;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // 클립보드 복사
  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareModal(false);
      }, 1500);
    } catch {
      alert("복사에 실패했어요. 다시 시도해주세요.");
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    navigator.clipboard.writeText(shareText);
    alert("텍스트가 복사되었어요!\n카카오톡에서 붙여넣기 해주세요 💬");
    setShowShareModal(false);
  };

  // 트위터 공유
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  // 네이티브 공유 (모바일)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `나의 사주 캐릭터: ${character.name}`,
          text: shareText,
          url: shareUrl,
        });
        setShowShareModal(false);
      } catch {
        // 사용자가 취소한 경우
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        
        {/* 헤더 */}
        <header className="mb-6">
          <button 
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
        </header>

        {/* [1] 캐릭터 이름 + 선언문 */}
        <section className="mb-6 rounded-3xl bg-[#1A2246] p-8 text-center relative overflow-hidden">
          {/* 배경 이펙트 */}
          <div className="absolute inset-0 opacity-10">
            <div className={`absolute top-4 right-4 w-32 h-32 rounded-full ${character.color} blur-3xl`}></div>
            <div className={`absolute bottom-4 left-4 w-24 h-24 rounded-full ${character.color} blur-2xl`}></div>
          </div>
          
          <div className="relative z-10">
            {/* 캐릭터 이미지 */}
            <CharacterGraphic id={character.id} color={character.color} />
            
            <h1 className="text-2xl font-black text-white mb-4">{character.name}</h1>
            <p className="text-lg text-white/90 font-medium leading-relaxed">
              "{character.declaration}"
            </p>
          </div>
        </section>

        {/* [2] 강점과 약점 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 강점 */}
          <section className="rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-1">
              <span>⚔️</span> 무기
            </h2>
            <ul className="space-y-2">
              {character.strengths.map((text, i) => (
                <li key={i} className="text-xs text-emerald-800 leading-relaxed">
                  {text}
                </li>
              ))}
            </ul>
          </section>

          {/* 약점 */}
          <section className="rounded-2xl bg-rose-50 p-5 border border-rose-100">
            <h2 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-1">
              <span>💔</span> 약점
            </h2>
            <ul className="space-y-2">
              {character.weaknesses.map((text, i) => (
                <li key={i} className="text-xs text-rose-800 leading-relaxed">
                  {text}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* [3] 공감 문장 - "이거 나야" */}
        <section className="mb-6 rounded-2xl bg-[#f9fafb] p-6 border border-[#e5e7eb]">
          <h2 className="text-sm font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
            <span>👀</span> 이거 나야...
          </h2>
          <ul className="space-y-3">
            {character.empathy.map((text, i) => (
              <li key={i} className="text-sm text-[#374151] flex items-start gap-3 leading-relaxed">
                <span className="shrink-0 text-[#9ca3af]">•</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* [3] 에너지 분포 (능력치 바) - 아코디언 */}
        <section className="mb-6 rounded-2xl bg-[#1A2246] shadow-xl overflow-hidden">
          {/* 헤더 - 클릭하면 펼치기/접기 */}
          <button
            onClick={() => setIsEnergyOpen(!isEnergyOpen)}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <h2 className="text-sm font-bold text-white/80 tracking-wide flex items-center gap-2">
              <span>⚡</span> 에너지 게이지
            </h2>
            <span className={`text-white/60 transition-transform duration-300 ${isEnergyOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {/* 콘텐츠 - 조건부 렌더링 */}
          <div className={`transition-all duration-300 ease-in-out ${isEnergyOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
            <div className="px-5 pb-5 space-y-3">
              {(["목", "화", "토", "금", "수"] as Element[]).map((el) => (
                <div key={el} className="flex items-center gap-2">
                  <span className="w-7 text-lg text-center">{elementEmoji[el]}</span>
                  <span 
                    className="w-5 text-xs font-bold text-white/60 cursor-help relative group"
                    title={elementTooltip[el]}
                  >
                    {el}
                    {/* 툴팁 */}
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-white text-[#1a1a2e] text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {elementTooltip[el]}
                      <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-white"></span>
                    </span>
                  </span>
                  <div className="flex-1">
                    <EnergyBar element={el} count={elements[el]} total={elements.total} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* [4] 오늘 모드 - 캐릭터 성향 기반 오늘의 상태 */}
        <div className="mb-6">
          <TodayModeSnippet
            todayMode={todayMode}
            characterName={character.name}
            onShowMore={() => setIsBottomSheetOpen(true)}
          />
        </div>

        {/* 공유 버튼 */}
        <button 
          className="w-full mb-6 rounded-xl bg-white py-4 text-[15px] font-bold text-[#1a1a2e] border-2 border-[#1a1a2e] transition-colors hover:bg-[#f9fafb] flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          onClick={() => setShowShareModal(true)}
        >
          <span>📤</span>
          <span>이 캐릭터 공유하기</span>
        </button>

        {/* 계정 섹션 */}
        <AccountSection />
      </div>

      {/* 오늘 모드 바텀시트 */}
      <TodayModeBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        todayMode={todayMode}
        characterName={character.name}
      />

      {/* 공유 모달 */}
      {showShareModal && (
        <>
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={() => setShowShareModal(false)}
          />
          
          {/* 모달 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
            <div className="mx-auto max-w-md bg-white rounded-t-3xl">
              {/* 핸들 */}
              <div className="pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
              </div>

              <div className="px-6 pb-8">
                <h3 className="text-lg font-bold text-gray-900 text-center mb-6">
                  공유하기
                </h3>

                {/* 공유 옵션들 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {/* 카카오톡 */}
                  <button 
                    onClick={handleKakaoShare}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-md">
                      <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                        <path d="M24 7C13.5 7 5 13.94 5 22.5C5 28.08 8.56 32.92 14 35.75L12.15 43.28C12 43.87 12.67 44.33 13.19 44L22.15 38.22C22.75 38.31 23.37 38.36 24 38.36C34.5 38.36 43 31.42 43 22.86C43 14.3 34.5 7 24 7Z" fill="#3C1E1E"/>
                        <text x="24" y="27" textAnchor="middle" fill="#FEE500" fontSize="11" fontWeight="bold" fontFamily="Arial">TALK</text>
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600">카카오톡</span>
                  </button>

                  {/* 트위터/X */}
                  <button 
                    onClick={handleTwitterShare}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-md">
                      <span className="text-2xl text-white">𝕏</span>
                    </div>
                    <span className="text-xs text-gray-600">X (트위터)</span>
                  </button>

                  {/* 더보기 (네이티브 공유) */}
                  {'share' in navigator && (
                    <button 
                      onClick={handleNativeShare}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shadow-md">
                        <span className="text-2xl">📱</span>
                      </div>
                      <span className="text-xs text-gray-600">더보기</span>
                    </button>
                  )}

                  {/* 클립보드 복사 */}
                  <button 
                    onClick={handleCopyClipboard}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-colors ${
                      copySuccess ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <span className="text-2xl">{copySuccess ? '✅' : '📋'}</span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {copySuccess ? '복사됨!' : '링크 복사'}
                    </span>
                  </button>
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// ========================
// 새로운 홈 화면 컴포넌트
// ========================
function NewHomePage({
  manseResult,
  formData,
  onEdit,
  onViewDetail,
  onViewLove,
}: {
  manseResult: ManseResult;
  formData: FormData;
  onEdit: () => void;
  onViewDetail: () => void;
  onViewLove: () => void;
}) {
  const router = useRouter();
  const character = generateCharacterType(manseResult.elements);
  const todayMode = computeTodayMode(character.id);

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-bottom-nav">
      <div className="mx-auto max-w-md px-5 py-6">
        {/* 헤더 */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#1a1a2e]">
              {formData.name ? `${formData.name}님` : "오늘의 나"} {todayMode.modeEmoji}
            </h1>
            <p className="text-xs text-[#9ca3af]">
              {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </p>
          </div>
          <button
            onClick={onEdit}
            className="text-xs text-[#6b7280] hover:text-[#1a1a2e] px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb]"
          >
            정보 수정
          </button>
        </header>

        {/* [1] 오늘의 한 줄 상태 */}
        <div className="mb-4">
          <TodayStatusLine statusOneLiner={todayMode.statusOneLiner} />
        </div>

        {/* [2] 나의 캐릭터 요약 카드 */}
        <div className="mb-4">
          <CharacterSummaryCard
            characterId={character.id}
            characterName={character.name}
            declaration={character.declaration}
            color={character.color}
            onClick={onViewDetail}
          />
        </div>

        {/* [3] 나의 기본 연애 성향 */}
        <div className="mb-4">
          <LoveTendencyCard characterId={character.id} />
        </div>

        {/* [4] 오늘의 연애 모드 카드 */}
        <div className="mb-4">
          <TodayLoveModeCard todayMode={todayMode} onClick={onViewLove} />
        </div>

        {/* [5] 궁합 미니 카드 */}
        <div className="mb-4">
          <CompatibilityMiniCard onClick={() => router.push("/match")} />
        </div>

        {/* [6] 나의 만세력 보기 */}
        <div className="mb-8">
          <ManseryeokAccordion manseResult={manseResult} />
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-[10px] text-[#9ca3af]">
          매일 바뀌는 오늘의 상태 · 캐릭터로 풀어본 사주
        </p>
      </div>
    </div>
  );
}

// ========================
// 카톡 분석 페이지 (Placeholder)
// ========================
function ChatPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-bottom-nav">
      <div className="mx-auto max-w-md px-5 py-8">
        {/* 돌아가기 버튼 */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a2e] transition-colors"
        >
          <span>←</span>
          <span>돌아가기</span>
        </button>

        <header className="mb-8 text-center">
          <span className="text-4xl mb-4 block">💬</span>
          <h1 className="text-xl font-bold text-[#1a1a2e] mb-2">카톡 분석</h1>
          <p className="text-sm text-[#6b7280]">곧 출시 예정이에요!</p>
        </header>
        
        <div className="rounded-2xl bg-white p-6 border border-[#e5e7eb] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-2xl">🔮</span>
          </div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-2">카카오톡 대화 분석</h2>
          <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
            대화 내용을 분석해서<br />
            상대방의 마음을 읽어드려요
          </p>
          <div className="inline-block px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
            Coming Soon ✨
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// 메인 컴포넌트
// ========================
const defaultFormData: FormData = {
  name: "",
  calendarType: "양력",
  year: "1990",
  month: "8",
  day: "20",
  hour: "9",
  minute: "00",
  hasTime: true,
};

function ManseryeokPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [view, setView] = useState<"home" | "edit" | "detail" | "love">("home");
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [manseResult, setManseResult] = useState<ManseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChatBadge] = useState(false); // 카톡 탭 배지 (비활성화)
  
  // 온보딩 상태
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCharacterReveal, setShowCharacterReveal] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  // Firebase 사용자 상태
  const [firebaseUser, setFirebaseUser] = useState<UserData | null>(null);

  // Firebase 사용자 데이터 로드
  const loadFirebaseUser = useCallback(async () => {
    if (isLoggedIn()) {
      const kakaoUser = getKakaoUser();
      if (kakaoUser) {
        const userData = await getUserData(kakaoUser.id);
        if (userData) {
          setFirebaseUser(userData);
          
          // Firestore에 저장된 birthInfo가 있으면 로드
          if (userData.birthInfo) {
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
          }
          
          // Firestore 온보딩 상태 확인
          if (userData.hasCompletedOnboarding) {
            markOnboardingComplete(); // localStorage도 동기화
          }
        }
      }
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
    if (tabParam && ["home", "love", "chat", "me"].includes(tabParam)) {
      setActiveTab(tabParam as TabId);
      
      // view도 함께 변경
      if (tabParam === "love") {
        setView("love");
      } else {
        setView("home");
      }
      // URL에서 tab 파라미터 제거 (깔끔하게)
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  // 온보딩 체크 (첫 방문 시) + 리셋 파라미터 처리
  useEffect(() => {
    // ?reset=onboarding 파라미터로 온보딩 리셋
    const resetParam = searchParams.get("reset");
    if (resetParam === "onboarding") {
      localStorage.removeItem("hasCompletedOnboarding");
      localStorage.removeItem("hasSeenCharacterReveal");
      router.replace("/", { scroll: false });
      setShowOnboarding(true);
      setIsFirstVisit(true);
      return;
    }
    
    // 이미 로그인되어 있고 Firebase에 데이터가 있으면 온보딩 스킵
    if (isLoggedIn() && firebaseUser?.birthInfo) {
      markOnboardingComplete(); // localStorage 동기화
      setShowOnboarding(false);
      setIsFirstVisit(false);
      return;
    }
    
    // 로그인되어 있지만 birthInfo가 없으면 입력 폼으로 (온보딩 스킵)
    if (isLoggedIn() && firebaseUser && !firebaseUser.birthInfo) {
      markOnboardingComplete();
      setShowOnboarding(false);
      setIsFirstVisit(true); // 캐릭터 리빌은 보여줌
      setView("edit");
      return;
    }
    
    // 비로그인 + 온보딩 미완료 → 온보딩 표시
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
      setIsFirstVisit(true);
    }
  }, [searchParams, router, firebaseUser]);

  // 온보딩 완료 핸들러 → 생년월일 입력 화면으로 이동
  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    setShowOnboarding(false);
    setView("edit"); // 생년월일 입력 화면으로
  };

  // 캐릭터 리빌 완료 핸들러
  const handleCharacterRevealComplete = () => {
    markCharacterRevealSeen();
    setShowCharacterReveal(false);
    setIsFirstVisit(false);
    setView("home"); // 홈으로 이동
    setActiveTab("home");
  };

  // 폼 제출 핸들러 (캐릭터 리빌 포함 + Firebase 저장)
  const handleFormSubmitWithReveal = async (data: FormData) => {
    setFormData(data);
    
    // Firebase에 birthInfo 저장 (로그인된 경우)
    if (isLoggedIn()) {
      const kakaoUser = getKakaoUser();
      if (kakaoUser) {
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
        
        await updateBirthInfo(kakaoUser.id, birthInfoForDB);
        console.log("✅ birthInfo saved to Firestore");
        
        // Firebase 사용자 상태 업데이트
        setFirebaseUser(prev => prev ? { 
          ...prev, 
          birthInfo: birthInfoForDB,
          hasCompletedOnboarding: true 
        } : null);
      }
    }
    
    // 첫 방문이고 캐릭터 리빌을 본 적 없으면 리빌 표시
    if (isFirstVisit && !hasSeenCharacterReveal()) {
      setShowCharacterReveal(true);
    } else {
      setView("home");
    }
  };

  // 온보딩 화면
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // 캐릭터 리빌 화면
  if (showCharacterReveal && manseResult) {
    const character = generateCharacterType(manseResult.elements);
    return (
      <CharacterReveal
        character={character}
        userName={formData.name || undefined}
        onComplete={handleCharacterRevealComplete}
      />
    );
  }

  if (loading || !manseResult) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-[#3b5998] border-t-transparent rounded-full mb-4"></div>
          <p className="text-[#6b7280]">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    // 모든 탭 전환 시 view 상태도 함께 변경
    if (tab === "home") {
      setView("home");
    } else if (tab === "love") {
      setView("love");
    } else {
      // chat, me 탭은 view를 home으로 리셋 (love 상태 해제)
      setView("home");
    }
  };

  // 편집 모드 (BottomNav 없이)
  if (view === "edit") {
    return (
      <BirthInfoForm
        initialData={isFirstVisit ? null : formData}
        onSubmit={async (data) => {
          // Firebase에 저장 + 캐릭터 리빌 표시
          await handleFormSubmitWithReveal(data);
          
          // 기존 사용자(재수정)인 경우 홈으로 이동
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

  // 연애 운세 상세 페이지 (탭에서 진입 시)
  if (activeTab === "love" || view === "love") {
    const character = generateCharacterType(manseResult.elements);
    const todayMode = computeTodayMode(character.id);
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

  // 카톡 분석 탭
  if (activeTab === "chat") {
    return (
      <>
        <ChatPage onBack={() => handleTabChange("home")} />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
      </>
    );
  }

  // 내 정보 탭 → 캐릭터 상세 페이지
  if (activeTab === "me") {
    return (
      <>
        <div className="pb-bottom-nav">
          <InterpretationPage
            manseResult={manseResult}
            formData={formData}
            onBack={() => {
              setActiveTab("home");
            }}
          />
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} chatBadge={showChatBadge} />
      </>
    );
  }

  // 기본: 홈 화면
  return (
    <>
      <NewHomePage
        manseResult={manseResult}
        formData={formData}
        onEdit={() => setView("edit")}
        onViewDetail={() => setActiveTab("me")}
        onViewLove={() => {
          setView("love");
          setActiveTab("love");
        }}
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
        <p className="text-purple-700 font-medium">로딩 중...</p>
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
