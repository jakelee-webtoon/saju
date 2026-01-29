/**
 * 만세력 계산 모듈 - 타입 정의
 * 
 * [타입 계층]
 * 1. Raw 타입: 외부 API 응답을 그대로 담는 타입
 * 2. Normalized 타입: 내부 계산용으로 정규화된 타입
 * 3. Output 타입: UI에 전달하는 최종 결과 타입
 */

// ========================
// 오행 타입
// ========================
export type Element = "목" | "화" | "토" | "금" | "수";

// ========================
// 천간/지지 타입
// ========================
export type Cheongan = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";
export type Cheongan漢字 = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";

export type Jiji = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";
export type Jiji漢字 = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";

// ========================
// [1] Raw 타입 - API 응답 원본
// ========================

/** 공공데이터포털 음력 API 응답 (getLunCalInfo) */
export interface LunarApiResponse {
  success: boolean;
  lunar?: {
    year: string;       // 음력 년
    month: string;      // 음력 월
    day: string;        // 음력 일
    leapMonth: boolean; // 윤달 여부
    ganjiYear: string;  // 세차 예: "경오(庚午)"
    ganjiMonth: string; // 월건 예: "갑신(甲申)"
    ganjiDay: string;   // 일진 예: "정사(丁巳)"
  };
  error?: string;
}

/** 입력 생년월일시 (사용자 입력) */
export interface BirthInput {
  calendarType: "양력" | "음력";
  year: number;
  month: number;
  day: number;
  hour?: number;      // 0-23, undefined면 시주 계산 불가
  minute?: number;    // 0-59
  gender?: "남" | "여";
}

// ========================
// [2] Normalized 타입 - 내부 계산용
// ========================

/** 파싱된 간지 (천간+지지) */
export interface ParsedGanji {
  천간: Cheongan漢字;
  천간읽기: Cheongan;
  지지: Jiji漢字;
  지지읽기: Jiji;
  오행천간: Element;
  오행지지: Element;
}

/** 정규화된 4주 데이터 */
export interface NormalizedPillars {
  year: ParsedGanji;
  month: ParsedGanji;
  day: ParsedGanji;
  hour: ParsedGanji | null;  // 시간 미입력 시 null
}

/** 정규화된 계산 입력 */
export interface NormalizedInput {
  // 원본 입력
  birth: BirthInput;
  
  // 음력 정보
  lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
  
  // 4주 간지
  pillars: NormalizedPillars;
  
  // 메타데이터
  meta: {
    // 월주가 절기 기준인지 여부
    // TODO: 현재 API는 음력월 기준으로 월건을 제공함
    //       정확한 월주 계산을 위해서는 절기 데이터가 필요함
    isMonthPillarByJeolgi: boolean;
    
    // 시주 계산 가능 여부
    hasTimePillar: boolean;
  };
}

// ========================
// [3] Output 타입 - UI 전달용
// ========================

/** 단일 주(柱) UI 출력 */
export interface PillarOutput {
  label: string;           // "년주", "월주", "일주", "시주"
  천간: string;            // 한자 (예: "庚")
  천간읽기: string;        // 한글 (예: "경")
  지지: string;            // 한자 (예: "午")
  지지읽기: string;        // 한글 (예: "오")
  오행천간: Element;
  오행지지: Element;
  isAvailable: boolean;    // 계산 가능 여부 (시주의 경우 false일 수 있음)
}

/** 오행 분포 */
export interface ElementDistribution {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
  total: number;  // 항상 8이어야 함 (시주 없으면 6)
}

/** 계산 신뢰도 상태 */
export type TrustLevel = "confirmed" | "reference" | "unavailable";

/** 계산 기준 메타데이터 */
export interface CalculationMeta {
  // 월주 계산 기준
  monthPillarBasis: {
    type: "jeolgi" | "lunar_month" | "unknown";
    trustLevel: TrustLevel;
    note: string;
  };
  
  // 시주 확정 여부
  hourPillarStatus: {
    isAvailable: boolean;
    trustLevel: TrustLevel;
    note: string;
  };
  
  // API 소스
  dataSource: {
    lunarConversion: "korea_astronomy_api" | "unknown";
    ganjiSource: "api_response" | "calculated" | "unknown";
  };
}

/** 최종 만세력 결과 */
export interface ManseResult {
  // 상태
  status: "success" | "partial" | "error";
  errorMessage?: string;
  
  // 출생 정보 요약
  birthSummary: {
    solar: {
      year: number;
      month: number;
      day: number;
      weekday?: string;
    };
    lunar: {
      year: number;
      month: number;
      day: number;
      isLeapMonth: boolean;
    };
    time?: {
      hour: number;
      minute: number;
    };
  };
  
  // 4주
  pillars: {
    year: PillarOutput;
    month: PillarOutput;
    day: PillarOutput;
    hour: PillarOutput;
  };
  
  // 일간 (일주의 천간)
  ilgan: {
    천간: string;
    천간읽기: string;
    오행: Element;
  };
  
  // 오행 분포
  elements: ElementDistribution;
  
  // 계산 기준 메타데이터
  calculationMeta: CalculationMeta;
  
  // 경고/안내 메시지
  warnings: string[];
}

// ========================
// 에러 타입
// ========================
export class SajuCalculationError extends Error {
  constructor(
    message: string,
    public code: "INVALID_INPUT" | "API_ERROR" | "PARSE_ERROR" | "CALCULATION_ERROR"
  ) {
    super(message);
    this.name = "SajuCalculationError";
  }
}
