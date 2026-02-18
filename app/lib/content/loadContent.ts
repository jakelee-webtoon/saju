// ========================
// 콘텐츠 데이터 로더
// ========================

import type {
  SituationTagsData,
  ModeLabelsData,
  ModeTemplatesData,
  ModeRulesData,
  CharactersData,
  AllContent,
  Character,
  SituationTag,
  ModeLabel,
  SajuProfile,
  LoveModeData,
} from './types';

// JSON 파일 직접 import (Next.js에서 지원)
import situationTagsJson from '@/app/content/todayMode/situationTags.json';
import labelsJson from '@/app/content/todayMode/labels.json';
import templatesJson from '@/app/content/todayMode/templates.json';
import rulesJson from '@/app/content/todayMode/rules.json';
import loveModesJson from '@/app/content/todayMode/loveModes.json';

// --- Fallback 데이터 (파일 로드 실패 시) ---
const FALLBACK_SITUATION_TAGS: SituationTagsData = {
  tags: [
    { id: 'default', label: '기본', shortLabel: '기본', emoji: '💫' }
  ]
};

const FALLBACK_MODE_LABELS: ModeLabelsData = {
  labels: [
    { id: 'observe', name: '관망모드', emoji: '👀', shortTitle: '관망 모드', description: '한 발짝 물러서 지켜보는 상태' }
  ]
};

const FALLBACK_TEMPLATES: ModeTemplatesData = {
  templates: {
    observe: {
      statusOneLinerTemplates: ['오늘은 지켜보는 게 좋은 흐름이에요'],
      loveModeLineTemplates: ['상대의 움직임을 살피는 상태예요'],
      statusLines: ['오늘은 지켜보는 게 좋은 날이야'],
      tipLines: ['조급해하지 않아도 괜찮아'],
      reasonLines: ['천천히 가도 괜찮아'],
      vulnerableLines: ['기다리기 힘들 때'],
      guideLines: ['여유를 가져봐']
    }
  }
};

const FALLBACK_RULES: ModeRulesData = {
  description: 'Fallback rules',
  characterModeWeights: {
    default: { observe: 10 }
  },
  dayOfWeekModifiers: {
    "0": { observe: 1 },
    "1": { observe: 1 }
  }
};

// NOTE: characters/index.json 파일이 삭제되어 더 이상 사용하지 않음
// 필요시 아래 fallback 데이터를 사용하거나 새로운 구조로 재구성
const FALLBACK_CHARACTERS: CharactersData = {
  characters: [{
    id: 'default',
    name: '기본 캐릭터',
    declaration: '넌 특별한 사람이야',
    description: '나만의 방식으로 세상을 살아가는 중',
    empathy: ['누구나 고민이 있어'],
    strengths: ['존재 자체가 장점'],
    weaknesses: ['완벽할 필요 없어'],
    baseTendencies: { impulse: 50, emotion: 50, stability: 50, focus: 50 },
    triggerSensitivity: {
      new_interest: 1,
      maintaining: 1,
      slow_reply: 1,
      need_confirm: 1,
      anxious: 1,
      consider_end: 1
    },
    recoveryBias: { observe: 1, cooldown: 1 },
    elementType: 'balance'
  }]
};

// --- 데이터 로더 함수들 ---

export function getSituationTags(): SituationTagsData {
  try {
    return situationTagsJson as SituationTagsData;
  } catch {
    console.warn('Failed to load situationTags.json, using fallback');
    return FALLBACK_SITUATION_TAGS;
  }
}

export function getModeLabels(): ModeLabelsData {
  try {
    return labelsJson as ModeLabelsData;
  } catch {
    console.warn('Failed to load labels.json, using fallback');
    return FALLBACK_MODE_LABELS;
  }
}

export function getTemplates(): ModeTemplatesData {
  try {
    return templatesJson as ModeTemplatesData;
  } catch {
    console.warn('Failed to load templates.json, using fallback');
    return FALLBACK_TEMPLATES;
  }
}

