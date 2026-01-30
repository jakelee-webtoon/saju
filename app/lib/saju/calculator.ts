/**
 * 만세력 계산 모듈 - 계산 함수
 * 
 * [규칙]
 * - 순수 함수로 구현 (외부 상태 의존 없음)
 * - manseryeok 라이브러리 사용 (https://github.com/yhj1024/manseryeok)
 * - 임의 추측/하드코딩 금지
 */

import {
  calculateFourPillars,
  solarToLunar,
  lunarToSolar,
  getHeavenlyStemElement,
  getEarthlyBranchElement,
  type FourPillars,
  type HeavenlyStem,
  type EarthlyBranch,
} from "manseryeok";

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
// 천간/지지 매핑 (manseryeok → 우리 타입)
// ========================

const STEM_TO_HANJA: Record<HeavenlyStem, Cheongan漢字> = {
  "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
  "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸",
};

const BRANCH_TO_HANJA: Record<EarthlyBranch, Jiji漢字> = {
  "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
  "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥",
};

const ELEMENT_KR: Record<string, Element> = {
  "목": "목", "화": "화", "토": "토", "금": "금", "수": "수",
};

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
// 통합 계산 함수 (편의용 - 레거시)
// ========================

/**
 * 생년월일시 + API 응답 → 만세력 결과 (원스텝)
 * @deprecated manseryeok 라이브러리 사용 권장 (calculateManseWithLibrary)
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
      calculationMeta: {
        monthPillarBasis: { type: "unknown", trustLevel: "unavailable", note: "계산 오류로 확인 불가" },
        hourPillarStatus: { isAvailable: false, trustLevel: "unavailable", note: "계산 오류로 확인 불가" },
        dataSource: { lunarConversion: "unknown", ganjiSource: "unknown" },
      },
      warnings: [err.message || "계산 오류"],
    };
  }
}

// ========================
// 입춘 시각 테이블 (절기 보정용)
// ========================

/**
 * 입춘 시각 테이블 (UTC+9 기준, 분 단위)
 * 형식: { year: [month, day, hour, minute] }
 * 입춘 시각 이전이면 전년도 년주를 사용해야 함
 */
const IPCHUN_TIMES: Record<number, [number, number, number, number]> = {
  1950: [2, 4, 17, 21], 1951: [2, 4, 23, 14], 1952: [2, 5, 5, 4], 1953: [2, 4, 10, 46],
  1954: [2, 4, 16, 31], 1955: [2, 4, 22, 18], 1956: [2, 5, 4, 13], 1957: [2, 4, 9, 55],
  1958: [2, 4, 15, 50], 1959: [2, 4, 21, 43], 1960: [2, 5, 3, 23], 1961: [2, 4, 9, 23],
  1962: [2, 4, 15, 18], 1963: [2, 4, 21, 8], 1964: [2, 5, 2, 57], 1965: [2, 4, 8, 46],
  1966: [2, 4, 14, 38], 1967: [2, 4, 20, 31], 1968: [2, 5, 2, 8], 1969: [2, 4, 8, 0],
  1970: [2, 4, 13, 46], 1971: [2, 4, 19, 26], 1972: [2, 5, 1, 20], 1973: [2, 4, 7, 4],
  1974: [2, 4, 13, 0], 1975: [2, 4, 18, 59], 1976: [2, 5, 0, 40], 1977: [2, 4, 6, 34],
  1978: [2, 4, 12, 27], 1979: [2, 4, 18, 13], 1980: [2, 5, 0, 10], 1981: [2, 4, 5, 56],
  1982: [2, 4, 11, 46], 1983: [2, 4, 17, 40], 1984: [2, 4, 23, 19], 1985: [2, 4, 5, 12],
  1986: [2, 4, 11, 8], 1987: [2, 4, 16, 52], 1988: [2, 4, 22, 43], 1989: [2, 4, 4, 27],
  1990: [2, 4, 10, 15], 1991: [2, 4, 16, 8], 1992: [2, 4, 21, 48], 1993: [2, 4, 3, 38],
  1994: [2, 4, 9, 31], 1995: [2, 4, 15, 14], 1996: [2, 4, 21, 8], 1997: [2, 4, 3, 2],
  1998: [2, 4, 8, 58], 1999: [2, 4, 14, 57], 2000: [2, 4, 20, 40], 2001: [2, 4, 2, 29],
  2002: [2, 4, 8, 24], 2003: [2, 4, 14, 5], 2004: [2, 4, 19, 56], 2005: [2, 4, 1, 43],
  2006: [2, 4, 7, 27], 2007: [2, 4, 13, 18], 2008: [2, 4, 19, 0], 2009: [2, 4, 0, 50],
  2010: [2, 4, 6, 47], 2011: [2, 4, 12, 33], 2012: [2, 4, 18, 22], 2013: [2, 4, 0, 13],
  2014: [2, 4, 6, 3], 2015: [2, 4, 11, 58], 2016: [2, 4, 17, 46], 2017: [2, 3, 23, 34],
  2018: [2, 4, 5, 28], 2019: [2, 4, 11, 14], 2020: [2, 4, 17, 3], 2021: [2, 3, 22, 59],
  2022: [2, 4, 4, 51], 2023: [2, 4, 10, 43], 2024: [2, 4, 16, 27], 2025: [2, 3, 22, 10],
  2026: [2, 4, 4, 2], 2027: [2, 4, 9, 46], 2028: [2, 4, 15, 31], 2029: [2, 3, 21, 20],
  2030: [2, 4, 3, 8], 2031: [2, 4, 8, 57], 2032: [2, 4, 14, 49], 2033: [2, 3, 20, 41],
  2034: [2, 4, 2, 40], 2035: [2, 4, 8, 31], 2036: [2, 4, 14, 19], 2037: [2, 3, 20, 11],
  2038: [2, 4, 1, 54], 2039: [2, 4, 7, 51], 2040: [2, 4, 13, 30], 2041: [2, 3, 19, 23],
  2042: [2, 4, 1, 4], 2043: [2, 4, 6, 58], 2044: [2, 4, 12, 41], 2045: [2, 3, 18, 35],
  2046: [2, 4, 0, 31], 2047: [2, 4, 6, 17], 2048: [2, 4, 12, 4], 2049: [2, 3, 17, 51],
  2050: [2, 3, 23, 42],
};

