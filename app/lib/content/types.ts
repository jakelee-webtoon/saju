// ========================
// 콘텐츠 데이터 타입 정의
// ========================

// --- 상황 태그 ---
export interface SituationTag {
  id: string;
  label: string;
  shortLabel: string;
  emoji?: string;
}

export interface SituationTagsData {
  tags: SituationTag[];
}

// --- 오늘 모드 라벨 ---
export interface ModeLabel {
  id: string;
  name: string;
  emoji: string;
  shortTitle: string;
  description: string;
}

export interface ModeLabelsData {
  version?: string;
  description?: string;
  labels: ModeLabel[];
}

// --- 템플릿 (모드별 문장 템플릿) ---
export interface ModeTemplateSet {
  statusOneLinerTemplates: string[];
  loveModeLineTemplates: string[];
  statusLines: string[];
  tipLines: string[];
  reasonLines: string[];
  vulnerableLines: string[];
  guideLines: string[];
}

export interface ModeTemplatesData {
  version?: string;
  description?: string;
  templates: Record<string, ModeTemplateSet>;
}

// --- 규칙 (캐릭터별 모드 가중치) ---
export interface ModeRulesData {
  version?: string;
  description?: string;
  characterModeWeights: Record<string, Record<string, number>>;
  dayOfWeekModifiers: Record<string, Record<string, number>>;  // 요일(0-6)별 모드 가중치
}

// --- 캐릭터 ---
export interface CharacterTendencies {
  impulse: number;   // 충동성 (0-100)
  emotion: number;   // 감정 몰입 (0-100)
  stability: number; // 안정성 (0-100)
  focus: number;     // 집중력 (0-100)
}

// 상황 태그별 민감도 (0: 무감, 1: 약함, 2: 보통, 3: 예민)
export type TriggerSensitivity = Record<string, number>;

// 회복 바이어스 (특정 모드로 회복되는 경향) - optional values 허용
export type RecoveryBias = Record<string, number | undefined>;

// --- 사주 프로필 (캐릭터 + 민감도 통합) ---
export interface SajuProfile {
  characterId: string;
  baseTendencies: CharacterTendencies;
  triggerSensitivity: TriggerSensitivity; // 상황 태그별 민감도 0~3
  recoveryBias?: RecoveryBias;            // 회복 바이어스 (선택)
}

export interface Character {
  id: string;
  name: string;
  declaration: string;
  description: string;
  empathy: string[];
  strengths: string[];
  weaknesses: string[];
  baseTendencies: CharacterTendencies;
  triggerSensitivity: TriggerSensitivity; // 상황별 민감도 추가
  recoveryBias?: RecoveryBias;            // 회복 바이어스 (선택)
  elementType: string;
}

export interface CharactersData {
  characters: Character[];
}

// --- 사용자 신호 ---
export interface UserSignals {
  viewCountToday: number;
  repeatViewStreak: number;
  lastAnalysisAt?: Date | string | null;
}

// --- 연애 모드 데이터 구조 ---
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

export interface LoveModeData {
  id: string;
  love_mode: string;
  emoji: string;
  color: LoveModeColor;
  home_summary: string;
  category?: string;  // optional
  detail: LoveModeDetail;
}

// --- 오늘 모드 계산 결과 ---
export interface TodayModeResult {
  modeId: string;
  modeName: string;
  modeEmoji: string;
  modeLabel: string;         // 아이콘 + 키워드 (예: "❄️ 쿨다운")
  color: LoveModeColor;
  // HOME용 간략 필드
  homeTitle: string;
  homeSummary: string;
  statusOneLiner: string;    // 3인칭 한 줄 상태 (홈 최상단)
  loveModeLine: string;      // 연애 모드 라인
  // 상세 필드
  detail: LoveModeDetail;
  // Legacy 필드 (기존 호환용)
  titleLine: string;
  statusLine: string;
  tipLine: string;
  reasonLine: string;
  vulnerableLines: string[];
  guideLine: string;
}

// --- 오늘 모드 계산 입력 ---
export interface ComputeTodayModeInput {
  characterId: string;
  date?: Date;
  userSignals?: UserSignals;
  selectedSituationTagId?: string | null;
}

// --- 전체 콘텐츠 ---
export interface AllContent {
  situationTags: SituationTagsData;
  modeLabels: ModeLabelsData;
  templates: ModeTemplatesData;
  rules: ModeRulesData;
  characters: CharactersData;
}
