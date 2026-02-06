"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MbtiPicker from "@/app/components/mbti/MbtiPicker";
import MatchResultCard from "@/app/components/match/MatchResultCard";
import { type MbtiType, calculateScore } from "@/app/lib/match/mbti";
import { generateMatchTexts, type MatchTexts } from "@/app/lib/match/texts";
import { type MatchResult } from "@/app/lib/match/mbti";

type ViewState = "input" | "result";

interface SavedMatchData {
  myMbti: string;
  nickname: string;
  theirMbti: string;
  result: MatchResult;
  texts: MatchTexts;
  savedAt: string;
}

export default function MatchPage() {
  const router = useRouter();
  
  // 상태
  const [view, setView] = useState<ViewState>("input");
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [myMbti, setMyMbti] = useState<MbtiType | null>(null);
  const [theirMbti, setTheirMbti] = useState<MbtiType | null>(null);
  
  // 결과
  const [result, setResult] = useState<MatchResult | null>(null);
  const [texts, setTexts] = useState<MatchTexts | null>(null);

  // localStorage에서 저장된 데이터 불러오기
  useEffect(() => {
    // 내 MBTI 불러오기
    const savedMyMbti = localStorage.getItem("myMbti");
    if (savedMyMbti) {
      setMyMbti(savedMyMbti as MbtiType);
    }
    
    // 마지막 결과 불러오기 (옵션)
    const lastResult = localStorage.getItem("lastMatchResult");
    if (lastResult) {
      try {
        const parsed = JSON.parse(lastResult) as SavedMatchData;
        setNickname(parsed.nickname);
        setTheirMbti(parsed.theirMbti as MbtiType);
        if (parsed.myMbti) {
          setMyMbti(parsed.myMbti as MbtiType);
        }
      } catch {
        // 파싱 오류 무시
      }
    }
  }, []);

  // 유효성 검사
  const isNicknameValid = nickname.length >= 1 && nickname.length <= 10;
  const canProceedStep2 = isNicknameValid;
  const canCalculate = myMbti && theirMbti;

  // 궁합 계산
  const handleCalculate = () => {
    if (!myMbti || !theirMbti) return;
    
    const matchResult = calculateScore(myMbti, theirMbti);
    const matchTexts = generateMatchTexts(matchResult, myMbti, theirMbti);
    
    setResult(matchResult);
    setTexts(matchTexts);
    setView("result");
    
    // localStorage 저장
    localStorage.setItem("myMbti", myMbti);
    localStorage.setItem("savedPartner", JSON.stringify({
      nickname,
      type: "mbti",
      mbti: theirMbti,
    }));
    localStorage.setItem("lastMatchResult", JSON.stringify({
      myMbti,
      nickname,
      theirMbti,
      result: matchResult,
      texts: matchTexts,
      savedAt: new Date().toISOString(),
    }));
  };

  // 다시 하기
  const handleReset = () => {
    setView("input");
    setStep(1);
    setNickname("");
    setTheirMbti(null);
    setResult(null);
    setTexts(null);
  };

  // 결과 화면
  if (view === "result" && result && texts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-8">
        <div className="mx-auto max-w-md px-5 py-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>←</span>
            <span>홈으로</span>
          </button>

          <MatchResultCard
            nickname={nickname}
            myMbti={myMbti!}
            theirMbti={theirMbti!}
            result={result}
            texts={texts}
            onReset={handleReset}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-8">
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
            💞 MBTI 궁합 보기
          </h1>
          <p className="text-sm text-purple-600">
            나와 상대의 MBTI로 궁합을 확인해보세요
          </p>
        </header>

        {/* 진행 표시 */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
        </div>

        {/* Step 1: 별명 + 나의 MBTI */}
        {step === 1 && (
          <section className="space-y-4">
            {/* 별명 입력 */}
            <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-purple-100">
              <h2 className="text-sm font-bold text-purple-900 mb-3">
                상대 별명
              </h2>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="별명을 입력하세요"
                maxLength={10}
                className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-purple-400">
                {nickname.length}/10자
              </p>
            </div>

            {/* 나의 MBTI */}
            <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-purple-100">
              <h2 className="text-sm font-bold text-purple-900 mb-1">
                나의 MBTI
              </h2>
              <p className="text-xs text-purple-500 mb-4">
                {myMbti ? `선택됨: ${myMbti}` : "나의 MBTI를 선택하세요"}
              </p>
              <MbtiPicker
                value={myMbti}
                onChange={(mbti) => setMyMbti(mbti)}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep2 || !myMbti}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                canProceedStep2 && myMbti
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              다음 →
            </button>
          </section>
        )}

        {/* Step 2: 상대 MBTI */}
        {step === 2 && (
          <section className="space-y-4">
            {/* 입력된 정보 표시 */}
            <div className="rounded-xl bg-purple-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">
                  <span className="font-bold">{nickname}</span>님과의 궁합
                </p>
                <p className="text-xs text-purple-500 mt-1">
                  나의 MBTI: <span className="font-bold">{myMbti}</span>
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-purple-500 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors"
              >
                수정
              </button>
            </div>

            {/* 상대 MBTI */}
            <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-lg border border-purple-100">
              <h2 className="text-sm font-bold text-purple-900 mb-1">
                {nickname}님의 MBTI
              </h2>
              <p className="text-xs text-purple-500 mb-4">
                {theirMbti ? `선택됨: ${theirMbti}` : "상대의 MBTI를 선택하세요"}
              </p>
              <MbtiPicker
                value={theirMbti}
                onChange={(mbti) => setTheirMbti(mbti)}
              />
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
              💕 궁합 보기
            </button>

            {/* 뒤로 버튼 */}
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-xl text-purple-600 font-medium hover:bg-purple-50 transition-colors"
            >
              ← 이전으로
            </button>
          </section>
        )}

        {/* 안내 문구 */}
        <p className="mt-8 text-center text-xs text-purple-400">
          MBTI 궁합은 재미로 보는 참고 자료예요 😊
        </p>
      </div>
    </div>
  );
}
