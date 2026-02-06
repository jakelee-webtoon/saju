/**
 * 오늘의 연애 결정 가이드 모듈
 * 유료 콘텐츠: 화살 1개로 열 수 있는 연애 결정 가이드
 */

import { type TodayModeResult } from "../todayMode/computeTodayMode";

// ========================
// 타입 정의
// ========================

export interface DecisionQuestion {
  id: string;
  question: string;
  emoji: string;
}

export interface DecisionResult {
  conclusion: string;
  isPositive: boolean;
  reasons: string[];
  recommendation: string;
  tone: "soft" | "direct" | "warning";
}

export interface DecisionGuide {
  question: DecisionQuestion;
  result: DecisionResult;
  dailyTag?: string; // 오늘의 특별 태그
}

// ========================
// 질문 유형
// ========================

const DECISION_QUESTIONS: DecisionQuestion[] = [
  { id: "contact", question: "오늘 먼저 연락해도 될까?", emoji: "📱" },
  { id: "confess", question: "이 고민, 지금 말해도 괜찮을까?", emoji: "💭" },
  { id: "express", question: "오늘 고백하면 부담일까?", emoji: "💝" },
  { id: "closer", question: "지금 거리를 좁혀도 될까?", emoji: "🌸" },
  { id: "wait", question: "오늘은 그냥 기다리는 게 나을까?", emoji: "⏳" },
];

// ========================
// 결론 템플릿
// ========================

const POSITIVE_CONCLUSIONS: Record<string, string[]> = {
  contact: [
    "오늘은 먼저 연락해도 좋아요",
    "지금 연락하면 자연스러울 거예요",
    "오늘은 용기 내볼 만한 날이에요",
  ],
  confess: [
    "오늘은 말해도 괜찮아요",
    "지금 털어놓으면 오히려 가벼워질 거예요",
    "솔직해져도 되는 타이밍이에요",
  ],
  express: [
    "오늘 표현하면 진심이 전해질 거예요",
    "부담보다 설렘으로 받아들일 날이에요",
    "감정을 전해도 좋은 흐름이에요",
  ],
  closer: [
    "오늘은 한 발짝 다가가도 돼요",
    "거리를 좁히기 좋은 날이에요",
    "조심스럽게 다가가면 잘 받아줄 거예요",
  ],
  wait: [
    "오늘은 기다리지 않아도 돼요",
    "먼저 움직여도 괜찮은 날이에요",
    "기다림보다 행동이 나은 타이밍이에요",
  ],
};

const NEGATIVE_CONCLUSIONS: Record<string, string[]> = {
  contact: [
    "오늘은 한 박자 쉬는 게 좋아 보여요",
    "지금은 기다려보는 게 나을 것 같아요",
    "오늘은 상대의 연락을 기다려봐요",
  ],
  confess: [
    "오늘은 조금 더 담아두는 게 좋겠어요",
    "지금보다 내일이 더 나은 타이밍이에요",
    "오늘은 마음속에 정리만 해둬요",
  ],
  express: [
    "오늘은 고백보다 신호 보내기가 좋아요",
    "조금 더 분위기를 봐도 괜찮아요",
    "서두르지 않아도 되는 날이에요",
  ],
  closer: [
    "오늘은 현재 거리 유지가 좋아요",
    "급하게 다가가면 부담될 수 있어요",
    "편안한 거리감을 유지해봐요",
  ],
  wait: [
    "오늘은 기다리는 게 현명해요",
    "지금은 여유를 갖는 게 좋겠어요",
    "참을성이 빛나는 날이에요",
  ],
};

// ========================
// 이유 템플릿
// ========================

const POSITIVE_REASONS: string[][] = [
  [
    "오늘 감정 에너지가 안정적이에요",
    "상대도 편안하게 받아들일 분위기예요",
    "진심이 잘 전달될 수 있는 날이에요",
  ],
  [
    "오늘 표현력이 좋은 날이에요",
    "말이 부드럽게 나올 타이밍이에요",
    "오해 없이 전달될 가능성이 높아요",
  ],
  [
    "오늘 용기가 자연스럽게 느껴지는 날이에요",
    "행동으로 옮기면 좋은 반응이 올 거예요",
    "지금이 아니면 아쉬울 수 있어요",
  ],
];

const NEGATIVE_REASONS: string[][] = [
  [
    "오늘 감정이 조금 예민할 수 있어요",
    "말이 의도와 다르게 전달될 수 있어요",
    "상대도 바쁜 하루일 가능성이 있어요",
  ],
  [
    "오늘은 직설적인 말투가 나오기 쉬워요",
    "상대가 부담으로 느낄 가능성이 있어요",
    "조급함이 조금 느껴지는 날이에요",
  ],
  [
    "오늘은 에너지가 약간 산만해요",
    "집중력이 분산되기 쉬운 날이에요",
    "차분하게 다시 준비하는 게 좋겠어요",
  ],
];

// ========================
// 추천 행동 템플릿
// ========================

const POSITIVE_RECOMMENDATIONS: string[] = [
  "자연스럽게 안부 문자로 시작해봐요",
  "가벼운 톤으로 먼저 말 걸어봐요",
  "지금 느낌 그대로 전해봐요",
  "짧지만 진심 담긴 메시지면 충분해요",
  "오늘의 기분 좋은 에너지를 담아봐요",
];

