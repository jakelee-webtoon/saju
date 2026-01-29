/**
 * 만세력 계산 모듈 - 계산 함수
 * 
 * [규칙]
 * - 순수 함수로 구현 (외부 상태 의존 없음)
 * - API 응답 데이터와 고정 매핑 테이블만 사용
 * - 임의 추측/하드코딩 금지
 */

import type {
  Element,
  Cheongan,
  Cheongan漢字,
  Jiji,
  Jiji漢字,
  ParsedGanji,
  NormalizedPillars,
  NormalizedInput,
  ElementDistribution,
  PillarOutput,
  ManseResult,
  LunarApiResponse,
  BirthInput,
  SajuCalculationError,
  CalculationMeta,
  TrustLevel,
} from "./types";

import {
  CHEONGAN_LIST,
  CHEONGAN_HANJA_LIST,
  CHEONGAN_TO_ELEMENT,
  CHEONGAN_HANJA_TO_ELEMENT,
  CHEONGAN_HANJA_TO_HANGUL,
  JIJI_LIST,
  JIJI_HANJA_LIST,
  JIJI_TO_ELEMENT,
  JIJI_HANJA_TO_ELEMENT,
  JIJI_HANJA_TO_HANGUL,
  HOUR_TO_JIJI_INDEX,
  ILGAN_TO_HOUR_CHEONGAN_START,
  ELEMENT_INITIAL,
  ELEMENT_TOTAL_WITH_HOUR,
  ELEMENT_TOTAL_WITHOUT_HOUR,
} from "./constants";

// ========================
// 파싱 함수
// ========================

/**
 * 간지 문자열 파싱
 * 
 * @param ganjiStr - API 응답 문자열 (예: "경오(庚午)")
 * @returns ParsedGanji 또는 null (파싱 실패 시)
 * 
 * @example
 * parseGanjiString("경오(庚午)") 
 * // => { 천간: "庚", 천간읽기: "경", 지지: "午", 지지읽기: "오", 오행천간: "금", 오행지지: "화" }
 */
export function parseGanjiString(ganjiStr: string): ParsedGanji | null {
  if (!ganjiStr || ganjiStr.length < 2) {
    return null;
  }

  // 방법 1: 괄호 안 한자 추출 "경오(庚午)" → "庚午"
  const hanjaMatch = ganjiStr.match(/\(([^)]+)\)/);
  if (hanjaMatch && hanjaMatch[1].length >= 2) {
    const hanja = hanjaMatch[1];
    const cheonganHanja = hanja[0] as Cheongan漢字;
    const jijiHanja = hanja[1] as Jiji漢字;
    
    // 유효성 검증
    if (
      CHEONGAN_HANJA_LIST.includes(cheonganHanja) &&
      JIJI_HANJA_LIST.includes(jijiHanja)
    ) {
      return {
        천간: cheonganHanja,
        천간읽기: CHEONGAN_HANJA_TO_HANGUL[cheonganHanja],
        지지: jijiHanja,
        지지읽기: JIJI_HANJA_TO_HANGUL[jijiHanja],
        오행천간: CHEONGAN_HANJA_TO_ELEMENT[cheonganHanja],
        오행지지: JIJI_HANJA_TO_ELEMENT[jijiHanja],
      };
    }
  }

  // 방법 2: 앞 두 글자 한글 추출 "경오(庚午)" → "경오"
  const cheonganHangul = ganjiStr[0] as Cheongan;
  const jijiHangul = ganjiStr[1] as Jiji;
  
  const cheonganIdx = CHEONGAN_LIST.indexOf(cheonganHangul);
  const jijiIdx = JIJI_LIST.indexOf(jijiHangul);
  
  if (cheonganIdx !== -1 && jijiIdx !== -1) {
    const cheonganHanja = CHEONGAN_HANJA_LIST[cheonganIdx];
    const jijiHanja = JIJI_HANJA_LIST[jijiIdx];
    
    return {
      천간: cheonganHanja,
      천간읽기: cheonganHangul,
      지지: jijiHanja,
      지지읽기: jijiHangul,
      오행천간: CHEONGAN_TO_ELEMENT[cheonganHangul],
      오행지지: JIJI_TO_ELEMENT[jijiHangul],
    };
  }

  return null;
}

