"use client";

import { TodayModeResult } from "@/app/lib/todayMode/computeTodayMode";

interface TodayLovePageProps {
  todayMode: TodayModeResult;
  characterName: string;
  onBack: () => void;
}

/**
 * 오늘의 연애 운세 상세 페이지
 * - 이미지 디자인 기반
 * - 모드 정보, 왜 이런 모드인지, 흔들릴 때, 가이드 제공
 */
export default function TodayLovePage({ todayMode, characterName, onBack }: TodayLovePageProps) {
  const today = new Date();
  const dateString = today.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const handleShare = async () => {
    const shareText = `[오늘의 연애 운세]\n${dateString}\n\n${todayMode.modeLabel}\n${todayMode.statusLine}\n\n💡 ${todayMode.tipLine}\n\n🧠 ${todayMode.guideLine}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "오늘의 연애 운세",
          text: shareText,
        });
      } catch {
        // 사용자가 공유 취소한 경우
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("클립보드에 복사됐어요! 💕");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9E6] to-[#FFF5D6]">
      <div className="mx-auto max-w-md px-5 py-6">
        {/* 헤더 - 뒤로가기 */}
        <header className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 transition-colors font-medium"
          >
            <span>←</span>
            <span>돌아가기</span>
          </button>
        </header>

        {/* 메인 카드 */}
        <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm border border-amber-100 relative overflow-hidden">
          {/* 하트 데코 */}
          <div className="absolute top-4 right-4 opacity-20">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#FFB6C1">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          {/* 날짜 */}
          <p className="text-sm text-amber-500 font-medium mb-2">{dateString}</p>

          {/* 타이틀 */}
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">오늘의 연애 운세</h1>
          <p className="text-sm text-[#6b7280] mb-5">{characterName} 기준</p>

          {/* 모드 배지 */}
          <div className="flex justify-center mb-4">
            <span className="inline-block px-6 py-2.5 rounded-full bg-amber-400 text-white font-bold text-base shadow-sm">
              {todayMode.modeLabel}
            </span>
          </div>

          {/* 상태 요약 */}
          <p className="text-center text-[#374151] font-medium text-base mb-4">
            {todayMode.statusLine}
          </p>

          {/* 팁 */}
          <div className="rounded-2xl bg-amber-50 px-4 py-3 border border-amber-100">
            <p className="text-center text-amber-700 text-sm">
              💡 {todayMode.tipLine}
            </p>
          </div>
        </section>

        {/* 왜 이런 모드냐면 */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm border border-amber-100">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#1a1a2e] mb-3">
            <span>📌</span> 오늘 왜 이런 모드냐면
          </h2>
          <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line">
            {todayMode.reasonLine}
          </p>
        </section>

        {/* 흔들릴 수 있는 상황 */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm border border-amber-100">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-500 mb-3">
            <span>💬</span> 오늘 이럴 때 특히 흔들릴 수 있어
          </h2>
          <ul className="space-y-2">
            {todayMode.vulnerableLines.map((line, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-amber-400 shrink-0"></span>
                <span className="text-sm text-amber-700">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 오늘의 한 줄 가이드 */}
        <section className="mb-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-medium text-amber-800/70 mb-2">
            <span>🧠</span> 오늘의 한 줄 가이드
          </h2>
          <p className="text-base font-bold text-[#1a1a2e] leading-relaxed">
            {todayMode.guideLine}
          </p>
        </section>

        {/* 공유 버튼 */}
        <button
          onClick={handleShare}
          className="w-full mb-4 rounded-2xl bg-amber-400 py-4 text-base font-bold text-white transition-all hover:bg-amber-500 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
        >
          <span>🚗</span>
          <span>오늘의 운세 공유하기</span>
        </button>

        {/* 하단 안내 */}
        <div className="rounded-xl bg-white/60 p-3 border border-amber-100">
          <p className="text-xs text-[#9ca3af] text-center">
            이건 예언이 아니라,<br />
            오늘 네 컨디션에 맞는 리포트야 😊
          </p>
        </div>
      </div>
    </div>
  );
}
