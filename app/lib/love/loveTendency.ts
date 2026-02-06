/**
 * 사주 기반 연애 성향 모듈
 * 캐릭터 타입을 기반으로 기본 연애 성향 생성
 */

// ========================
// 타입 정의
// ========================

export interface LoveTendency {
  // 한 줄 요약
  summary: string;
  
  // 핵심 키워드 3개
  keywords: {
    speed: string;      // 연애 속도
    expression: string; // 감정 표현 방식
    priority: string;   // 관계에서 가장 중요한 것
  };
  
  // 무료 공개 영역 (2-3줄)
  freeDescription: string;
  
  // 잠금 영역 프리뷰 (열면 볼 수 있는 것)
  lockedPreview: string[];
}

export interface LoveTendencyFull extends LoveTendency {
  // 잠금 해제 시 보이는 상세 내용
  lockedContent: {
    weakMoment: string;      // 연애에서 가장 약해지는 순간
    breakupPattern: string;  // 자주 반복되는 이별 패턴
    idealPartner: string;    // 잘 맞는 상대의 핵심 조건
    phaseChange: string;     // 연애 초반 vs 안정기 변화
  };
}

// ========================
// 연애 성향 데이터베이스
// ========================

const LOVE_TENDENCY_DB: Record<string, LoveTendencyFull> = {
  // ========== 화 주도 ==========
  "fire_wood": {
    summary: "불이 붙으면 빠르지만, 관심이 식으면 더 빠른 타입",
    keywords: {
      speed: "초반에 확 타오르는 스타일",
      expression: "말보다 행동으로 먼저",
      priority: "새로운 설렘과 자극",
    },
    freeDescription: "시작은 누구보다 뜨겁게 하는 편이에요. 마음에 들면 고민 없이 다가가고, 감정을 숨기지 못해요. 다만 익숙해지면 새로운 자극을 찾게 되는 경향이 있어요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 예상 못한 행동을 할 때, 호기심이 다시 타오르면 무장해제돼요",
      breakupPattern: "권태기가 오면 새로운 사람에게 눈이 가거나, 먼저 식어버리는 패턴이 있어요",
      idealPartner: "예측 불가능하고 자기만의 세계가 있는 사람, 지루하지 않게 해주는 상대",
      phaseChange: "초반엔 적극적으로 리드하지만, 안정기엔 오히려 상대가 리드해주길 바라는 경향이 있어요",
    },
  },
  
  "fire_metal": {
    summary: "뜨겁게 사랑하지만 상처받으면 칼같이 끊는 타입",
    keywords: {
      speed: "확신이 서면 빠르게 진행",
      expression: "직설적이고 솔직하게",
      priority: "서로에 대한 존중과 신뢰",
    },
    freeDescription: "사랑할 땐 온 마음을 다하지만, 배신이나 실망에는 냉정해지는 편이에요. 감정과 이성 사이에서 균형을 잡으려 하고, 상대에게도 일정한 기준을 기대해요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 진심으로 자신을 인정해줄 때, 차가운 방어막이 녹아요",
      breakupPattern: "작은 실망이 쌓이다가 어느 순간 '이 사람 아니다' 하고 결심하면 돌아보지 않아요",
      idealPartner: "자기 기준이 확실하고, 약속을 지키는 신뢰할 수 있는 사람",
      phaseChange: "초반엔 테스트하듯 지켜보다가, 안정기엔 의외로 다정하고 헌신적이에요",
    },
  },
  
  "fire_water": {
    summary: "감정의 폭이 커서 깊이 사랑하고 깊이 상처받는 타입",
    keywords: {
      speed: "감정 따라 들쑥날쑥",
      expression: "극과 극을 오가며",
      priority: "깊은 감정적 교감",
    },
    freeDescription: "사랑하면 모든 걸 주고 싶어하고, 상대의 작은 변화에도 민감하게 반응해요. 감정이 풍부해서 연애가 인생에서 큰 비중을 차지하는 경향이 있어요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 복잡한 감정을 있는 그대로 받아줄 때 깊이 빠져요",
      breakupPattern: "감정 소모가 심해서 지치거나, 상대가 감정을 받아주지 못하면 폭발해요",
      idealPartner: "감정적으로 안정적이면서도 깊이 있는 대화가 가능한 사람",
      phaseChange: "초반엔 열정적이다가, 안정기엔 감정 기복이 더 심해질 수 있어요",
    },
  },
  
  "fire_earth": {
    summary: "열정적이지만 현실도 챙기는 로맨틱 현실주의자",
    keywords: {
      speed: "설레면 빠르게, 하지만 계산도 함",
      expression: "말과 행동을 같이",
      priority: "함께하는 안정적인 미래",
    },
    freeDescription: "사랑에 빠지면 적극적이지만, 동시에 '이 사람과 미래가 가능한가'도 생각해요. 감정과 현실 사이에서 균형을 잡으려 하는 편이에요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 든든하게 미래 계획을 이야기할 때 마음이 열려요",
      breakupPattern: "현실적인 조건이 안 맞거나, 상대가 너무 즉흥적이면 불안해서 멀어져요",
      idealPartner: "열정도 있으면서 생활력도 있는, 함께 성장할 수 있는 파트너",
      phaseChange: "초반엔 로맨틱하게 시작하고, 안정기엔 실용적인 동반자 모드가 돼요",
    },
  },

  // ========== 수 주도 ==========
  "water_metal": {
    summary: "겉으론 쿨해 보이지만 속으론 깊이 빠지는 타입",
    keywords: {
      speed: "천천히, 확신이 필요해",
      expression: "조심스럽게, 눈치 보며",
      priority: "상대의 진심 확인",
    },
    freeDescription: "쉽게 마음을 열지 않지만, 한번 열리면 깊이 빠지는 편이에요. 상대의 말과 행동을 분석하며 진심인지 확인하려 하고, 확신이 생겨야 다음 단계로 가요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 일관되게 진심을 보여줄 때, 차가운 벽이 천천히 무너져요",
      breakupPattern: "상대의 진심을 의심하게 되면 스스로 거리를 두고, 결국 멀어져요",
      idealPartner: "말과 행동이 일치하고, 기다려줄 수 있는 인내심 있는 사람",
      phaseChange: "초반엔 거리를 두다가, 안정기엔 의외로 집착에 가까운 애정을 보여요",
    },
  },
  
  "water_wood": {
    summary: "다정하지만 상처받으면 혼자 숨어버리는 타입",
    keywords: {
      speed: "감정 교류가 되면 자연스럽게",
      expression: "섬세하고 배려 깊게",
      priority: "정서적 안정과 이해",
    },
    freeDescription: "상대의 감정을 잘 읽고 맞춰주는 편이에요. 다정하고 배려심이 깊지만, 상처받으면 말 없이 숨어버리는 경향이 있어요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 마음을 먼저 알아채고 다가와줄 때 감동받아요",
      breakupPattern: "서운함을 말하지 못하고 쌓다가, 어느 순간 마음이 닫혀버려요",
      idealPartner: "감정을 먼저 표현해주고, 침묵도 이해해줄 수 있는 사람",
      phaseChange: "초반엔 조심스럽다가, 안정기엔 무한 배려 모드가 되지만 번아웃 주의",
    },
  },
  
  "water_fire": {
    summary: "겉은 차갑고 속은 뜨거운 츤데레 스타일",
    keywords: {
      speed: "겉과 속이 다른 페이스",
      expression: "쉽게 티 안 내지만 속으론 난리",
      priority: "서로의 온도차 이해",
    },
    freeDescription: "밖에서 보면 쿨해 보이는데 속은 누구보다 뜨거운 편이에요. 감정을 숨기려 하지만 결국 티가 나고, 그 갭이 매력이 되기도 해요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 쿨한 척하는 자신의 진짜 마음을 알아볼 때 무너져요",
      breakupPattern: "감정 표현의 온도 차이로 오해가 쌓이다 터지는 패턴",
      idealPartner: "겉모습에 속지 않고 진짜 마음을 읽어줄 수 있는 통찰력 있는 사람",
      phaseChange: "초반엔 밀당하다가, 안정기엔 의외로 표현이 서툰 다정함을 보여요",
    },
  },
  
  "water_earth": {
    summary: "조용히 사랑을 쌓아가는 묵묵한 헌신형",
    keywords: {
      speed: "느리지만 꾸준하게",
      expression: "말보다 행동으로 증명",
      priority: "오래가는 안정적인 관계",
    },
    freeDescription: "화려한 표현은 어색하지만 묵묵히 옆을 지키는 타입이에요. 시간이 지날수록 진가가 드러나는 연애를 하고, 한번 시작하면 쉽게 놓지 않아요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 조용한 헌신을 알아봐줄 때 깊이 감동받아요",
      breakupPattern: "너무 참다가 한계점에서 갑자기 정리하는 패턴이 있어요",
      idealPartner: "화려함보다 진정성을 알아보고, 함께 쌓아갈 수 있는 사람",
      phaseChange: "초반엔 어색하다가, 안정기엔 누구보다 든든한 버팀목이 돼요",
    },
  },

  // ========== 목 주도 ==========
  "wood_fire": {
    summary: "성장하는 관계를 원하는 긍정 에너지 연애형",
    keywords: {
      speed: "가능성이 보이면 적극적으로",
      expression: "밝고 긍정적으로",
      priority: "함께 성장하는 관계",
    },
    freeDescription: "연애도 성장의 기회로 보는 편이에요. 상대와 함께 더 나은 사람이 되고 싶어하고, 관계에서도 발전을 추구해요. 긍정적인 에너지로 상대를 이끌어요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 꿈을 응원하고 함께 성장하자고 할 때 빠져요",
      breakupPattern: "상대가 정체되거나 발전 의지가 없어 보이면 답답해서 멀어져요",
      idealPartner: "자기 발전에 관심 있고, 서로 자극이 되는 파트너",
      phaseChange: "초반엔 함께할 비전을 그리고, 안정기엔 서로의 코치가 돼요",
    },
  },
  
  "wood_water": {
    summary: "감성적이면서도 성장 지향적인 로맨티스트",
    keywords: {
      speed: "감정적 교감이 먼저",
      expression: "따뜻하고 감성적으로",
      priority: "정서적 연결과 성장",
    },
    freeDescription: "감정적인 교류를 중요하게 생각하면서도, 관계가 제자리에 있는 건 싫어해요. 따뜻한 감성으로 상대를 대하지만, 내면에선 더 나은 관계를 꿈꿔요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 깊은 대화로 마음을 나누면서 미래를 이야기할 때",
      breakupPattern: "감정적 교류가 부족하거나, 관계가 정체되면 의미를 잃어요",
      idealPartner: "감성이 풍부하면서도 발전 지향적인 사람",
      phaseChange: "초반엔 로맨틱하게, 안정기엔 서로의 성장 파트너가 돼요",
    },
  },
  
  "wood_metal": {
    summary: "원칙은 있지만 성장을 위해 유연해질 수 있는 타입",
    keywords: {
      speed: "계획적으로, 단계별로",
      expression: "논리적이지만 따뜻하게",
      priority: "건강하고 발전적인 관계",
    },
    freeDescription: "연애에서도 나름의 원칙이 있지만, 관계의 성장을 위해선 유연하게 변할 수 있어요. 머리와 가슴 사이에서 균형을 찾으려 해요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 원칙을 존중하면서도 새로운 시각을 줄 때",
      breakupPattern: "가치관 충돌이 반복되거나, 성장이 멈추면 관계를 재고해요",
      idealPartner: "자기 기준이 있으면서도 유연하게 소통할 수 있는 사람",
      phaseChange: "초반엔 서로 맞춰가며, 안정기엔 함께 규칙을 만들어가요",
    },
  },
  
  "wood_earth": {
    summary: "현실적인 성장을 추구하는 안정 지향 연애형",
    keywords: {
      speed: "착실하게 한 단계씩",
      expression: "실용적인 사랑 표현",
      priority: "현실적이고 지속 가능한 관계",
    },
    freeDescription: "꿈만 꾸는 게 아니라 현실에서 함께 성장하길 원해요. 연애도 삶의 일부로 여기고, 함께 안정적인 미래를 만들어가는 걸 중요하게 생각해요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 구체적인 미래 계획을 함께 세우자고 할 때",
      breakupPattern: "상대가 너무 비현실적이거나 불안정하면 지쳐서 떠나요",
      idealPartner: "꿈도 있지만 현실 감각도 있는, 함께 집을 지을 수 있는 사람",
      phaseChange: "초반엔 미래를 확인하고, 안정기엔 실제로 함께 만들어가요",
    },
  },

  // ========== 금 주도 ==========
  "metal_water": {
    summary: "냉정해 보이지만 속은 깊은 완벽주의 연애형",
    keywords: {
      speed: "신중하게, 확실할 때만",
      expression: "절제된 표현, 깊은 진심",
      priority: "신뢰와 품격 있는 관계",
    },
    freeDescription: "겉으로는 냉정해 보이지만 마음을 준 사람에게는 깊은 편이에요. 연애에서도 높은 기준이 있고, 그 기준에 맞는 사람을 찾아요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 높은 기준을 이해하고 맞춰줄 때 마음이 열려요",
      breakupPattern: "상대가 기준에 미달하거나 실망시키면 급속히 마음이 식어요",
      idealPartner: "품위 있고 자기 관리가 되는, 존경할 수 있는 사람",
      phaseChange: "초반엔 평가하듯 지켜보다가, 안정기엔 깊은 신뢰를 주고받아요",
    },
  },
  
  "metal_fire": {
    summary: "차가운 듯 뜨거운, 반전 매력의 연애 스타일",
    keywords: {
      speed: "겉은 천천히, 속은 빠르게",
      expression: "절제와 폭발 사이",
      priority: "서로의 열정과 원칙의 균형",
    },
    freeDescription: "평소엔 차분하고 절제된 모습이지만, 마음을 연 상대에겐 의외로 열정적이에요. 이 갭 때문에 상대가 더 빠지게 되는 타입이에요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 차가운 껍질 안에 숨은 열정을 알아볼 때",
      breakupPattern: "서로의 온도 차이를 못 맞추면 소통 문제로 끝나기 쉬워요",
      idealPartner: "열정적이면서도 자신의 절제된 면을 존중해줄 수 있는 사람",
      phaseChange: "초반엔 쿨하다가, 안정기엔 예상 못한 다정함을 보여요",
    },
  },
  
  "metal_wood": {
    summary: "원칙적이지만 성장은 응원하는 든든한 연애형",
    keywords: {
      speed: "기준에 맞으면 진행",
      expression: "조언과 응원으로",
      priority: "서로 발전시키는 관계",
    },
    freeDescription: "연애에서도 원칙이 있지만, 상대의 성장은 진심으로 응원해요. 잔소리처럼 들릴 수 있지만 다 상대를 위한 마음이에요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 조언을 진지하게 받아들이고 성장할 때 감동해요",
      breakupPattern: "상대가 발전 의지 없이 제자리거나, 조언을 무시하면 지쳐요",
      idealPartner: "성장 의지가 있고, 건설적인 피드백을 주고받을 수 있는 사람",
      phaseChange: "초반엔 가르치려 하다가, 안정기엔 서로의 멘토가 돼요",
    },
  },
  
  "metal_earth": {
    summary: "신뢰를 바탕으로 오래가는 관계를 원하는 타입",
    keywords: {
      speed: "천천히, 확실하게",
      expression: "말보다 행동으로",
      priority: "흔들리지 않는 신뢰",
    },
    freeDescription: "한번 시작하면 오래가는 연애를 해요. 화려한 감정보다 꾸준한 신뢰를 쌓아가는 걸 중요하게 여기고, 흔들림 없는 관계를 원해요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 변치 않는 모습으로 꾸준히 옆에 있을 때",
      breakupPattern: "신뢰가 깨지면 회복이 어렵고, 한번 마음 닫으면 끝이에요",
      idealPartner: "안정적이고 일관된, 약속을 지키는 신뢰할 수 있는 사람",
      phaseChange: "초반엔 테스트 기간이 길고, 안정기엔 흔들림 없는 파트너가 돼요",
    },
  },

  // ========== 토 주도 ==========
  "earth_fire": {
    summary: "따뜻하고 든든한 안정형 연애 스타일",
    keywords: {
      speed: "편안해지면 자연스럽게",
      expression: "따뜻하고 포용적으로",
      priority: "정서적 안정과 신뢰",
    },
    freeDescription: "상대를 편안하게 해주는 따뜻한 에너지가 있어요. 급하게 밀어붙이지 않고 자연스럽게 관계를 쌓아가며, 한번 연인이 되면 든든한 버팀목이 돼요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신에게 의지하고 믿어줄 때 더 잘해주고 싶어져요",
      breakupPattern: "너무 많이 받아주다 지치거나, 상대가 당연시하면 멀어져요",
      idealPartner: "자신을 인정해주고 감사할 줄 아는, 정서적으로 안정된 사람",
      phaseChange: "초반엔 천천히 다가가고, 안정기엔 완전한 안식처가 돼요",
    },
  },
  
  "earth_water": {
    summary: "조용히 깊어지는 묵직한 사랑을 하는 타입",
    keywords: {
      speed: "서두르지 않아, 천천히",
      expression: "잔잔하지만 깊게",
      priority: "깊이 있는 정서적 유대",
    },
    freeDescription: "겉으로 드러나는 화려한 사랑보다 조용히 깊어지는 관계를 해요. 시간이 갈수록 진가가 드러나고, 오래 알수록 더 좋은 사람이에요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 시간을 들여 자신을 이해하려 할 때 깊이 감동받아요",
      breakupPattern: "상대가 너무 급하거나 가벼우면 맞지 않다고 느껴요",
      idealPartner: "조급하지 않고 깊이 있는 관계를 원하는, 성숙한 사람",
      phaseChange: "초반엔 느려서 답답할 수 있지만, 안정기엔 깊은 동반자가 돼요",
    },
  },
  
  "earth_metal": {
    summary: "책임감 강하고 현실적인 안정 추구형",
    keywords: {
      speed: "신중하게, 확실할 때",
      expression: "실용적인 사랑 표현",
      priority: "현실적이고 책임 있는 관계",
    },
    freeDescription: "연애도 인생의 중요한 결정으로 보고 신중하게 접근해요. 한번 시작하면 책임감을 갖고 끝까지 가려 하고, 현실적인 미래를 함께 그려요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대도 자신만큼 진지하고 책임감 있게 관계에 임할 때",
      breakupPattern: "상대가 가볍게 여기거나 책임을 회피하면 실망해서 떠나요",
      idealPartner: "성숙하고 책임감 있는, 함께 미래를 설계할 수 있는 사람",
      phaseChange: "초반엔 진지하게 확인하고, 안정기엔 인생 파트너가 돼요",
    },
  },
  
  "earth_wood": {
    summary: "포용력 있게 성장을 함께하는 동반자형",
    keywords: {
      speed: "자연스러운 흐름대로",
      expression: "받아주면서 이끌어주며",
      priority: "함께 성장하는 안정적 관계",
    },
    freeDescription: "상대를 있는 그대로 받아주면서도 함께 성장하길 원해요. 넓은 품으로 포용하면서 좋은 방향으로 이끌어주는 든든한 파트너가 돼요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 포용을 인정하고 함께 성장하려 할 때",
      breakupPattern: "일방적으로 주기만 하다 지치거나, 상대가 성장 의지가 없으면 멀어져요",
      idealPartner: "발전 의지가 있고, 받은 만큼 돌려줄 줄 아는 균형 잡힌 사람",
      phaseChange: "초반엔 받아주는 모드, 안정기엔 함께 성장하는 동반자가 돼요",
    },
  },

  // ========== 균형형 ==========
  "balance": {
    summary: "상황에 따라 유연하게 변하는 균형 잡힌 연애형",
    keywords: {
      speed: "상대와 상황에 맞춰",
      expression: "적절하게 조율하며",
      priority: "서로의 균형과 조화",
    },
    freeDescription: "한쪽으로 치우치지 않는 균형 잡힌 연애를 해요. 상대에 따라 맞춰줄 수도, 이끌 수도 있고, 상황에 유연하게 대처하는 편이에요.",
    lockedPreview: [
      "당신이 연애에서 가장 약해지는 순간",
      "자주 반복되는 이별 패턴",
      "잘 맞는 상대의 핵심 조건",
      "연애 초반 vs 안정기에서 달라지는 모습",
    ],
    lockedContent: {
      weakMoment: "상대가 자신의 균형 잡힌 면을 인정하고 편하게 대해줄 때",
      breakupPattern: "상대가 너무 한쪽으로 치우쳐서 균형이 깨지면 지쳐요",
      idealPartner: "극단적이지 않고, 함께 균형을 맞춰갈 수 있는 사람",
      phaseChange: "초반이든 안정기든 큰 변화 없이 안정적인 모습을 유지해요",
    },
  },
};

// ========================
// 메인 함수
// ========================

/**
 * 캐릭터 ID로 연애 성향 조회
 */
export function getLoveTendency(characterId: string): LoveTendency {
  const full = LOVE_TENDENCY_DB[characterId];
  
  if (full) {
    return {
      summary: full.summary,
      keywords: full.keywords,
      freeDescription: full.freeDescription,
      lockedPreview: full.lockedPreview,
    };
  }
  
  // fallback
  return LOVE_TENDENCY_DB["balance"];
}

/**
 * 캐릭터 ID로 전체 연애 성향 조회 (잠금 해제 콘텐츠 포함)
 */
export function getLoveTendencyFull(characterId: string): LoveTendencyFull {
  return LOVE_TENDENCY_DB[characterId] || LOVE_TENDENCY_DB["balance"];
}

// ========================
// localStorage 잠금 해제 관리
// ========================

const TENDENCY_UNLOCK_KEY = "loveTendencyUnlock";

/**
 * 연애 성향 잠금 해제 여부 확인
 */
export function isTendencyUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TENDENCY_UNLOCK_KEY) === "true";
}

/**
 * 연애 성향 잠금 해제 기록
 */
export function markTendencyUnlocked(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TENDENCY_UNLOCK_KEY, "true");
}
