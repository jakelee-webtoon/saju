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

    // 분석 프롬프트 (문장 생성만, evidence는 서버에서 계산)
    const analyzePrompt = `당신은 연애 상황 분석가입니다. 대화를 분석하여 각 슬롯별로 **문장만** 생성해주세요.

**중요 규칙:**
- 근거(evidence)는 생성하지 마세요 (서버에서 계산합니다)
- 각 슬롯별로 1-2문장만 생성하세요
- 단정하지 말고 "~로 보여요", "~일 가능성이 있어요" 표현 사용
- 운세나 과장 표현 금지

**대화 내용:**
${otherMessages}

**요청 슬롯:**
${filteredSlots.join(', ')}

**출력 형식 (JSON만):**
{
  "topline": "한 문장 요약",
  "modules": [
    { "slot": "hidden_signal", "text": "1-2문장 분석" },
    { "slot": "danger_line", "text": "1-2문장 분석" }
  ],
  "cta": { "text": "짧은 CTA 문구", "action": "go_reply" }
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
          baseDelayMs: 2000,
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

    // Evidence 계산 (서버 사이드)
    const evidenceMap = calculateEvidence(extract.messages, filteredSlots);

    // 결과에 evidence 추가
    if (analysisResult.modules) {
      analysisResult.modules = analysisResult.modules.map((module: any) => ({
        ...module,
        evidence: evidenceMap[module.slot] || [],
      }));
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
 * Evidence 계산 (서버 사이드)
 * LLM이 근거를 "발명"하게 두지 말고 서버에서 고르기
 */
function calculateEvidence(messages: Message[], slots: string[]): Record<string, string[]> {
  const evidence: Record<string, string[]> = {};
  const otherMessages = messages.filter(m => m.speaker === 'other');

  // tempo_read: 응답 간격, 짧은 답장, 이모지 빈도
  if (slots.includes('tempo_read')) {
    const tempoEvidence: string[] = [];
    
    // 짧은 답장 (10자 이하)
    const shortReplies = otherMessages
      .filter(m => m.text.length < 10 && m.text.trim().length > 0)
      .slice(0, 2)
      .map(m => m.msg_id);
    tempoEvidence.push(...shortReplies);
    
    // 이모지 빈도가 높은 메시지
    const emojiMessages = otherMessages
      .filter(m => {
        const emojiCount = (m.text.match(/[😀-🙏🌀-🗿]/g) || []).length;
        return emojiCount >= 2;
      })
      .slice(0, 1)
      .map(m => m.msg_id);
    tempoEvidence.push(...emojiMessages);
    
    evidence.tempo_read = tempoEvidence.slice(0, 3);
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
