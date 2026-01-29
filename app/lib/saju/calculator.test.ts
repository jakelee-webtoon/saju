/**
 * 만세력 계산 모듈 - 테스트
 * 
 * 테스트 케이스:
 * 1. 기본 케이스 (시간 포함)
 * 2. 시간 미입력 케이스
 * 3. 윤달 케이스
 * 4. API 응답 오류 케이스
 * 5. 간지 파싱 케이스
 * 6. 오행 합계 검증 케이스
 * 7. 절기 경계일 케이스 (월주 신뢰도)
 * 8. 메타데이터 검증 케이스
 */

import {
  parseGanjiString,
  calculateHourPillar,
  calcElements,
  validateElementDistribution,
  normalizeInput,
  buildManseResult,
  calculateManse,
} from "./calculator";

import type {
  LunarApiResponse,
  BirthInput,
  NormalizedPillars,
  ParsedGanji,
} from "./types";

import {
  ELEMENT_TOTAL_WITH_HOUR,
  ELEMENT_TOTAL_WITHOUT_HOUR,
} from "./constants";

// ========================
// 테스트 데이터
// ========================

/** 테스트 케이스 1: 1990년 8월 20일 9시 (양력) */
const TEST_CASE_1 = {
  birth: {
    calendarType: "양력" as const,
    year: 1990,
    month: 8,
    day: 20,
    hour: 9,
    minute: 0,
  },
  lunarResponse: {
    success: true,
    lunar: {
      year: "1990",
      month: "07",
      day: "01",
      leapMonth: false,
      ganjiYear: "경오(庚午)",   // 년주: 경오
      ganjiMonth: "갑신(甲申)", // 월주: 갑신
      ganjiDay: "정사(丁巳)",   // 일주: 정사
    },
  } as LunarApiResponse,
  expected: {
    yearPillar: { 천간읽기: "경", 지지읽기: "오", 오행천간: "금", 오행지지: "화" },
    monthPillar: { 천간읽기: "갑", 지지읽기: "신", 오행천간: "목", 오행지지: "금" },
    dayPillar: { 천간읽기: "정", 지지읽기: "사", 오행천간: "화", 오행지지: "화" },
    // 시주: 정일(丁日) + 9시(진시) → 병진(丙辰)
    // 정임 → 자시가 경자, 진시(4번째)는 경+4=갑? 아니, 오호연원법 다시 확인
    // 정일 → 시작 경(6), 진시(4) → (6+4)%10 = 0 = 갑 → 갑진
    hourPillar: { 천간읽기: "갑", 지지읽기: "진", 오행천간: "목", 오행지지: "토" },
  },
};

/** 테스트 케이스 2: 시간 미입력 */
const TEST_CASE_2 = {
  birth: {
    calendarType: "양력" as const,
    year: 1985,
    month: 3,
    day: 15,
    // hour 없음
  },
  lunarResponse: {
    success: true,
    lunar: {
      year: "1985",
      month: "01",
      day: "24",
      leapMonth: false,
      ganjiYear: "을축(乙丑)",
      ganjiMonth: "기묘(己卯)",
      ganjiDay: "임인(壬寅)",
    },
  } as LunarApiResponse,
};

/** 테스트 케이스 3: 윤달 */
const TEST_CASE_3 = {
  birth: {
    calendarType: "양력" as const,
    year: 2023,
    month: 4,
    day: 20,
    hour: 14,
  },
  lunarResponse: {
    success: true,
    lunar: {
      year: "2023",
      month: "02",
      day: "30",
      leapMonth: true, // 윤달
      ganjiYear: "계묘(癸卯)",
      ganjiMonth: "병진(丙辰)",
      ganjiDay: "갑자(甲子)",
    },
  } as LunarApiResponse,
};

/** 테스트 케이스 4: API 오류 */
const TEST_CASE_4 = {
  birth: {
    calendarType: "양력" as const,
    year: 2000,
    month: 1,
    day: 1,
  },
  lunarResponse: {
    success: false,
    error: "API Error",
  } as LunarApiResponse,
};

