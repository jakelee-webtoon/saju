// ========================
// 생년월일 기반 궁합 계산 엔진
// 기존 사주 계산 로직을 활용한 규칙 기반 점수화
// ========================

import { calculateManseWithLibrary } from "@/app/lib/saju/calculator";
import type { Element, ManseResult, ElementDistribution } from "@/app/lib/saju/types";

// ========================
// 타입 정의
// ========================

export type BirthMatchGrade = "삐걱주의" | "연습필요" | "무난무난" | "꽤 잘 맞음" | "찰떡";

export interface BirthMatchGradeInfo {
  grade: BirthMatchGrade;
  emoji: string;
  color: string;
  bgColor: string;
}

// 12지지 (띠)
export type Zodiac = 
  | "쥐" | "소" | "호랑이" | "토끼" | "용" | "뱀"
  | "말" | "양" | "원숭이" | "닭" | "개" | "돼지";

// 오행 관계
export type ElementRelation = "상생" | "상극" | "비화" | "중립";

// 비교 결과
export interface BirthComparison {
  // 오행 관계
  elementRelation: {
    myElement: Element;
    theirElement: Element;
    relation: ElementRelation;
    description: string;
  };
  // 띠 관계
  zodiacRelation: {
    myZodiac: Zodiac;
    theirZodiac: Zodiac;
    isSamhap: boolean;      // 삼합
    isYukhap: boolean;      // 육합
    isSame: boolean;        // 같은 띠
    isConflict: boolean;    // 충돌 조합
  };
  // 오행 분포 비교
  elementBalance: {
    myDistribution: ElementDistribution;
    theirDistribution: ElementDistribution;
    sharedStrong: Element[];  // 둘 다 강한 오행
    complementary: Element[]; // 서로 보완하는 오행
  };
  // 생일 특성
  birthdayTraits: {
    sameMonth: boolean;
    dayDifference: number;
    bothLateMonth: boolean;  // 둘 다 20일 이후
  };
}

// 궁합 결과
export interface BirthMatchResult {
  score: number;
  grade: BirthMatchGrade;
  gradeInfo: BirthMatchGradeInfo;
  comparison: BirthComparison;
  bonuses: string[];
  penalties: string[];
  myManseResult?: ManseResult;
  theirManseResult?: ManseResult;
}

// ========================
// 상수 정의
// ========================

// 지지 → 띠 매핑 (순서: 자축인묘진사오미신유술해)
const JIJI_TO_ZODIAC: Record<string, Zodiac> = {
  "자": "쥐", "축": "소", "인": "호랑이", "묘": "토끼",
  "진": "용", "사": "뱀", "오": "말", "미": "양",
  "신": "원숭이", "유": "닭", "술": "개", "해": "돼지",
};

// 년도 → 띠 계산 (1984년 = 갑자년 = 쥐띠)
const ZODIAC_ORDER: Zodiac[] = [
  "쥐", "소", "호랑이", "토끼", "용", "뱀",
  "말", "양", "원숭이", "닭", "개", "돼지"
];

// 삼합 그룹 (세 띠가 함께 강한 에너지 형성)
const SAMHAP_GROUPS: Zodiac[][] = [
  ["원숭이", "쥐", "용"],      // 수(水)국
  ["호랑이", "말", "개"],      // 화(火)국
  ["돼지", "토끼", "양"],      // 목(木)국
  ["뱀", "닭", "소"],          // 금(金)국
];

// 육합 쌍 (두 띠의 조화)
const YUKHAP_PAIRS: [Zodiac, Zodiac][] = [
  ["쥐", "소"],
  ["호랑이", "돼지"],
  ["토끼", "개"],
  ["용", "닭"],
  ["뱀", "원숭이"],
  ["말", "양"],
];

// 충돌 조합 (일반적으로 어려움이 있다고 알려진 조합, 최대 6쌍만)
const CONFLICT_PAIRS: [Zodiac, Zodiac][] = [
  ["쥐", "말"],        // 자오충
  ["소", "양"],        // 축미충
  ["호랑이", "원숭이"], // 인신충
  ["토끼", "닭"],      // 묘유충
  ["용", "개"],        // 진술충
  ["뱀", "돼지"],      // 사해충
];

