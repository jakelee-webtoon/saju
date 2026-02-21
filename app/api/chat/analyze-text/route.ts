import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  validateChatInput,
  checkInappropriateContent,
  checkDuplicateRequest,
  getRequestIdentifier,
  withTimeout,
  createErrorResponse,
} from "@/app/lib/security/apiSecurity";
import { getCachedAnalysis, setCachedAnalysis } from "@/app/lib/cache/analysisCache";

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

// ========================
// 일일 토큰 사용량 추적 (비용 방어)
// ========================
interface DailyTokenUsage {
  tokens: number;
  resetAt: number;
}

const dailyTokenUsage = new Map<string, DailyTokenUsage>();

function getDailyTokenUsage(identifier: string): number {
  const now = Date.now();
  const usage = dailyTokenUsage.get(identifier);
  
  if (!usage || now > usage.resetAt) {
    // 자정에 리셋
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    dailyTokenUsage.set(identifier, {
      tokens: 0,
      resetAt: tomorrow.getTime(),
    });
    return 0;
  }
  
  return usage.tokens;
}

function addDailyTokenUsage(identifier: string, tokens: number): number {
  const now = Date.now();
  const usage = dailyTokenUsage.get(identifier);
  
  if (!usage || now > usage.resetAt) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    dailyTokenUsage.set(identifier, {
      tokens,
      resetAt: tomorrow.getTime(),
    });
    return tokens;
  }
  
  usage.tokens += tokens;
  return usage.tokens;
}

// ========================
// 비용 절감 설정
// ========================
const COST_LIMITS = {
  MAX_CHAT_LENGTH: 1500, // 최대 1500자만 사용 (2000 → 1500으로 감소)
  MIN_CHAT_LENGTH: 50,   // 50자 미만은 API 호출하지 않음
  MAX_DAILY_TOKENS: 100000, // 일일 최대 토큰 사용량 (약 $0.10 기준)
  MAX_REQUEST_SIZE: 10000,  // 최대 요청 본문 크기 (10KB)
};