/** 테스트 케이스 5: 절기 경계일 (입춘 무렵 - 2월 4일) 
 * 절기 기준으로는 월주가 달라질 수 있는 날짜
 * 현재 절기 API 미연동으로 "참고값" 상태여야 함
 */
const TEST_CASE_5_JEOLGI_BOUNDARY = {
  birth: {
    calendarType: "양력" as const,
    year: 2024,
    month: 2,
    day: 4, // 입춘일 (절기 경계)
    hour: 12,
  },
  lunarResponse: {
    success: true,
    lunar: {
      year: "2023",
      month: "12",
      day: "25",
      leapMonth: false,
      ganjiYear: "갑진(甲辰)", // 절기 기준이면 갑진이 맞음
      ganjiMonth: "을축(乙丑)", // 음력 기준 월주
      ganjiDay: "기해(己亥)",
    },
  } as LunarApiResponse,
};

/** 테스트 케이스 5: 간지 파싱 - 다양한 형식 */
const PARSE_TEST_CASES = [
  { input: "경오(庚午)", expected: { 천간읽기: "경", 지지읽기: "오" } },
  { input: "갑신(甲申)", expected: { 천간읽기: "갑", 지지읽기: "신" } },
  { input: "정사(丁巳)", expected: { 천간읽기: "정", 지지읽기: "사" } },
  { input: "임자(壬子)", expected: { 천간읽기: "임", 지지읽기: "자" } },
  { input: "계해(癸亥)", expected: { 천간읽기: "계", 지지읽기: "해" } },
];

// ========================
// 테스트 실행 함수
// ========================