// 오행 상생 관계 (목→화→토→금→수→목)
const ELEMENT_SANGSAENG: Record<Element, Element> = {
  "목": "화",  // 목생화
  "화": "토",  // 화생토
  "토": "금",  // 토생금
  "금": "수",  // 금생수
  "수": "목",  // 수생목
};

// 오행 상극 관계 (목→토, 토→수, 수→화, 화→금, 금→목)
const ELEMENT_SANGGEUK: Record<Element, Element> = {
  "목": "토",  // 목극토
  "토": "수",  // 토극수
  "수": "화",  // 수극화
  "화": "금",  // 화극금
  "금": "목",  // 금극목
};

// ========================
// 유틸리티 함수
// ========================

/**
 * 년도로 띠 계산
 */
export function getZodiacFromYear(year: number): Zodiac {
  // 1984년 = 쥐띠 (갑자년)
  const offset = ((year - 1984) % 12 + 12) % 12;
  return ZODIAC_ORDER[offset];
}

/**
 * 지지 한글로 띠 계산
 */
export function getZodiacFromJiji(jiji: string): Zodiac {
  return JIJI_TO_ZODIAC[jiji] || "쥐";
}

/**
 * 두 띠가 삼합인지 확인
 */
export function isSamhap(zodiac1: Zodiac, zodiac2: Zodiac): boolean {
  return SAMHAP_GROUPS.some(
    group => group.includes(zodiac1) && group.includes(zodiac2)
  );
}

/**
 * 두 띠가 육합인지 확인
 */
export function isYukhap(zodiac1: Zodiac, zodiac2: Zodiac): boolean {
  return YUKHAP_PAIRS.some(
    pair => (pair[0] === zodiac1 && pair[1] === zodiac2) ||
            (pair[1] === zodiac1 && pair[0] === zodiac2)
  );
}

/**
 * 두 띠가 충돌인지 확인
 */
export function isConflict(zodiac1: Zodiac, zodiac2: Zodiac): boolean {
  return CONFLICT_PAIRS.some(
    pair => (pair[0] === zodiac1 && pair[1] === zodiac2) ||
            (pair[1] === zodiac1 && pair[0] === zodiac2)
  );
}

/**
 * 두 오행의 관계 확인
 */
export function getElementRelation(element1: Element, element2: Element): ElementRelation {
  // 같은 오행
  if (element1 === element2) {
    return "비화";
  }
  
  // 상생 관계 (내가 상대를 생하거나, 상대가 나를 생함)
  if (ELEMENT_SANGSAENG[element1] === element2 || 
      ELEMENT_SANGSAENG[element2] === element1) {
    return "상생";
  }
  
  // 상극 관계 (내가 상대를 극하거나, 상대가 나를 극함)
  if (ELEMENT_SANGGEUK[element1] === element2 || 
      ELEMENT_SANGGEUK[element2] === element1) {
    return "상극";
  }
  
  return "중립";
}

/**
 * 오행 관계 설명
 */
function getElementRelationDescription(
  element1: Element, 
  element2: Element, 
  relation: ElementRelation
): string {
  switch (relation) {
    case "비화":
      return `같은 ${element1} 에너지로 서로 공감해요`;
    case "상생":
      if (ELEMENT_SANGSAENG[element1] === element2) {
        return `${element1}이 ${element2}를 북돋아주는 관계예요`;
      } else {
        return `${element2}이 ${element1}를 북돋아주는 관계예요`;
      }
    case "상극":
      return `서로 다른 에너지가 부딪힐 수 있어요`;
    default:
      return "중립적인 관계예요";
  }
}

/**
 * 오행 분포에서 가장 강한 오행 찾기
 */
function getStrongestElement(distribution: ElementDistribution): Element {
  const elements: Element[] = ["목", "화", "토", "금", "수"];
  let strongest: Element = "목";
  let maxCount = 0;
  
  for (const el of elements) {
    if (distribution[el] > maxCount) {
      maxCount = distribution[el];
      strongest = el;
    }
  }
  
  return strongest;
}

/**
 * 오행 분포에서 강한 오행들 찾기 (2개 이상)
 */
function getStrongElements(distribution: ElementDistribution): Element[] {
  const elements: Element[] = ["목", "화", "토", "금", "수"];
  return elements.filter(el => distribution[el] >= 2);
}

/**
 * 두 생년월일 비교
 */
