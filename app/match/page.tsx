"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// MBTI 16가지 유형
const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP"
];

interface SavedPartner {
  nickname: string;
  type: "mbti" | "birth";
  mbti?: string;
  birthDate?: string;
}

export default function MatchPage() {
  const router = useRouter();
  
  // 상태
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [inputType, setInputType] = useState<"mbti" | "birth">("mbti");
  const [selectedMbti, setSelectedMbti] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [existingPartner, setExistingPartner] = useState<SavedPartner | null>(null);

  // 기존 저장된 상대 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("savedPartner");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedPartner;
        setExistingPartner(parsed);
        setNickname(parsed.nickname);
        if (parsed.type === "mbti" && parsed.mbti) {
          setInputType("mbti");
          setSelectedMbti(parsed.mbti);
        } else if (parsed.type === "birth" && parsed.birthDate) {
          setInputType("birth");
          const [y, m, d] = parsed.birthDate.split("-");
          setBirthYear(y);
          setBirthMonth(m);
          setBirthDay(d);
        }
      } catch {
        // 파싱 오류 무시
      }
    }
  }, []);

  // 닉네임 유효성 검사
  const isNicknameValid = nickname.length >= 2 && nickname.length <= 10;
  
  // MBTI/생년월일 유효성 검사
  const isMbtiValid = inputType === "mbti" && selectedMbti !== "";
  const isBirthValid = inputType === "birth" && birthYear && birthMonth && birthDay;
  const isInputValid = isMbtiValid || isBirthValid;

  // 저장 처리
  const handleSave = () => {
    const partnerData: SavedPartner = {
      nickname,
      type: inputType,
      ...(inputType === "mbti" ? { mbti: selectedMbti } : {}),
      ...(inputType === "birth" ? { birthDate: `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}` } : {}),
    };
    
    localStorage.setItem("savedPartner", JSON.stringify(partnerData));
    setIsSaved(true);
  };

  // 년/월/일 옵션
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // 저장 완료 화면
  if (isSaved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="mx-auto max-w-md px-5 py-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>←</span>
            <span>홈으로</span>
          </button>

          {/* 완료 메시지 */}
          <div className="text-center py-16">
            <div className="text-6xl mb-6">💞</div>
            <h1 className="text-2xl font-bold text-purple-900 mb-4">
              저장 완료!
            </h1>
            <p className="text-purple-700 mb-2">
              <span className="font-bold">{nickname}</span>님 정보가 저장되었어요
            </p>
            <p className="text-sm text-purple-600 mb-8">
              {inputType === "mbti" ? `MBTI: ${selectedMbti}` : `생년월일: ${birthYear}.${birthMonth}.${birthDay}`}
            </p>
            
            {/* 안내 카드 */}
            <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg border border-purple-100 mb-6">
              <div className="text-4xl mb-4">🔮</div>
              <h2 className="text-lg font-bold text-purple-900 mb-2">
                곧 궁합 리포트가 제공돼요!
              </h2>
              <p className="text-sm text-purple-600 leading-relaxed">
                오늘의 연애 모드 기준으로<br />
                <span className="font-medium">{nickname}</span>님과의 궁합을<br />
                분석해드릴 예정이에요
              </p>
            </div>

            {/* 버튼들 */}
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors mb-3"
            >
              홈으로 돌아가기
            </button>
            <button
              onClick={() => {
                setIsSaved(false);
                setStep(1);
              }}
              className="w-full py-3 rounded-xl bg-white text-purple-600 font-medium border border-purple-200 hover:bg-purple-50 transition-colors"
            >
              다른 사람 추가하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="mx-auto max-w-md px-5 py-8">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
        >
          <span>←</span>
          <span>홈으로</span>
        </button>

        {/* 헤더 */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-purple-900 mb-2">
            💞 궁합 보기
          </h1>
          <p className="text-sm text-purple-600">
            상대 정보를 입력하면 오늘 모드 기준으로 궁합을 분석해드려요
          </p>
        </header>

        {/* 기존 저장된 상대 안내 */}
        {existingPartner && step === 1 && (
          <div className="mb-6 rounded-xl bg-white/80 p-4 border border-purple-100">
            <p className="text-sm text-purple-700">
              💡 이전에 저장한 <span className="font-bold">{existingPartner.nickname}</span>님 정보를 수정할 수 있어요
            </p>
          </div>
        )}

        {/* Step 1: 별명 입력 */}
        {step === 1 && (
          <section className="mb-6">
            <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-lg border border-purple-100">
              <h2 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">1</span>
                상대 별명 입력
              </h2>
              
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="별명을 입력하세요 (2~10자)"
                maxLength={10}
                className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              
              <p className="mt-2 text-xs text-purple-500">
                {nickname.length}/10자 {isNicknameValid && "✓"}
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!isNicknameValid}
              className={`w-full mt-4 py-4 rounded-xl font-bold transition-all ${
                isNicknameValid
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              다음 →
            </button>
          </section>
        )}

        {/* Step 2: 궁합 방식 선택 */}
        {step === 2 && (
          <section className="mb-6">
            {/* 입력된 별명 표시 */}
            <div className="mb-4 rounded-xl bg-purple-100 p-3 flex items-center justify-between">
              <span className="text-sm text-purple-700">
                <span className="font-bold">{nickname}</span>님의 정보
              </span>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-purple-500 hover:text-purple-700"
              >
                수정
              </button>
            </div>

            <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-lg border border-purple-100">
              <h2 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">2</span>
                궁합 방식 선택
              </h2>

              {/* 탭 선택 */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setInputType("mbti")}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    inputType === "mbti"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  MBTI로 보기
                </button>
                <button
                  onClick={() => setInputType("birth")}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    inputType === "birth"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  생년월일로 보기
                </button>
              </div>

              {/* MBTI 선택 UI */}
              {inputType === "mbti" && (
                <div>
                  <p className="text-xs text-purple-600 mb-3">MBTI를 선택하세요</p>
                  <div className="grid grid-cols-4 gap-2">
                    {MBTI_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedMbti(type)}
                        className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                          selectedMbti === type
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-purple-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {selectedMbti && (
                    <p className="mt-3 text-sm text-purple-700 text-center">
                      선택: <span className="font-bold">{selectedMbti}</span>
                    </p>
                  )}
                </div>
              )}

              {/* 생년월일 입력 UI */}
              {inputType === "birth" && (
                <div>
                  <p className="text-xs text-purple-600 mb-3">생년월일을 입력하세요</p>
                  <div className="flex gap-2">
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="flex-1 rounded-lg border border-purple-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">년</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}년</option>
                      ))}
                    </select>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-24 rounded-lg border border-purple-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">월</option>
                      {months.map((m) => (
                        <option key={m} value={m}>{m}월</option>
                      ))}
                    </select>
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-24 rounded-lg border border-purple-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">일</option>
                      {days.map((d) => (
                        <option key={d} value={d}>{d}일</option>
                      ))}
                    </select>
                  </div>
                  {isBirthValid && (
                    <p className="mt-3 text-sm text-purple-700 text-center">
                      입력: <span className="font-bold">{birthYear}.{birthMonth}.{birthDay}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={!isInputValid}
              className={`w-full mt-4 py-4 rounded-xl font-bold transition-all ${
                isInputValid
                  ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              이 사람 저장하고 궁합 보기 💞
            </button>

            {/* 뒤로 버튼 */}
            <button
              onClick={() => setStep(1)}
              className="w-full mt-2 py-3 rounded-xl text-purple-600 font-medium hover:bg-purple-50 transition-colors"
            >
              ← 이전으로
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
