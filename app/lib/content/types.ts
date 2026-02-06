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
  oneLiner: string;
  toneHint: string;
}

export interface ModeLabelsData {
  labels: ModeLabel[];
}

// --- 템플릿 ---
export interface ModeTemplatesData {
  titleTemplate: string;
  statusOneLinerTemplates: Record<string, string[]>;  // 3인칭 한 줄 상태
  loveModeLine1Templates: Record<string, string[]>;   // 연애 모드 1줄차 (객관적 상태)
  loveModeLine2Templates: Record<string, string[]>;   // 연애 모드 2줄차 (공감 확장)
  summaryTemplates: Record<string, string[]>;
  tipTemplates: Record<string, string[]>;
  detailTemplates: {
    reason: Record<string, string[]>;
    vulnerable: Record<string, string[]>;
    guide: Record<string, string[]>;
  };
}

// --- 규칙 ---
export interface ModeRulesData {
  description: string;
  baseWeights: Record<string, number>;
  characterTendencyMapping: Record<string, { add: string[]; weight: number }>;
  situationTagWeights: Record<string, Record<string, number>>;
  userSignalWeights: {
    highViewCount: { threshold: number; weights: Record<string, number> };
    repeatStreak: { threshold: number; weights: Record<string, number> };
    recentAnalysis: { withinHours: number; weights: Record<string, number> };
  };
  dayOfWeekBias: Record<string, Record<string, number>>;
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

// 회복 바이어스 (특정 모드로 회복되는 경향)
export type RecoveryBias = Record<string, number>;

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
export interface LoveModeData {
  id: string;
  love_mode: string;
  category: string;
  home_summary_line1: string;
  home_summary_line2: string;
  detail: {
    mode_label: string;
    main_sentence: string;
    reason: string;
    triggers: string[];
    one_line_guide: string;
  };
}

// --- 오늘 모드 계산 결과 ---
export interface TodayModeResult {
  modeId: string;
  modeName: string;
  modeLabel: string;         // 아이콘 + 키워드 (예: "❄️ 쿨다운")
  // HOME용 간략 필드
  statusOneLiner: string;    // 3인칭 한 줄 상태 (홈 최상단)
  loveModeLine1: string;     // 연애 모드 1줄차 (객관적 상태)
  loveModeLine2: string;     // 연애 모드 2줄차 (공감 확장)
  // 상세 필드
  mainSentence: string;      // 오늘의 상태 요약 문장
  reason: string;            // "오늘 왜 이런 모드냐면"
  triggers: string[];        // "오늘 이럴 때 특히 흔들릴 수 있어"
  oneLineGuide: string;      // 오늘의 한 줄 가이드
  // 기존 상세 필드 (호환성)
  titleLine: string;
  summaryLine: string;
  tipLine: string;
  detailLines: {
    reason: string;
    vulnerable: string[];
    guide: string;
  };
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