function compareBirthdays(
  myMonth: number, myDay: number,
  theirMonth: number, theirDay: number
): { sameMonth: boolean; dayDifference: number; bothLateMonth: boolean } {
  const sameMonth = myMonth === theirMonth;
  const dayDifference = Math.abs(myDay - theirDay);
  const bothLateMonth = myDay >= 20 && theirDay >= 20;
  
  return { sameMonth, dayDifference, bothLateMonth };
}

// ========================
// 메인 계산 함수
// ========================

/**
 * 생년월일 기반 궁합 점수 계산
 * 
 * 기본점수 55점에서 시작:
 * 
 * [오행 관계]
 * - 상생: +12 (북돋아주는 관계)
 * - 비화: +8 (같은 에너지로 공감)
 * - 중립: +4 (적당한 거리감)
 * - 상극: -6 (부딪힐 수 있음)
 * 
 * [띠 관계]
 * - 육합: +12 (가장 조화로운 짝)
 * - 삼합: +10 (함께 큰 에너지 형성)
 * - 같은 띠: +8 (동질감)
 * - 충돌: -6 (마찰 가능)
 * 
 * [오행 분포 보완]
 * - 서로 부족한 오행을 보완: +4
 * - 둘 다 같은 오행 과다: -3 (과열 주의)
 * 
 * [생일 특성]
 * - 같은 달: +3 (리듬 비슷)
 * - 날짜 차이 0~3일: +2 (취향 겹침 가능)
 * - 둘 다 20일 이후: +1 (결단력 있음)
 */
