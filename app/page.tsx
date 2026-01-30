"use client";

import { useState, useEffect } from "react";
import { calculateManse, type ManseResult, type BirthInput, type LunarApiResponse, type Element, type TrustLevel } from "./lib/saju";

// ========================
// 오행 UI 스타일
// ========================
const elementStyles: Record<Element, { bg: string; text: string; cellBg: string; cellText: string }> = {
  목: { bg: "bg-emerald-50", text: "text-emerald-600", cellBg: "bg-emerald-500", cellText: "text-white" },
  화: { bg: "bg-red-50", text: "text-red-500", cellBg: "bg-red-500", cellText: "text-white" },
  토: { bg: "bg-amber-50", text: "text-amber-600", cellBg: "bg-amber-400", cellText: "text-amber-900" },
  금: { bg: "bg-slate-100", text: "text-slate-500", cellBg: "bg-slate-200", cellText: "text-slate-700" },
  수: { bg: "bg-blue-50", text: "text-blue-500", cellBg: "bg-blue-500", cellText: "text-white" },
};

// ========================
// API 호출 함수
// ========================
async function fetchLunarData(year: number, month: number, day: number): Promise<LunarApiResponse> {
  try {
    const response = await fetch(`/api/lunar?year=${year}&month=${month}&day=${day}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("음력 API 호출 오류:", error);
    return { success: false, error: "API 호출 실패" };
  }
}

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

function BirthInfoForm({ 
  onSubmit, 
  initialData 
}: { 
  onSubmit: (data: FormData) => void;
  initialData?: FormData | null;
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
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
                {years.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">월</option>
                {months.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm" required>
                <option value="">일</option>
                {days.map((d) => <option key={d} value={d}>{d}일</option>)}
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
                  {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
                </select>
                <select value={minute} onChange={(e) => setMinute(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm">
                  <option value="">분</option>
                  {minutes.map((m) => <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}분</option>)}
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

/** 캐릭터 타입 정의 */
interface CharacterType {
  id: string;
  name: string;
  declaration: string; // 한 줄 선언문 "너는 이런 사람이다"
  description: string; // 2~3줄 성격 설명
  empathy: string[]; // 공감 문장 3개
  strengths: string[]; // 강점 2~3개
  weaknesses: string[]; // 취약 포인트 1~2개
  color: string;
  icon: string;
  // legacy fields for compatibility
  points: string[];
  summary: string;
}

/** 주도+보조 오행 조합 키 생성 */
function getComboKey(primary: Element, secondary: Element | null): string {
  if (!secondary) return primary;
  return `${primary}_${secondary}`;
}

/** 캐릭터 데이터베이스 (주도+보조 조합별) */
const CHARACTER_DB: Record<string, CharacterType> = {
  // ========== 화 주도 ==========
  "화_목": {
    id: "fire_wood",
    name: "점화 본능",
    declaration: "넌 생각하기 전에 이미 불 지르고 있는 사람이야",
    description: "뭔가 시작하는 건 숨 쉬듯 자연스러운데,\n그걸 유지하는 건 관심 밖이야.\n새 불꽃이 더 재밌거든.",
    empathy: [
      "일 벌리는 건 쉬운데 마무리가 세상 어려움",
      "새 아이디어 떠오르면 지금 하던 거 까먹음",
      "열정적이라는 말 자주 듣는데 본인은 그냥 하고 싶어서 함"
    ],
    strengths: ["추진력 만렙, 시작하면 일단 간다", "분위기를 확 바꾸는 에너지"],
    weaknesses: ["브레이크가 고장난 게 아니라 애초에 없었음"],
    color: "bg-red-500", icon: "🔥",
    points: [], summary: "불 붙이는 건 본능, 끄는 건 남의 일"
  },
  "화_금": {
    id: "fire_metal",
    name: "칼날 위의 불꽃",
    declaration: "넌 뜨겁게 달리면서도 어디로 가는지 아는 사람이야",
    description: "열정은 넘치는데 계산도 해.\n남들 눈엔 무모해 보여도\n본인 머릿속엔 계획이 있어.",
    empathy: [
      "화끈하게 지르면서도 영수증은 챙기는 편",
      "감정적으로 보여도 결론은 논리적임",
      "욱하는 것 같지만 진짜 화나면 오히려 차가워짐"
    ],
    strengths: ["뜨거운 추진력 + 날카로운 판단력", "싸울 때 포인트 딱 잡아냄"],
    weaknesses: ["가끔 자기 기준이 너무 높아서 스스로도 지침"],
    color: "bg-orange-600", icon: "⚔️",
    points: [], summary: "열정과 냉정 사이를 질주 중"
  },
  "화_수": {
    id: "fire_water",
    name: "끓는 주전자",
    declaration: "넌 뜨거웠다 차가웠다 하는 극과 극 사람이야",
    description: "속에서 부글부글 끓고 있는데\n밖으로는 잘 안 티 내.\n근데 가끔 뚜껑이 열림.",
    empathy: [
      "겉으론 쿨한 척하는데 속은 이미 불타는 중",
      "감정 조절 잘한다고 들으면서 속으론 폭발 직전일 때 있음",
      "한번 폭발하면 본인도 놀람"
    ],
    strengths: ["감정을 에너지로 바꾸는 능력", "깊은 생각 + 강한 실행력"],
    weaknesses: ["내면의 충돌이 잦아서 혼자 지칠 때 있음"],
    color: "bg-purple-600", icon: "🌋",
    points: [], summary: "겉은 호수, 속은 용암"
  },
  "화_토": {
    id: "fire_earth",
    name: "안전한 불장난",
    declaration: "넌 뜨겁지만 어디서 멈춰야 하는지 아는 사람이야",
    description: "열정은 있는데 막 지르진 않아.\n안전한 범위 안에서 최대한 뜨거워지는 타입.\n의외로 현실적이야.",
    empathy: [
      "도전적으로 보이는데 리스크 계산 다 하고 함",
      "남들 앞에서 불 쇼하고 집 가서 후회 안 할 정도만 함",
      "열정적이면서도 현실 감각 있다는 말 자주 들음"
    ],
    strengths: ["열정을 지속 가능하게 관리함", "안정감 있는 추진력"],
    weaknesses: ["안전을 추구하다 기회를 놓칠 때가 있음"],
    color: "bg-rose-500", icon: "🏕️",
    points: [], summary: "불은 활활, 근데 모닥불 수준으로 컨트롤 중"
  },
  
  // ========== 수 주도 ==========
  "수_화": {
    id: "water_fire",
    name: "차가운 열정가",
    declaration: "넌 겉은 냉정한데 속에 불씨를 품고 있는 사람이야",
    description: "쿨해 보이는데 관심 있는 건 진심이야.\n다만 티를 잘 안 내서 남들이 모를 뿐.\n불붙으면 그때부터 무서움.",
    empathy: [
      "관심 없는 척하다가 갑자기 빠지면 제대로 빠짐",
      "감정 표현 서툴러서 오해 살 때 있음",
      "진짜 화나면 조용해지는 타입"
    ],
    strengths: ["필요할 때 폭발하는 집중력", "깊은 내면과 강한 의지"],
    weaknesses: ["속마음 표현이 서툴러서 답답할 때 있음"],
    color: "bg-indigo-600", icon: "🧊",
    points: [], summary: "얼음 속에 숨겨둔 불씨"
  },
  "수_목": {
    id: "water_wood",
    name: "조용한 성장러",
    declaration: "넌 눈에 안 띄게 계속 자라고 있는 사람이야",
    description: "겉으론 별 거 안 하는 것 같은데\n뒤에서 꾸준히 뭔가 하고 있어.\n어느 날 보면 저만치 가 있음.",
    empathy: [
      "티 안 내고 혼자 공부하다가 갑자기 결과물 냄",
      "조용히 하는 게 편해서 존재감이 없을 때 있음",
      "천천히 가는 것 같아도 결국 목표까지 감"
    ],
    strengths: ["꾸준함의 끝판왕", "깊이 있는 성장"],
    weaknesses: ["존재감 어필이 약해서 노력을 못 알아볼 때 있음"],
    color: "bg-teal-600", icon: "🌿",
    points: [], summary: "조용히 뿌리 내리고 천천히 하늘로"
  },
  "수_금": {
    id: "water_metal",
    name: "얼음 칼날",
    declaration: "넌 감정 없이 정확하게 벨 수 있는 사람이야",
    description: "상황 판단이 냉철하고\n필요하면 감정 빼고 결정해.\n냉정하다기보단 합리적인 거야.",
    empathy: [
      "감정적인 결정 잘 못 해서 차갑다고 오해받음",
      "논리적으로 맞으면 인정해, 내 의견이 틀려도",
      "팩트 폭격기라는 말 들어봤을 듯"
    ],
    strengths: ["냉철한 판단력", "흔들리지 않는 기준"],
    weaknesses: ["너무 냉정해 보여서 벽 느끼는 사람 있음"],
    color: "bg-slate-600", icon: "🔪",
    points: [], summary: "감정은 OFF, 이성은 MAX"
  },
  "수_토": {
    id: "water_earth",
    name: "잔잔한 호수",
    declaration: "넌 깊은데 흔들리지 않는 사람이야",
    description: "속은 깊은데 겉은 고요해.\n급하게 안 움직이고 천천히 생각해.\n결론 내면 잘 안 바뀜.",
    empathy: [
      "빨리빨리 재촉받으면 스트레스임",
      "결정 느린 편인데 한번 정하면 번복 없음",
      "조용하다고 생각 없는 거 아님, 오히려 더 많이 함"
    ],
    strengths: ["깊은 사고력", "흔들리지 않는 안정감"],
    weaknesses: ["변화에 적응하는 데 시간 좀 걸림"],
    color: "bg-cyan-700", icon: "🏔️",
    points: [], summary: "고요한 수면 아래 깊은 세계가 있음"
  },
  
  // ========== 목 주도 ==========
  "목_화": {
    id: "wood_fire",
    name: "불타는 성장판",
    declaration: "넌 멈추면 죽는다고 생각하는 사람이야",
    description: "뭔가 해야 직성이 풀려.\n성장하고 있다는 느낌이 없으면 불안해.\n근데 그 에너지가 진짜 무서움.",
    empathy: [
      "가만히 있으면 몸에 벌레 기어다니는 느낌",
      "성장하고 있다는 느낌 없으면 우울해짐",
      "주변에서 좀 쉬라고 하는데 쉬는 게 더 힘듦"
    ],
    strengths: ["압도적인 성장 의지", "멈추지 않는 추진력"],
    weaknesses: ["번아웃 주의보, 자기 관리가 약점"],
    color: "bg-lime-600", icon: "🌳",
    points: [], summary: "성장 본능이 불처럼 타오르는 중"
  },
  "목_수": {
    id: "wood_water",
    name: "영양만점 새싹",
    declaration: "넌 생각하면서 자라는 똑똑한 식물이야",
    description: "그냥 뻗어나가는 게 아니라\n생각하면서 자라.\n방향 정하고 효율적으로 움직여.",
    empathy: [
      "열심히 하는데 막 하는 건 아님, 계획 있음",
      "배우는 거 좋아해서 자기계발에 시간 많이 씀",
      "성장은 하고 싶은데 무모한 건 싫음"
    ],
    strengths: ["전략적인 성장", "배움에 대한 끝없는 갈증"],
    weaknesses: ["생각만 하다가 타이밍 놓칠 때 있음"],
    color: "bg-emerald-500", icon: "📚",
    points: [], summary: "물 먹고 지식 먹고 쑥쑥 자라는 중"
  },
  "목_금": {
    id: "wood_metal",
    name: "정밀 가지치기",
    declaration: "넌 성장하되 필요 없는 건 잘라내는 사람이야",
    description: "자라긴 자라는데 막 자라진 않아.\n불필요한 건 쳐내면서 성장해.\n효율 중시하는 성장러.",
    empathy: [
      "시간 낭비 싫어서 필요 없으면 안 함",
      "성장은 하고 싶은데 정리도 동시에 함",
      "인맥 정리도 과감하게 하는 편"
    ],
    strengths: ["효율적인 성장", "선택과 집중의 달인"],
    weaknesses: ["너무 빨리 쳐내서 아까울 때도 있음"],
    color: "bg-green-600", icon: "✂️",
    points: [], summary: "자라면서 동시에 정리 중"
  },
  "목_토": {
    id: "wood_earth",
    name: "뿌리 깊은 나무",
    declaration: "넌 느리지만 쓰러지지 않는 사람이야",
    description: "빨리 자라진 않는데\n기초가 탄탄해서 흔들리지 않아.\n오래 갈 사람임.",
    empathy: [
      "속도보다 확실한 걸 추구함",
      "기반 없이 시작하는 거 불안해함",
      "느리다고 무시당하는데 결국 내가 남아있음"
    ],
    strengths: ["탄탄한 기본기", "흔들리지 않는 성장"],
    weaknesses: ["초반 속도가 느려서 조급할 때 있음"],
    color: "bg-amber-500", icon: "🌲",
    points: [], summary: "뿌리부터 제대로 내리는 중"
  },
  
  // ========== 토 주도 ==========
  "토_화": {
    id: "earth_fire",
    name: "용암 대지",
    declaration: "넌 평소엔 조용한데 한번 터지면 진짜 터지는 사람이야",
    description: "겉은 안정적인데 속에 불이 있어.\n평소엔 참는데 한계 오면\n주변이 다 알 정도로 터짐.",
    empathy: [
      "참을 인이 많은 편인데 그게 쌓이면 폭발",
      "화났을 때 무서운 사람이라고 들어봤을 듯",
      "평소엔 순한데 진짜 화나면 손 못 씀"
    ],
    strengths: ["폭발적인 지구력", "참다가 터지면 무서운 힘"],
    weaknesses: ["참다가 터지는 패턴이 반복될 수 있음"],
    color: "bg-orange-700", icon: "🌋",
    points: [], summary: "땅 속 마그마 대기 중"
  },
  "토_수": {
    id: "earth_water",
    name: "지하수맥",
    declaration: "넌 겉으론 안 보이는데 속이 깊은 사람이야",
    description: "표면적으론 드러나는 게 없는데\n파면 팔수록 뭔가 나와.\n말 안 해서 그렇지 속은 꽉 차있음.",
    empathy: [
      "말수 적어서 속을 모르겠다는 말 자주 들음",
      "겉으론 무덤덤한데 실제론 생각 많이 함",
      "감정 표현 잘 안 해서 오해 살 때 있음"
    ],
    strengths: ["깊은 내면", "묵묵히 해내는 지구력"],
    weaknesses: ["표현 안 해서 답답함을 줄 때 있음"],
    color: "bg-stone-600", icon: "💎",
    points: [], summary: "겉은 평범한 땅, 속은 보물 저장소"
  },
  "토_목": {
    id: "earth_wood",
    name: "정원사",
    declaration: "넌 안정적인 환경에서 뭔가를 키우는 사람이야",
    description: "자기가 직접 뻗어나가기보단\n뭔가를 키우고 가꾸는 데 재능 있어.\n기다릴 줄 아는 사람.",
    empathy: [
      "내가 잘되는 것보다 내 사람들 잘되는 게 뿌듯",
      "기다리는 거 잘해서 급한 사람들 이해 안 됨",
      "가꾸고 돌보는 일에 보람 느낌"
    ],
    strengths: ["돌봄의 능력", "인내심 만렙"],
    weaknesses: ["자기 일은 뒷전일 때가 있음"],
    color: "bg-lime-700", icon: "🌷",
    points: [], summary: "내 정원에서 남들 꽃 피우는 중"
  },
  "토_금": {
    id: "earth_metal",
    name: "바위 조각가",
    declaration: "넌 단단한 기반 위에서 깎아내는 사람이야",
    description: "기초가 튼튼해야 일을 해.\n그리고 군더더기를 깎아내.\n남는 건 본질만.",
    empathy: [
      "확실한 것만 믿는 편이라 모험은 별로",
      "복잡한 거 싫고 단순하고 깔끔한 거 좋아함",
      "쓸데없는 건 인간관계든 물건이든 정리함"
    ],
    strengths: ["본질을 꿰뚫는 눈", "단단한 기본기"],
    weaknesses: ["융통성이 부족해 보일 때 있음"],
    color: "bg-gray-600", icon: "🗿",
    points: [], summary: "단단한 땅 위에서 핵심만 남기는 중"
  },
  
  // ========== 금 주도 ==========
  "금_화": {
    id: "metal_fire",
    name: "담금질",
    declaration: "넌 날카로운데 불에 달궈지면 더 강해지는 사람이야",
    description: "기준이 확실한데 열정도 있어.\n차갑기만 한 게 아니라\n필요하면 뜨겁게 달아오름.",
    empathy: [
      "평소엔 냉정한데 진심인 것 앞에선 달라짐",
      "할 말은 하는 편인데 감정 담긴 말은 더 강력함",
      "차갑다가 갑자기 뜨거워지면 주변이 당황함"
    ],
    strengths: ["정밀함 + 열정의 조합", "진심일 때 폭발하는 에너지"],
    weaknesses: ["온도차가 커서 종잡기 어려울 수 있음"],
    color: "bg-red-700", icon: "⚒️",
    points: [], summary: "불에 달궈지면 더 날카로워지는 중"
  },
  "금_수": {
    id: "metal_water",
    name: "심해의 칼날",
    declaration: "넌 깊은 곳에서 조용히 벨 준비를 하는 사람이야",
    description: "겉으론 잠잠한데\n속에선 계속 갈고 있어.\n한번 꺼내면 끝을 봄.",
    empathy: [
      "평소엔 조용한데 일처리 들어가면 무서워짐",
      "준비 없이 시작하는 거 싫어함",
      "말 적은 편인데 할 말은 정확하게 함"
    ],
    strengths: ["철저한 준비성", "결정적 순간의 정확성"],
    weaknesses: ["준비가 너무 길어서 타이밍 놓칠 때 있음"],
    color: "bg-blue-800", icon: "🗡️",
    points: [], summary: "조용히 칼 가는 소리만 들림"
  },
  "금_목": {
    id: "metal_wood",
    name: "가위손 정원사",
    declaration: "넌 자르면서 동시에 키우는 사람이야",
    description: "성장도 시키는데 가지치기도 함.\n키우면서 다듬어.\n효율적인 양육가 스타일.",
    empathy: [
      "잘 안되는 건 빨리 손절하고 되는 것에 집중",
      "가르칠 때 칭찬보다 피드백이 더 많은 편",
      "성장시키는데 감정은 잘 안 넣음"
    ],
    strengths: ["효율적인 육성 능력", "명확한 피드백"],
    weaknesses: ["너무 날카로운 피드백에 상처받는 사람 있음"],
    color: "bg-emerald-700", icon: "🌿",
    points: [], summary: "자르면서 키우는 신기한 재능"
  },
  "금_토": {
    id: "metal_earth",
    name: "철벽 요새",
    declaration: "넌 들어오려면 통과해야 할 게 많은 사람이야",
    description: "기준이 확실하고 기반도 단단해.\n쉽게 들이지 않는데\n한번 들이면 끝까지 책임져.",
    empathy: [
      "아무나 친해지지 않는 편",
      "한번 인정하면 진짜 내 편으로 대우함",
      "신뢰 쌓는 데 시간 걸리는 편"
    ],
    strengths: ["단단한 신뢰 구축", "한번 맺은 관계는 확실함"],
    weaknesses: ["첫 진입장벽이 높아서 관계가 좁을 수 있음"],
    color: "bg-slate-700", icon: "🏰",
    points: [], summary: "들어오기 어렵지만 들어오면 천국"
  },
  
  // ========== 균형형 ==========
  "balance": {
    id: "balance",
    name: "만능 밸런서",
    declaration: "넌 어디서든 맞춰서 살아남는 사람이야",
    description: "특별히 튀는 것 없이 다 조금씩 있어.\n그래서 어디든 적응해.\n근데 가끔 나도 내가 뭔지 모를 때 있음.",
    empathy: [
      "다 잘하는 것 같은데 진짜 잘하는 게 뭔지 모름",
      "어디 가든 적응은 잘하는데 소속감이 애매함",
      "뭘 해도 무난하게 해서 존재감이 없을 때 있음"
    ],
    strengths: ["적응력 만렙", "어디서든 1인분 함"],
    weaknesses: ["정체성이 불분명할 때 혼란스러움"],
    color: "bg-gradient-to-r from-rose-400 to-blue-400", icon: "🎭",
    points: [], summary: "모든 에너지가 눈치 게임 중"
  },
  
  // ========== 극단적 집중형 (단일 오행이 4개 이상) ==========
  "화_극단": {
    id: "fire_extreme",
    name: "폭주 기관차",
    declaration: "넌 달리다가 탈선해도 계속 달리는 사람이야",
    description: "멈추는 법을 몰라.\n아니, 멈추기 싫어.\n태우고 부수고 그래야 성에 차.",
    empathy: [
      "쉬라는 말 들으면 오히려 더 하고 싶어짐",
      "지쳐서 쓰러져도 다음 날 또 달림",
      "열정적이라기보다 그냥 안 하면 답답한 것"
    ],
    strengths: ["한계를 모르는 추진력", "태워버리는 강렬함"],
    weaknesses: ["브레이크가 고장남, 번아웃 위험"],
    color: "bg-red-600", icon: "🚂",
    points: [], summary: "멈추면 죽는 상어 같은 삶"
  },
  "수_극단": {
    id: "water_extreme",
    name: "심해어",
    declaration: "넌 아무도 없는 깊은 곳이 제일 편한 사람이야",
    description: "사람들 사이에 있으면 숨이 막혀.\n혼자 있어야 비로소 생각이 돼.\n그 깊이가 무기야.",
    empathy: [
      "혼자 있는 시간 없으면 미쳐버릴 것 같음",
      "사람 많은 데 있으면 에너지가 빨림",
      "깊게 생각하는 게 습관이라 단순한 게 어려움"
    ],
    strengths: ["누구도 따라올 수 없는 깊이", "혼자서도 해내는 능력"],
    weaknesses: ["너무 깊어서 소통이 어려울 때 있음"],
    color: "bg-blue-900", icon: "🐙",
    points: [], summary: "심해에서 혼자 빛나는 중"
  },
  "목_극단": {
    id: "wood_extreme",
    name: "정글의 왕",
    declaration: "넌 뻗어나가다가 숲을 이루는 사람이야",
    description: "성장 욕구가 미쳤어.\n하나로 안 끝나고 계속 확장해.\n멈추면 시들어버릴 것 같은 공포가 있음.",
    empathy: [
      "한 분야로 안 끝나고 계속 새로운 거 함",
      "정체되면 불안해서 뭐라도 해야 함",
      "성장하고 있다는 느낌이 삶의 의미임"
    ],
    strengths: ["무한 확장 능력", "어디서든 뿌리내림"],
    weaknesses: ["너무 많이 벌려서 관리가 안 될 때 있음"],
    color: "bg-green-700", icon: "🌴",
    points: [], summary: "자라다가 숲이 된 케이스"
  },
  "토_극단": {
    id: "earth_extreme",
    name: "움직이지 않는 산",
    declaration: "넌 세상이 뒤집혀도 그 자리인 사람이야",
    description: "변화가 싫어.\n아니, 필요 없어.\n이대로 충분하고 이대로 갈 거야.",
    empathy: [
      "바꾸라는 말 들으면 왜?가 먼저 나옴",
      "익숙한 게 좋고 새로운 건 귀찮음",
      "변하지 않는 게 미덕이라고 생각함"
    ],
    strengths: ["흔들리지 않는 존재감", "끝까지 버티는 지구력"],
    weaknesses: ["변화를 거부해서 고립될 수 있음"],
    color: "bg-stone-700", icon: "🗻",
    points: [], summary: "태풍이 와도 여기 있을 예정"
  },
  "금_극단": {
    id: "metal_extreme",
    name: "외과의사",
    declaration: "넌 잘라야 할 걸 정확히 아는 사람이야",
    description: "감정? 필요 없어.\n본질만 남기고 다 쳐내.\n그게 효율적이니까.",
    empathy: [
      "쓸데없는 감정 소모 극혐",
      "논리적으로 맞으면 인정, 아니면 끝",
      "차갑다는 말 들어도 상관없음, 사실이니까"
    ],
    strengths: ["극한의 효율성", "흔들림 없는 결단력"],
    weaknesses: ["인간미가 없어 보여서 적을 만들 수 있음"],
    color: "bg-zinc-700", icon: "🔬",
    points: [], summary: "감정 제거, 본질만 남김"
  }
};

/** 오행 기반 캐릭터 타입 생성 (주도+보조 조합) */
function generateCharacterType(elements: { 목: number; 화: number; 토: number; 금: number; 수: number; total: number }): CharacterType {
  const sorted = (["목", "화", "토", "금", "수"] as Element[])
    .map((el) => ({ element: el, count: elements[el] }))
    .sort((a, b) => b.count - a.count);
  
  const primary = sorted[0]; // 주도 오행
  const secondary = sorted[1]; // 보조 오행
  const weakest = sorted.filter(s => s.count === 0); // 결핍 오행
  const range = primary.count - sorted[sorted.length - 1].count;
  
  // 1. 균형형 체크 (편차가 1 이하)
  if (range <= 1) {
    return CHARACTER_DB["balance"];
  }
  
  // 2. 극단적 집중형 (주도 오행이 4개 이상)
  if (primary.count >= 4) {
    const extremeKey = `${primary.element}_극단`;
    if (CHARACTER_DB[extremeKey]) {
      return CHARACTER_DB[extremeKey];
    }
  }
  
  // 3. 주도+보조 조합형
  const comboKey = getComboKey(primary.element, secondary.element);
  if (CHARACTER_DB[comboKey]) {
    return CHARACTER_DB[comboKey];
  }
  
  // 4. 기본 주도 오행형 (fallback)
  const fallbackKey = `${primary.element}_${sorted[1].element}`;
  return CHARACTER_DB[fallbackKey] || CHARACTER_DB["balance"];
}

/** 오행 바 퍼센트 계산 (극적으로 스케일링) */
function getElementPercent(count: number, total: number): number {
  if (total === 0) return 0;
  // 극적인 스케일링: 0개=5%, 1개=25%, 2개=50%, 3개=75%, 4개+=95%
  const scaleMap: Record<number, number> = { 0: 5, 1: 25, 2: 50, 3: 75, 4: 90, 5: 95, 6: 100, 7: 100, 8: 100 };
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
  목: "🌱",
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
        <section className="mb-6 rounded-3xl bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] p-8 text-center relative overflow-hidden">
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

        {/* [2] 공감 문장 - "이거 나야" */}
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

        {/* [4] 강점과 약점 */}
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

        {/* [2] 에너지 분포 (능력치 바) */}
        <section className="mb-6 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white/60 mb-5 tracking-wide">⚡ 에너지 게이지</h2>
          
          <div className="space-y-3">
            {(["화", "수", "목", "토", "금"] as Element[]).map((el) => (
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
          
        </section>

        {/* 공유 버튼 */}
        <button 
          className="w-full mb-4 rounded-xl bg-white py-4 text-[15px] font-bold text-[#1a1a2e] border-2 border-[#1a1a2e] transition-colors hover:bg-[#f9fafb] flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          onClick={() => {
            const shareText = `[${character.name}]\n${character.declaration}`;
            if (navigator.share) {
              navigator.share({
                title: `나의 사주 캐릭터: ${character.name}`,
                text: shareText,
              });
            } else {
              navigator.clipboard.writeText(shareText);
              alert("클립보드에 복사됨!\n" + shareText);
            }
          }}
        >
          <span>📤</span>
          <span>이 캐릭터 공유하기</span>
        </button>

        {/* [4] 마무리 멘트 */}
        <section className="mb-8 rounded-xl bg-[#f9fafb] p-4 border border-[#e5e7eb]">
          <p className="text-xs text-[#9ca3af] text-center leading-relaxed">
            이건 운세가 아니라,<br />
            사주 구조를 캐릭터처럼 풀어본 거예요 😊
          </p>
        </section>

        {/* 기준 정보 (작게) */}
        <div className="text-center mb-8">
          <p className="text-xs text-[#9ca3af]">
            기준: {ilgan.천간읽기}({pillars.day.천간}) 일간
          </p>
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

export default function ManseryeokPage() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [view, setView] = useState<"result" | "edit" | "interpret">("result");
  const [manseResult, setManseResult] = useState<ManseResult | null>(null);

  if (view === "edit") {
    return (
      <BirthInfoForm
        initialData={formData}
        onSubmit={(data) => {
          setFormData(data);
          setView("result");
        }}
      />
    );
  }

  if (view === "interpret" && manseResult) {
    return (
      <InterpretationPage
        manseResult={manseResult}
        formData={formData}
        onBack={() => setView("result")}
      />
    );
  }

  return (
    <SajuResultWithCallback
      formData={formData} 
      onEdit={() => setView("edit")}
      onInterpret={(result) => {
        setManseResult(result);
        setView("interpret");
      }}
    />
  );
}

// SajuResult에서 결과를 전달하기 위한 래퍼 컴포넌트
function SajuResultWithCallback({ 
  formData, 
  onEdit,
  onInterpret,
}: { 
  formData: FormData;
  onEdit: () => void;
  onInterpret: (result: ManseResult) => void;
}) {
  // 모든 useState는 최상위에서 호출
  const [manseResult, setManseResult] = useState<ManseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<number | null>(null);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      
      const birthInput: BirthInput = {
        calendarType: formData.calendarType,
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        day: parseInt(formData.day),
        hour: formData.hasTime && formData.hour ? parseInt(formData.hour) : undefined,
        minute: formData.hasTime && formData.minute ? parseInt(formData.minute) : undefined,
      };
      
      const lunarResponse = await fetchLunarData(birthInput.year, birthInput.month, birthInput.day);
      const result = calculateManse(birthInput, lunarResponse);
      setManseResult(result);
      setLoading(false);
    };
    
    calculate();
  }, [formData]);

  if (loading || !manseResult) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-[#3b5998] border-t-transparent rounded-full mb-4"></div>
          <p className="text-[#6b7280]">만세력 계산 중...</p>
        </div>
      </div>
    );
  }

  // 기존 SajuResult 로직
  const { birthSummary, pillars, ilgan, elements, warnings, calculationMeta } = manseResult;
  
  const trustLevelLabel: Record<string, { text: string; color: string }> = {
    confirmed: { text: "확정", color: "text-emerald-600" },
    reference: { text: "참고값", color: "text-amber-600" },
    unavailable: { text: "미확정", color: "text-gray-400" },
  };
  
  const pillarDescriptions: Record<string, string> = {
    hour: "태어난 시간으로 정해지는 기둥이에요. 위는 천간, 아래는 지지라고 불러요.",
    day: "태어난 날로 정해지는 기둥이에요. 위의 천간은 '나'를 나타내는 중심이에요.",
    month: "태어난 달로 정해지는 기둥이에요. 계절의 흐름을 담고 있어요.",
    year: "태어난 해로 정해지는 기둥이에요. 12년마다 같은 띠가 돌아와요.",
  };

  const pillarArray = [
    { ...pillars.hour, key: "hour" },
    { ...pillars.day, key: "day" },
    { ...pillars.month, key: "month" },
    { ...pillars.year, key: "year" },
  ];
  
  const selectedData = selectedPillar !== null ? pillarArray[selectedPillar] : null;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-md px-5 py-8">
        
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
            {formData.name ? `${formData.name}님의 만세력` : "당신의 만세력"}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">입력하신 정보를 기준으로 계산된 사주 구조입니다</p>
        </header>

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#f0f4ff] px-2 py-0.5 text-xs font-medium text-[#3b5998]">양력</span>
                <span className="text-[15px] font-medium text-[#1a1a2e]">
                  {birthSummary.solar.year}년 {birthSummary.solar.month}월 {birthSummary.solar.day}일
                  {birthSummary.time && (
                    <span className="ml-2 text-[#6b7280] font-normal">
                      {birthSummary.time.hour}시 {birthSummary.time.minute.toString().padStart(2, '0')}분
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#fef3c7] px-2 py-0.5 text-xs font-medium text-[#92400e]">음력</span>
                <span className="text-sm text-[#6b7280]">
                  {birthSummary.lunar.year}년 
                  {birthSummary.lunar.isLeapMonth && <span className="text-[#f59e0b]">(윤)</span>}
                  {birthSummary.lunar.month}월 {birthSummary.lunar.day}일
                </span>
              </div>
              {!birthSummary.time && (
                <p className="text-xs text-[#9ca3af]">※ 시간 미입력 - 시주 제외</p>
              )}
            </div>
            <button onClick={onEdit} className="text-xs text-[#3b5998] hover:text-[#2d4a8a] font-medium">정보 수정</button>
          </div>
        </section>


        <section className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {pillarArray.map((pillar, index) => (
              <button 
                key={pillar.key}
                onClick={() => setSelectedPillar(selectedPillar === index ? null : index)}
                disabled={!pillar.isAvailable}
                className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                  selectedPillar === index 
                    ? 'ring-2 ring-[#1a1a2e] ring-offset-2 scale-[1.02]' 
                    : pillar.isAvailable ? 'hover:scale-[1.01]' : 'opacity-50'
                }`}
              >
                <div className={`py-2.5 text-center ${
                  selectedPillar === index ? 'bg-[#1a1a2e]' : 'bg-[#e5e7eb]'
                }`}>
                  <span className={`text-xs font-semibold ${
                    selectedPillar === index ? 'text-white' : 'text-[#6b7280]'
                  }`}>
                    {pillar.label}
                  </span>
                </div>
                
                {pillar.isAvailable ? (
                  <>
                    <div className={`py-4 text-center ${elementStyles[pillar.오행천간].cellBg}`}>
                      <span className={`text-2xl font-bold ${elementStyles[pillar.오행천간].cellText}`}>{pillar.천간}</span>
                      <div className="mt-1">
                        <span className={`text-[10px] ${elementStyles[pillar.오행천간].cellText} opacity-70`}>{pillar.천간읽기}</span>
                      </div>
                    </div>
                    <div className={`py-4 text-center ${elementStyles[pillar.오행지지].cellBg}`}>
                      <span className={`text-2xl font-bold ${elementStyles[pillar.오행지지].cellText}`}>{pillar.지지}</span>
                      <div className="mt-1">
                        <span className={`text-[10px] ${elementStyles[pillar.오행지지].cellText} opacity-70`}>{pillar.지지읽기}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center bg-gray-100">
                    <span className="text-2xl text-gray-400">?</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {selectedData && selectedData.isAvailable && (
          <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border-2 border-[#1a1a2e]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1a1a2e]">{selectedData.label} 상세</h3>
              <span className="text-xs text-[#9ca3af]">클릭하여 다른 주 확인</span>
            </div>
            
            <div className="flex justify-center gap-6">
              <div className={`flex flex-col items-center p-4 rounded-xl border-2 border-[#1a1a2e] ${elementStyles[selectedData.오행천간].cellBg}`}>
                <span className="text-xs font-medium text-[#1a1a2e] mb-2 bg-white/90 px-2 py-0.5 rounded">천간</span>
                <span className={`text-5xl font-bold ${elementStyles[selectedData.오행천간].cellText}`}>{selectedData.천간}</span>
                <span className={`text-lg mt-2 ${elementStyles[selectedData.오행천간].cellText}`}>{selectedData.천간읽기}</span>
                <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold bg-white/95 ${elementStyles[selectedData.오행천간].text}`}>
                  {selectedData.오행천간}
                </span>
              </div>
              
              <div className={`flex flex-col items-center p-4 rounded-xl border-2 border-[#1a1a2e] ${elementStyles[selectedData.오행지지].cellBg}`}>
                <span className="text-xs font-medium text-[#1a1a2e] mb-2 bg-white/90 px-2 py-0.5 rounded">지지</span>
                <span className={`text-5xl font-bold ${elementStyles[selectedData.오행지지].cellText}`}>{selectedData.지지}</span>
                <span className={`text-lg mt-2 ${elementStyles[selectedData.오행지지].cellText}`}>{selectedData.지지읽기}</span>
                <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold bg-white/95 ${elementStyles[selectedData.오행지지].text}`}>
                  {selectedData.오행지지}
                </span>
              </div>
            </div>
            
            <p className="mt-4 text-xs text-[#6b7280] text-center bg-[#f9fafb] rounded-lg py-3 px-4 leading-relaxed">
              {pillarDescriptions[selectedData.key]}
            </p>
          </section>
        )}

        <section className="mb-8 rounded-xl bg-white p-5 shadow-sm border border-[#e5e7eb]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#1a1a2e]">오행 분포</h3>
            <span className="text-[11px] text-[#9ca3af]">총 {elements.total}개</span>
          </div>
          
          <div className="space-y-3">
            {(["목", "화", "토", "금", "수"] as Element[]).map((el) => {
              const count = elements[el];
              const percentage = elements.total > 0 ? (count / elements.total) * 100 : 0;
              return (
                <div key={el} className="flex items-center gap-3">
                  <div className="w-8 flex items-center justify-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${elementStyles[el].bg} ${elementStyles[el].text}`}>
                      {el}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${elementStyles[el].cellBg}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right text-xs text-[#6b7280]">{count}</span>
                </div>
              );
            })}
          </div>
          
          <p className="mt-4 text-[11px] text-[#9ca3af] text-center">
            오행 분포는 천간/지지 각 1점씩 합산 (지장간 미포함)
          </p>
        </section>

        <button 
          onClick={() => onInterpret(manseResult)}
          className="w-full rounded-xl bg-[#1a1a2e] py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#2d2d44]"
        >
          구조 해석 보기
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