// ========================
// 프롬프트 생성 (최적화된 버전 - 토큰 수 절감)
// ========================
function buildAnalysisPrompt(chatText: string, partnerMbti?: string): string {
  // 대화 텍스트가 너무 길면 앞부분만 사용 (비용 절감)
  const maxChatLength = COST_LIMITS.MAX_CHAT_LENGTH;
  const truncatedChat = chatText.length > maxChatLength 
    ? chatText.substring(0, maxChatLength) + "..."
    : chatText;

  // 상대방 MBTI 정보 (확률 보정 요소로만 사용)
  const mbtiSection = partnerMbti 
    ? `\n[상대방 MBTI: ${partnerMbti} - 확률 보정 요소]

**${partnerMbti} 해석 룰:**
${getMbtiInterpretationRule(partnerMbti)}

**사용 규칙:**
- 일반론 금지 ("${partnerMbti}는 원래~" ❌)
- 이번 대화에서 실제로 보인 패턴만 해석
- MBTI 언급은 최대 2-3회, 각 2-3문장 이내
- "관측 패턴 → MBTI 보정 → 최종 해석" 구조`
    : '';

  return `당신은 연애 대화 분석 전문 카피라이터이자 심리 분석가입니다.
이번 대화를 근거 기반으로 분석하세요.

[대화 내용]
${truncatedChat}

[핵심 원칙]
1. 추상적 표현 금지: "~같아요", "~듯해요" 최소화. 대신 "이 대화에서 보인 패턴은 ○○입니다"처럼 명확하게.
2. 반드시 근거 기반: 모든 해석에는 대화 속 행동/패턴을 근거로 포함 (답장 속도, 질문 빈도, 리액션 패턴, 주제 확장 여부 등).
3. 일반론 금지: 누구에게나 적용되는 말 금지. 반드시 "이번 대화 기준"으로 분석.
4. 위험 신호는 감정이 아닌 패턴으로: "관심이 떨어졌어요" ❌ → "질문 빈도 0회, 주제 확장 끊김" ⭕
5. 문장은 짧고 단단하게: 설명은 최대 3줄 이내. 장황한 심리학 설명 금지.
6. 톤: 차분하지만 단정적. 지나치게 감정적이거나 오글거리지 않음. 과장 금지.${mbtiSection}

[분석 항목]

1. emotionSummary (상단 핵심 요약 - 한 줄로 현재 관계 상태 정의)
   - 예: "편안함은 확실하지만, 관계를 밀어붙일 타이밍은 아직 아닙니다"
   - 예: "호감은 분명하지만, 리듬이 약간 느슨해지고 있습니다"
   - 반드시 강력하고 구체적으로.

2. affectionScore (호감도 점수 0-100)
   - 숫자만 주지 말고, 한 줄 근거를 반드시 붙일 것
   - 예: 78점 (질문 4회, 긍정 리액션 6회, 답장 평균 12분)
   - 점수 기준:
     * 80-100: 강한 호감 (구체적 근거 필수)
     * 60-79: 긍정적 관심 (구체적 근거 필수)
     * 40-59: 중립 (구체적 근거 필수)
     * 20-39: 소극적 (구체적 근거 필수)
     * 0-19: 거부/회피 (구체적 근거 필수)

3. affectionReasons (호감도 근거 - 최대 3개)
   - 이번 대화의 구체적 행동 패턴만
   ${partnerMbti ? `- ${partnerMbti} 유형: 최소 1개 근거에 MBTI 보정 포함
   - 예: "답장 느림 → ${partnerMbti}는 신중 표현 과정일 확률 높음"
   ` : `- 예: "질문 4회로 주도권 보임"
   `}

4. emotionFlow (감정 흐름 - 최대 3줄)
   - 대화 진행 순서와 패턴 변화 구체적으로
   ${partnerMbti ? `- ${partnerMbti} 해석 시 MBTI 보정 포함 가능 (최대 1회)` : ''}

5. riskSignals (위험 신호 - 패턴으로, 없으면 [])
   ${partnerMbti ? `- ${partnerMbti} 유형: "위험 신호 확률 vs 정상 범위 확률" 비교
   - 예: "단답형 많음 → ${partnerMbti}는 효율 표현일 확률"
   ` : `- 예: "질문 빈도 0회", "주제 확장 끊김"
   `}

6. recommendedAction (오늘의 행동 제안 - 전략적이고 구체적으로)
   - **중요**: 예시 문장이 아니라 행동 지침을 제공하세요
   - 실제로 보낼 구체적 문장은 제공하지 말 것
   - 대신 "어떤 행동을 하면 좋을지" 방향성을 제시
   - 2-3문장 이내, 친근한 톤

7. actionGuidelines (행동 지침 2개) - **선택사항**
   - ["지침1", "지침2"] 형태
   - 예시 문장 없이 행동 방향만

8. replyPatternDetails (답장 패턴 상세) - **선택사항**
   a) averageReplySpeed: { value: "빠른 편" 등, description: "2-3문장" }
   b) questionLead: { value: "내가 리드" 등, description: "2-3문장" }
   c) emotionalDensity: { value: "활발" 등, description: "2-3문장" }
   d) mbtiInterpretation: ${partnerMbti ? `{ value: "${partnerMbti}", description: "2-3문장" }` : `null`}

[출력 형식 - JSON만]
{
  "emotionSummary": "한 줄로 현재 관계 상태 정의 (강력하고 구체적으로)",
  "affectionScore": 75,
  "affectionScoreReason": "점수 근거 한 줄 (예: 질문 4회, 긍정 리액션 6회, 답장 평균 12분)",
  "affectionReasons": ["이번 대화에서 보인 구체적 행동 패턴 1", "구체적 행동 패턴 2", "구체적 행동 패턴 3"],
  "emotionFlow": "이번 대화의 구체적 흐름 (최대 3줄)",
  "riskSignals": ["패턴 기반 위험 신호 1"] 또는 [],
  "recommendedAction": "행동 지침 (예시 문장 없이, 2-3문장)",
  "actionGuidelines": ["지침1", "지침2"],
  "replyPatternDetails": {
    "averageReplySpeed": { "value": "빠른 편", "description": "..." },
    "questionLead": { "value": "내가 리드", "description": "..." },
    "emotionalDensity": { "value": "활발", "description": "..." },
    "mbtiInterpretation": { "value": "${partnerMbti || 'null'}", "description": "..." } 또는 null
  }
}

JSON만 응답하세요. 다른 설명은 필요 없습니다.`;
}