// ========================
// 시주 계산 함수
// ========================

/**
 * 시주 계산
 * 
 * @param ilganHanja - 일간 한자 (예: "庚")
 * @param hour - 시간 (0-23)
 * @returns ParsedGanji
 * 
 * 계산 방법:
 * 1. 시간 → 지지 인덱스 (시진 배당표)
 * 2. 일간 → 시간 천간 시작점 (오호연원법)
 * 3. 시작점 + 지지 인덱스 → 시간 천간
 */
export function calculateHourPillar(ilganHanja: Cheongan漢字, hour: number): ParsedGanji {
  // 시간 → 지지 인덱스
  const jijiIdx = HOUR_TO_JIJI_INDEX[hour];
  const jijiHanja = JIJI_HANJA_LIST[jijiIdx];
  const jijiHangul = JIJI_LIST[jijiIdx];
  
  // 일간 → 시간 천간 시작점
  const ilganHangul = CHEONGAN_HANJA_TO_HANGUL[ilganHanja];
  const cheonganStartIdx = ILGAN_TO_HOUR_CHEONGAN_START[ilganHangul];
  
  // 시작점 + 지지 인덱스 → 시간 천간
  const cheonganIdx = (cheonganStartIdx + jijiIdx) % 10;
  const cheonganHanja = CHEONGAN_HANJA_LIST[cheonganIdx];
  const cheonganHangul = CHEONGAN_LIST[cheonganIdx];
  
  return {
    천간: cheonganHanja,
    천간읽기: cheonganHangul,
    지지: jijiHanja,
    지지읽기: jijiHangul,
    오행천간: CHEONGAN_TO_ELEMENT[cheonganHangul],
    오행지지: JIJI_TO_ELEMENT[jijiHangul],
  };
}

// ========================
// 오행 계산 함수
// ========================

/**
 * 오행 분포 계산
 * 
 * @param pillars - 4주 데이터
 * @returns ElementDistribution
 * 
 * [계산 규격]
 * - 천간 4개 + 지지 4개를 1점씩 합산 (총 8점)
 * - 시주가 null이면 6점
 * - 지장간은 포함하지 않음
 */
export function calcElements(pillars: NormalizedPillars): ElementDistribution {
  const counts: Record<Element, number> = { ...ELEMENT_INITIAL };
  
  // 년주
  counts[pillars.year.오행천간]++;
  counts[pillars.year.오행지지]++;
  
  // 월주
  counts[pillars.month.오행천간]++;
  counts[pillars.month.오행지지]++;
  
  // 일주
  counts[pillars.day.오행천간]++;
  counts[pillars.day.오행지지]++;
  
  // 시주 (있는 경우만)
  if (pillars.hour) {
    counts[pillars.hour.오행천간]++;
    counts[pillars.hour.오행지지]++;
  }
  
  // 총합 계산
  const total = counts.목 + counts.화 + counts.토 + counts.금 + counts.수;
  
  return {
    ...counts,
    total,
  };
}

/**
 * 오행 분포 검증
 * 
 * @param elements - 오행 분포
 * @param hasHourPillar - 시주 포함 여부
 * @returns 유효하면 true
 */
export function validateElementDistribution(
  elements: ElementDistribution,
  hasHourPillar: boolean
): boolean {
  const expectedTotal = hasHourPillar ? ELEMENT_TOTAL_WITH_HOUR : ELEMENT_TOTAL_WITHOUT_HOUR;
  return elements.total === expectedTotal;
}

// ========================
// 정규화 함수
// ========================

/**
 * API 응답 + 사용자 입력 → NormalizedInput 변환
 * 
 * @param birth - 사용자 입력 생년월일시
 * @param lunarResponse - 음력 API 응답
 * @returns NormalizedInput
 * @throws SajuCalculationError
 */