const NEGATIVE_RECOMMENDATIONS: string[] = [
  "오늘은 짧은 안부 정도가 가장 좋아요",
  "대신 나를 위한 시간을 가져봐요",
  "내일 더 좋은 컨디션으로 다가가요",
  "오늘은 상대 SNS나 상태만 체크해둬요",
  "마음 정리하는 시간으로 써봐요",
];

// ========================
// 일일 특별 태그
// ========================

const DAILY_TAGS = [
  { tag: "🔥 오늘은 강렬한 결정의 날", weight: 0.15 },
  { tag: "💎 연애 결정이 유난히 잘 맞는 날", weight: 0.15 },
  { tag: "🌙 차분한 마음이 필요한 날", weight: 0.2 },
  { tag: "⚡ 직감을 믿어도 되는 날", weight: 0.2 },
  { tag: "🌈 새로운 시작에 좋은 날", weight: 0.15 },
  { tag: null, weight: 0.15 }, // 태그 없음
];

// ========================
// 유틸리티 함수
// ========================

/**
 * 날짜 기반 시드 생성
 */
function getDailySeed(date: Date = new Date()): number {
  const dateStr = date.toISOString().split("T")[0];
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * 시드 기반 랜덤
 */
function seededRandom(seed: number, index: number = 0): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

/**
 * 배열에서 시드 기반 랜덤 선택
 */
function pickFromArray<T>(array: T[], seed: number, index: number = 0): T {
  const randomIndex = Math.floor(seededRandom(seed, index) * array.length);
  return array[randomIndex];
}

// ========================
// 메인 함수
// ========================

// 모드별 긍정 확률 (높을수록 긍정적 결과 나올 확률 높음)
const MODE_POSITIVE_RATES: Record<string, number> = {
  "burst": 0.75,      // 폭발 모드 - 긍정적
  "soft": 0.70,       // 부드러움 모드 - 긍정적
  "flow": 0.65,       // 흐름 모드 - 중간 긍정
  "steady": 0.60,     // 안정 모드 - 약간 긍정
  "cooldown": 0.40,   // 쿨다운 모드 - 약간 부정
  "guard": 0.35,      // 경계 모드 - 부정적
  "retreat": 0.30,    // 후퇴 모드 - 부정적
};

/**
 * 오늘의 결정 가이드 생성
 * - 날짜에 따라 질문과 결과가 달라짐
 * - todayMode에 따라 긍정/부정 결과 결정
 */
export function generateDecisionGuide(
  todayMode: TodayModeResult,
  date: Date = new Date()
): DecisionGuide {
  const seed = getDailySeed(date);
  
  // 오늘의 질문 선택
  const question = pickFromArray(DECISION_QUESTIONS, seed, 0);
  
  // 긍정/부정 결정 (모드별 확률 + 약간의 랜덤)
  const baseRate = MODE_POSITIVE_RATES[todayMode.modeId] || 0.5;
  const randomValue = seededRandom(seed, 1);
  const isPositive = randomValue < baseRate;
  
  // 결론 선택
  const conclusions = isPositive 
    ? POSITIVE_CONCLUSIONS[question.id] 
    : NEGATIVE_CONCLUSIONS[question.id];
  const conclusion = pickFromArray(conclusions, seed, 2);
  
  // 이유 선택
  const reasonSets = isPositive ? POSITIVE_REASONS : NEGATIVE_REASONS;
  const reasons = pickFromArray(reasonSets, seed, 3);
  
  // 추천 행동 선택
  const recommendations = isPositive ? POSITIVE_RECOMMENDATIONS : NEGATIVE_RECOMMENDATIONS;
  const recommendation = pickFromArray(recommendations, seed, 4);
  
  // 톤 결정
  const tones: Array<"soft" | "direct" | "warning"> = ["soft", "direct", "warning"];
  const tone = isPositive 
    ? (seededRandom(seed, 5) > 0.7 ? "direct" : "soft")
    : (seededRandom(seed, 5) > 0.7 ? "warning" : "soft");
  
  // 일일 태그 결정
  let dailyTag: string | undefined;
  const tagRandom = seededRandom(seed, 6);
  let cumulative = 0;
  for (const tagOption of DAILY_TAGS) {
    cumulative += tagOption.weight;
    if (tagRandom < cumulative) {
      dailyTag = tagOption.tag || undefined;
      break;
    }
  }
  
  return {
    question,
    result: {
      conclusion,
      isPositive,
      reasons,
      recommendation,
      tone,
    },
    dailyTag,
  };
}

// ========================
// localStorage 잠금 해제 관리
// ========================

const UNLOCK_STORAGE_KEY = "decisionGuideUnlock";

interface UnlockData {
  date: string;
  unlocked: boolean;
}

/**
 * 오늘 이미 잠금 해제했는지 확인
 */
export function isUnlockedToday(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const stored = localStorage.getItem(UNLOCK_STORAGE_KEY);
    if (!stored) return false;
    
    const data: UnlockData = JSON.parse(stored);
    const today = new Date().toISOString().split("T")[0];
    
    return data.date === today && data.unlocked;
  } catch {
    return false;
  }
}

/**
 * 오늘 잠금 해제 기록
 */
export function markUnlockedToday(): void {
  if (typeof window === "undefined") return;
  
  const today = new Date().toISOString().split("T")[0];
  const data: UnlockData = { date: today, unlocked: true };
  localStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify(data));
}

/**
 * 잠금 해제 초기화 (테스트용)
 */
export function resetUnlock(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(UNLOCK_STORAGE_KEY);
}
