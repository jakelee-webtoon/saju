"use client";

interface TodayLoveModeCardProps {
  loveModeLine: string;
  onClick?: () => void;
}

/**
 * 오늘의 연애 모드 카드
 * - 연애 상황에만 초점
 * - 애매 + 공감 + 해석 여지
 * - 확정/미래예측 없이 가능성/흐름만 표현
 * - 클릭 시 상세 페이지로 이동
 */
export default function TodayLoveModeCard({ loveModeLine, onClick }: TodayLoveModeCardProps) {
  return (
    <section
      onClick={onClick}
      className={`rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 p-5 border border-rose-100 transition-all ${
        onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">💕</span>
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-rose-400 mb-2 uppercase tracking-wider">
            오늘의 연애 흐름
          </h3>
          <p className="text-sm text-rose-800 leading-relaxed font-medium">
            {loveModeLine}
          </p>
        </div>
        {onClick && (
          <span className="text-rose-300 text-lg shrink-0">→</span>
        )}
      </div>
    </section>
  );
}