/**
 * POST /api/chat/analyze-text
 * 텍스트 직접 입력 기반 대화 분석 (간단한 호감도 분석)
 * 
 * 이 엔드포인트는 사용자가 직접 입력한 텍스트를 분석합니다.
 * - 간단한 호감도 점수 및 감정 분석
 * - 캐시 기능으로 비용 절감
 * 
 * @see /api/chat/analyze - Extract ID 기반 고급 분석 (OCR 추출 대화)
 */
export async function POST(request: NextRequest) {
  const identifier = getRequestIdentifier(request);

  // Rate Limiting 체크
  const rateLimitCheck = checkRateLimit(identifier, 'chatAnalysis');
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: rateLimitCheck.reason || "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 일일 토큰 사용량 사전 체크 (비용 방어)
  const currentDailyTokens = getDailyTokenUsage(identifier);
  if (currentDailyTokens >= COST_LIMITS.MAX_DAILY_TOKENS) {
    return NextResponse.json(
      { error: "일일 사용 한도를 초과했습니다. 내일 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    // 요청 본문 크기 체크 (비용 방어)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > COST_LIMITS.MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: "요청 크기가 너무 큽니다. 대화 내용을 줄여주세요." },
        { status: 400 }
      );
    }

    const { chatText, partner_mbti } = await request.json();

    // 입력 검증
    const validation = validateChatInput(chatText);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 텍스트 길이 체크 (비용 방어)
    if (chatText.length < COST_LIMITS.MIN_CHAT_LENGTH) {
      // 너무 짧은 텍스트는 API 호출하지 않고 기본 응답 반환
      return NextResponse.json({
        success: true,
        analysis: {
          emotionSummary: "대화 내용이 너무 짧아 정확한 분석이 어려워요. 더 긴 대화를 입력해주세요.",
          affectionScore: 50,
          affectionScoreReason: "대화 내용 부족으로 분석 불가",
          affectionReasons: ["대화 내용이 부족합니다"],
          emotionFlow: "분석 불가",
          riskSignals: [],
          recommendedAction: "더 긴 대화 내용을 입력해주세요",
          actionGuidelines: ["더 긴 대화 내용을 입력해주세요"],
          replyPatternDetails: null,
        },
        cached: false,
        skipped: true, // API 호출 생략
      });
    }

    // 텍스트 길이 제한 (비용 방어)
    if (chatText.length > COST_LIMITS.MAX_CHAT_LENGTH) {
      console.log(`[Chat Analysis] ⚠️ 텍스트 길이 제한: ${chatText.length}자 → ${COST_LIMITS.MAX_CHAT_LENGTH}자로 자동 잘림`);
    }

    // 부적절한 내용 체크
    const contentCheck = checkInappropriateContent(chatText);
    if (!contentCheck.safe) {
      return NextResponse.json(
        { error: contentCheck.reason || "부적절한 내용이 포함되어 있습니다" },
        { status: 400 }
      );
    }

    // 캐시 확인 (비용 절감)
    const cachedResult = getCachedAnalysis(chatText);
    if (cachedResult) {
      console.log("[Chat Analysis] ✅ Cache hit - API 호출 생략 (비용 절감)");
      return NextResponse.json({
        success: true,
        analysis: cachedResult,
        cached: true,
      });
    }

    // API 호출 시작 로깅
    console.log("[Chat Analysis] 🔄 API 호출 시작 - Gemini API 호출");

    // 중복 요청 체크
    const duplicateCheck = checkDuplicateRequest(identifier, chatText);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        { error: "같은 내용의 요청이 너무 빠르게 반복되었습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    // Gemini 초기화 (토큰 제한 강화로 비용 절감)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 900, // 출력 토큰 제한 (replyPatternDetails + actionGuidelines 포함 위해 900으로 증가)
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    // 프롬프트 생성 (최적화된 버전) - 상대방 MBTI 정보 포함
    const prompt = buildAnalysisPrompt(chatText, partner_mbti);

    // Gemini 호출 (타임아웃 적용)
    const apiCallStartTime = Date.now();
    const result = await withTimeout(
      model.generateContent(prompt),
      30000 // 30초 타임아웃
    );
    const response = result.response;
    const text = response.text();
    const apiCallDuration = Date.now() - apiCallStartTime;

    // 토큰 사용량 로깅 및 비용 추적 (비용 방어)
    try {
      const usageMetadata = response.usageMetadata;
      if (usageMetadata) {
        const promptTokens = usageMetadata.promptTokenCount || 0;
        const candidatesTokens = usageMetadata.candidatesTokenCount || 0;
        const totalTokens = promptTokens + candidatesTokens;
        
        // 일일 토큰 사용량 업데이트
        const newDailyTokens = addDailyTokenUsage(identifier, totalTokens);
        
        console.log(`[Chat Analysis] 💰 API 호출 완료 - 토큰 사용량:`);
        console.log(`  - 입력 토큰: ${promptTokens}`);
        console.log(`  - 출력 토큰: ${candidatesTokens}`);
        console.log(`  - 총 토큰: ${totalTokens} (일일 누적: ${newDailyTokens}/${COST_LIMITS.MAX_DAILY_TOKENS})`);
        console.log(`  - 응답 시간: ${apiCallDuration}ms`);
        console.log(`  - 텍스트 길이: ${chatText.length}자`);
        
        // 일일 토큰 한도 초과 경고 (이미 API 호출 완료되었으므로 다음 요청부터 차단)
        if (newDailyTokens > COST_LIMITS.MAX_DAILY_TOKENS) {
          console.warn(`[Chat Analysis] ⚠️ 일일 토큰 한도 초과: ${newDailyTokens}/${COST_LIMITS.MAX_DAILY_TOKENS}`);
        }
      }
    } catch (error) {
      console.error("[Chat Analysis] 토큰 사용량 로깅 실패:", error);
    }

    // JSON 파싱
    let analysisResult: {
      emotionSummary: string;
      affectionScore: number;
      affectionScoreReason?: string;
      affectionReasons: string[];
      emotionFlow: string;
      riskSignals: string[];
      recommendedAction: string;
      actionGuidelines?: string[];
      replyPatternDetails?: {
        averageReplySpeed: { value: string; description: string };
        questionLead: { value: string; description: string };
        emotionalDensity: { value: string; description: string };
        mbtiInterpretation: { value: string; description: string } | null;
      };
    } | null = null;

    try {
      // JSON 블록 추출
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response text:", text);
      return NextResponse.json(
        { error: "분석 결과를 파싱하는데 실패했어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    if (!analysisResult) {
      return NextResponse.json(
        { error: "분석 결과를 받지 못했어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 결과 검증
    if (
      typeof analysisResult.affectionScore !== "number" ||
      analysisResult.affectionScore < 0 ||
      analysisResult.affectionScore > 100
    ) {
      analysisResult.affectionScore = Math.max(0, Math.min(100, analysisResult.affectionScore || 50));
    }

    if (!Array.isArray(analysisResult.affectionReasons)) {
      analysisResult.affectionReasons = [];
    }

    if (!Array.isArray(analysisResult.riskSignals)) {
      analysisResult.riskSignals = [];
    }

    // 캐시에 저장 (다음 요청 시 API 호출 생략)
    setCachedAnalysis(chatText, analysisResult);

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      cached: false,
    });

  } catch (error) {
    const errorResponse = createErrorResponse(error, "대화 분석 중 오류가 발생했습니다");
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status }
    );
  }
}
