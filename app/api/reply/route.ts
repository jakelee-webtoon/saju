import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  validateReplyInput,
  checkInappropriateContent,
  checkDuplicateRequest,
  getRequestIdentifier,
  withTimeout,
  createErrorResponse,
} from "@/app/lib/security/apiSecurity";

// 톤별 프롬프트 가이드
const TONE_GUIDES: Record<string, string> = {
  친근: "친근하고 다정한 말투로, 이모티콘이나 ㅋㅋ, ㅎㅎ를 자연스럽게 사용해서",
  쿨: "담백하고 쿨한 말투로, 짧고 간결하게, 너무 감정 표현 없이",
  애교: "귀엽고 애교 있는 말투로, ~용, ~당, ㅠㅠ, 💕 같은 표현을 사용해서",
  직진: "솔직하고 직접적인 말투로, 돌려 말하지 않고 확실하게 밀어붙이는 느낌으로",
  센스: "재치 있고 유머러스한 말투로, 상대방이 웃을 수 있게 센스 있게",
  섹시: "은근히 설레게 하는 말투로, 직접적이지 않지만 묘하게 끌리는 느낌으로, 적절한 여운을 남기며",
  로맨틱: "달달하고 로맨틱한 말투로, 상대방이 두근거릴 수 있게, 사랑스러운 표현으로",
  솔직: "꾸밈없이 있는 그대로 담백하게, 진심이 느껴지도록 솔직하게",
  논리적: "이성적이고 차분한 말투로, 감정보다는 논리적으로, 조리있게 말하는 느낌으로",
  츤데레: "관심 있는데 쿨한 척하는 말투로, 은근히 떠보면서도 '나 별로 신경 안 써~' 느낌, 하지만 대화는 계속 이어가고 싶은 게 느껴지게, 밀당의 정석처럼",
  팩폭: "팩트로 직격하는 말투로, 돌려 말하지 않고 현실적으로, 약간 까칠하지만 맞는 말로",
};

// 캐릭터별 성향 가이드
const CHARACTER_GUIDES: Record<string, string> = {
  "passionate-flame": "열정적이고 적극적인 성향, 감정 표현이 풍부함",
  "gentle-water": "부드럽고 감성적인 성향, 상대방 감정에 공감을 잘 함",
  "free-wind": "자유롭고 유쾌한 성향, 가벼운 농담을 좋아함",
  "stable-earth": "안정적이고 신뢰감 있는 성향, 진중한 대화를 선호함",
  "creative-metal": "독특하고 창의적인 성향, 예상치 못한 답변을 함",
};

export async function POST(request: NextRequest) {
  const identifier = getRequestIdentifier(request);

  // Rate Limiting 체크
  const rateLimitCheck = checkRateLimit(identifier, 'reply');
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: rateLimitCheck.reason || "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const { message, tone, tones, characterId, characterName } = await request.json();

    // tones 배열 또는 단일 tone 지원
    const toneList: string[] = tones || (tone ? [tone] : []);

    // 입력 검증
    if (toneList.length === 0) {
      return NextResponse.json(
        { error: "톤을 선택해주세요" },
        { status: 400 }
      );
    }

    const messageValidation = validateReplyInput(message);
    if (!messageValidation.valid) {
      return NextResponse.json(
        { error: messageValidation.error },
        { status: 400 }
      );
    }

    // 부적절한 내용 체크
    const contentCheck = checkInappropriateContent(message);
    if (!contentCheck.safe) {
      return NextResponse.json(
        { error: contentCheck.reason || "부적절한 내용이 포함되어 있습니다" },
        { status: 400 }
      );
    }

    // 중복 요청 체크
    const requestKey = `${message}:${toneList.join(',')}`;
    const duplicateCheck = checkDuplicateRequest(identifier, requestKey);
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

    // 복수 톤 프롬프트 구성
    const toneDescriptions = toneList
      .map(t => TONE_GUIDES[t] || "")
      .filter(Boolean)
      .join(", 그리고 ");
    
    const toneNames = toneList.join(" + ");
    const characterGuide = CHARACTER_GUIDES[characterId] || "";

    const prompt = `당신은 한국 20-30대가 카카오톡에서 사용하는 자연스러운 답장을 생성하는 AI입니다.

상황:
- 상대방 메시지: "${message}"
- 원하는 톤: ${toneNames} (${toneDescriptions})
${characterGuide ? `- 나의 성향: ${characterName} - ${characterGuide}` : ""}

요청사항:
1. 위 상대방 메시지에 대한 답장을 3개 생성해주세요
2. 각 답장은 실제 카톡에서 보낼 수 있는 자연스러운 한국어여야 합니다
3. 너무 길지 않게 (1-2문장 정도)
4. 각 답장은 조금씩 다른 뉘앙스로 만들어주세요
5. 절대 "안녕하세요", "감사합니다" 같은 딱딱한 표현 쓰지 마세요
6. 실제 친구나 썸 타는 사람에게 보내는 것처럼 자연스럽게

응답 형식 (JSON):
{
  "replies": [
    "첫 번째 답장",
    "두 번째 답장", 
    "세 번째 답장"
  ]
}

JSON만 응답해주세요. 다른 설명은 필요 없습니다.`;

    // Gemini 호출 (타임아웃 적용)
    const result = await withTimeout(
      model.generateContent(prompt),
      30000 // 30초 타임아웃
    );
    const response = result.response;
    const text = response.text();

    // JSON 파싱
    let replies: string[] = [];
    try {
      // JSON 블록 추출 (```json ... ``` 형태일 수 있음)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        replies = parsed.replies || [];
      }
    } catch {
      // 파싱 실패 시 텍스트에서 직접 추출 시도
      const lines = text.split("\n").filter(line => 
        line.trim() && 
        !line.includes("{") && 
        !line.includes("}") &&
        !line.includes("replies")
      );
      replies = lines.slice(0, 3).map(line => 
        line.replace(/^["'\d.\-\s]+/, "").replace(/["',]+$/, "").trim()
      ).filter(Boolean);
    }

    // 최소 1개 이상의 답장이 있어야 함
    if (replies.length === 0) {
      return NextResponse.json(
        { error: "답장 생성에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      replies: replies.slice(0, 3), // 최대 3개
      tones: toneList,
    });

  } catch (error) {
    const errorResponse = createErrorResponse(error, "답장 생성 중 오류가 발생했습니다");
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status }
    );
  }
}
