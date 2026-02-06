/**
 * 오늘 모드 계산 로직
 * - 캐릭터 성향 + 날짜 + 사주 기반으로 오늘의 연애 흐름을 계산
 * - LLM 사용 없이 규칙 기반으로 동작
 * - 80개 이상의 연애 모드 중 하나를 선택
 */

import loveModesData from "@/app/content/todayMode/loveModes.json";

// 타입 정의
export interface LoveModeColor {
  bg: string;
  accent: string;
  text: string;
}

export interface LoveModeDetail {
  mode_label: string;
  main_sentence: string;
  reason: string;
  triggers: string[];
  one_line_guide: string;
}

export interface LoveMode {
  id: string;
  love_mode: string;
  emoji: string;
  color: LoveModeColor;
  home_summary: string;
  detail: LoveModeDetail;
}

export interface TodayModeResult {
  // 기본 정보
  modeId: string;
  modeName: string;
  modeEmoji: string;
  modeLabel: string; // "🧊 쿨다운" 형태
  
  // 색상
  color: LoveModeColor;
  
  // 홈 화면용
  homeTitle: string; // "💗 오늘의 나의 연애 모드"
  homeSummary: string; // 요약 문장 1줄
  
  // 상세 화면용
  detail: LoveModeDetail;
  
  // Legacy 필드 (기존 호환용)
  titleLine: string;
  statusLine: string;
  tipLine: string;
  statusOneLiner: string;
  loveModeLine: string;
  reasonLine: string;
  vulnerableLines: string[];
  guideLine: string;
}

/**
 * 날짜 기반 시드 생성 (같은 날은 같은 결과)
 */
function getDateSeed(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

/**
 * 시드 기반 의사 난수 생성 (0~1 사이)
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * 캐릭터 ID에서 오행 추출
 */
function getElementFromCharacterId(characterId: string): string {
  const elementMap: Record<string, string> = {
    fire: "화", water: "수", wood: "목", earth: "토", metal: "금",
    화: "화", 수: "수", 목: "목", 토: "토", 금: "금"
  };
  
  const parts = characterId.toLowerCase().split("_");
  for (const part of parts) {
    if (elementMap[part]) return elementMap[part];
  }
  return "화"; // 기본값
}

/**
 * 오행별 연애 모드 가중치
 * 각 오행의 특성에 따라 특정 모드가 나올 확률을 조정
 */
const elementModeWeights: Record<string, Record<string, number>> = {
  화: {
    rush: 3, intense: 3, direct: 3, impulsive: 2, passionate: 2,
    cooldown: 0.5, patient: 0.5, slow: 0.5, detached: 0.5
  },
  수: {
    cooldown: 3, observe: 3, mysterious: 2, overthink: 2, sensitive: 2,
    rush: 0.5, direct: 0.5, impulsive: 0.5
  },
  목: {
    hopeful: 3, adventurous: 2, curious: 2, supportive: 2, optimistic: 2,
    cooldown: 0.5, pessimistic: 0.5, detached: 0.5
  },
  토: {
    stable: 3, patient: 3, realistic: 2, careful: 2, balanced: 2,
    rush: 0.5, impulsive: 0.5, adventurous: 0.5
  },
  금: {
    realistic: 3, selective: 3, decisive: 2, boundary: 2, honest: 2,
    dreamy: 0.5, romantic: 0.5, clinging: 0.5
  }
};

/**
 * 요일별 모드 가중치 조정
 */
const dayOfWeekWeights: Record<number, Record<string, number>> = {
  0: { lonely: 1.5, healing: 1.5, lazy_love: 1.5 }, // 일요일
  1: { realistic: 1.5, focused: 1.5, careful: 1.5 }, // 월요일
  2: { communicative: 1.5, direct: 1.2 }, // 화요일
  3: { balanced: 1.5, compromising: 1.2 }, // 수요일
  4: { hopeful: 1.5, adventurous: 1.2, flirty: 1.2 }, // 목요일
  5: { playful: 1.5, romantic: 1.5, cheerful: 1.5 }, // 금요일
  6: { flutter: 1.5, affectionate: 1.5, freedom: 1.5 } // 토요일
};

/**
 * 오늘의 연애 모드 계산
 * @param characterId 캐릭터 ID
 * @param date 기준 날짜 (기본값: 오늘)
 */
export function computeTodayMode(
  characterId: string,
  date: Date = new Date()
): TodayModeResult {
  const dateSeed = getDateSeed(date);
  const dayOfWeek = date.getDay();
  const element = getElementFromCharacterId(characterId);
  
  // 모든 모드 목록
  const allModes = loveModesData.modes as LoveMode[];
  
  // 1. 각 모드의 가중치 계산
  const modeWeights = allModes.map(mode => {
    let weight = 1;
    
    // 오행 가중치 적용
    const elementWeights = elementModeWeights[element] || {};
    if (elementWeights[mode.id]) {
      weight *= elementWeights[mode.id];
    }
    
    // 요일 가중치 적용
    const dayWeights = dayOfWeekWeights[dayOfWeek] || {};
    if (dayWeights[mode.id]) {
      weight *= dayWeights[mode.id];
    }
    
    // 날짜 기반 변동 (같은 날 같은 결과를 위한 pseudo-random)
    const dateVariation = seededRandom(dateSeed + mode.id.charCodeAt(0)) * 0.5 + 0.75;
    weight *= dateVariation;
    
    return { mode, weight };
  });
  
  // 2. 가중치 기반 모드 선택
  const totalWeight = modeWeights.reduce((sum, m) => sum + m.weight, 0);
  const combinedSeed = dateSeed + characterId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let random = seededRandom(combinedSeed) * totalWeight;
  
  let selectedMode: LoveMode = allModes[0];
  for (const { mode, weight } of modeWeights) {
    random -= weight;
    if (random <= 0) {
      selectedMode = mode;
      break;
    }
  }
  
  // 3. 결과 구성
  return {
    // 기본 정보
    modeId: selectedMode.id,
    modeName: selectedMode.love_mode,
    modeEmoji: selectedMode.emoji,
    modeLabel: `${selectedMode.emoji} ${selectedMode.love_mode}`,
    
    // 색상
    color: selectedMode.color,
    
    // 홈 화면용
    homeTitle: "💗 오늘의 나의 연애 모드",
    homeSummary: selectedMode.home_summary,
    
    // 상세 화면용
    detail: selectedMode.detail,
    
    // Legacy 필드 (기존 코드 호환)
    titleLine: `⚡ 오늘 모드: ${selectedMode.love_mode}`,
    statusLine: selectedMode.detail.main_sentence,
    tipLine: selectedMode.detail.one_line_guide,
    statusOneLiner: selectedMode.home_summary,
    loveModeLine: selectedMode.home_summary,
    reasonLine: selectedMode.detail.reason,
    vulnerableLines: selectedMode.detail.triggers,
    guideLine: selectedMode.detail.one_line_guide,
  };
}

/**
 * 모든 연애 모드 목록 반환
 */
export function getAllLoveModes(): LoveMode[] {
  return loveModesData.modes as LoveMode[];
}

/**
 * 특정 모드 ID로 모드 정보 조회
 */
export function getLoveModeById(modeId: string): LoveMode | undefined {
  return (loveModesData.modes as LoveMode[]).find(m => m.id === modeId);
}
