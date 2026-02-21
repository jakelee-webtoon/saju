import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  getRequestIdentifier,
  withTimeout,
  createErrorResponse,
} from "@/app/lib/security/apiSecurity";
import { getExtractById, Message } from "@/app/lib/cache/extractCache";
import { withRetry } from "@/app/lib/security/retryHandler";
import { trackCost, getOrCreateSessionId } from "@/app/lib/cost/tracking";
import { validateCostLimit } from "@/app/lib/cost/monitoring";

// 동적 라우팅 강제 (에러 페이지 방지)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/chat/analyze
 * Extract ID 기반 대화 분석 (OCR 추출 대화 분석, 고급 기능)
 * 
 * 이 엔드포인트는 /api/chat/extract로 추출한 대화를 분석합니다.
 * - extract_id를 받아서 캐시된 대화 JSON을 분석
 * - tier별 slot_pack 지원 (free, paid1, paid2)
 * - 비용 추적 및 모니터링 포함
 * 
 * @see /api/chat/analyze-text - 텍스트 직접 입력 기반 간단한 분석
 */
export async function POST(request: NextRequest) {
  try {
    const identifier = getRequestIdentifier(request);
    const sessionId = getOrCreateSessionId(request);

    // 비용 한도 체크
    const costLimitCheck = validateCostLimit();
    if (!costLimitCheck.allowed) {
      return NextResponse.json(
        { error: costLimitCheck.error || "일일 비용 한도를 초과했습니다." },
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate Limiting 체크
    const rateLimitCheck = checkRateLimit(identifier, 'chatAnalysis');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.reason || "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
    let body: any;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: "요청 본문을 파싱할 수 없습니다" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const {
      extract_id,
      tier = "free",
      slot_pack = ["topline", "hidden_signal", "danger_line"],
      tone_profile = "no_judgement_no_fortune",
      max_output_tokens = 900,
      partner_mbti, // 상대방 MBTI (선택사항) - 이미 저장된 MBTI 정보
    } = body;

    if (!extract_id) {
      return NextResponse.json(
        { error: "extract_id가 필요합니다" },
        { status: 400 }
      );
    }

    // Extract 결과 조회
    const extract = getExtractById(extract_id);
    if (!extract) {
      return NextResponse.json(
        { error: "해당 대화 추출 결과를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // tier별 slot_pack 제한
    const tierLimits: Record<string, string[]> = {
      free: ["topline", "hidden_signal"],
      paid1: ["topline", "hidden_signal", "danger_line", "tempo_read"],
      paid2: ["topline", "hidden_signal", "danger_line", "tempo_read", "safe_direct"],
    };

    const allowedSlots = tierLimits[tier] || tierLimits.free;
    const filteredSlots = slot_pack.filter((slot: string) => allowedSlots.includes(slot));

    // 대화 텍스트 생성 (me 메시지 제외)
    const otherMessages = extract.messages
      .filter(m => m.speaker === 'other')
      .map(m => m.text)
      .join('\n');

    if (otherMessages.length < 50) {
      return NextResponse.json(
        { error: "분석할 대화 내용이 부족합니다" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    // Gemini 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: Math.min(max_output_tokens, 900), // 최대 900 토큰
        temperature: 0.7,
      },
    });

    // Evidence 계산 (서버 사이드)
    const evidenceMap = calculateEvidence(extract.messages, filteredSlots, partner_mbti);
    
    // 답장 속도 정보 추출
    const tempoMeta = (evidenceMap as any).__tempo_meta;
    const replySpeed = tempoMeta?.speedCategory;
    const averageMinutes = tempoMeta?.averageMinutes;
    
    // 상대방 MBTI 정보 (이미 저장된 MBTI 사용)
    const mbtiPattern = partner_mbti ? getMbtiReplyPattern(partner_mbti) : null;
    
    // MBTI별 답장 패턴 정보 (프롬프트에 포함)
    const mbtiContext = partner_mbti && mbtiPattern 
      ? `\n**상대방 MBTI: ${partner_mbti}**
${mbtiPattern}

답장 속도: ${replySpeed === 'fast' ? '빠른 편' : replySpeed === 'slow' ? '느린 편' : '보통'}${averageMinutes ? ` (평균 ${Math.round(averageMinutes)}분)` : ''}

**중요**: 상대방이 ${partner_mbti} 유형이므로, 위 MBTI 특성을 고려하여 답장 패턴을 해석해주세요.`
      : '';

    // 분석 프롬프트 (문장 생성만, evidence는 서버에서 계산)
    const analyzePrompt = `당신은 연애 대화 분석 전문 카피라이터이자 심리 분석가입니다.
이번 대화를 근거 기반으로 분석하세요.

**핵심 원칙:**
1. 추상적 표현 금지: "~같아요", "~듯해요" 최소화. 대신 "이 대화에서 보인 패턴은 ○○입니다"처럼 명확하게.
2. 반드시 근거 기반: 모든 해석에는 대화 속 행동/패턴을 근거로 포함 (답장 속도, 질문 빈도, 리액션 패턴, 주제 확장 여부 등).
3. 일반론 금지: 누구에게나 적용되는 말 금지. 반드시 "이번 대화 기준"으로 분석.
4. 위험 신호는 감정이 아닌 패턴으로: "관심이 떨어졌어요" ❌ → "질문 빈도 0회, 주제 확장 끊김" ⭕
5. 문장은 짧고 단단하게: 설명은 최대 3줄 이내. 장황한 심리학 설명 금지.
6. 톤: 차분하지만 단정적. 지나치게 감정적이거나 오글거리지 않음. 과장 금지.

**대화 내용:**
${otherMessages}

${partner_mbti ? `**상대방 MBTI: ${partner_mbti} - 확률 보정 요소로만 사용**

**절대 금지:**
- "${partner_mbti}는 원래~", "${partner_mbti}는 보통~" 같은 일반론 설명
- MBTI 교과서식 설명
- 일반 심리학 칼럼 느낌

**올바른 사용법:**
MBTI는 '일반론 설명'이 아니라, 이번 대화에서 관측된 패턴을 해석할 때 "확률을 조정하는 보정 요소"로만 사용하세요.

**해석 구조:**
1. 관측된 패턴 (대화에서 보인 구체적 행동)
2. MBTI 보정 (이 패턴이 ${partner_mbti}일 때 어떤 의미일 확률이 높은지)
3. 최종 해석 (보정된 확률 기반 해석)

**MBTI 언급 규칙:**
- 전체 분석에서 MBTI 언급은 최대 2-3회 이하
- 각 언급은 최대 2-3문장 이내
- 다음 상황에서만 사용:
  * 답장 속도 변화 해석 시
  * 단답형 여부 해석 시
  * 질문 빈도 감소 해석 시
  * 감정 표현 부족 해석 시
  * 이모티콘 사용량 변화 해석 시
  * 주제 확장 여부 해석 시

**${partner_mbti} 유형별 해석 보정 룰:**
${getMbtiInterpretationRule(partner_mbti)}

**예시 (올바른 방식):**
- 위 룰을 참고하여 "관심 저하"로 단정하지 말고, 해당 유형의 대안 가능성을 먼저 고려하세요.
- 예: "답장이 느린 편입니다. ${partner_mbti} 성향을 고려하면, 이는 '관심 저하'보다는 [위 룰의 대안 가능성]일 가능성이 더 높습니다."

**예시 (잘못된 방식 - 절대 사용 금지):**
- "${partner_mbti}는 원래 답장이 빠른 편입니다" ❌
- "J 유형은 보통 계획적이에요" ❌
- "${partner_mbti}의 특성상 공감을 잘 해요" ❌
` : ''}

**요청 슬롯:**
${filteredSlots.join(', ')}

**슬롯별 분석 가이드:**

${filteredSlots.includes('tempo_read') ? `**tempo_read (답장 패턴 리듬 분석):**
- 답장 속도: ${replySpeed === 'fast' ? '빠른 편' : replySpeed === 'slow' ? '느린 편' : '보통'}${averageMinutes ? ` (평균 ${Math.round(averageMinutes)}분)` : ''}
- 관측된 패턴: 답장 간격의 패턴 변화를 구체적으로 설명하세요.
${partner_mbti ? `- MBTI 보정: ${partner_mbti} 성향을 고려하여 해석 강도를 조정하세요.
  * 답장이 느린 경우: ${partner_mbti}라면 "신중하게 표현을 고르는 과정일 가능성" vs "업무/우선순위 밀림 가능성" vs "감정 리듬 영향 가능성" 중 적절한 해석 선택
  * 단답형 많은 경우: ${partner_mbti}라면 "표현 효율성 추구일 가능성" vs "감정 에너지 저하 가능성" 중 적절한 해석 선택
  * 이모티콘 적은 경우: ${partner_mbti}라면 "기본 스타일일 확률" vs "평소 대비 에너지 저하 가능성" 중 적절한 해석 선택
- 최종 해석: "관측된 패턴 → MBTI 보정 → 최종 해석" 구조로 작성하세요.
- 예: "답장 평균 ${Math.round(averageMinutes || 0)}분으로 ${replySpeed === 'slow' ? '느린 편입니다' : '빠른 편입니다'}. ${partner_mbti} 성향을 고려하면, 이는 '관심 저하'보다는 '${replySpeed === 'slow' ? '신중한 표현 과정' : '빠른 반응 리듬'}'일 가능성이 더 높습니다."
` : `- 단순히 "답장이 빠르다/느리다"가 아니라, 그 속도가 어떤 의미인지 구체적으로 해석하세요.
- 예: "답장 평균 ${Math.round(averageMinutes || 0)}분으로 ${replySpeed === 'slow' ? '느린 편이지만' : '빠른 편이고'}, 이는 상대방이 신중하게 고민하는 경향 때문일 수 있습니다."
`}
` : ''}

**출력 형식 (JSON만):**
{
  "topline": "한 줄로 현재 관계 상태 정의 (강력하고 구체적으로)",
  "modules": [
    ${filteredSlots.includes('hidden_signal') ? `{ "slot": "hidden_signal", "text": "이번 대화에서 보인 구체적 행동 패턴 기반 신호${partner_mbti ? ' (MBTI 보정 포함 시: 관측된 패턴 → MBTI 보정 → 최종 해석 구조)' : ''} (최대 3줄)" },` : ''}
    ${filteredSlots.includes('danger_line') ? `{ "slot": "danger_line", "text": "패턴 기반 위험 신호${partner_mbti ? ' (MBTI 보정 포함 시: 이 패턴이 위험 신호일 확률 vs 정상 범위일 확률 비교)' : ''} (없으면 '이번 대화에서는 위험 신호가 보이지 않습니다' - 최대 3줄)" },` : ''}
    ${filteredSlots.includes('tempo_read') ? `{ "slot": "tempo_read", "text": "답장 패턴 리듬 분석${partner_mbti ? ' (관측된 패턴 → MBTI 보정 → 최종 해석 구조 필수)' : ''} (구체적 근거 포함 - 최대 3줄)" }` : ''}
  ],
  "cta": { "text": "실제로 바로 보낼 수 있는 구체적 행동 제안 (1-2문장)", "action": "go_reply" }
}

JSON만 응답하세요. 다른 설명은 필요 없습니다.`;

    // Gemini 호출 (토큰 제한 적용)
    let result: any;
    try {
      result = await withRetry(
        async () => {
          return await withTimeout(
            model.generateContent(analyzePrompt),
            30000
          );
        },
        {
          maxRetries: 1,
          delay: 2000,
        }
      );
    } catch (retryError) {
      console.error("[Analyze] Gemini API call failed:", retryError);
      return NextResponse.json(
        { 
          success: false,
          error: "AI 서비스 호출에 실패했습니다. 잠시 후 다시 시도해주세요." 
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let response: any;
    let text: string;
    try {
      response = result.response;
      text = response.text();
    } catch (responseError) {
      console.error("[Analyze] Failed to get response text:", responseError);
      return NextResponse.json(
        { 
          success: false,
          error: "AI 응답을 처리하는데 실패했습니다. 다시 시도해주세요." 
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 토큰 사용량 추적
    try {
      const usageMetadata = response.usageMetadata;
      if (usageMetadata) {
        trackCost(
          sessionId,
          'chat-analysis',
          usageMetadata.promptTokenCount || 0,
          usageMetadata.candidatesTokenCount || 0,
          '/api/chat/analyze',
          identifier
        );
      }
    } catch (error) {
      console.error("Cost tracking error:", error);
    }

    // JSON 파싱
    let analysisResult: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON을 찾을 수 없습니다");
      }
    } catch (parseError) {
      console.error("Analyze JSON parse error:", parseError);
      return NextResponse.json(
        { error: "분석 결과를 파싱하는데 실패했어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 결과에 evidence 추가 (이미 위에서 계산됨)
    if (analysisResult.modules) {
      analysisResult.modules = analysisResult.modules.map((module: any) => ({
        ...module,
        evidence: evidenceMap[module.slot] || [],
      }));
    }
    
    // 답장 속도 및 MBTI 메타데이터 추가 (tempo_read가 있는 경우)
    if (filteredSlots.includes('tempo_read') && tempoMeta) {
      analysisResult.tempo_meta = {
        averageMinutes: tempoMeta.averageMinutes,
        speedCategory: tempoMeta.speedCategory,
        replyCount: tempoMeta.replyCount,
        mbti: tempoMeta.mbti,
        mbtiPattern: tempoMeta.mbtiPattern,
      };
    }

    // Paywall 힌트 추가
    if (tier === 'free' && filteredSlots.length < tierLimits.paid1.length) {
      analysisResult.paywall_hint = {
        next: "paid1",
        copy: "조금 더 보면 도움이 될 수 있어요",
      };
    } else if (tier === 'paid1' && filteredSlots.length < tierLimits.paid2.length) {
      analysisResult.paywall_hint = {
        next: "paid2",
        copy: "더 깊은 분석을 원하시나요?",
      };
    }

    return NextResponse.json(
      {
        success: true,
        ...analysisResult,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    } catch (error) {
      console.error("[Analyze] Error:", error);
      const errorResponse = createErrorResponse(error, "대화 분석 중 오류가 발생했습니다");
      return NextResponse.json(
        { 
          success: false,
          error: errorResponse.error 
        },
        { 
          status: errorResponse.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error("[Analyze] Top-level error:", error);
    // 모든 에러를 JSON으로 반환 (HTML 에러 페이지 방지)
    try {
      const errorResponse = createErrorResponse(error, "서버 오류가 발생했습니다");
      return NextResponse.json(
        { 
          success: false,
          error: errorResponse.error 
        },
        { 
          status: errorResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    } catch (fallbackError) {
      // 최후의 수단: 항상 JSON 반환
      return new NextResponse(
        JSON.stringify({ success: false, error: "서버 오류가 발생했습니다" }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  }
}

/**
 * 시간 문자열을 분 단위로 변환
 * 지원 형식: "오전 10:30", "오후 2:30", "10:30", "14:30", "PM 2:30" 등
 */
function parseTimeToMinutes(timeStr: string): number | null {
  try {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    // 오전/오후 확인
    const isPM = timeStr.includes('오후') || timeStr.includes('PM') || timeStr.includes('pm');
    const isAM = timeStr.includes('오전') || timeStr.includes('AM') || timeStr.includes('am');
    
    // 시간:분 추출
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    // 24시간 형식인 경우 (14:30 같은 형식)
    if (hours >= 0 && hours <= 23 && !isAM && !isPM) {
      return hours * 60 + minutes;
    }
    
    // 12시간 형식 처리
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    
    // 유효성 검사
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    return hours * 60 + minutes;
  } catch {
    return null;
  }
}

/**
 * 답장 속도 계산 (분 단위)
 * 내 메시지와 상대방 다음 메시지 간 시간 차이
 */
function calculateReplySpeed(messages: Message[]): {
  averageMinutes: number | null;
  speedCategory: 'fast' | 'normal' | 'slow' | 'unknown';
  replyCount: number;
} {
  const myMessages = messages.filter(m => m.speaker === 'me');
  const otherMessages = messages.filter(m => m.speaker === 'other');
  
  if (myMessages.length === 0 || otherMessages.length === 0) {
    return { averageMinutes: null, speedCategory: 'unknown', replyCount: 0 };
  }
  
  const replyTimes: number[] = [];
  
  // 내 메시지 이후 상대방의 첫 답장까지의 시간 계산
  for (let i = 0; i < myMessages.length; i++) {
    const myMsg = myMessages[i];
    if (!myMsg.time) continue;
    
    const myTime = parseTimeToMinutes(myMsg.time);
    if (myTime === null) continue;
    
    // 내 메시지 이후의 상대방 메시지 찾기
    const myMsgIndex = messages.findIndex(m => m.msg_id === myMsg.msg_id);
    const nextOtherMsg = messages.slice(myMsgIndex + 1).find(m => m.speaker === 'other' && m.time);
    
    if (nextOtherMsg && nextOtherMsg.time) {
      const otherTime = parseTimeToMinutes(nextOtherMsg.time);
      if (otherTime !== null) {
        // 다음 날로 넘어간 경우 처리 (1440분 = 24시간)
        let diff = otherTime - myTime;
        if (diff < 0) diff += 1440; // 다음 날
        if (diff > 720) diff = 1440 - diff; // 전날로 가정 (12시간 이상 차이나면)
        
        replyTimes.push(diff);
      }
    }
  }
  
  if (replyTimes.length === 0) {
    return { averageMinutes: null, speedCategory: 'unknown', replyCount: 0 };
  }
  
  const average = replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length;
  
  // 빠른 편: 30분 이하, 느린 편: 2시간 이상
  let speedCategory: 'fast' | 'normal' | 'slow' | 'unknown';
  if (average <= 30) {
    speedCategory = 'fast';
  } else if (average >= 120) {
    speedCategory = 'slow';
  } else {
    speedCategory = 'normal';
  }
  
  return { averageMinutes: average, speedCategory, replyCount: replyTimes.length };
}


/**
 * MBTI별 해석 보정 룰 (확률 조정용)
 */
function getMbtiInterpretationRule(mbti: string): string {
  const rules: Record<string, string> = {
    // 분석형 (NT 계열)
    "INTJ": "답장이 느리거나 단답이어도 '무관심'으로 단정하지 말 것. 효율적 표현 선호 + 감정 최소화 스타일일 가능성을 먼저 고려하라.",
    "INTP": "답장 텀이 들쭉날쭉하거나 뒤늦은 답장이 와도 '거리두기'로 해석하지 말 것. 생각하다 잊거나 타이밍을 놓친 가능성이 높다.",
    "ENTJ": "짧고 결론 중심 답변은 차가움이 아니라 처리 중심 성향일 수 있다. 질문이 적어도 무관심 단정 금지.",
    "ENTP": "대화 리듬이 갑자기 빨라지거나 토론형으로 변해도 감정 과열로 해석하지 말 것. 흥미 기반 몰입 가능성 우선 고려.",
    
    // 이상주의/감정형 (NF 계열)
    "INFJ": "답장이 느려도 무시가 아니다. 깊이 생각해 정리하는 중일 가능성을 우선 고려하라.",
    "INFP": "답장이 느린 것은 관심 부족이 아니라 '어떻게 말할지 고민' 중일 가능성이 높다.",
    "ENFJ": "질문이 줄었을 경우 갈등으로 단정하지 말 것. 정서적 에너지 저하나 배려 모드일 가능성도 고려하라.",
    "ENFP": "답장 속도 변동이 크더라도 감정 기복/몰입도 영향 가능성을 먼저 고려. 리듬 불안정을 곧바로 관심 저하로 해석하지 말 것.",
    
    // 현실/안정형 (SJ 계열)
    "ISTJ": "답장이 느려지면 관심 저하보다 '업무/우선순위 밀림'을 먼저 고려하라.",
    "ISFJ": "질문이 줄어도 애정 감소 단정 금지. 표현은 줄어도 배려는 유지될 수 있다.",
    "ESTJ": "짧고 빠른 답장은 무심함이 아니라 처리 효율 추구일 가능성이 높다.",
    "ESFJ": "이모티콘이 줄어들었을 때는 갈등보다 '피로도' 가능성을 먼저 점검하라.",
    
    // 자유/즉흥형 (SP 계열)
    "ISTP": "단답형 + 질문 없음 = 무관심으로 단정하지 말 것. 감정 표현 자체를 최소화하는 스타일일 수 있다.",
    "ISFP": "답장이 느려도 거리두기보다 '자기 리듬 유지' 가능성을 우선 고려하라.",
    "ESTP": "갑작스러운 무응답은 감정 문제가 아니라 '현실 우선순위 전환'일 수 있다.",
    "ESFP": "이모티콘/반응이 줄어들면 관계 단절로 단정하지 말 것. 단순 피로 가능성 우선 고려.",
  };
  
  return rules[mbti] || "일반적인 해석을 적용하되, '관심 저하'로 단정하기 전에 대안 가능성을 먼저 고려하라.";
}

/**
 * MBTI별 답장 패턴 설명 (레거시 - tempo_read에서 사용)
 */
function getMbtiReplyPattern(mbti: string | null): string | null {
  if (!mbti) return null;
  
  const patterns: Record<string, string> = {
    // J 유형들 (계획적, 책임감)
    "ISTJ": "답장은 제때 하는 게 기본이에요. 아주 빠르진 않지만, 일정한 속도와 톤으로 깔끔하게 답장해요. 읽씹은 거의 없어요.",
    "ESTJ": "바로바로 읽고 즉시 답변해요. 빠르게 처리하고 마무리 짓는 게 기본 태도예요.",
    "ISFJ": "상대를 배려해 웬만하면 답장 느린 사람 되지 않으려 노력해요. 다만 바쁠 땐 읽고 있다가 나중에 답장하는 스타일이에요.",
    "ESFJ": "단체 톡방에서 제일 먼저 답장하는 사람이에요. 이모티콘 활용도 많고, 분위기 유지에 신경 써요.",
    
    // P 유형들 (즉흥적, 자유로움)
    "ENFP": "빠를 때는 진짜 1초 컷, 안 빠를 때는 며칠 잠수예요. 감정 상태에 따라 답장 속도 변화가 심해요.",
    "INFP": "대답을 신중하게 고민해서 답장까지 시간이 필요해요. '어떤 말이 좋을까...' 생각하다가 하루 지나버리기도 해요. 진심이 담긴 답장이지만, 속도는 느릴 수 있어요.",
    "ISFP": "편한 사이일수록 답장 느려요. 너무 격식 차리는 말투를 싫어하고, 자기 타이밍이 중요해요.",
    "ISTP": "필요할 때만 카톡 확인해요. 무뚝뚝한 스타일로, 단답형이 많아요. 톡보다 현실 대면을 선호해요.",
    
    // E 유형들 (사교적, 외향적)
    "ENTP": "빠른 답장에 재치 있는 멘트예요. 카톡으로 토론하거나 아이디어 내는 거 좋아해요.",
    "ESFP": "친구랑 수다 떨 듯 실시간 반응이에요. 카톡에 이모티콘 5개 기본이에요.",
    "ESTP": "현실 우선이에요. 바쁠 땐 아예 무시, 놀 땐 폭풍 답장이에요.",
    
    // I 유형들 (내향적, 사색적)
    "INFJ": "답장은 느릴 수 있으나, 무시는 아니에요. 정성스럽게 쓰려다 시간이 걸려요.",
    "INTJ": "급한 거 아니면 나중에 해도 된다고 생각해요. 실용적 목적 없으면 카톡 알림 무시하기도 해요.",
    "INTP": "읽고, 생각하고, 까먹고... 갑자기 3일 뒤에 '헉 미안!' 답장 가능성이 높아요.",
  };
  
  return patterns[mbti] || null;
}

/**
 * Evidence 계산 (서버 사이드)
 * LLM이 근거를 "발명"하게 두지 말고 서버에서 고르기
 */
function calculateEvidence(messages: Message[], slots: string[], partnerMbti?: string): Record<string, string[]> {
  const evidence: Record<string, string[]> = {};
  const otherMessages = messages.filter(m => m.speaker === 'other');

  // tempo_read: 응답 간격, 짧은 답장, 이모지 빈도, 답장 속도
  if (slots.includes('tempo_read')) {
    const tempoEvidence: string[] = [];
    
    // 답장 속도 계산
    const replySpeed = calculateReplySpeed(messages);
    
    // 짧은 답장 (10자 이하)
    const shortReplies = otherMessages
      .filter(m => m.text.length < 10 && m.text.trim().length > 0)
      .slice(0, 2)
      .map(m => m.msg_id);
    tempoEvidence.push(...shortReplies);
    
    // 이모지 빈도가 높은 메시지
    const emojiMessages = otherMessages
      .filter(m => {
        // 이모지 유니코드 범위: Emoticons, Symbols, Pictographs 등
        const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const emojiCount = (m.text.match(emojiPattern) || []).length;
        return emojiCount >= 2;
      })
      .slice(0, 1)
      .map(m => m.msg_id);
    tempoEvidence.push(...emojiMessages);
    
      evidence.tempo_read = tempoEvidence.slice(0, 3);
      // 답장 속도 정보를 메타데이터로 저장 (evidence와 별도)
      (evidence as any).__tempo_meta = {
        averageMinutes: replySpeed.averageMinutes,
        speedCategory: replySpeed.speedCategory,
        replyCount: replySpeed.replyCount,
      };
  }

  // hidden_signal: 주제 확장, 개인 공유, 질문 증가
  if (slots.includes('hidden_signal')) {
    const signalEvidence: string[] = [];
    
    // 질문이 포함된 메시지
    const questions = otherMessages
      .filter(m => m.text.includes('?') || m.text.includes('물어') || m.text.includes('궁금'))
      .slice(0, 2)
      .map(m => m.msg_id);
    signalEvidence.push(...questions);
    
    // 개인적인 공유 (감정 표현, 일상 공유 등)
    const personalShares = otherMessages
      .filter(m => {
        const text = m.text.toLowerCase();
        return text.includes('느낌') || text.includes('기분') || text.includes('생각') ||
               text.includes('오늘') || text.includes('어제') || text.includes('내일');
      })
      .slice(0, 1)
      .map(m => m.msg_id);
    signalEvidence.push(...personalShares);
    
    evidence.hidden_signal = signalEvidence.slice(0, 3);
  }

  // danger_line: 짧은 답장, 회피 패턴
  if (slots.includes('danger_line')) {
    const dangerEvidence: string[] = [];
    
    // 매우 짧은 답장 (5자 이하)
    const veryShort = otherMessages
      .filter(m => m.text.length < 5 && m.text.trim().length > 0)
      .slice(0, 2)
      .map(m => m.msg_id);
    dangerEvidence.push(...veryShort);
    
    // 회피 패턴 (응, ㅇㅇ, ㅎㅎ, ㅋㅋ만 있는 경우)
    const evasivePatterns = otherMessages
      .filter(m => {
        const text = m.text.trim();
        return /^(응|ㅇㅇ|ㅎㅎ|ㅋㅋ|그래|음|어|아|네)$/i.test(text);
      })
      .slice(0, 1)
      .map(m => m.msg_id);
    dangerEvidence.push(...evasivePatterns);
    
    evidence.danger_line = dangerEvidence.slice(0, 3);
  }

  // safe_direct: 안전하게 직접적으로 표현한 메시지
  if (slots.includes('safe_direct')) {
    const safeDirectEvidence: string[] = [];
    
    // 명확한 의사 표현 (좋아, 싫어, 하고 싶어 등)
    const clearExpressions = otherMessages
      .filter(m => {
        const text = m.text.toLowerCase();
        return text.includes('좋아') || text.includes('싫어') || text.includes('하고 싶') ||
               text.includes('만나') || text.includes('보고 싶') || text.includes('그리워');
      })
      .slice(0, 3)
      .map(m => m.msg_id);
    safeDirectEvidence.push(...clearExpressions);
    
    evidence.safe_direct = safeDirectEvidence.slice(0, 3);
  }

  return evidence;
}
