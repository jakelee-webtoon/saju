/**
 * 오늘 모드 계산 로직
 * - 캐릭터 성향 + 날짜 기반으로 오늘의 상태를 계산
 * - LLM 사용 없이 규칙 기반으로 동작
 */

import labelsData from "@/app/content/todayMode/labels.json";
import templatesData from "@/app/content/todayMode/templates.json";
import rulesData from "@/app/content/todayMode/rules.json";

// 타입 정의
export type ModeId = "rush" | "observe" | "overheat" | "cooldown" | "sensitive" | "direct" | "doubt" | "hopeful";

export interface TodayModeResult {
  modeId: ModeId;
  modeName: string;
  modeLabel: string; // "🔥 급발진" 형태
  titleLine: string; // "⚡ 오늘 모드: 급발진 확률 ↑"
  // 홈 화면용 (3인칭 관찰자 톤)
  statusOneLiner: string; // 오늘의 한 줄 상태
  loveModeLine: string; // 오늘의 연애 모드
  // 기존 필드 (상세용)
  statusLine: string; // 상태 요약 한 줄
  tipLine: string; // 팁 한 줄
  // 상세 모달용
  reasonLine: string;
  vulnerableLines: string[];
  guideLine: string;
}

interface ModeLabel {
  id: string;
  name: string;
  emoji: string;
  shortTitle: string;
  description: string;
}

interface ModeTemplate {
  statusOneLinerTemplates: string[];
  loveModeLineTemplates: string[];
  statusLines: string[];
  tipLines: string[];
  reasonLines: string[];
  vulnerableLines: string[];
  guideLines: string[];
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
 * 가중치 배열에서 시드 기반으로 선택
 */
function weightedSelect<T>(items: T[], weights: number[], seed: number): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) {
    // 모든 가중치가 0이면 균등 분포
    const index = Math.floor(seededRandom(seed) * items.length);
    return items[index];
  }
  
  let random = seededRandom(seed) * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

/**
 * 배열에서 시드 기반으로 하나 선택
 */
function selectFromArray<T>(arr: T[], seed: number): T {
  const index = Math.floor(seededRandom(seed) * arr.length);
  return arr[index];
}

/**
 * 배열에서 시드 기반으로 여러 개 선택 (중복 없이)
 */
function selectMultipleFromArray<T>(arr: T[], count: number, seed: number): T[] {
  const result: T[] = [];
  const available = [...arr];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = Math.floor(seededRandom(seed + i * 1000) * available.length);
    result.push(available[index]);
    available.splice(index, 1);
  }
  
  return result;
}

/**
 * 오늘 모드 계산
 * @param characterId 캐릭터 ID (예: "fire_wood", "water_metal")
 * @param date 기준 날짜 (기본값: 오늘)
 */
export function computeTodayMode(
  characterId: string,
  date: Date = new Date()
): TodayModeResult {
  const dateSeed = getDateSeed(date);
  const dayOfWeek = date.getDay();
  
  // 1. 캐릭터별 기본 가중치 가져오기
  const characterWeights = (rulesData.characterModeWeights as Record<string, Record<ModeId, number>>)[characterId] 
    || rulesData.characterModeWeights["balance"];
  
  // 2. 요일 보정 적용
  const dayModifiers = (rulesData.dayOfWeekModifiers as Record<string, Record<string, number>>)[dayOfWeek.toString()] || {};
  
  // 3. 최종 가중치 계산
  const modeIds: ModeId[] = ["rush", "observe", "overheat", "cooldown", "sensitive", "direct", "doubt", "hopeful"];
  const finalWeights = modeIds.map(modeId => {
    const base = characterWeights[modeId] || 1;
    const modifier = dayModifiers[modeId] || 0;
    return Math.max(0, base + modifier);
  });
  
  // 4. 시드 기반으로 모드 선택
  const combinedSeed = dateSeed + characterId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const selectedModeId = weightedSelect(modeIds, finalWeights, combinedSeed);
  
  // 5. 라벨 정보 가져오기
  const labelInfo = labelsData.labels.find(l => l.id === selectedModeId) as ModeLabel;
  
  // 6. 템플릿에서 문장 선택
  const templates = (templatesData.templates as Record<ModeId, ModeTemplate>)[selectedModeId];
  
  // 홈 화면용 (3인칭 톤)
  const statusOneLiner = selectFromArray(templates.statusOneLinerTemplates, combinedSeed + 10);
  const loveModeLine = selectFromArray(templates.loveModeLineTemplates, combinedSeed + 11);
  
  // 기존 필드
  const statusLine = selectFromArray(templates.statusLines, combinedSeed + 1);
  const tipLine = selectFromArray(templates.tipLines, combinedSeed + 2);
  const reasonLine = selectFromArray(templates.reasonLines, combinedSeed + 3);
  const vulnerableLines = selectMultipleFromArray(templates.vulnerableLines, 3, combinedSeed + 4);
  const guideLine = selectFromArray(templates.guideLines, combinedSeed + 5);
  
  return {
    modeId: selectedModeId,
    modeName: labelInfo.name,
    modeLabel: `${labelInfo.emoji} ${labelInfo.name}`,
    titleLine: `⚡ 오늘 모드: ${labelInfo.shortTitle}`,
    statusOneLiner,
    loveModeLine,
    statusLine,
    tipLine,
    reasonLine,
    vulnerableLines,
    guideLine,
  };
}

/**
 * 모든 모드 라벨 목록 반환
 */
export function getAllModeLabels(): ModeLabel[] {
  return labelsData.labels as ModeLabel[];
}

/**
 * 특정 모드의 상세 정보 반환
 */
export function getModeDetails(modeId: ModeId): ModeLabel | undefined {
  return labelsData.labels.find(l => l.id === modeId) as ModeLabel | undefined;
}