export function normalizeInput(
  birth: BirthInput,
  lunarResponse: LunarApiResponse
): NormalizedInput {
  // API 응답 검증
  if (!lunarResponse.success || !lunarResponse.lunar) {
    throw {
      name: "SajuCalculationError",
      message: "음력 API 응답이 없습니다",
      code: "API_ERROR",
    } as SajuCalculationError;
  }
  
  const lunar = lunarResponse.lunar;
  
  // 간지 파싱
  const yearPillar = parseGanjiString(lunar.ganjiYear);
  const monthPillar = parseGanjiString(lunar.ganjiMonth);
  const dayPillar = parseGanjiString(lunar.ganjiDay);
  
  if (!yearPillar) {
    throw {
      name: "SajuCalculationError",
      message: `년주 간지 파싱 실패: ${lunar.ganjiYear}`,
      code: "PARSE_ERROR",
    } as SajuCalculationError;
  }
  
  if (!monthPillar) {
    throw {
      name: "SajuCalculationError",
      message: `월주 간지 파싱 실패: ${lunar.ganjiMonth}`,
      code: "PARSE_ERROR",
    } as SajuCalculationError;
  }
  
  if (!dayPillar) {
    throw {
      name: "SajuCalculationError",
      message: `일주 간지 파싱 실패: ${lunar.ganjiDay}`,
      code: "PARSE_ERROR",
    } as SajuCalculationError;
  }
  
  // 시주 계산 (시간이 있는 경우만)
  let hourPillar: ParsedGanji | null = null;
  const hasTime = birth.hour !== undefined;
  
  if (hasTime && birth.hour !== undefined) {
    hourPillar = calculateHourPillar(dayPillar.천간, birth.hour);
  }
  
  return {
    birth,
    lunar: {
      year: parseInt(lunar.year),
      month: parseInt(lunar.month),
      day: parseInt(lunar.day),
      isLeapMonth: lunar.leapMonth,
    },
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    meta: {
      // TODO: 현재 API는 음력월 기준 월건 제공
      //       정확한 월주 계산을 위해서는 절기 데이터 필요
      isMonthPillarByJeolgi: false,
      hasTimePillar: hasTime,
    },
  };
}

// ========================
// 메인 빌드 함수
// ========================

/**
 * 만세력 결과 빌드
 * 
 * @param input - 정규화된 입력
 * @returns ManseResult
 */