export function getRules(): ModeRulesData {
  try {
    return rulesJson as ModeRulesData;
  } catch {
    console.warn('Failed to load rules.json, using fallback');
    return FALLBACK_RULES;
  }
}

// NOTE: characters/index.json 파일이 삭제되어 더 이상 사용하지 않음
// 현재 사용되지 않는 함수 - 필요시 재구성
export function getCharacters(): CharactersData {
  console.warn('getCharacters() is deprecated - characters/index.json was removed');
  return FALLBACK_CHARACTERS;
}

// --- 편의 함수들 ---

export function getAllContent(): AllContent {
  return {
    situationTags: getSituationTags(),
    modeLabels: getModeLabels(),
    templates: getTemplates(),
    rules: getRules(),
    characters: getCharacters(),
  };
}

// NOTE: characters/index.json 파일이 삭제되어 더 이상 사용하지 않음
// 현재 사용되지 않는 함수들 - 필요시 재구성
export function getCharacterById(characterId: string): Character | null {
  console.warn('getCharacterById() is deprecated - characters/index.json was removed');
  const { characters } = getCharacters();
  return characters.find(c => c.id === characterId) || null;
}

export function getCharacterByElementType(elementType: string): Character | null {
  console.warn('getCharacterByElementType() is deprecated - characters/index.json was removed');
  const { characters } = getCharacters();
  return characters.find(c => c.elementType === elementType) || null;
}

export function getSituationTagById(tagId: string): SituationTag | null {
  const { tags } = getSituationTags();
  return tags.find(t => t.id === tagId) || null;
}

export function getModeLabelById(labelId: string): ModeLabel | null {
  const { labels } = getModeLabels();
  return labels.find(l => l.id === labelId) || null;
}

// NOTE: characters/index.json 파일이 삭제되어 더 이상 사용하지 않음
// 현재 사용되지 않는 함수들 - 필요시 재구성
export function findCharacterForElement(primaryElement: string): Character | null {
  console.warn('findCharacterForElement() is deprecated - characters/index.json was removed');
  const elementMap: Record<string, string> = {
    'fire': 'fire',
    'water': 'water',
    'wood': 'wood',
    'earth': 'earth',
    'metal': 'earth', // metal은 earth로 매핑 (MVP)
    'balance': 'earth',
  };
  
  const targetElement = elementMap[primaryElement] || 'earth';
  return getCharacterByElementType(targetElement);
}

// --- SajuProfile 추출 ---
export function getSajuProfile(characterId: string): SajuProfile | null {
  console.warn('getSajuProfile() is deprecated - characters/index.json was removed');
  const character = getCharacterById(characterId);
  if (!character) return null;
  
  return {
    characterId: character.id,
    baseTendencies: character.baseTendencies,
    triggerSensitivity: character.triggerSensitivity,
    recoveryBias: character.recoveryBias,
  };
}

export function getSajuProfileFromCharacter(character: Character): SajuProfile {
  return {
    characterId: character.id,
    baseTendencies: character.baseTendencies,
    triggerSensitivity: character.triggerSensitivity,
    recoveryBias: character.recoveryBias,
  };
}

// --- 연애 모드 데이터 ---
export function getLoveModes(): LoveModeData[] {
  try {
    return (loveModesJson as { modes: LoveModeData[] }).modes;
  } catch {
    console.warn('Failed to load loveModes.json');
    return [];
  }
}

export function getLoveModeById(modeId: string): LoveModeData | null {
  const modes = getLoveModes();
  return modes.find(m => m.id === modeId) || null;
}

export function getLoveModesByCategory(category: string): LoveModeData[] {
  const modes = getLoveModes();
  return modes.filter(m => m.category && m.category === category);
}

export function getRandomLoveMode(seed: number): LoveModeData {
  const modes = getLoveModes();
  const index = seed % modes.length;
  return modes[index] || modes[0];
}