/**
 * 입춘 이전인지 확인
 * @returns true면 입춘 이전 (전년도 년주 사용해야 함)
 */
function isBeforeIpchun(year: number, month: number, day: number, hour: number, minute: number): boolean {
  const ipchun = IPCHUN_TIMES[year];
  if (!ipchun) return false; // 데이터 없으면 보정 안 함
  
  const [ipMonth, ipDay, ipHour, ipMinute] = ipchun;
  
  // 입춘 월 이전
  if (month < ipMonth) return true;
  if (month > ipMonth) return false;
  
  // 입춘 일 이전
  if (day < ipDay) return true;
  if (day > ipDay) return false;
  
  // 입춘 시각 이전
  const birthMinutes = hour * 60 + minute;
  const ipchunMinutes = ipHour * 60 + ipMinute;
  
  return birthMinutes < ipchunMinutes;
}

/**
 * 년주 천간/지지 계산 (60갑자 순환)
 * 1984년 = 甲子(갑자)년 기준
 */
function calculateYearPillar(year: number): { stem: HeavenlyStem; branch: EarthlyBranch } {
  const stems: HeavenlyStem[] = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const branches: EarthlyBranch[] = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  
  // 1984년 = 갑자년 (index 0)
  const offset = year - 1984;
  const stemIndex = ((offset % 10) + 10) % 10;
  const branchIndex = ((offset % 12) + 12) % 12;
  
  return {
    stem: stems[stemIndex],
    branch: branches[branchIndex],
  };
}

// ========================
// manseryeok 라이브러리 기반 계산 함수 (신규)
// ========================

/**
 * Pillar(manseryeok) → ParsedGanji 변환
 */
function pillarToGanji(
  stem: HeavenlyStem,
  branch: EarthlyBranch
): ParsedGanji {
  const stemElement = getHeavenlyStemElement(stem);
  const branchElement = getEarthlyBranchElement(branch);
  
  return {
    천간: STEM_TO_HANJA[stem],
    천간읽기: stem as Cheongan,
    지지: BRANCH_TO_HANJA[branch],
    지지읽기: branch as Jiji,
    오행천간: ELEMENT_KR[stemElement],
    오행지지: ELEMENT_KR[branchElement],
  };
}

/**
 * manseryeok 라이브러리를 사용한 만세력 계산
 * 
 * @param birth - 생년월일시 입력 (양력 또는 음력)
 * @returns ManseResult
 */
