"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MbtiPicker from "@/app/components/mbti/MbtiPicker";
import MatchResultCard from "@/app/components/match/MatchResultCard";
import BirthMatchResultCard from "@/app/components/match/BirthMatchResultCard";
import { type MbtiType, calculateScore } from "@/app/lib/match/mbti";
import { generateMatchTexts, generateBirthMatchTexts, type MatchTexts, type BirthMatchTexts } from "@/app/lib/match/texts";
import { type MatchResult } from "@/app/lib/match/mbti";
import { calculateBirthMatch, type BirthMatchResult } from "@/app/lib/match/birth";
import { saveMatchHistory, savePartnerInfo, getPartners, getUserData } from "@/app/lib/firebase/userService";
import { getKakaoUser, getNaverUser } from "@/app/lib/auth";
import { BottomNav, type TabId, SwipeBack } from "@/app/components/common";
import { getCurrentPartner, syncPartnersFromFirestore } from "@/app/lib/cupid/partnersStorage";

// 로그인된 사용자 ID 가져오기
function getUserId(): string | null {
  const kakaoUser = getKakaoUser();
  if (kakaoUser) return kakaoUser.id;
  
  const naverUser = getNaverUser();
  if (naverUser) return naverUser.id;
  
  return null;
}

type ViewState = "input" | "result";
type InputType = "mbti" | "birth";

interface SavedMatchData {
  nickname: string;
  type: InputType;
  theirMbti?: string;
  birthDate?: string;
  result?: MatchResult;
  texts?: MatchTexts;
  savedAt: string;
}

// 사주 기반 MBTI 추정 (사주 원소를 기반으로 가상의 MBTI 생성)
function getSajuBasedMbti(birthInfo?: { year: number; month: number; day: number; hour?: number }): MbtiType | null {
  if (!birthInfo) return null;
  
  // 사용자 생년월일 데이터 사용
  const year = birthInfo.year;
  const month = birthInfo.month;
  const day = birthInfo.day;
  const hour = birthInfo.hour ?? 9;
  
  // 간단한 규칙 기반 추정 (실제 사주 로직과 연결 가능)
  const seed = year + month * 100 + day * 10 + hour;
  
  const e_i = (seed % 2 === 0) ? "E" : "I";
  const n_s = ((seed + month) % 2 === 0) ? "N" : "S";
  const t_f = ((seed + day) % 2 === 0) ? "T" : "F";
  const j_p = ((seed + hour) % 2 === 0) ? "J" : "P";
  
  return `${e_i}${n_s}${t_f}${j_p}` as MbtiType;
}

