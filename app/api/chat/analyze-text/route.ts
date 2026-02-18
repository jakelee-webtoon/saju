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
function buildAnalysisPrompt(chatText: string): string {
  // 대화 텍스트가 너무 길면 앞부분만 사용 (비용 절감)
  const maxChatLength = COST_LIMITS.MAX_CHAT_LENGTH;
  const truncatedChat = chatText.length > maxChatLength 
    ? chatText.substring(0, maxChatLength) + "..."
    : chatText;

  return `연애 대화 분석가입니다. 카톡 대화를 분석해주세요.

[대화]
${truncatedChat}

[규칙]
- "가능성 기반" 분석, 단정 금지
- 따뜻하고 솔직한 톤
- 한국어로 응답

[점수 기준]
- 80-100: 강한 호감
- 60-79: 긍정적 관심
- 40-59: 중립
- 20-39: 소극적
- 0-19: 거부/회피

[출력 형식 - JSON만]
{
  "emotionSummary": "한 문장 요약",
  "affectionScore": 75,
  "affectionReasons": ["이유1", "이유2"],
  "emotionFlow": "감정 흐름 설명",
  "riskSignals": ["위험신호1"] 또는 [],
  "recommendedAction": "한 가지 행동 제안"
}

JSON만 응답하세요.`;
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

    const { chatText } = await request.json();

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
          affectionReasons: ["대화 내용이 부족합니다"],
          emotionFlow: "분석 불가",
          riskSignals: [],
          recommendedAction: "더 긴 대화 내용을 입력해주세요",
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
        maxOutputTokens: 600, // 출력 토큰 제한 강화 (800 → 600으로 감소)
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    // 프롬프트 생성 (최적화된 버전)
    const prompt = buildAnalysisPrompt(chatText);

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
      affectionReasons: string[];
      emotionFlow: string;
      riskSignals: string[];
      recommendedAction: string;
    } | null = null;

    try {
      // JSON 블록 추출
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
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
