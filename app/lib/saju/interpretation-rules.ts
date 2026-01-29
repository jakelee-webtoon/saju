/**
 * 사주 해석 생성 규칙
 * 
 * 핵심 원칙: 일간 중심 (ilgan_centered)
 * - 사주 해석은 일간을 중심으로 구조를 설명
 * - 운명·길흉·성격 단정 금지
 */

// ========================
// 타입 정의
// ========================

export type InterpretationPhase = 
  | "phase_0_manse"      // 만세력 기본
  | "phase_1_ilgan"      // 일간 중심 요약
  | "phase_2_structure"  // 구조 분석 (십신 포함)
  | "phase_3_advanced";  // 고급 (합충형파 포함)

export type SectionType = 
  | "ilgan"
  | "environment_month"
  | "five_elements"
  | "ten_gods"
  | "relations";

export interface PhaseConfig {
  ilgan: boolean;
  environment_month: boolean;
  five_elements: boolean;
  ten_gods: boolean;
  relations: boolean;
}

// ========================
// 상수 정의
// ========================

/** 해석 순서 */
export const INTERPRETATION_ORDER: SectionType[] = [
  "ilgan",
  "environment_month",
  "five_elements",
  "ten_gods",
  "relations",
];

/** 금지된 판단 표현 */
export const FORBIDDEN_JUDGEMENTS = [
  "fate",        // 운명
  "success",     // 성공
  "failure",     // 실패
  "personality_typing", // 성격 유형화
] as const;

/** 허용된 주어 */
export const ALLOWED_SUBJECTS = [
  "이 사주",
  "이 구조",
] as const;

/** 금지된 주어 */
export const FORBIDDEN_SUBJECTS = [
  "당신은",
  "당신의",
] as const;

/** 문장 제한 */
export const SENTENCE_LIMITS = {
  perSection: 2,
  maxSentences: 3,
} as const;

// ========================
// 오행 표현 규칙
// ========================

/** 허용된 오행 표현 */
export const ALLOWED_ELEMENT_EXPRESSIONS = [
  "많다",
  "적다",
  "드러난다",
  "드러나지 않는다",
  "상대적으로 두드러진다",
  "구조상 나타난다",
  "구조상 나타나지 않는다",
] as const;

/** 금지된 오행 표현 */
export const FORBIDDEN_ELEMENT_EXPRESSIONS = [
  "강하다",
  "약하다",
  "좋다",
  "나쁘다",
  "부족하다",
  "넘친다",
] as const;

// ========================
// 데이터 불확실성 정책
// ========================

export const UNCERTAINTY_MESSAGES = {
  monthPillarMissing: "월령 정보가 불완전하여 환경 해석은 참고 수준으로 제공합니다.",
  hourPillarMissing: "시주 정보가 없어 시간 기반 해석은 제외됩니다.",
  apiFailure: "필수 계산 정보가 부족하여 해석을 제공할 수 없습니다.",
} as const;

// ========================
// 페이즈별 설정
// ========================

export const PHASE_MATRIX: Record<InterpretationPhase, PhaseConfig> = {
  phase_0_manse: {
    ilgan: true,
    environment_month: true,
    five_elements: true,
    ten_gods: false,
    relations: false,
  },
  phase_1_ilgan: {
    ilgan: true,
    environment_month: true,
    five_elements: true,
    ten_gods: false,
    relations: false,
  },
  phase_2_structure: {
    ilgan: true,
    environment_month: true,
    five_elements: true,
    ten_gods: true,
    relations: false,
  },
  phase_3_advanced: {
    ilgan: true,
    environment_month: true,
    five_elements: true,
    ten_gods: true,
    relations: true,
  },
};

// ========================
// 섹션별 규칙
// ========================

export const SECTION_RULES = {
  ilgan: {
    enabled: true,
    purpose: "interpretation_anchor",
    allowedContent: ["day_stem", "element_of_day_stem"],
    forbiddenContent: ["personality", "destiny", "ten_gods"],
    examples: {
      allowed: "이 사주는 丁火 일간을 기준으로 해석됩니다.",
      forbidden: "열정적인 성격을 지닌 사람입니다.",
    },
  },
  environment_month: {
    enabled: true,
    dependsOn: "month_pillar",
    allowedContent: ["seasonal_context", "environmental_flow"],
    forbiddenContent: ["career", "wealth", "social_status"],
    note: "월령은 결과가 아닌 환경 맥락으로만 사용한다.",
    examples: {
      allowed: "이 사주는 화 기운이 왕성한 계절 환경에서 작동합니다.",
      forbidden: "여름에 태어나서 성격이 밝습니다.",
    },
  },
  five_elements: {
    enabled: true,
    calculationBasis: {
      sources: ["heavenly_stems", "earthly_branches"],
      totalCount: 8,
    },
    interpretationScope: ["balance", "management", "adjustment"],
    examples: {
      allowed: "화 기운이 상대적으로 두드러집니다.",
      forbidden: "화가 강해서 성격이 급합니다.",
    },
  },
  ten_gods: {
    phase: "phase_2_structure",
    enabled: true,
    dependsOn: "ilgan",
    allowedContent: ["existence_check", "relative_distribution"],
    forbiddenContent: ["job_prediction", "relationship_prediction"],
    examples: {
      allowed: "재성 요소가 구조상 드러납니다.",
      forbidden: "돈복이 강한 사주입니다.",
    },
  },
  relations: {
    phase: "phase_3_advanced",
    enabled: false,
    rulesIncluded: ["합", "충", "형", "파", "원진", "신살"],
    allowedAction: "calculate_existence_only",
    forbiddenAction: "sentence_generation",
    examples: {
      allowed: "구조적 상호작용이 감지됩니다.",
      forbidden: "충이 있어서 불운합니다.",
    },
  },
} as const;

// ========================
// LLM 가드레일
// ========================

export const LLM_GUARDRAIL = {
  mustFollow: [
    "ilgan_centered_interpretation",  // 일간 중심 해석
    "structural_explanation_only",    // 구조 설명만
    "uncertainty_reduction",          // 불확실성 감소
  ],
  mustAvoid: [
    "fortune_telling_tone",           // 점술적 톤
    "absolute_statements",            // 절대적 진술
    "personalized_destiny_claims",    // 개인화된 운명 주장
  ],
} as const;

// ========================
// 유틸리티 함수
// ========================

/**
 * 현재 페이즈에서 특정 섹션이 활성화되어 있는지 확인
 */
export function isSectionEnabled(phase: InterpretationPhase, section: SectionType): boolean {
  return PHASE_MATRIX[phase][section];
}

/**
 * 표현이 허용되는지 검증
 */
export function isExpressionAllowed(expression: string): boolean {
  // 금지된 표현 포함 여부 확인
  for (const forbidden of FORBIDDEN_ELEMENT_EXPRESSIONS) {
    if (expression.includes(forbidden)) {
      return false;
    }
  }
  
  // 금지된 주어 포함 여부 확인
  for (const forbidden of FORBIDDEN_SUBJECTS) {
    if (expression.includes(forbidden)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 문장이 규칙을 준수하는지 검증
 */
export function validateInterpretationSentence(sentence: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // 금지된 주어 검사
  for (const subject of FORBIDDEN_SUBJECTS) {
    if (sentence.includes(subject)) {
      violations.push(`금지된 주어 사용: "${subject}"`);
    }
  }
  
  // 금지된 표현 검사
  for (const expr of FORBIDDEN_ELEMENT_EXPRESSIONS) {
    if (sentence.includes(expr)) {
      violations.push(`금지된 표현 사용: "${expr}"`);
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}
