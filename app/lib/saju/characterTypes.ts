/**
 * 캐릭터 타입 데이터베이스
 * 오행 조합에 따른 성격 유형 정의
 */

import type { Element } from "./index";

// ========================
// 타입 정의
// ========================

export interface CharacterType {
  id: string;
  name: string;
  emoji: string;        // 캐릭터 이모지 (예: 🔥, ⚔️)
  declaration: string;  // 한 줄 선언문
  description: string;  // 2~3줄 성격 설명
  empathy: string[];    // 공감 문장 3개
  strengths: string[];  // 강점 2~3개
  weaknesses: string[]; // 취약 포인트 1~2개
  color: string;        // Tailwind 색상 클래스
}

// ========================
// 캐릭터 데이터베이스
// ========================

export const CHARACTER_DB: Record<string, CharacterType> = {
  // ========== 화 주도 ==========
  "화_목": {
  id: "fire_wood",
  name: "점화 본능",
  declaration: "넌 ‘생각’보다 ‘시작’이 먼저 튀어나오는 사람이야",
  description: "불 붙이는 건 숨 쉬듯 자연스러운데\n불 지키는 건 관심 밖이야\n새 불씨가 오면, 이미 다음 장으로 넘어가 있거든.",
  empathy: [
    "시작 버튼은 누가 대신 눌러준 적이 없고, 늘 내가 먼저였음",
    "흥미 떨어지면 속도가 확 꺼져서 스스로도 당황함",
    "열정이 아니라 호기심으로 움직이는데, 남들은 열정이라 부름"
  ],
  strengths: ["초반 추진력으로 판을 여는 타입", "분위기 전환이 빠르고 과감함"],
  weaknesses: ["지속 구간에서 ‘관리’가 제일 귀찮음"],
  color: "bg-red-500", emoji: "🔥"
  },
  "화_금": {
  id: "fire_metal",
  name: "칼날 위의 불꽃",
  declaration: "넌 뜨겁게 달리면서도 ‘어디를 베어야 하는지’ 아는 사람이야",
  description: "감정으로 뛰는데 방향은 잃지 않아\n남들 눈엔 무모해 보여도\n너 머릿속엔 ‘승부처’가 정확히 잡혀 있어.",
  empathy: [
    "질러놓고 후회하는 게 아니라, 질러야 할 때를 알고 지름",
    "감정적인 말도 결국 결론은 논리로 정리됨",
    "평소엔 뜨거운데, 진짜 중요한 순간엔 오히려 차가워짐"
  ],
  strengths: ["결정적 순간에 포인트를 정확히 잡음", "추진과 판단이 동시에 굴러감"],
  weaknesses: ["기준이 높아서 사람도 일도 ‘거칠게’ 느껴질 때 있음"],
  color: "bg-orange-600", emoji: "⚔️"
  },
  "화_수": {
  id: "fire_water",
  name: "끓는 주전자",
  declaration: "넌 겉은 조용한데 속은 이미 끓고 있는 사람이야",
  description: "표정은 멀쩡한데 속은 바쁘고\n참다가 어느 순간 확 올라와\n그때부터는 너도 너를 못 말려.",
  empathy: [
    "쿨한 척은 하는데, 사실 제일 많이 신경 씀",
    "표현을 아끼다가 한 번 말하면 세게 나감",
    "괜찮다고 했던 것들이 어느 날 한꺼번에 터짐"
  ],
  strengths: ["감정을 에너지로 바꾸는 힘", "깊은 고민 끝에 강하게 움직임"],
  weaknesses: ["누적되면 폭발로 처리하는 버릇이 생길 수 있음"],
  color: "bg-purple-600", emoji: "🌋"
  },
  "화_토": {
  id: "fire_earth",
  name: "안전한 불장난",
  declaration: "넌 뜨겁게 가되 ‘선’은 지키는 사람이야",
  description: "열정은 있는데 막 던지진 않아\n한 번 뛰기 전에 바닥을 확인하고\n그 다음에 제일 멀리 점프해.",
  empathy: [
    "대담해 보이는데, 사실 리스크 계산이 먼저임",
    "불필요한 싸움은 피하고, 필요한 승부만 봄",
    "‘즐기되 망치진 않는다’가 내 기본값"
  ],
  strengths: ["지속 가능한 추진력", "현실 감각 있는 실행"],
  weaknesses: ["안전선이 넓어지면 기회를 늦게 잡을 때가 있음"],
  color: "bg-rose-500", emoji: "🏕️"
  },
  
  // ========== 수 주도 ==========
  "수_화": {
    id: "water_fire",
    name: "차가운 열정가",
    declaration: "넌 겉은 냉정한데 속에 불씨를 품고 있는 사람이야",
    description: "쿨해 보이는데 관심 있는 건 진심이야.\n다만 티를 잘 안 내서 남들이 모를 뿐.\n불붙으면 그때부터 무서움.",
    empathy: [
      "관심 없는 척하다가 갑자기 빠지면 제대로 빠짐",
      "감정 표현 서툴러서 오해 살 때 있음",
      "진짜 화나면 조용해지는 타입"
    ],
    strengths: ["필요할 때 폭발하는 집중력", "깊은 내면과 강한 의지"],
    weaknesses: ["속마음 표현이 서툴러서 답답할 때 있음"],
    color: "bg-indigo-600", emoji: "🧊"
  },
  "수_목": {
    id: "water_wood",
    name: "조용한 성장러",
    declaration: "넌 눈에 안 띄게 계속 자라고 있는 사람이야",
    description: "겉으론 별 거 안 하는 것 같은데\n뒤에서 꾸준히 뭔가 하고 있어.\n어느 날 보면 저만치 가 있음.",
    empathy: [
      "티 안 내고 혼자 공부하다가 갑자기 결과물 냄",
      "조용히 하는 게 편해서 존재감이 없을 때 있음",
      "천천히 가는 것 같아도 결국 목표까지 감"
    ],
    strengths: ["꾸준함의 끝판왕", "깊이 있는 성장"],
    weaknesses: ["존재감 어필이 약해서 노력을 못 알아볼 때 있음"],
    color: "bg-teal-600", emoji: "🌿"
  },
  "수_금": {
    id: "water_metal",
    name: "얼음 칼날",
    declaration: "넌 감정 없이 정확하게 벨 수 있는 사람이야",
    description: "상황 판단이 냉철하고\n필요하면 감정 빼고 결정해.\n냉정하다기보단 합리적인 거야.",
    empathy: [
      "감정적인 결정 잘 못 해서 차갑다고 오해받음",
      "논리적으로 맞으면 인정해, 내 의견이 틀려도",
      "팩트 폭격기라는 말 들어봤을 듯"
    ],
    strengths: ["냉철한 판단력", "흔들리지 않는 기준"],
    weaknesses: ["너무 냉정해 보여서 벽 느끼는 사람 있음"],
    color: "bg-slate-600", emoji: "🔪"
  },
  "수_토": {
    id: "water_earth",
    name: "잔잔한 호수",
    declaration: "넌 깊은데 흔들리지 않는 사람이야",
    description: "속은 깊은데 겉은 고요해.\n급하게 안 움직이고 천천히 생각해.\n결론 내면 잘 안 바뀜.",
    empathy: [
      "빨리빨리 재촉받으면 스트레스임",
      "결정 느린 편인데 한번 정하면 번복 없음",
      "조용하다고 생각 없는 거 아님, 오히려 더 많이 함"
    ],
    strengths: ["깊은 사고력", "흔들리지 않는 안정감"],
    weaknesses: ["변화에 적응하는 데 시간 좀 걸림"],
    color: "bg-cyan-700", emoji: "🏔️"
  },
  
  // ========== 목 주도 ==========
  "목_화": {
    id: "wood_fire",
    name: "불타는 성장판",
    declaration: "넌 멈추면 죽는다고 생각하는 사람이야",
    description: "뭔가 해야 직성이 풀려.\n성장하고 있다는 느낌이 없으면 불안해.\n근데 그 에너지가 진짜 무서움.",
    empathy: [
      "가만히 있으면 몸에 벌레 기어다니는 느낌",
      "성장하고 있다는 느낌 없으면 우울해짐",
      "주변에서 좀 쉬라고 하는데 쉬는 게 더 힘듦"
    ],
    strengths: ["압도적인 성장 의지", "멈추지 않는 추진력"],
    weaknesses: ["번아웃 주의보, 자기 관리가 약점"],
    color: "bg-lime-600", emoji: "🌳"
  },
  "목_수": {
    id: "wood_water",
    name: "영양만점 새싹",
    declaration: "넌 생각하면서 자라는 똒똒한 식물이야",
    description: "그냥 뻗어나가는 게 아니라\n생각하면서 자라.\n방향 정하고 효율적으로 움직여.",
    empathy: [
      "열심히 하는데 막 하는 건 아님, 계획 있음",
      "배우는 거 좋아해서 자기계발에 시간 많이 씀",
      "성장은 하고 싶은데 무모한 건 싫음"
    ],
    strengths: ["전략적인 성장", "배움에 대한 끝없는 갈증"],
    weaknesses: ["생각만 하다가 타이밍 놓칠 때 있음"],
    color: "bg-emerald-500", emoji: "📚"
  },
  "목_금": {
    id: "wood_metal",
    name: "정밀 가지치기",
    declaration: "넌 성장하되 필요 없는 건 잘라내는 사람이야",
    description: "자라긴 자라는데 막 자라진 않아.\n불필요한 건 쳐내면서 성장해.\n효율 중시하는 성장러.",
    empathy: [
      "시간 낭비 싫어서 필요 없으면 안 함",
      "성장은 하고 싶은데 정리도 동시에 함",
      "인맥 정리도 과감하게 하는 편"
    ],
    strengths: ["효율적인 성장", "선택과 집중의 달인"],
    weaknesses: ["너무 빨리 쳐내서 아까울 때도 있음"],
    color: "bg-green-600", emoji: "✂️"
  },
  "목_토": {
    id: "wood_earth",
    name: "뿌리 깊은 나무",
    declaration: "넌 느리지만 쓰러지지 않는 사람이야",
    description: "빨리 자라진 않는데\n기초가 탄탄해서 흔들리지 않아.\n오래 갈 사람임.",
    empathy: [
      "속도보다 확실한 걸 추구함",
      "기반 없이 시작하는 거 불안해함",
      "느리다고 무시당하는데 결국 내가 남아있음"
    ],
    strengths: ["탄탄한 기본기", "흔들리지 않는 성장"],
    weaknesses: ["초반 속도가 느려서 조급할 때 있음"],
    color: "bg-amber-500", emoji: "🌲"
  },
  
  // ========== 토 주도 ==========
  "토_화": {
    id: "earth_fire",
    name: "용암 대지",
    declaration: "넌 평소엔 조용한데 한번 터지면 진짜 터지는 사람이야",
    description: "겉은 안정적인데 속에 불이 있어.\n평소엔 참는데 한계 오면\n주변이 다 알 정도로 터짐.",
    empathy: [
      "참을 인이 많은 편인데 그게 쌓이면 폭발",
      "화났을 때 무서운 사람이라고 들어봤을 듯",
      "평소엔 순한데 진짜 화나면 손 못 씀"
    ],
    strengths: ["폭발적인 지구력", "참다가 터지면 무서운 힘"],
    weaknesses: ["참다가 터지는 패턴이 반복될 수 있음"],
    color: "bg-orange-700", emoji: "🌋"
  },
  "토_수": {
    id: "earth_water",
    name: "지하수맥",
    declaration: "넌 겉으론 안 보이는데 속이 깊은 사람이야",
    description: "표면적으론 드러나는 게 없는데\n파면 팔수록 뭔가 나와.\n말 안 해서 그렇지 속은 꽉 차있음.",
    empathy: [
      "말수 적어서 속을 모르겠다는 말 자주 들음",
      "겉으론 무덤덤한데 실제론 생각 많이 함",
      "감정 표현 잘 안 해서 오해 살 때 있음"
    ],
    strengths: ["깊은 내면", "묵묵히 해내는 지구력"],
    weaknesses: ["표현 안 해서 답답함을 줄 때 있음"],
    color: "bg-stone-600", emoji: "💎"
  },
  "토_목": {
    id: "earth_wood",
    name: "정원사",
    declaration: "넌 안정적인 환경에서 뭔가를 키우는 사람이야",
    description: "자기가 직접 뻗어나가기보단\n뭔가를 키우고 가꾸는 데 재능 있어.\n기다릴 줄 아는 사람.",
    empathy: [
      "내가 잘되는 것보다 내 사람들 잘되는 게 뿌듯",
      "기다리는 거 잘해서 급한 사람들 이해 안 됨",
      "가꾸고 돌보는 일에 보람 느낌"
    ],
    strengths: ["돌봄의 능력", "인내심 만렙"],
    weaknesses: ["자기 일은 뒷전일 때가 있음"],
    color: "bg-lime-700", emoji: "🌷"
  },
  "토_금": {
    id: "earth_metal",
    name: "바위 조각가",
    declaration: "넌 단단한 기반 위에서 깎아내는 사람이야",
    description: "기초가 튼튼해야 일을 해.\n그리고 군더더기를 깎아내.\n남는 건 본질만.",
    empathy: [
      "확실한 것만 믿는 편이라 모험은 별로",
      "복잡한 거 싫고 단순하고 깔끔한 거 좋아함",
      "쓸데없는 건 인간관계든 물건이든 정리함"
    ],
    strengths: ["본질을 꿰뚫는 눈", "단단한 기본기"],
    weaknesses: ["융통성이 부족해 보일 때 있음"],
    color: "bg-gray-600", emoji: "🗿"
  },
  
  // ========== 금 주도 ==========
  "금_화": {
    id: "metal_fire",
    name: "담금질",
    declaration: "넌 날카로운데 불에 달궈지면 더 강해지는 사람이야",
    description: "기준이 확실한데 열정도 있어.\n차갑기만 한 게 아니라\n필요하면 뜨겁게 달아오름.",
    empathy: [
      "평소엔 냉정한데 진심인 것 앞에선 달라짐",
      "할 말은 하는 편인데 감정 담긴 말은 더 강력함",
      "차갑다가 갑자기 뜨거워지면 주변이 당황함"
    ],
    strengths: ["정밀함 + 열정의 조합", "진심일 때 폭발하는 에너지"],
    weaknesses: ["온도차가 커서 종잡기 어려울 수 있음"],
    color: "bg-red-700", emoji: "⚒️"
  },
  "금_수": {
    id: "metal_water",
    name: "심해의 칼날",
    declaration: "넌 깊은 곳에서 조용히 벨 준비를 하는 사람이야",
    description: "겉으론 잠잠한데\n속에선 계속 갈고 있어.\n한번 꺼내면 끝을 봄.",
    empathy: [
      "평소엔 조용한데 일처리 들어가면 무서워짐",
      "준비 없이 시작하는 거 싫어함",
      "말 적은 편인데 할 말은 정확하게 함"
    ],
    strengths: ["철저한 준비성", "결정적 순간의 정확성"],
    weaknesses: ["준비가 너무 길어서 타이밍 놓칠 때 있음"],
    color: "bg-blue-800", emoji: "🗡️"
  },
  "금_목": {
    id: "metal_wood",
    name: "가위손 정원사",
    declaration: "넌 자르면서 동시에 키우는 사람이야",
    description: "성장도 시키는데 가지치기도 함.\n키우면서 다듬어.\n효율적인 양육가 스타일.",
    empathy: [
      "잘 안되는 건 빨리 손절하고 되는 것에 집중",
      "가르칠 때 칭찬보다 피드백이 더 많은 편",
      "성장시키는데 감정은 잘 안 넣음"
    ],
    strengths: ["효율적인 육성 능력", "명확한 피드백"],
    weaknesses: ["너무 날카로운 피드백에 상처받는 사람 있음"],
    color: "bg-emerald-700", emoji: "🌿"
  },
  "금_토": {
    id: "metal_earth",
    name: "철벽 요새",
    declaration: "넌 들어오려면 통과해야 할 게 많은 사람이야",
    description: "기준이 확실하고 기반도 단단해.\n쉽게 들이지 않는데\n한번 들이면 끝까지 책임져.",
    empathy: [
      "아무나 친해지지 않는 편",
      "한번 인정하면 진짜 내 편으로 대우함",
      "신뢰 쌓는 데 시간 걸리는 편"
    ],
    strengths: ["단단한 신뢰 구축", "한번 맺은 관계는 확실함"],
    weaknesses: ["첫 진입장벽이 높아서 관계가 좁을 수 있음"],
    color: "bg-slate-700", emoji: "🏰"
  },
  
  // ========== 균형형 ==========
  "balance": {
    id: "balance",
    name: "만능 밸런서",
    declaration: "넌 어디서든 맞춰서 살아남는 사람이야",
    description: "특별히 튀는 것 없이 다 조금씩 있어.\n그래서 어디든 적응해.\n근데 가끔 나도 내가 뭔지 모를 때 있음.",
    empathy: [
      "다 잘하는 것 같은데 진짜 잘하는 게 뭔지 모름",
      "어디 가든 적응은 잘하는데 소속감이 애매함",
      "뭘 해도 무난하게 해서 존재감이 없을 때 있음"
    ],
    strengths: ["적응력 만렙", "어디서든 1인분 함"],
    weaknesses: ["정체성이 불분명할 때 혼란스러움"],
    color: "bg-gradient-to-r from-rose-400 to-blue-400", emoji: "🎭"
  },
  
  // ========== 극단적 집중형 ==========
  "화_극단": {
    id: "fire_extreme",
    name: "폭주 기관차",
    declaration: "넌 달리다가 탈선해도 계속 달리는 사람이야",
    description: "멈추는 법을 몰라.\n아니, 멈추기 싫어.\n태우고 부수고 그래야 성에 차.",
    empathy: [
      "쉬라는 말 들으면 오히려 더 하고 싶어짐",
      "지쳐서 쓰러져도 다음 날 또 달림",
      "열정적이라기보다 그냥 안 하면 답답한 것"
    ],
    strengths: ["한계를 모르는 추진력", "태워버리는 강렬함"],
    weaknesses: ["브레이크가 고장남, 번아웃 위험"],
    color: "bg-red-600", emoji: "🚂"
  },
  "수_극단": {
    id: "water_extreme",
    name: "심해어",
    declaration: "넌 아무도 없는 깊은 곳이 제일 편한 사람이야",
    description: "사람들 사이에 있으면 숨이 막혀.\n혼자 있어야 비로소 생각이 돼.\n그 깊이가 무기야.",
    empathy: [
      "혼자 있는 시간 없으면 미쳐버릴 것 같음",
      "사람 많은 데 있으면 에너지가 빨림",
      "깊게 생각하는 게 습관이라 단순한 게 어려움"
    ],
    strengths: ["누구도 따라올 수 없는 깊이", "혼자서도 해내는 능력"],
    weaknesses: ["너무 깊어서 소통이 어려울 때 있음"],
    color: "bg-blue-900", emoji: "🐙"
  },
  "목_극단": {
    id: "wood_extreme",
    name: "정글의 왕",
    declaration: "넌 뻗어나가다가 숲을 이루는 사람이야",
    description: "성장 욕구가 미쳤어.\n하나로 안 끝나고 계속 확장해.\n멈추면 시들어버릴 것 같은 공포가 있음.",
    empathy: [
      "한 분야로 안 끝나고 계속 새로운 거 함",
      "정체되면 불안해서 뭐라도 해야 함",
      "성장하고 있다는 느낌이 삶의 의미임"
    ],
    strengths: ["무한 확장 능력", "어디서든 뿌리내림"],
    weaknesses: ["너무 많이 벌려서 관리가 안 될 때 있음"],
    color: "bg-green-700", emoji: "🌴"
  },
  "토_극단": {
    id: "earth_extreme",
    name: "움직이지 않는 산",
    declaration: "넌 세상이 뒤집혀도 그 자리인 사람이야",
    description: "변화가 싫어.\n아니, 필요 없어.\n이대로 충분하고 이대로 갈 거야.",
    empathy: [
      "바꾸라는 말 들으면 왜?가 먼저 나옴",
      "익숙한 게 좋고 새로운 건 귀찮음",
      "변하지 않는 게 미덕이라고 생각함"
    ],
    strengths: ["흔들리지 않는 존재감", "끝까지 버티는 지구력"],
    weaknesses: ["변화를 거부해서 고립될 수 있음"],
    color: "bg-stone-700", emoji: "🗻"
  },
  "금_극단": {
    id: "metal_extreme",
    name: "외과의사",
    declaration: "넌 잘라야 할 걸 정확히 아는 사람이야",
    description: "감정? 필요 없어.\n본질만 남기고 다 쳐내.\n그게 효율적이니까.",
    empathy: [
      "쓸데없는 감정 소모 극혐",
      "논리적으로 맞으면 인정, 아니면 끝",
      "차갑다는 말 들어도 상관없음, 사실이니까"
    ],
    strengths: ["극한의 효율성", "흔들림 없는 결단력"],
    weaknesses: ["인간미가 없어 보여서 적을 만들 수 있음"],
    color: "bg-zinc-700", emoji: "🔬"
  }
};

