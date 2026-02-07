"use client";

import { useState, useRef } from "react";
import SwipeBack from "@/app/components/SwipeBack";

interface AnalysisResult {
  emotionSummary: string;
  affectionScore: number;
  affectionReasons: string[];
  emotionFlow: string;
  riskSignals: string[];
  recommendedAction: string;
}

export default function ChatAnalysisPage({ onBack }: { onBack: () => void }) {
  const [chatText, setChatText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!chatText.trim()) {
      setError("대화 내용을 입력해주세요");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/chat-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatText: chatText.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "분석에 실패했어요");
      }

      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        throw new Error("분석 결과를 받지 못했어요");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했어요");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-blue-500 to-cyan-500";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    if (score >= 20) return "from-orange-500 to-red-500";
    return "from-red-500 to-red-600";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "강한 호감";
    if (score >= 60) return "긍정적 관심";
    if (score >= 40) return "중립/관찰";
    if (score >= 20) return "소극적";
    return "거부/회피";
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요");
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 크기는 10MB 이하여야 해요");
      return;
    }

    setIsExtracting(true);
    setError(null);

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "텍스트 추출에 실패했어요");
      }

      if (data.success && data.text) {
        setChatText(data.text);
        setError(null);
      } else {
        throw new Error("텍스트를 추출하지 못했어요");
      }
    } catch (err) {
      console.error("OCR error:", err);
      setError(err instanceof Error ? err.message : "이미지 처리 중 오류가 발생했어요");
      setUploadedImage(null);
    } finally {
      setIsExtracting(false);
      // 파일 입력 초기화
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <SwipeBack>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
        <div className="mx-auto max-w-md px-5 py-6">
          {/* 헤더 */}
          <header className="mb-6">
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>←</span>
              <span>돌아가기</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg">
                💬
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">카톡 대화 분석</h1>
                <p className="text-sm text-indigo-600">
                  대화 내용으로 상대 마음 읽기
                </p>
              </div>
            </div>
          </header>

          {/* 입력 영역 */}
          {!analysisResult && (
            <div className="mb-6 space-y-4">
              {/* 이미지 업로드 영역 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📸 카톡 스크린샷 업로드
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isExtracting || isAnalyzing}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      isExtracting || isAnalyzing
                        ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                        : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400"
                    }`}
                  >
                    {isExtracting ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mx-auto mb-2" />
                        <p className="text-sm text-gray-600">텍스트 추출 중...</p>
                      </div>
                    ) : uploadedImage ? (
                      <div className="text-center">
                        <img
                          src={uploadedImage}
                          alt="업로드된 이미지"
                          className="max-h-24 mx-auto mb-2 rounded-lg"
                        />
                        <p className="text-xs text-indigo-600">다른 이미지 업로드</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl mb-2">📷</span>
                        <p className="text-sm text-gray-600">
                          클릭하여 스크린샷 업로드
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          또는 아래에 직접 입력
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* 텍스트 입력 영역 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    또는 직접 입력하기
                  </label>
                  {chatText && (
                    <button
                      onClick={() => {
                        setChatText("");
                        setUploadedImage(null);
                        setError(null);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      지우기
                    </button>
                  )}
                </div>
                <textarea
                  value={chatText}
                  onChange={(e) => {
                    setChatText(e.target.value);
                    setError(null);
                  }}
                  placeholder={`예시:
나: 오늘 뭐해?
상대: 집에 있어
나: 심심하겠다 ㅋㅋ
상대: 응 ㅋㅋ 너는?
나: 나도 집에 있는데
상대: 그럼 만날까?`}
                  className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={isAnalyzing || isExtracting}
                />
                <p className="mt-2 text-xs text-gray-500">
                  최소 5줄 이상의 대화가 필요해요
                </p>

                {/* 에러 메시지 */}
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* 분석 버튼 */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !chatText.trim() || isExtracting}
                  className={`mt-4 w-full py-4 rounded-xl font-bold text-white transition-all ${
                    isAnalyzing || !chatText.trim() || isExtracting
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 active:scale-[0.98]"
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      분석 중...
                    </span>
                  ) : (
                    "🔮 분석 시작하기"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 분석 결과 */}
          {analysisResult && (
            <div className="space-y-4">
              {/* 다시 분석 버튼 */}
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setChatText("");
                  setUploadedImage(null);
                  setError(null);
                }}
                className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                ← 다른 대화 분석하기
              </button>

              {/* 감정 요약 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💭</span>
                  <span>상대 감정 요약</span>
                </h2>
                <p className="text-gray-700 leading-relaxed">{analysisResult.emotionSummary}</p>
              </div>

              {/* 호감도 점수 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📊</span>
                    <span>호감도 분석</span>
                  </h2>
                  <span className="text-2xl font-black text-indigo-600">
                    {analysisResult.affectionScore}
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div className="mb-4">
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getScoreColor(analysisResult.affectionScore)} transition-all duration-500`}
                      style={{ width: `${analysisResult.affectionScore}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-600 text-center">
                    {getScoreLabel(analysisResult.affectionScore)}
                  </p>
                </div>

                {/* 근거 */}
                <div className="space-y-2">
                  {analysisResult.affectionReasons.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 감정 흐름 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📈</span>
                  <span>감정 흐름</span>
                </h2>
                <p className="text-gray-700 leading-relaxed">{analysisResult.emotionFlow}</p>
              </div>

              {/* 위험 신호 */}
              <div className="rounded-2xl bg-white/80 backdrop-blur p-6 border border-white/50 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>위험 신호 체크</span>
                </h2>
                {analysisResult.riskSignals.length === 0 ? (
                  <p className="text-gray-600 text-sm">뚜렷한 위험 신호는 없어요</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.riskSignals.map((signal, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <span className="text-sm text-red-700">{signal}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 추천 행동 */}
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 border border-purple-200 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  <span>오늘의 추천 행동</span>
                </h2>
                <p className="text-gray-800 leading-relaxed font-medium">
                  {analysisResult.recommendedAction}
                </p>
              </div>

              {/* 하단 안내 */}
              <p className="text-center text-xs text-gray-400 mt-6">
                ⚠️ 분석 결과는 참고용이며, 실제 관계는 더 복잡할 수 있어요
              </p>
            </div>
          )}

          {/* 로딩 중 */}
          {isAnalyzing && !analysisResult && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-3xl animate-pulse">🔮</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">대화 분석 중...</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    상대방의 감정과 호감도를 분석하고 있어요
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SwipeBack>
  );
}