export function calculateBirthMatch(
  myYear: number, myMonth: number, myDay: number,
  theirYear: number, theirMonth: number, theirDay: number,
  myHour?: number, theirHour?: number
): BirthMatchResult {
  const bonuses: string[] = [];
  const penalties: string[] = [];
  let score = 55; // 기본점수
  
  // 사주 계산
  const myManseResult = calculateManseWithLibrary({
    year: myYear,
    month: myMonth,
    day: myDay,
    hour: myHour,
  });
  
  const theirManseResult = calculateManseWithLibrary({
    year: theirYear,
    month: theirMonth,
    day: theirDay,
    hour: theirHour,
  });
  
  // 일간 오행 추출 (사주 계산 실패 시 fallback)
  const myElement: Element = myManseResult.status !== "error" 
    ? myManseResult.ilgan.오행 
    : getStrongestElement(myManseResult.elements);
  const theirElement: Element = theirManseResult.status !== "error"
    ? theirManseResult.ilgan.오행
    : getStrongestElement(theirManseResult.elements);
  
  // 띠 계산 (년주 지지 또는 연도 기반)
  const myZodiac: Zodiac = myManseResult.status !== "error" && myManseResult.pillars.year.isAvailable
    ? getZodiacFromJiji(myManseResult.pillars.year.지지읽기)
    : getZodiacFromYear(myYear);
  const theirZodiac: Zodiac = theirManseResult.status !== "error" && theirManseResult.pillars.year.isAvailable
    ? getZodiacFromJiji(theirManseResult.pillars.year.지지읽기)
    : getZodiacFromYear(theirYear);
  
  // ========== 오행 관계 점수 ==========
  const relation = getElementRelation(myElement, theirElement);
  const relationDescription = getElementRelationDescription(myElement, theirElement, relation);
  
  switch (relation) {
    case "상생":
      score += 12;
      bonuses.push("서로를 북돋아주는 상생 관계예요");
      break;
    case "비화":
      score += 8;
      bonuses.push(`같은 ${myElement} 에너지로 깊이 공감해요`);
      break;
    case "중립":
      score += 4;
      bonuses.push("적당한 거리감이 편안함을 줘요");
      break;
    case "상극":
      score -= 6;
      penalties.push("서로 다른 에너지가 충돌할 수 있어요");
      break;
  }
  
  // ========== 띠 관계 점수 ==========
  const samhapMatch = isSamhap(myZodiac, theirZodiac);
  const yukhapMatch = isYukhap(myZodiac, theirZodiac);
  const sameZodiac = myZodiac === theirZodiac;
  const conflictMatch = isConflict(myZodiac, theirZodiac);
  
  if (yukhapMatch) {
    score += 12;
    bonuses.push(`${myZodiac}띠와 ${theirZodiac}띠는 천생연분 육합이에요`);
  } else if (samhapMatch) {
    score += 10;
    bonuses.push(`${myZodiac}띠와 ${theirZodiac}띠가 삼합을 이뤄요`);
  } else if (sameZodiac) {
    score += 8;
    bonuses.push(`같은 ${myZodiac}띠끼리 동질감이 있어요`);
  } else if (conflictMatch) {
    score -= 6;
    penalties.push(`${myZodiac}띠와 ${theirZodiac}띠는 조금 신경 쓰면 좋아요`);
  }
  
  // ========== 오행 분포 보완 ==========
  const myStrongElements = getStrongElements(myManseResult.elements);
  const theirStrongElements = getStrongElements(theirManseResult.elements);
  
  // 서로 보완하는 오행 찾기
  const complementary: Element[] = [];
  const elements: Element[] = ["목", "화", "토", "금", "수"];
  for (const el of elements) {
    const myCount = myManseResult.elements[el];
    const theirCount = theirManseResult.elements[el];
    // 한쪽이 부족하고(0-1) 다른쪽이 충분한 경우(2+)
    if ((myCount <= 1 && theirCount >= 2) || (theirCount <= 1 && myCount >= 2)) {
      complementary.push(el);
    }
  }
  
  if (complementary.length > 0) {
    score += 4;
    bonuses.push("서로 부족한 에너지를 채워줄 수 있어요");
  }
  
  // 둘 다 같은 오행이 과다한 경우
  const sharedStrong = myStrongElements.filter(el => theirStrongElements.includes(el));
  if (sharedStrong.length > 0) {
    const strongElement = sharedStrong[0];
    if (myManseResult.elements[strongElement] >= 3 && theirManseResult.elements[strongElement] >= 3) {
      score -= 3;
      penalties.push(`${strongElement} 에너지가 둘 다 강해서 과열될 수 있어요`);
    }
  }
  
  // ========== 생일 특성 ==========
  const birthdayTraits = compareBirthdays(myMonth, myDay, theirMonth, theirDay);
  
  if (birthdayTraits.sameMonth) {
    score += 3;
    bonuses.push("같은 달에 태어나 계절 리듬이 맞아요");
  }
  
  if (birthdayTraits.dayDifference <= 3) {
    score += 2;
    bonuses.push("비슷한 날에 태어나 취향이 통할 수 있어요");
  }
  
  if (birthdayTraits.bothLateMonth) {
    score += 1;
  }
  
  // ========== 점수 클램프 ==========
  score = Math.max(0, Math.min(100, score));
  
  // ========== 등급 결정 ==========
  const gradeInfo = getBirthGradeInfo(score);
  
  // ========== 비교 결과 구성 ==========
  const comparison: BirthComparison = {
    elementRelation: {
      myElement,
      theirElement,
      relation,
      description: relationDescription,
    },
    zodiacRelation: {
      myZodiac,
      theirZodiac,
      isSamhap: samhapMatch,
      isYukhap: yukhapMatch,
      isSame: sameZodiac,
      isConflict: conflictMatch,
    },
    elementBalance: {
      myDistribution: myManseResult.elements,
      theirDistribution: theirManseResult.elements,
      sharedStrong,
      complementary,
    },
    birthdayTraits,
  };
  
  return {
    score,
    grade: gradeInfo.grade,
    gradeInfo,
    comparison,
    bonuses: bonuses.slice(0, 3),
    penalties: penalties.slice(0, 2),
    myManseResult,
    theirManseResult,
  };
}

/**
 * 점수에 따른 등급 정보 반환
 */
export function getBirthGradeInfo(score: number): BirthMatchGradeInfo {
  if (score >= 85) {
    return { grade: "찰떡", emoji: "💕", color: "text-pink-600", bgColor: "bg-pink-100" };
  } else if (score >= 70) {
    return { grade: "꽤 잘 맞음", emoji: "💗", color: "text-rose-500", bgColor: "bg-rose-100" };
  } else if (score >= 55) {
    return { grade: "무난무난", emoji: "😊", color: "text-amber-500", bgColor: "bg-amber-100" };
  } else if (score >= 40) {
    return { grade: "연습필요", emoji: "🤔", color: "text-orange-500", bgColor: "bg-orange-100" };
  } else {
    return { grade: "삐걱주의", emoji: "⚠️", color: "text-gray-500", bgColor: "bg-gray-100" };
  }
}

// ========================
// 테스트 함수
// ========================