// ========================
// 유틸리티 함수
// ========================

/** 주도+보조 오행 조합 키 생성 */
function getComboKey(primary: Element, secondary: Element | null): string {
  if (!secondary) return primary;
  return `${primary}_${secondary}`;
}

/** 오행 기반 캐릭터 타입 생성 */
export function generateCharacterType(
  elements: { 목: number; 화: number; 토: number; 금: number; 수: number; total: number }
): CharacterType {
  const sorted = (["목", "화", "토", "금", "수"] as Element[])
    .map((el) => ({ element: el, count: elements[el] }))
    .sort((a, b) => b.count - a.count);
  
  const primary = sorted[0];
  const secondary = sorted[1];
  const range = primary.count - sorted[sorted.length - 1].count;
  
  // 1. 균형형 체크 (편차가 1 이하)
  if (range <= 1) {
    return CHARACTER_DB["balance"];
  }
  
  // 2. 극단적 집중형 (주도 오행이 4개 이상)
  if (primary.count >= 4) {
    const extremeKey = `${primary.element}_극단`;
    if (CHARACTER_DB[extremeKey]) {
      return CHARACTER_DB[extremeKey];
    }
  }
  
  // 3. 주도+보조 조합형
  const comboKey = getComboKey(primary.element, secondary.element);
  if (CHARACTER_DB[comboKey]) {
    return CHARACTER_DB[comboKey];
  }
  
  // 4. 기본 주도 오행형 (fallback)
  const fallbackKey = `${primary.element}_${sorted[1].element}`;
  return CHARACTER_DB[fallbackKey] || CHARACTER_DB["balance"];
}