export default function MatchPage() {
  const router = useRouter();
  
  // 상태
  const [view, setView] = useState<ViewState>("input");
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [inputType, setInputType] = useState<InputType>("mbti");
  const [theirMbti, setTheirMbti] = useState<MbtiType | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthHour, setBirthHour] = useState("");
  const [includeTime, setIncludeTime] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<{ name: string; mbti?: string; saju?: any } | null>(null);
  
  // 사용자 생년월일 정보
  const [myBirthInfo, setMyBirthInfo] = useState<{ year: number; month: number; day: number; hour?: number } | null>(null);
  
  // 내 사주 기반 MBTI (사용자 생년월일이 있을 때만 계산)
  const [myMbti, setMyMbti] = useState<MbtiType | null>(null);
  
  // MBTI 결과
  const [result, setResult] = useState<MatchResult | null>(null);
  const [texts, setTexts] = useState<MatchTexts | null>(null);
  
  // 생년월일 결과
  const [birthResult, setBirthResult] = useState<BirthMatchResult | null>(null);
  const [birthTexts, setBirthTexts] = useState<BirthMatchTexts | null>(null);

  // 사용자 생년월일 정보 로드
  useEffect(() => {
    const loadUserBirthInfo = async () => {
      const userId = getUserId();
      if (!userId) return;
      
      const userData = await getUserData(userId);
      if (userData?.birthInfo) {
        const birthInfo = {
          year: userData.birthInfo.year,
          month: userData.birthInfo.month,
          day: userData.birthInfo.day,
          hour: userData.birthInfo.hour,
        };
        setMyBirthInfo(birthInfo);
        const mbti = getSajuBasedMbti(birthInfo);
        if (mbti) setMyMbti(mbti);
      }
    };
    
    loadUserBirthInfo();
  }, []);

  // 상대 관리에서 저장한 현재 상대 정보 불러오기
  useEffect(() => {
    const loadSavedPartner = async () => {
      // 1. 상대 관리에서 저장한 현재 상대 확인 (최우선)
      await syncPartnersFromFirestore(); // Firestore에서 최신 정보 동기화
      const savedCurrentPartner = getCurrentPartner();
      
      if (savedCurrentPartner) {
        // 현재 상대 정보만 저장 (폼에는 채우지 않음)
        setCurrentPartner({
          name: savedCurrentPartner.name,
          mbti: savedCurrentPartner.mbti,
          saju: savedCurrentPartner.saju,
        });
        return;
      }
      
      // 현재 상대 정보가 없으면 null
      setCurrentPartner(null);
    };
    
    loadSavedPartner();
    
    // 페이지 포커스 시 다시 불러오기 (다른 페이지에서 돌아올 때)
    const handleFocus = () => {
      loadSavedPartner();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 유효성 검사
  const isNicknameValid = nickname.length >= 1 && nickname.length <= 10;
  const isMbtiValid = inputType === "mbti" && theirMbti !== null;
  const isBirthValid = inputType === "birth" && birthYear && birthMonth && birthDay;
  const canCalculate = isNicknameValid && (isMbtiValid || isBirthValid);

  // 년/월/일/시 옵션
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 저장된 상대 정보로 바로 궁합 계산
  const handleCalculateWithCurrentPartner = async () => {
    if (!currentPartner) return;
    
    const userId = getUserId();
    setNickname(currentPartner.name);
    
    // MBTI 정보가 있으면 MBTI 궁합 계산
    if (currentPartner.mbti) {
      setInputType("mbti");
      setTheirMbti(currentPartner.mbti as MbtiType);
      
      if (!myMbti) {
        alert("궁합 계산을 위해서는 먼저 생년월일을 입력해주세요.");
        return;
      }
      
      const matchResult = calculateScore(myMbti, currentPartner.mbti as MbtiType);
      const matchTexts = generateMatchTexts(matchResult, myMbti, currentPartner.mbti as MbtiType);
      
      setResult(matchResult);
      setTexts(matchTexts);
      setView("result");
      
      // Firebase에 궁합 히스토리 저장
      if (userId) {
        await saveMatchHistory({
          oderId: userId,
          matchType: "mbti",
          partnerNickname: currentPartner.name,
          partnerInfo: { mbti: currentPartner.mbti },
          compatibilityScore: matchResult.score,
        });
      }
    }
    // 사주 정보가 있으면 생년월일 궁합 계산
    else if (currentPartner.saju) {
      setInputType("birth");
      const theirYear = currentPartner.saju.birthY;
      const theirMonth = currentPartner.saju.birthM;
      const theirDay = currentPartner.saju.birthD;
      const theirHour = currentPartner.saju.birthTimeKnown && currentPartner.saju.birthHour !== undefined
        ? currentPartner.saju.birthHour
        : undefined;
      
      if (!myBirthInfo) {
        alert("궁합 계산을 위해서는 먼저 생년월일을 입력해주세요.");
        return;
      }
      
      const matchResult = calculateBirthMatch(
        myBirthInfo.year, myBirthInfo.month, myBirthInfo.day,
        theirYear, theirMonth, theirDay,
        myBirthInfo.hour, theirHour
      );
      const matchTexts = generateBirthMatchTexts(matchResult);
      
      setBirthResult(matchResult);
      setBirthTexts(matchTexts);
      setView("result");
      
      // Firebase에 궁합 히스토리 저장
      if (userId) {
        await saveMatchHistory({
          oderId: userId,
          matchType: "birth",
          partnerNickname: currentPartner.name,
          partnerInfo: {
            birthYear: theirYear,
            birthMonth: theirMonth,
            birthDay: theirDay,
            birthHour: theirHour,
          },
          compatibilityScore: matchResult.score,
        });
      }
    }
  };

  // 궁합 계산
  const handleCalculate = async () => {
    const userId = getUserId();
    
    if (inputType === "mbti" && theirMbti) {
      if (!myMbti) {
        alert("궁합 계산을 위해서는 먼저 생년월일을 입력해주세요.");
        return;
      }
      
      const matchResult = calculateScore(myMbti, theirMbti);
      const matchTexts = generateMatchTexts(matchResult, myMbti, theirMbti);
      
      setResult(matchResult);
      setTexts(matchTexts);
      setView("result");
      
      // localStorage 저장
      localStorage.setItem("savedPartner", JSON.stringify({
        nickname,
        type: "mbti",
        mbti: theirMbti,
      }));
      
      // Firebase에 상대방 정보 및 궁합 히스토리 저장
      if (userId) {
        // 상대방 정보 저장 (별도 관리)
        await savePartnerInfo(userId, nickname, { mbti: theirMbti });
        
        // 궁합 히스토리 저장
        await saveMatchHistory({
          oderId: userId,
          matchType: "mbti",
          partnerNickname: nickname,
          partnerInfo: { mbti: theirMbti },
          compatibilityScore: matchResult.score,
        });
      }
    } else if (inputType === "birth" && birthYear && birthMonth && birthDay) {
      // 생년월일 기반 궁합 계산
      const theirYear = parseInt(birthYear);
      const theirMonth = parseInt(birthMonth);
      const theirDay = parseInt(birthDay);
      const theirHour = includeTime && birthHour ? parseInt(birthHour) : undefined;
      
      if (!myBirthInfo) {
        alert("궁합 계산을 위해서는 먼저 생년월일을 입력해주세요.");
        return;
      }
      
      const matchResult = calculateBirthMatch(
        myBirthInfo.year, myBirthInfo.month, myBirthInfo.day,
        theirYear, theirMonth, theirDay,
        myBirthInfo.hour, theirHour
      );
      const matchTexts = generateBirthMatchTexts(matchResult);
      
      setBirthResult(matchResult);
      setBirthTexts(matchTexts);
      setView("result");
      
      // localStorage 저장
      localStorage.setItem("savedPartner", JSON.stringify({
        nickname,
        type: "birth",
        birthDate: `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`,
        birthHour: includeTime ? birthHour : "",
      }));
      
      // Firebase에 상대방 정보 및 궁합 히스토리 저장
      if (userId) {
        // 상대방 정보 저장 (별도 관리)
        await savePartnerInfo(userId, nickname, {
          birthYear: theirYear,
          birthMonth: theirMonth,
          birthDay: theirDay,
          birthHour: theirHour, // 출생 시간도 저장
        });
        
        // 궁합 히스토리 저장
        await saveMatchHistory({
          oderId: userId,
          matchType: "birth",
          partnerNickname: nickname,
          partnerInfo: {
            birthYear: theirYear,
            birthMonth: theirMonth,
            birthDay: theirDay,
            birthHour: theirHour, // 출생 시간도 저장
          },
          compatibilityScore: matchResult.score,
        });
      }
    }
  };

  // 다시 하기
  const handleReset = () => {
    setView("input");
    setStep(1);
    setNickname("");
    setTheirMbti(null);
    setBirthYear("");
    setBirthMonth("");
    setBirthDay("");
    setBirthHour("");
    setIncludeTime(false);
    setResult(null);
    setTexts(null);
    setBirthResult(null);
    setBirthTexts(null);
  };

  // 탭 변경 시 홈으로 이동
  const handleTabChange = (tab: TabId) => {
    router.push(`/?tab=${tab}`);
  };

  // MBTI 결과 화면
  if (view === "result" && result && texts && inputType === "mbti") {
    return (
      <SwipeBack onBack={() => router.push("/")}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
          <div className="mx-auto max-w-md px-5 py-8">
            <button
              onClick={() => router.push("/")}
              className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              <span>←</span>
              <span>돌아가기</span>
            </button>

            <MatchResultCard
              nickname={nickname}
              myMbti={myMbti}
              theirMbti={theirMbti!}
              result={result}
              texts={texts}
              onReset={handleReset}
            />
          </div>
          
          <BottomNav 
            activeTab="home" 
            onTabChange={handleTabChange}
          />
        </div>
      </SwipeBack>
    );
  }

  // 생년월일 결과 화면
  if (view === "result" && birthResult && birthTexts && inputType === "birth") {
    return (
      <SwipeBack onBack={() => router.push("/")}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
          <div className="mx-auto max-w-md px-5 py-8">
            <button
              onClick={() => router.push("/")}
              className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              <span>←</span>
              <span>돌아가기</span>
            </button>

            <BirthMatchResultCard
              nickname={nickname}
              myBirth={myBirthInfo ? `${myBirthInfo.year}.${myBirthInfo.month}.${myBirthInfo.day}` : "미입력"}
              theirBirth={`${birthYear}.${birthMonth}.${birthDay}${includeTime && birthHour ? ` ${birthHour}시` : ""}`}
              result={birthResult}
              texts={birthTexts}
              onReset={handleReset}
            />
          </div>
          
          <BottomNav 
            activeTab="home" 
            onTabChange={handleTabChange}
          />
        </div>
      </SwipeBack>
    );
  }

  return (
    <SwipeBack onBack={() => router.push("/")}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
        <div className="mx-auto max-w-md px-5 py-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>

          {/* 헤더 */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              💞 궁합 보기
            </h1>
            <p className="text-sm text-purple-600">
              내 사주 기반으로 상대방과의 궁합을 확인해보세요
            </p>
          </header>

          {/* 진행 표시 */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
          </div>

          {/* Step 1: 별명 입력 또는 저장된 상대 확인 */}
          {step === 1 && (
            <section className="space-y-4">
              {/* 저장된 현재 상대 정보가 있을 때 확인 카드 */}
              {currentPartner ? (
                <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white shadow-lg">
                  <div className="text-center mb-4">
                    <p className="text-sm font-medium opacity-90 mb-2">
                      저장된 상대 정보
                    </p>
                    <h2 className="text-2xl font-bold mb-1">
                      {currentPartner.name}님
                    </h2>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {currentPartner.mbti && (
                        <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
                          MBTI: {currentPartner.mbti}
                        </span>
                      )}
                      {currentPartner.saju && (
                        <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
                          사주 입력됨
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCalculateWithCurrentPartner}
                    className="w-full py-4 rounded-xl font-bold bg-white text-purple-600 hover:bg-purple-50 transition-all shadow-lg"
                  >
                    {currentPartner.name}님과의 궁합 보기 →
                  </button>
                </div>
              ) : (
                <>
                  {/* 현재 상대 정보가 없을 때 안내 */}
                  <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-5 border border-purple-200">
                    <p className="text-sm text-purple-700 mb-3">
                      저장된 상대 정보가 없어요
                    </p>
                    <p className="text-xs text-purple-500 mb-4">
                      상대 정보를 먼저 저장하면 궁합을 더 쉽게 확인할 수 있어요
                    </p>
                    <button
                      onClick={() => router.push("/partners/new?returnTo=match")}
                      className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all"
                    >
                      상대방 정보 입력하러 가기 →
                    </button>
                  </div>

                  <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-purple-100">
                    <h2 className="text-sm font-bold text-purple-900 mb-3">
                      상대 별명
                    </h2>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="예: 썸남, 직장동료, 친구"
                      maxLength={10}
                      className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    <p className="mt-2 text-xs text-purple-400">
                      {nickname.length}/10자
                    </p>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!isNicknameValid}
                    className={`w-full py-4 rounded-xl font-bold transition-all ${
                      isNicknameValid
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    다음 →
                  </button>
                </>
              )}
            </section>
          )}

          {/* Step 2: 궁합 방식 선택 */}
          {step === 2 && (
            <section className="space-y-4">
              {/* 입력된 정보 표시 */}
              <div className="rounded-xl bg-purple-100 p-4 flex items-center justify-between">
                <p className="text-sm text-purple-700">
                  <span className="font-bold">{nickname}</span>님과의 궁합
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-purple-500 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  수정
                </button>
              </div>

              {/* 탭 선택 */}
              <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-purple-100">
                <h2 className="text-sm font-bold text-purple-900 mb-4">
                  궁합 방식 선택
                </h2>
                
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setInputType("mbti")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      inputType === "mbti"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    상대방 <span className="font-bold">MBTI</span>로 보기
                  </button>
                  <button
                    onClick={() => setInputType("birth")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      inputType === "birth"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    상대방 <span className="font-bold">생년월일</span>로 보기
                  </button>
                </div>

                {/* MBTI 선택 */}
                {inputType === "mbti" && (
                  <div>
                    <p className="text-xs text-purple-500 mb-3">
                      {theirMbti ? `선택됨: ${theirMbti}` : `${nickname}님의 MBTI를 선택하세요`}
                    </p>
                    <MbtiPicker
                      value={theirMbti}
                      onChange={(mbti) => setTheirMbti(mbti)}
                    />
                  </div>
                )}

                {/* 생년월일 입력 */}
                {inputType === "birth" && (
                  <div>
                    <p className="text-xs text-purple-500 mb-3">
                      {nickname}님의 생년월일을 입력하세요
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        className="flex-1 rounded-xl border border-purple-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="">년</option>
                        {years.map((y) => (
                          <option key={y} value={y}>{y}년</option>
                        ))}
                      </select>
                      <select
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className="w-24 rounded-xl border border-purple-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="">월</option>
                        {months.map((m) => (
                          <option key={m} value={m}>{m}월</option>
                        ))}
                      </select>
                      <select
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className="w-24 rounded-xl border border-purple-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="">일</option>
                        {days.map((d) => (
                          <option key={d} value={d}>{d}일</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* 시간 입력 (선택) */}
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setIncludeTime(!includeTime);
                          if (!includeTime) setBirthHour("");
                        }}
                        className="flex items-center gap-2 text-xs text-purple-500 hover:text-purple-700 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          includeTime ? "bg-purple-500 border-purple-500" : "border-purple-300"
                        }`}>
                          {includeTime && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span>출생 시간도 입력할게요 (선택)</span>
                      </button>
                      
                      {includeTime && (
                        <div className="mt-2">
                          <select
                            value={birthHour}
                            onChange={(e) => setBirthHour(e.target.value)}
                            className="w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                          >
                            <option value="">시간 선택</option>
                            {hours.map((h) => (
                              <option key={h} value={h}>{h}시 ({h === 0 ? "자정" : h < 12 ? "오전" : h === 12 ? "정오" : "오후"})</option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-purple-400">
                            시간을 알면 더 정확한 시주 분석이 가능해요
                          </p>
                        </div>
                      )}
                    </div>

                    {isBirthValid && (
                      <p className="mt-3 text-sm text-purple-700 text-center">
                        입력: <span className="font-bold">
                          {birthYear}.{birthMonth}.{birthDay}
                          {includeTime && birthHour && ` ${birthHour}시`}
                        </span>
                      </p>
                    )}
                    <p className="mt-3 text-xs text-purple-400 text-center">
                      💡 띠 궁합 + 오행 관계로 분석해드려요
                    </p>
                  </div>
                )}
              </div>

              {/* 궁합 보기 버튼 */}
              <button
                onClick={handleCalculate}
                disabled={!canCalculate}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  canCalculate
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                💕 우리 궁합 확인하기
              </button>

              {/* 뒤로 버튼 */}
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-xl text-purple-600 font-medium hover:bg-purple-50 transition-colors"
              >
                ← 돌아가기
              </button>
            </section>
          )}

        </div>
        
        <BottomNav 
          activeTab="home" 
          onTabChange={handleTabChange}
        />
      </div>
    </SwipeBack>
  );
}