export function buildManseResult(input: NormalizedInput): ManseResult {
  const { birth, lunar, pillars, meta } = input;
  
  // 오행 분포 계산
  const elements = calcElements(pillars);
  
  // 오행 검증 - 합계가 맞지 않으면 에러 상태
  const expectedTotal = meta.hasTimePillar ? ELEMENT_TOTAL_WITH_HOUR : ELEMENT_TOTAL_WITHOUT_HOUR;
  const isElementsValid = elements.total === expectedTotal;
  
  // 경고 메시지 수집
  const warnings: string[] = [];
  
  // 월주 신뢰도 판단
  const monthPillarTrustLevel: TrustLevel = meta.isMonthPillarByJeolgi ? "confirmed" : "reference";
  if (!meta.isMonthPillarByJeolgi) {
    warnings.push("월주는 절기 기준이 아닌 참고값입니다. 절기 경계일의 경우 실제 월주가 다를 수 있습니다.");
  }
  
  // 시주 신뢰도 판단
  const hourPillarTrustLevel: TrustLevel = meta.hasTimePillar ? "confirmed" : "unavailable";
  if (!meta.hasTimePillar) {
    warnings.push("출생 시간 미입력으로 시주를 계산할 수 없습니다.");
  }
  
  // 오행 검증 실패 시 에러 상태
  if (!isElementsValid) {
    warnings.push(`오행 분포 합계 검증 실패: 계산값 ${elements.total}, 기대값 ${expectedTotal}`);
  }
  
  // 계산 기준 메타데이터
  const calculationMeta: CalculationMeta = {
    monthPillarBasis: {
      type: meta.isMonthPillarByJeolgi ? "jeolgi" : "lunar_month",
      trustLevel: monthPillarTrustLevel,
      note: meta.isMonthPillarByJeolgi 
        ? "절기 기준으로 월주가 확정되었습니다." 
        : "절기 API 미연동으로 음력월 기준 참고값입니다. 절기 경계일은 검증 필요.",
    },
    hourPillarStatus: {
      isAvailable: meta.hasTimePillar,
      trustLevel: hourPillarTrustLevel,
      note: meta.hasTimePillar 
        ? "출생 시간 기준으로 시주가 계산되었습니다." 
        : "출생 시간 미입력으로 시주를 계산할 수 없습니다.",
    },
    dataSource: {
      lunarConversion: "korea_astronomy_api",
      ganjiSource: "api_response",
    },
  };
  
  // PillarOutput 생성 함수
  const toPillarOutput = (
    label: string,
    pillar: ParsedGanji | null,
    isAvailable: boolean
  ): PillarOutput => {
    if (!pillar || !isAvailable) {
      return {
        label,
        천간: "?",
        천간읽기: "?",
        지지: "?",
        지지읽기: "?",
        오행천간: "토" as Element, // 기본값 (계산에 포함되지 않음)
        오행지지: "토" as Element,
        isAvailable: false,
      };
    }
    
    return {
      label,
      천간: pillar.천간,
      천간읽기: pillar.천간읽기,
      지지: pillar.지지,
      지지읽기: pillar.지지읽기,
      오행천간: pillar.오행천간,
      오행지지: pillar.오행지지,
      isAvailable: true,
    };
  };
  
  // 상태 결정: 오행 검증 실패 시 error, 경고 있으면 partial
  let status: "success" | "partial" | "error" = "success";
  if (!isElementsValid) {
    status = "error";
  } else if (warnings.length > 0) {
    status = "partial";
  }
  
  return {
    status,
    
    birthSummary: {
      solar: {
        year: birth.year,
        month: birth.month,
        day: birth.day,
      },
      lunar: {
        year: lunar.year,
        month: lunar.month,
        day: lunar.day,
        isLeapMonth: lunar.isLeapMonth,
      },
      time: meta.hasTimePillar && birth.hour !== undefined
        ? { hour: birth.hour, minute: birth.minute ?? 0 }
        : undefined,
    },
    
    pillars: {
      year: toPillarOutput("년주", pillars.year, true),
      month: toPillarOutput("월주", pillars.month, true),
      day: toPillarOutput("일주", pillars.day, true),
      hour: toPillarOutput("시주", pillars.hour, meta.hasTimePillar),
    },
    
    ilgan: {
      천간: pillars.day.천간,
      천간읽기: pillars.day.천간읽기,
      오행: pillars.day.오행천간,
    },
    
    elements,
    
    calculationMeta,
    
    warnings,
  };
}

// ========================
// 통합 계산 함수 (편의용)
// ========================

/**
 * 생년월일시 + API 응답 → 만세력 결과 (원스텝)
 * 
 * @param birth - 사용자 입력
 * @param lunarResponse - 음력 API 응답
 * @returns ManseResult
 */
export function calculateManse(
  birth: BirthInput,
  lunarResponse: LunarApiResponse
): ManseResult {
  try {
    const normalized = normalizeInput(birth, lunarResponse);
    return buildManseResult(normalized);
  } catch (error) {
    const err = error as SajuCalculationError;
    return {
      status: "error",
      errorMessage: err.message || "알 수 없는 오류가 발생했습니다",
      birthSummary: {
        solar: { year: birth.year, month: birth.month, day: birth.day },
        lunar: { year: 0, month: 0, day: 0, isLeapMonth: false },
      },
      pillars: {
        year: { label: "년주", 천간: "?", 천간읽기: "?", 지지: "?", 지지읽기: "?", 오행천간: "토", 오행지지: "토", isAvailable: false },
        month: { label: "월주", 천간: "?", 천간읽기: "?", 지지: "?", 지지읽기: "?", 오행천간: "토", 오행지지: "토", isAvailable: false },
        day: { label: "일주", 천간: "?", 천간읽기: "?", 지지: "?", 지지읽기: "?", 오행천간: "토", 오행지지: "토", isAvailable: false },
        hour: { label: "시주", 천간: "?", 천간읽기: "?", 지지: "?", 지지읽기: "?", 오행천간: "토", 오행지지: "토", isAvailable: false },
      },
      ilgan: { 천간: "?", 천간읽기: "?", 오행: "토" },
      elements: { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0, total: 0 },
      warnings: [err.message || "계산 오류"],
    };
  }
}
