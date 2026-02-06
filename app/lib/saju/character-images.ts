// 이 파일은 캐릭터 타입에 2D 이미지를 매핑하기 위한 설정입니다.
// 오행(화,목,토,금,수)에 따라 2D 캐릭터 이미지를 반환합니다.

export type Gender = "male" | "female";

// 오행별 2D 이미지 경로
const ELEMENT_IMAGES: Record<string, string> = {
  fire: "/characters/character/fire_2d.webp",    // 화
  wood: "/characters/character/tree_2d.webp",    // 목
  earth: "/characters/character/soil_2d.webp",   // 토
  metal: "/characters/character/gold_2d.webp",   // 금
  water: "/characters/character/water_2d.webp",  // 수
  balance: "/characters/character/soil_2d.webp", // 균형 (토로 fallback)
};

// 캐릭터 ID에서 기본 오행 추출
function getBaseElement(characterId: string): string | null {
  // 화 관련 캐릭터
  if (characterId.startsWith("fire") || characterId === "화_극단") return "fire";
  // 수 관련 캐릭터
  if (characterId.startsWith("water") || characterId === "수_극단") return "water";
  // 목 관련 캐릭터
  if (characterId.startsWith("wood") || characterId === "목_극단") return "wood";
  // 토 관련 캐릭터
  if (characterId.startsWith("earth") || characterId === "토_극단") return "earth";
  // 금 관련 캐릭터
  if (characterId.startsWith("metal") || characterId === "금_극단") return "metal";
  // 균형형
  if (characterId === "balance") return "balance";
  
  return null;
}

// 캐릭터 ID에 따른 이미지 경로 반환 (오행 기반)
// gender 파라미터는 하위 호환성을 위해 유지하지만 사용하지 않음
export function getCharacterImage(characterId: string, gender?: Gender): string | undefined {
  const baseElement = getBaseElement(characterId);
  if (baseElement) {
    return ELEMENT_IMAGES[baseElement];
  }
  return ELEMENT_IMAGES["earth"]; // 기본값: 토
}

// 기존 호환성을 위한 직접 매핑
export const characterImages: Record<string, string> = {
  fire: "/characters/character/fire_2d.webp",
  wood: "/characters/character/tree_2d.webp",
  earth: "/characters/character/soil_2d.webp",
  metal: "/characters/character/gold_2d.webp",
  water: "/characters/character/water_2d.webp",
  balance: "/characters/character/soil_2d.webp",
};
