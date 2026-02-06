"use client";

interface TodayStatusLineProps {
  statusOneLiner: string;
}

/**
 * 오늘의 한 줄 상태 (3인칭 관찰자 톤)
 * - 홈 화면 최상단에 배치
 * - 운세 ❌ / 컨디션 리포트 ⭕
 * - 조언, 판단 없이 상태만 서술
 */
export default function TodayStatusLine({ statusOneLiner }: TodayStatusLineProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50 p-4 border border-slate-100">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">🧭</span>
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          {statusOneLiner}
        </p>
      </div>
    </section>
  );
}