export function calculateManseWithLibrary(birth: BirthInput): ManseResult {
  try {
    const hasTime = birth.hour !== undefined;
    
    // 음력 변환 (양력 입력인 경우)
    let lunarDate: { year: number; month: number; day: number; isLeapMonth: boolean };
    let solarDate: { year: number; month: number; day: number };
    
    if (birth.isLunar) {
      // 음력 입력 → 양력 변환
      const solar = lunarToSolar(birth.year, birth.month, birth.day, birth.isLeapMonth ?? false);
      solarDate = { year: solar.year, month: solar.month, day: solar.day };
      lunarDate = { 
        year: birth.year, 
        month: birth.month, 
        day: birth.day, 
        isLeapMonth: birth.isLeapMonth ?? false 
      };
    } else {
      // 양력 입력 → 음력 변환
      const lunar = solarToLunar(birth.year, birth.month, birth.day);
      solarDate = { year: birth.year, month: birth.month, day: birth.day };
      lunarDate = { 
        year: lunar.year, 
        month: lunar.month, 
        day: lunar.day, 
        isLeapMonth: lunar.isLeapMonth 
      };
    }
    
    // 사주 계산 (manseryeok 라이브러리)
    const birthHour = birth.hour ?? 12;
    const birthMinute = birth.minute ?? 0;
    
    const fourPillars = calculateFourPillars({
      year: solarDate.year,
      month: solarDate.month,
      day: solarDate.day,
      hour: birthHour,
      minute: birthMinute,
      isLunar: false, // 양력 기준으로 계산
    });
    
    // ========== 입춘 보정 ==========
    // 입춘 이전이면 전년도 년주를 사용
    let yearPillar: ParsedGanji;
    const needsYearCorrection = isBeforeIpchun(
      solarDate.year, 
      solarDate.month, 
      solarDate.day, 
      birthHour, 
      birthMinute
    );
    
    if (needsYearCorrection) {
      // 전년도 년주 계산
      const prevYearPillar = calculateYearPillar(solarDate.year - 1);
      yearPillar = pillarToGanji(prevYearPillar.stem, prevYearPillar.branch);
    } else {
      yearPillar = pillarToGanji(
        fourPillars.year.heavenlyStem,
        fourPillars.year.earthlyBranch
      );
    }
    
    // 월주/일주/시주
    const monthPillar = pillarToGanji(
      fourPillars.month.heavenlyStem,
      fourPillars.month.earthlyBranch
    );
    const dayPillar = pillarToGanji(
      fourPillars.day.heavenlyStem,
      fourPillars.day.earthlyBranch
    );
    const hourPillar = hasTime ? pillarToGanji(
      fourPillars.hour.heavenlyStem,
      fourPillars.hour.earthlyBranch
    ) : null;
    
    // 오행 분포 계산
    const pillars: NormalizedPillars = {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    };
    const elements = calcElements(pillars);
    
    // 검증
    const expectedTotal = hasTime ? ELEMENT_TOTAL_WITH_HOUR : ELEMENT_TOTAL_WITHOUT_HOUR;
    const isElementsValid = elements.total === expectedTotal;
    
    // 경고 메시지
    const warnings: string[] = [];
    if (!hasTime) {
      warnings.push("출생 시간 미입력으로 시주를 계산할 수 없습니다.");
    }
    if (!isElementsValid) {
      warnings.push(`오행 분포 합계 검증 실패: 계산값 ${elements.total}, 기대값 ${expectedTotal}`);
    }
    
    // PillarOutput 생성
    const toPillarOutput = (
      label: string,
      pillar: ParsedGanji | null,
      isAvailable: boolean
    ): PillarOutput => {
      if (!pillar || !isAvailable) {
        return {
          label,
          천간: "?", 천간읽기: "?", 지지: "?", 지지읽기: "?",
          오행천간: "토" as Element, 오행지지: "토" as Element,
          isAvailable: false,
        };
      }
      return { label, ...pillar, isAvailable: true };
    };
    
    // 상태 결정
    let status: "success" | "partial" | "error" = "success";
    if (!isElementsValid) status = "error";
    else if (warnings.length > 0) status = "partial";
    
    // 결과 반환
    return {
      status,
      birthSummary: {
        solar: solarDate,
        lunar: lunarDate,
        time: hasTime ? { hour: birth.hour!, minute: birth.minute ?? 0 } : undefined,
      },
      pillars: {
        year: toPillarOutput("년주", yearPillar, true),
        month: toPillarOutput("월주", monthPillar, true),
        day: toPillarOutput("일주", dayPillar, true),
        hour: toPillarOutput("시주", hourPillar, hasTime),
      },
      ilgan: {
        천간: dayPillar.천간,
        천간읽기: dayPillar.천간읽기,
        오행: dayPillar.오행천간,
      },
      elements,
      calculationMeta: {
        monthPillarBasis: {
          type: "jeolgi",
          trustLevel: "confirmed",
          note: "manseryeok 라이브러리 기반 절기 계산",
        },
        hourPillarStatus: {
          isAvailable: hasTime,
          trustLevel: hasTime ? "confirmed" : "unavailable",
          note: hasTime ? "출생 시간 기준 계산" : "출생 시간 미입력",
        },
        dataSource: {
          lunarConversion: "korea_astronomy_api",
          ganjiSource: "calculated",
        },
      },
      warnings,
    };
    
  } catch (error) {
    const err = error as Error;
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
      calculationMeta: {
        monthPillarBasis: { type: "unknown", trustLevel: "unavailable", note: "계산 오류" },
        hourPillarStatus: { isAvailable: false, trustLevel: "unavailable", note: "계산 오류" },
        dataSource: { lunarConversion: "unknown", ganjiSource: "unknown" },
      },
      warnings: [err.message || "계산 오류"],
    };
  }
}
