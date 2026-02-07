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

// ========================
// 프롬프트 생성
// ========================
function buildAnalysisPrompt(chatText: string): string {
  return `당신은 연애 상황에 특화된 AI 대화 분석가입니다.
사용자가 입력한 카카오톡 대화 텍스트를 바탕으로 상대방의 감정, 호감도, 위험 신호, 다음 행동 가이드를 분석합니다.

**중요: 대화 구분 규칙**
- "나:"로 시작하는 메시지 = 사용자(나)가 보낸 메시지
- "나:"가 아닌 다른 이름으로 시작하는 메시지 (예: "민지:", "지훈:", "상대:" 등) = 상대방이 보낸 메시지
- 반드시 "나:"가 아닌 메시지만 분석 대상입니다 (상대방의 반응만 분석)
- "나:"로 시작하는 메시지는 분석하지 마세요

[전제 조건]
- 입력은 카카오톡 대화 일부이며, 완벽한 맥락이 아닐 수 있다
- "나:"가 아닌 메시지만 분석 대상이다
- 과장·단정·운세처럼 말하지 말고 "가능성 기반"으로 분석한다
- 상대를 조종하거나 조작하는 표현은 절대 쓰지 않는다
- 판단 톤은 따뜻하지만 솔직하게, 친구처럼 말한다
- 한국어로 답변한다

[대화 내용]
${chatText}

[분석 기준]

1. 답장 속도 분석:
   - 5분 이내: 매우 긍정적 (관심 높음)
   - 30분 이내: 긍정적 (관심 있음)
   - 1-3시간: 보통 (바쁠 수 있음)
   - 3시간 이상: 주의 (관심 낮을 가능성)
   - 시간 정보 없으면 "답장 속도 분석 불가" 명시

2. 호감도 점수 기준:
   - 80-100: 강한 호감 신호 (적극적 관심)
   - 60-79: 긍정적 관심 (관계 발전 가능)
   - 40-59: 중립/관찰 단계 (아직 모호함)
   - 20-39: 소극적/관심 낮음 (회의적)
   - 0-19: 거부/회피 신호 (관계 단절 가능)

3. 호감 신호 체크:
   - 질문 여부: 질문 있음 = 관심, 없음 = 소극적
   - 이모티콘 사용: 증가 = 긍정, 감소 = 주의
   - 대화 길이: 길어짐 = 긍정, 짧아짐 = 주의
   - 감정 표현: 많음 = 긍정, 없음 = 주의

4. 위험 신호 체크:
   - 답장이 3회 연속 1단어 이하 ("응", "ㅇㅇ" 등)
   - 질문에 대한 직접적 회피 2회 이상
   - 감정 표현이 급격히 사라짐
   - "바쁘다/나중에" 반복 3회 이상
   - 대화 주도권 회피 (항상 답변만 함)

5. 맥락 부족 시:
   - 대화가 10줄 미만이면 "분석에 충분한 데이터가 없어요" 안내
   - 시간 정보 없으면 "답장 속도 분석은 제외됩니다" 명시

[출력 형식 - JSON만 응답]

{
  "emotionSummary": "현재 상대의 감정을 한 문장으로 요약 (예: '지금은 호감은 있지만 조심스러운 상태로 보여요')",
  "affectionScore": 75,
  "affectionReasons": [
    "답장 속도가 평균 10분 이내로 빠른 편이에요",
    "질문을 자주 해서 관심이 있어 보여요",
    "이모티콘 사용이 많아서 대화에 적극적이에요"
  ],
  "emotionFlow": "초반: 가볍고 반응형 → 후반: 질문 감소 + 답변 짧아짐",
  "riskSignals": ["답장이 최근에 짧아졌어요", "질문 회피가 2회 있었어요"],
  "recommendedAction": "오늘은 먼저 연락하지 말고, 반응을 기다리는 게 좋아요"
}

[주의사항]
- riskSignals가 없으면 빈 배열 []
- affectionReasons는 2-3개만
- recommendedAction은 딱 1가지 행동만
- 단정하지 말고 "~로 보여요", "~일 가능성이 있어요" 같은 표현 사용
- 불안 조장하지 말고 위로 + 현실 균형 유지

JSON만 응답해주세요. 다른 설명은 필요 없습니다.`;
}

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

  try {
    const { chatText } = await request.json();

    // 입력 검증
    const validation = validateChatInput(chatText);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 부적절한 내용 체크
    const contentCheck = checkInappropriateContent(chatText);
    if (!contentCheck.safe) {
      return NextResponse.json(
        { error: contentCheck.reason || "부적절한 내용이 포함되어 있습니다" },
        { status: 400 }
      );
    }

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

    // Gemini 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 프롬프트 생성
    const prompt = buildAnalysisPrompt(chatText);

    // Gemini 호출 (타임아웃 적용)
    const result = await withTimeout(
      model.generateContent(prompt),
      30000 // 30초 타임아웃
    );
    const response = result.response;
    const text = response.text();

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

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });

  } catch (error) {
    const errorResponse = createErrorResponse(error, "대화 분석 중 오류가 발생했습니다");
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status }
    );
  }
}