function runTests() {
  console.log("=".repeat(50));
  console.log("만세력 계산 모듈 테스트");
  console.log("=".repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  // 테스트 1: 간지 파싱
  console.log("\n[테스트 1] 간지 문자열 파싱");
  for (const tc of PARSE_TEST_CASES) {
    const result = parseGanjiString(tc.input);
    if (
      result &&
      result.천간읽기 === tc.expected.천간읽기 &&
      result.지지읽기 === tc.expected.지지읽기
    ) {
      console.log(`  ✓ "${tc.input}" → ${result.천간읽기}${result.지지읽기}`);
      passed++;
    } else {
      console.log(`  ✗ "${tc.input}" 파싱 실패`);
      failed++;
    }
  }
  
  // 테스트 2: 기본 케이스 (시간 포함) - 오행 합계 검증
  console.log("\n[테스트 2] 기본 케이스 - 오행 합계 = 8");
  try {
    const result = calculateManse(TEST_CASE_1.birth, TEST_CASE_1.lunarResponse);
    if (result.status !== "error" && result.elements.total === ELEMENT_TOTAL_WITH_HOUR) {
      console.log(`  ✓ 오행 합계: ${result.elements.total} (기대값: ${ELEMENT_TOTAL_WITH_HOUR})`);
      console.log(`    목=${result.elements.목}, 화=${result.elements.화}, 토=${result.elements.토}, 금=${result.elements.금}, 수=${result.elements.수}`);
      passed++;
    } else {
      console.log(`  ✗ 오행 합계 불일치: ${result.elements.total}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ 예외 발생: ${e}`);
    failed++;
  }
  
  // 테스트 3: 시간 미입력 - 오행 합계 = 6
  console.log("\n[테스트 3] 시간 미입력 - 오행 합계 = 6");
  try {
    const result = calculateManse(TEST_CASE_2.birth, TEST_CASE_2.lunarResponse);
    if (result.status !== "error" && result.elements.total === ELEMENT_TOTAL_WITHOUT_HOUR) {
      console.log(`  ✓ 오행 합계: ${result.elements.total} (기대값: ${ELEMENT_TOTAL_WITHOUT_HOUR})`);
      console.log(`  ✓ 시주 미사용: isAvailable=${result.pillars.hour.isAvailable}`);
      passed++;
    } else {
      console.log(`  ✗ 오행 합계 불일치: ${result.elements.total}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ 예외 발생: ${e}`);
    failed++;
  }
  
  // 테스트 4: 윤달 케이스
  console.log("\n[테스트 4] 윤달 케이스");
  try {
    const result = calculateManse(TEST_CASE_3.birth, TEST_CASE_3.lunarResponse);
    if (result.status !== "error" && result.birthSummary.lunar.isLeapMonth === true) {
      console.log(`  ✓ 윤달 여부: ${result.birthSummary.lunar.isLeapMonth}`);
      console.log(`  ✓ 오행 합계: ${result.elements.total}`);
      passed++;
    } else {
      console.log(`  ✗ 윤달 처리 실패`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ 예외 발생: ${e}`);
    failed++;
  }
  
  // 테스트 5: API 오류 케이스
  console.log("\n[테스트 5] API 오류 케이스");
  try {
    const result = calculateManse(TEST_CASE_4.birth, TEST_CASE_4.lunarResponse);
    if (result.status === "error") {
      console.log(`  ✓ 에러 상태 반환: ${result.status}`);
      console.log(`  ✓ 에러 메시지: ${result.errorMessage}`);
      passed++;
    } else {
      console.log(`  ✗ 에러 상태가 아님`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ 예외 발생: ${e}`);
    failed++;
  }
  
  // 테스트 6: 시주 계산 검증
  console.log("\n[테스트 6] 시주 계산 (오호연원법)");
  // 정일(丁) + 9시(진시) 검증
  // 정임 → 자시가 경(6), 진시(인덱스 4) → (6+4)%10 = 0 = 갑
  const hourResult = calculateHourPillar("丁", 9);
  if (hourResult.천간읽기 === "갑" && hourResult.지지읽기 === "진") {
    console.log(`  ✓ 정일 9시 → ${hourResult.천간읽기}${hourResult.지지읽기}(${hourResult.천간}${hourResult.지지})`);
    passed++;
  } else {
    console.log(`  ✗ 시주 계산 오류: ${hourResult.천간읽기}${hourResult.지지읽기}`);
    failed++;
  }
  
  // 테스트 7: 매핑 정확성 검증
  console.log("\n[테스트 7] 오행 매핑 정확성");
  const testPillars: NormalizedPillars = {
    year: { 천간: "庚", 천간읽기: "경", 지지: "午", 지지읽기: "오", 오행천간: "금", 오행지지: "화" },
    month: { 천간: "甲", 천간읽기: "갑", 지지: "申", 지지읽기: "신", 오행천간: "목", 오행지지: "금" },
    day: { 천간: "丁", 천간읽기: "정", 지지: "巳", 지지읽기: "사", 오행천간: "화", 오행지지: "화" },
    hour: { 천간: "甲", 천간읽기: "갑", 지지: "辰", 지지읽기: "진", 오행천간: "목", 오행지지: "토" },
  };
  
  const elements = calcElements(testPillars);
  // 예상: 목=2(갑,갑), 화=3(오,정,사), 토=1(진), 금=2(경,신), 수=0
  const expectedElements = { 목: 2, 화: 3, 토: 1, 금: 2, 수: 0 };
  
  if (
    elements.목 === expectedElements.목 &&
    elements.화 === expectedElements.화 &&
    elements.토 === expectedElements.토 &&
    elements.금 === expectedElements.금 &&
    elements.수 === expectedElements.수
  ) {
    console.log(`  ✓ 오행 매핑 정확: 목=${elements.목}, 화=${elements.화}, 토=${elements.토}, 금=${elements.금}, 수=${elements.수}`);
    passed++;
  } else {
    console.log(`  ✗ 오행 매핑 오류`);
    console.log(`    실제: 목=${elements.목}, 화=${elements.화}, 토=${elements.토}, 금=${elements.금}, 수=${elements.수}`);
    console.log(`    기대: 목=${expectedElements.목}, 화=${expectedElements.화}, 토=${expectedElements.토}, 금=${expectedElements.금}, 수=${expectedElements.수}`);
    failed++;
  }
  
  // 테스트 8: 절기 경계일 케이스 - 메타데이터 검증
  console.log("\n[테스트 8] 절기 경계일 - 월주 신뢰도 검증");
  try {
    const result = calculateManse(TEST_CASE_5_JEOLGI_BOUNDARY.birth, TEST_CASE_5_JEOLGI_BOUNDARY.lunarResponse);
    
    // 절기 API 미연동 상태이므로 월주는 "reference" 상태여야 함
    const monthBasis = result.calculationMeta.monthPillarBasis;
    const hourStatus = result.calculationMeta.hourPillarStatus;
    
    if (monthBasis.trustLevel === "reference" && monthBasis.type === "lunar_month") {
      console.log(`  ✓ 월주 신뢰도: ${monthBasis.trustLevel} (절기 미확정 - 참고값)`);
      console.log(`    ㄴ 기준: ${monthBasis.type}`);
      console.log(`    ㄴ 안내: ${monthBasis.note}`);
      passed++;
    } else {
      console.log(`  ✗ 월주 메타데이터 오류`);
      console.log(`    기대: trustLevel=reference, type=lunar_month`);
      console.log(`    실제: trustLevel=${monthBasis.trustLevel}, type=${monthBasis.type}`);
      failed++;
    }
    
    // 시주는 시간이 있으므로 "confirmed" 상태여야 함
    if (hourStatus.trustLevel === "confirmed" && hourStatus.isAvailable === true) {
      console.log(`  ✓ 시주 신뢰도: ${hourStatus.trustLevel} (시간 입력됨)`);
      passed++;
    } else {
      console.log(`  ✗ 시주 메타데이터 오류`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ 예외 발생: ${e}`);
    failed++;
  }
  
  // 테스트 9: 시간 미입력 시 메타데이터 검증
  console.log("\n[테스트 9] 시간 미입력 - 시주 메타데이터 검증");
  try {
    const result = calculateManse(TEST_CASE_2.birth, TEST_CASE_2.lunarResponse);
    
    const hourStatus = result.calculationMeta.hourPillarStatus;
    
    if (hourStatus.trustLevel === "unavailable" && hourStatus.isAvailable === false) {
      console.log(`  ✓ 시주 신뢰도: ${hourStatus.trustLevel} (시간 미입력)`);
      console.log(`    ㄴ 안내: ${hourStatus.note}`);
      passed++;
    } else {
      console.log(`  ✗ 시주 메타데이터 오류`);
      console.log(`    기대: trustLevel=unavailable, isAvailable=false`);
      console.log(`    실제: trustLevel=${hourStatus.trustLevel}, isAvailable=${hourStatus.isAvailable}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ 예외 발생: ${e}`);
    failed++;
  }
  
  // 테스트 10: 데이터 소스 메타데이터 검증
  console.log("\n[테스트 10] 데이터 소스 메타데이터 검증");
  try {
    const result = calculateManse(TEST_CASE_1.birth, TEST_CASE_1.lunarResponse);
    
    const dataSource = result.calculationMeta.dataSource;
    
    if (dataSource.lunarConversion === "korea_astronomy_api" && dataSource.ganjiSource === "api_response") {
      console.log(`  ✓ 데이터 소스: 음력변환=${dataSource.lunarConversion}, 간지=${dataSource.ganjiSource}`);
      passed++;
    } else {
      console.log(`  ✗ 데이터 소스 메타데이터 오류`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ 예외 발생: ${e}`);
    failed++;
  }
  
  // 결과 요약
  console.log("\n" + "=".repeat(50));
  console.log(`테스트 결과: ${passed} 통과, ${failed} 실패`);
  console.log("=".repeat(50));
  
  return { passed, failed };
}

// Node.js에서 직접 실행 시
if (typeof window === "undefined") {
  runTests();
}

export { runTests };
