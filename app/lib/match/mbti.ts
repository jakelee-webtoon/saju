// ========================
// MBTI 궁합 점수 계산 엔진
// 16x16 하드코딩 없이 규칙 기반으로 계산
// ========================

export type MbtiType = 
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export const MBTI_TYPES: MbtiType[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP"
];

// 등급 정의
export type MatchGrade = "삐걱주의" | "연습필요" | "무난무난" | "꽤 잘 맞음" | "찰떡";

export interface MatchGradeInfo {
  grade: MatchGrade;
  emoji: string;
  color: string;
  bgColor: string;
}

// 축 비교 결과
export interface AxisComparison {
  ei: { same: boolean; mine: string; theirs: string };
  ns: { same: boolean; mine: string; theirs: string };
  tf: { same: boolean; mine: string; theirs: string };
  jp: { same: boolean; mine: string; theirs: string };
}

// 궁합 결과
export interface MatchResult {
  score: number;
  grade: MatchGrade;
  gradeInfo: MatchGradeInfo;
  axisComparison: AxisComparison;
  bonuses: string[];
  penalties: string[];
}

/**
 * MBTI 파싱 - 각 축 추출
 */
export function parseMbti(mbti: string): { e_i: string; n_s: string; t_f: string; j_p: string } {
  const upper = mbti.toUpperCase();
  return {
    e_i: upper[0], // E or I
    n_s: upper[1], // N or S
    t_f: upper[2], // T or F
    j_p: upper[3], // J or P
  };
}

/**
 * 두 MBTI 축 비교
 */
export function compareAxis(myMbti: string, theirMbti: string): AxisComparison {
  const mine = parseMbti(myMbti);
  const theirs = parseMbti(theirMbti);
  
  return {
    ei: { same: mine.e_i === theirs.e_i, mine: mine.e_i, theirs: theirs.e_i },
    ns: { same: mine.n_s === theirs.n_s, mine: mine.n_s, theirs: theirs.n_s },
    tf: { same: mine.t_f === theirs.t_f, mine: mine.t_f, theirs: theirs.t_f },
    jp: { same: mine.j_p === theirs.j_p, mine: mine.j_p, theirs: theirs.j_p },
  };
}

/**
 * 점수 계산 (0~100)
 * 
 * A) 기본점수 55점에서 시작
 * B) 축별 점수:
 *   - E/I: 같으면 +8, 다르면 +4 (다름도 보완으로 긍정)
 *   - N/S: 같으면 +10, 다르면 -6 (대화 결이 갈리기 쉬움)
 *   - T/F: 같으면 +8, 다르면 -4 (상처 포인트)
 *   - J/P: 같으면 +6, 다르면 -2 (약속/리듬)
 * C) 보너스/패널티:
 *   - N 둘 다면 +4
 *   - S 둘 다면 +3
 *   - F 둘 다면 +3
 *   - T 둘 다면 +2
 *   - (J와 P가 다르고, E도 다르면) -3
 */
export function calculateScore(myMbti: string, theirMbti: string): MatchResult {
  const axis = compareAxis(myMbti, theirMbti);
  const mine = parseMbti(myMbti);
  const theirs = parseMbti(theirMbti);
  
  let score = 55; // 기본점수
  const bonuses: string[] = [];
  const penalties: string[] = [];
  
  // B) 축별 점수
  // E/I
  if (axis.ei.same) {
    score += 8;
    bonuses.push("에너지 방향이 같아요");
  } else {
    score += 4;
    bonuses.push("서로 다른 에너지로 보완해요");
  }
  
  // N/S (가장 중요)
  if (axis.ns.same) {
    score += 10;
    bonuses.push("대화 스타일이 잘 맞아요");
  } else {
    score -= 6;
    penalties.push("대화 방식이 달라 오해가 생길 수 있어요");
  }
  
  // T/F
  if (axis.tf.same) {
    score += 8;
    bonuses.push("결정 방식이 비슷해요");
  } else {
    score -= 4;
    penalties.push("감정 표현 방식이 달라요");
  }
  
  // J/P
  if (axis.jp.same) {
    score += 6;
    bonuses.push("생활 리듬이 맞아요");
  } else {
    score -= 2;
    penalties.push("계획 vs 즉흥 차이가 있어요");
  }
  
  // C) 보너스/패널티
  // N 둘 다
  if (mine.n_s === "N" && theirs.n_s === "N") {
    score += 4;
    bonuses.push("상상력 넘치는 대화가 가능해요");
  }
  
  // S 둘 다
  if (mine.n_s === "S" && theirs.n_s === "S") {
    score += 3;
    bonuses.push("현실적이고 안정적인 관계예요");
  }
  
  // F 둘 다
  if (mine.t_f === "F" && theirs.t_f === "F") {
    score += 3;
    bonuses.push("서로의 감정을 잘 이해해요");
  }
  
  // T 둘 다
  if (mine.t_f === "T" && theirs.t_f === "T") {
    score += 2;
    bonuses.push("논리적인 소통이 가능해요");
  }
  
  // J와 P가 다르고, E/I도 다르면
  if (!axis.jp.same && !axis.ei.same) {
    score -= 3;
    penalties.push("약속/속도에서 충돌이 생길 수 있어요");
  }
  
  // 점수 클램프 (0~100)
  score = Math.max(0, Math.min(100, score));
  
  // 등급 결정
  const gradeInfo = getGradeInfo(score);
  
  return {
    score,
    grade: gradeInfo.grade,
    gradeInfo,
    axisComparison: axis,
    bonuses: bonuses.slice(0, 3), // 최대 3개
    penalties: penalties.slice(0, 2), // 최대 2개
  };
}

/**
 * 점수에 따른 등급 정보 반환
 */
export function getGradeInfo(score: number): MatchGradeInfo {
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

