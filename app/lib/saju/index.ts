/**
 * 만세력 계산 모듈 - 공개 API
 */

// 타입
export type {
  Element,
  Cheongan,
  Jiji,
  ParsedGanji,
  NormalizedPillars,
  NormalizedInput,
  ElementDistribution,
  PillarOutput,
  ManseResult,
  LunarApiResponse,
  BirthInput,
  TrustLevel,
  CalculationMeta,
} from "./types";

// 상수
export {
  CHEONGAN_LIST,
  CHEONGAN_HANJA_LIST,
  CHEONGAN_TO_ELEMENT,
  JIJI_LIST,
  JIJI_HANJA_LIST,
  JIJI_TO_ELEMENT,
  ELEMENT_LIST,
  ELEMENT_TOTAL_WITH_HOUR,
  ELEMENT_TOTAL_WITHOUT_HOUR,
} from "./constants";

// 계산 함수
export {
  parseGanjiString,
  calculateHourPillar,
  calcElements,
  validateElementDistribution,
  normalizeInput,
  buildManseResult,
  calculateManse,
} from "./calculator";

// 해석 규칙
export {
  INTERPRETATION_ORDER,
  FORBIDDEN_JUDGEMENTS,
  ALLOWED_SUBJECTS,
  FORBIDDEN_SUBJECTS,
  SENTENCE_LIMITS,
  ALLOWED_ELEMENT_EXPRESSIONS,
  FORBIDDEN_ELEMENT_EXPRESSIONS,
  UNCERTAINTY_MESSAGES,
  PHASE_MATRIX,
  SECTION_RULES,
  LLM_GUARDRAIL,
  isSectionEnabled,
  isExpressionAllowed,
  validateInterpretationSentence,
} from "./interpretation-rules";

export type {
  InterpretationPhase,
  SectionType,
  PhaseConfig,
} from "./interpretation-rules";
