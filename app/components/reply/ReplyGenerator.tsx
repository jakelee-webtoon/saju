"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getRemainingFreeCount,
  canUseForFree,
  incrementUsage,
  DAILY_FREE_LIMIT,
  ARROW_COST_PER_REPLY,
} from "@/app/lib/reply/replyUsage";
import { getArrowBalance, useArrowSync } from "@/app/lib/cupid/arrowBalance";

interface ReplyGeneratorProps {
  characterName: string;
  characterId: string;
  onBack: () => void;
}

// 개별 톤 타입
type ToneType = "친근" | "쿨" | "애교" | "직진" | "센스" | "섹시" | "로맨틱" | "솔직" | "논리적" | "츤데레" | "팩폭";

// 의도 기반 프리셋 정의
interface IntentPreset {
  id: string;
  emoji: string;
  label: string;
  description: string;
  tones: ToneType[];
  color: string;
  bgColor: string;
}

const INTENT_PRESETS: IntentPreset[] = [
  {
    id: "push-pull",
    emoji: "🎣",
    label: "밀당",
    description: "관심 있는데 티 안 내면서",
    tones: ["츤데레", "센스"],
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100",
  },
  {
    id: "flutter",
    emoji: "💕",
    label: "설레게",
    description: "두근거리게 만들고 싶어",
    tones: ["로맨틱", "섹시"],
    color: "text-rose-500",
    bgColor: "bg-rose-50 border-rose-200 hover:bg-rose-100",
  },
  {
    id: "comfortable",
    emoji: "😊",
    label: "편하게",
    description: "부담 없이 친근하게",
    tones: ["친근", "솔직"],
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    id: "go-for-it",
    emoji: "🔥",
    label: "직진",
    description: "확실하게 밀어붙일 거야",
    tones: ["직진", "로맨틱"],
    color: "text-red-500",
    bgColor: "bg-red-50 border-red-200 hover:bg-red-100",
  },
  {
    id: "witty",
    emoji: "😏",
    label: "센스있게",
    description: "웃기면서 여운 남기기",
    tones: ["센스", "섹시"],
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    id: "cool",
    emoji: "🧊",
    label: "쿨하게",
    description: "별로 신경 안 쓰는 것처럼",
    tones: ["쿨", "논리적"],
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
];

// 개별 톤 스타일 (고급 옵션용)
const TONE_STYLES: Record<ToneType, { emoji: string; desc: string }> = {
  친근: { emoji: "😊", desc: "편하고 다정하게" },
  쿨: { emoji: "😎", desc: "담백하고 멋있게" },
  애교: { emoji: "🥰", desc: "귀엽고 사랑스럽게" },
  직진: { emoji: "💪", desc: "확실하게 밀어붙이기" },
  센스: { emoji: "✨", desc: "재치있고 유머있게" },
  섹시: { emoji: "🔥", desc: "은근히 설레게" },
  로맨틱: { emoji: "💕", desc: "달달하고 로맨틱하게" },
  솔직: { emoji: "🙂", desc: "있는 그대로 담백하게" },
  논리적: { emoji: "🧠", desc: "이성적이고 차분하게" },
  츤데레: { emoji: "😤", desc: "관심 없는 척 하면서" },
  팩폭: { emoji: "💣", desc: "팩트로 때리기" },
};

interface GeneratedReply {
  id: string;
  text: string;
  preset: string;
  emoji: string;
}

export default function ReplyGenerator({
  characterName,
  characterId,
  onBack,
}: ReplyGeneratorProps) {
  const router = useRouter();
  const [receivedMessage, setReceivedMessage] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<IntentPreset | null>(null);
  const [selectedTones, setSelectedTones] = useState<ToneType[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedReplies, setGeneratedReplies] = useState<GeneratedReply[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 유료화 관련 상태
  const [freeRemaining, setFreeRemaining] = useState(DAILY_FREE_LIMIT);
  const [arrowBalance, setArrowBalance] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showArrowUsedToast, setShowArrowUsedToast] = useState(false);

  // 초기 로드 시 잔여 횟수 및 화살 확인
  useEffect(() => {
    setFreeRemaining(getRemainingFreeCount());
    setArrowBalance(getArrowBalance());
  }, []);

  // 화살 잔액 업데이트 (생성 후)
  const refreshBalances = () => {
    setFreeRemaining(getRemainingFreeCount());
    setArrowBalance(getArrowBalance());
  };

  // 프리셋 선택 핸들러
  const handlePresetSelect = (preset: IntentPreset) => {
    setSelectedPreset(preset);
    setSelectedTones(preset.tones);
    setShowAdvanced(false);
  };

  // 개별 톤 토글 (고급 옵션)
  const handleToneToggle = (tone: ToneType) => {
    setSelectedPreset(null); // 프리셋 선택 해제
    setSelectedTones(prev => 
      prev.includes(tone) 
        ? prev.filter(t => t !== tone)
        : [...prev, tone].slice(0, 3) // 최대 3개
    );
  };

  // AI 답장 생성
  const handleGenerate = async () => {
    if (!receivedMessage.trim() || selectedTones.length === 0) return;

    // 무료 사용 가능 여부 체크
    const isFree = canUseForFree();
    
    if (!isFree) {
      const currentBalance = getArrowBalance();
      if (currentBalance < ARROW_COST_PER_REPLY) {
        setShowPaywall(true);
        return;
      }
      useArrowSync(ARROW_COST_PER_REPLY);
      setShowArrowUsedToast(true);
      setTimeout(() => setShowArrowUsedToast(false), 2000);
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: receivedMessage,
          tones: selectedTones, // 복수 톤 전달
          characterId,
          characterName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "답장 생성에 실패했습니다");
      }

      if (isFree) {
        incrementUsage();
      }

      const replies: GeneratedReply[] = data.replies.map((text: string, idx: number) => ({
        id: `reply-${idx}-${Date.now()}`,
        text,
        preset: selectedPreset?.label || selectedTones.join("+"),
        emoji: selectedPreset?.emoji || "✨",
      }));

      setGeneratedReplies(replies);
      setError(null);
      refreshBalances();
    } catch (err) {
      if (generatedReplies.length === 0) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 답장 복사
  const handleCopy = async (reply: GeneratedReply) => {
    try {
      await navigator.clipboard.writeText(reply.text);
      setCopiedId(reply.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // 클립보드 실패 시 무시
    }
  };

  // 화살로 생성하기
  const handleUseArrow = () => {
    setShowPaywall(false);
    handleGenerate();
  };

  const canGenerate = receivedMessage.trim() && selectedTones.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">
      <div className="mx-auto max-w-md px-5 py-6">
        {/* 헤더 */}
        <header className="mb-6">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                ✨
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI 답장 생성기</h1>
                <p className="text-sm text-purple-600">
                  {characterName} 스타일로 답장해드려요
                </p>
              </div>
            </div>
            {/* 화살 잔액 표시 */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-100 text-pink-600 text-sm font-medium">
              <span>💘</span>
              <span>{arrowBalance}</span>
            </div>
          </div>
        </header>

        {/* 무료 횟수 표시 */}
        <div className="mb-5 p-3 rounded-xl bg-white/70 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">오늘 무료 {DAILY_FREE_LIMIT}회 중</span>
            <span className="text-sm font-bold text-purple-600">{freeRemaining}회 남음</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${(freeRemaining / DAILY_FREE_LIMIT) * 100}%` }}
            />
          </div>
        </div>

        {/* 1. 의도 기반 프리셋 선택 (먼저!) */}
        <section className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🎯 어떻게 답장할까요?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {INTENT_PRESETS.map((preset) => {
              const isSelected = selectedPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? `${preset.bgColor} border-current ${preset.color} scale-[1.02] shadow-md`
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{preset.emoji}</span>
                    <span className={`font-bold ${isSelected ? preset.color : "text-gray-800"}`}>
                      {preset.label}
                    </span>
                  </div>
                  <p className={`text-xs ${isSelected ? preset.color : "text-gray-500"}`}>
                    {preset.description}
                  </p>
                  {isSelected && (
                    <div className="mt-2 flex gap-1">
                      {preset.tones.map(tone => (
                        <span key={tone} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60">
                          {TONE_STYLES[tone].emoji} {tone}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 고급 옵션 토글 */}
        <section className="mb-5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            <span>⚙️</span>
            <span>직접 고를래요 (고급)</span>
            <span className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>▼</span>
          </button>
          
          {showAdvanced && (
            <div className="mt-3 p-4 rounded-2xl bg-white border border-gray-200">
              <p className="text-xs text-gray-500 mb-3">최대 3개까지 선택 가능</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TONE_STYLES) as ToneType[]).map((tone) => {
                  const style = TONE_STYLES[tone];
                  const isSelected = selectedTones.includes(tone);
                  return (
                    <button
                      key={tone}
                      onClick={() => handleToneToggle(tone)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-purple-100 border-purple-300 text-purple-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="mr-1">{style.emoji}</span>
                      {tone}
                    </button>
                  );
                })}
              </div>
              {selectedTones.length > 0 && !selectedPreset && (
                <p className="mt-3 text-xs text-purple-600">
                  선택: {selectedTones.map(t => `${TONE_STYLES[t].emoji}${t}`).join(" + ")}
                </p>
              )}
            </div>
          )}
        </section>

        {/* 2. 받은 메시지 입력 */}
        <section className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💬 상대방이 뭐라고 했어요?
          </label>
          <textarea
            value={receivedMessage}
            onChange={(e) => setReceivedMessage(e.target.value)}
            placeholder="상대방 메시지를 입력해주세요..."
            className="w-full h-20 rounded-2xl border-2 border-purple-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
          />
        </section>

        {/* 3. 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className={`w-full py-4 rounded-2xl font-bold text-white transition-all mb-6 ${
            !canGenerate || isGenerating
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] shadow-lg"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">✨</span>
              <span>답장 만드는 중...</span>
            </span>
          ) : !canGenerate ? (
            <span className="flex items-center justify-center gap-2">
              <span>👆</span>
              <span>메시지와 스타일을 선택해주세요</span>
            </span>
          ) : freeRemaining > 0 ? (
            <span className="flex items-center justify-center gap-2">
              <span>{selectedPreset?.emoji || "✨"}</span>
              <span>{selectedPreset?.label || "선택한 스타일"}로 답장 생성</span>
              <span className="text-xs opacity-80">(무료)</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🏹</span>
              <span>화살 1개로 생성하기</span>
            </span>
          )}
        </button>

        {/* 에러 메시지 */}
        {error && generatedReplies.length === 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 relative">
            <button 
              onClick={() => setError(null)}
              className="absolute top-2 right-2 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
            <p className="text-sm text-red-600 text-center">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* 생성된 답장들 */}
        {generatedReplies.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>💌</span>
              <span>이렇게 답장해보세요</span>
            </h2>
            
            {generatedReplies.map((reply, index) => (
              <div
                key={reply.id}
                className="relative rounded-2xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 번호 배지 */}
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  {index + 1}
                </div>
                
                {/* 답장 내용 */}
                <p className="text-gray-800 text-[15px] leading-relaxed pr-16 mb-2">
                  {reply.text}
                </p>
                
                {/* 복사 버튼 */}
                <button
                  onClick={() => handleCopy(reply)}
                  className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copiedId === reply.id
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700"
                  }`}
                >
                  {copiedId === reply.id ? "복사됨! ✓" : "복사"}
                </button>
                
                {/* 스타일 태그 */}
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600">
                  <span>{reply.emoji}</span>
                  <span>{reply.preset}</span>
                </div>
              </div>
            ))}
            
            {/* 재생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-white border-2 border-purple-200 text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>다른 답장 보기</span>
              {freeRemaining === 0 && <span className="text-xs opacity-70">(🏹 1개)</span>}
            </button>
          </section>
        )}

        {/* 하단 안내 */}
        <p className="mt-8 text-center text-[10px] text-gray-400">
          AI가 제안하는 답장이에요. 상황에 맞게 수정해서 사용하세요 😊
        </p>
      </div>

      {/* 화살 사용 토스트 */}
      {showArrowUsedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-medium shadow-lg animate-bounce">
          🏹 화살 1개 사용!
        </div>
      )}

      {/* 페이월 모달 */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <span className="text-3xl">😢</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                오늘 무료 답장을 다 썼어요
              </h3>
              <p className="text-sm text-gray-500">
                화살로 계속 이용하거나<br/>
                내일 다시 만나요!
              </p>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600">내 화살</span>
              <span className="font-bold text-pink-600 flex items-center gap-1">
                <span>💘</span>
                <span>{arrowBalance}개</span>
              </span>
            </div>

            {arrowBalance >= ARROW_COST_PER_REPLY ? (
              <>
                <button
                  onClick={handleUseArrow}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold mb-3 hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  🏹 화살 {ARROW_COST_PER_REPLY}개로 생성하기
                </button>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                >
                  다음에 할게요
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-xl bg-pink-50 border border-pink-200">
                  <p className="text-sm text-pink-600 text-center">
                    화살이 부족해요! 충전하고 계속하세요 💕
                  </p>
                </div>
                <button
                  onClick={() => router.push("/shop")}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold mb-3 hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2"
                >
                  <span>💘</span>
                  <span>화살 충전하러 가기</span>
                </button>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                >
                  다음에 할게요
                </button>
              </>
            )}

            <p className="mt-4 text-center text-[10px] text-gray-400">
              매일 자정에 무료 {DAILY_FREE_LIMIT}회가 충전돼요!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
