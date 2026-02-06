// ========================
// MBTI 궁합 문구 선택 로직
// ========================

import { type MatchResult, type AxisComparison, parseMbti } from "./mbti";
import textsData from "@/app/data/match/mbti_texts.json";

export interface MatchTexts {
  declaration: string;
  goodPoints: string[];
  cautionPoints: string[];
  action: string;
}

type TextsDataType = typeof textsData;

/**
 * 배열에서 랜덤하게 하나 선택
 */
function pickRandom<T>(arr: T[], seed?: number): T {
  const index = seed !== undefined 
    ? Math.abs(seed) % arr.length 
    : Math.floor(Math.random() * arr.length);
  return arr[index];
}

/**
 * 배열에서 n개 랜덤 선택 (중복 없이)
 */
function pickRandomN<T>(arr: T[], n: number, seed?: number): T[] {
  const shuffled = [...arr];
  const baseSeed = seed ?? Date.now();
  
  // Fisher-Yates shuffle with seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.abs((baseSeed + i * 7) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, n);
}

/**
 * 선언문 선택
 */
function selectDeclaration(grade: string, seed?: number): string {
  const declarations = textsData.declarations as Record<string, string[]>;
  const pool = declarations[grade] || declarations["무난무난"];
  return pickRandom(pool, seed);
}

/**
 * 좋은 포인트 선택 (2~3개)
 */
function selectGoodPoints(
  axis: AxisComparison, 
  myMbti: string, 
  theirMbti: string,
  seed?: number
): string[] {
  const good = textsData.goodPoints;
  const mine = parseMbti(myMbti);
  const theirs = parseMbti(theirMbti);
  const pool: string[] = [];
  
  // E/I
  if (axis.ei.same) {
    pool.push(...good.ei_same);
  } else {
    pool.push(...good.ei_diff);
  }
  
  // N/S
  if (axis.ns.same) {
    if (mine.n_s === "N") {
      pool.push(...good.ns_same_n);
    } else {
      pool.push(...good.ns_same_s);
    }
  }
  
  // T/F
  if (axis.tf.same) {
    if (mine.t_f === "T") {
      pool.push(...good.tf_same_t);
    } else {
      pool.push(...good.tf_same_f);
    }
  }
  
  // J/P
  if (axis.jp.same) {
    pool.push(...good.jp_same);
  }
  
  // 일반
  pool.push(...good.general);
  
  return pickRandomN(pool, 3, seed);
}

/**
 * 조심 포인트 선택 (2개)
 * 우선순위: N/S 다름 > T/F 다름 > J/P 다름 > E/I 다름
 */
function selectCautionPoints(axis: AxisComparison, seed?: number): string[] {
  const caution = textsData.cautionPoints;
  const pool: string[] = [];
  
  // N/S 다르면 우선
  if (!axis.ns.same) {
    pool.push(...caution.ns_diff);
  }
  
  // T/F 다르면
  if (!axis.tf.same) {
    pool.push(...caution.tf_diff);
  }
  
  // J/P 다르면
  if (!axis.jp.same) {
    pool.push(...caution.jp_diff);
  }
  
  // E/I 다르면
  if (!axis.ei.same) {
    pool.push(...caution.ei_diff);
  }
  
  // 일반 (pool이 비어있을 때)
  if (pool.length < 2) {
    pool.push(...caution.general);
  }
  
  return pickRandomN(pool, 2, seed);
}

/**
 * 추천 행동 선택 (1개)
 */
function selectAction(axis: AxisComparison, score: number, seed?: number): string {
  const actions = textsData.actions;
  const pool: string[] = [];
  
  // 점수에 따른 행동
  if (score >= 70) {
    pool.push(...actions.high_score);
  } else if (score >= 50) {
    pool.push(...actions.mid_score);
  } else {
    pool.push(...actions.low_score);
  }
  
  // 축별 행동 추가
  if (!axis.ns.same) {
    pool.push(...actions.ns_diff);
  }
  if (!axis.tf.same) {
    pool.push(...actions.tf_diff);
  }
  if (!axis.jp.same) {
    pool.push(...actions.jp_diff);
  }
  if (!axis.ei.same) {
    pool.push(...actions.ei_diff);
  }
  
  return pickRandom(pool, seed);
}

/**
 * 전체 문구 생성
 */
export function generateMatchTexts(
  result: MatchResult, 
  myMbti: string, 
  theirMbti: string
): MatchTexts {
  // 날짜 기반 시드 (같은 날 같은 결과)
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const mbtiSeed = myMbti.charCodeAt(0) + theirMbti.charCodeAt(0);
  const combinedSeed = seed + mbtiSeed;
  
  return {
    declaration: selectDeclaration(result.grade, combinedSeed),
    goodPoints: selectGoodPoints(result.axisComparison, myMbti, theirMbti, combinedSeed + 1),
    cautionPoints: selectCautionPoints(result.axisComparison, combinedSeed + 2),
    action: selectAction(result.axisComparison, result.score, combinedSeed + 3),
  };
}

/**
 * 전체 결과 + 문구 생성 (편의 함수)
 * 주의: 이 함수를 사용하려면 calculateScore를 외부에서 import해서 전달해야 함
 */
export function getFullMatchResult(
  myMbti: string, 
  theirMbti: string, 
  nickname: string,
  calculateScoreFn: (myMbti: string, theirMbti: string) => MatchResult
): {
  nickname: string;
  myMbti: string;
  theirMbti: string;
  result: MatchResult;
  texts: MatchTexts;
} {
  const result = calculateScoreFn(myMbti, theirMbti);
  const texts = generateMatchTexts(result, myMbti, theirMbti);
  
  return {
    nickname,
    myMbti,
    theirMbti,
    result,
    texts,
  };
}
