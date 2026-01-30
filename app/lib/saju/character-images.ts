// 이 파일은 AI가 생성한 이미지를 캐릭터 타입에 매핑하기 위한 설정입니다.

// 기본 오행별 이미지 경로
const BASE_IMAGES: Record<string, string> = {
  fire: "/characters/character/fire.webp",
  water: "/characters/character/water.webp",
  wood: "/characters/character/wood.webp",
  earth: "/characters/character/earth.webp",
  metal: "/characters/character/metal.webp",
  balance: "/characters/character/balance.webp",
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

// 캐릭터 ID에 따른 이미지 경로 반환
export function getCharacterImage(characterId: string): string | undefined {
  const baseElement = getBaseElement(characterId);
  if (baseElement) {
    return BASE_IMAGES[baseElement];
  }
  return undefined;
}

// 기존 호환성을 위한 직접 매핑 (deprecated)
export const characterImages: Record<string, string> = {
  fire: "/characters/character/fire.webp",
  // 다른 캐릭터 이미지들도 추가될 예정입니다.
};
