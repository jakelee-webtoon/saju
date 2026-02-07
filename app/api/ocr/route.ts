import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  validateImageFile,
  getRequestIdentifier,
  withTimeout,
  createErrorResponse,
} from "@/app/lib/security/apiSecurity";

export async function POST(request: NextRequest) {
  const identifier = getRequestIdentifier(request);

  // Rate Limiting 체크
  const rateLimitCheck = checkRateLimit(identifier, 'ocr');
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: rateLimitCheck.reason || "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const isSecondImage = formData.get("isSecondImage") === "true";
    const previousContext = formData.get("previousContext") as string | null;

    // 파일 검증
    const fileValidation = validateImageFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
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

    // 이미지를 base64로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    // Gemini Vision 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // OCR 프롬프트
    let prompt = `이 이미지는 카카오톡 대화 스크린샷입니다.
이미지에서 대화 내용을 텍스트로 추출해주세요.

**중요: 카카오톡 대화 구분 규칙**
- 왼쪽에 표시된 메시지 (보통 회색 배경) = 상대방의 메시지 → 상대방의 실제 이름 사용 (예: "민지:", "지훈:", "수진:" 등)
- 오른쪽에 표시된 메시지 (보통 초록색 배경) = 사용자(나)의 메시지 → "나:" 접두사 사용
- 상대방의 이름은 이미지 상단이나 메시지 옆에 표시된 이름을 그대로 사용해주세요

요구사항:
1. 각 메시지의 위치(왼쪽/오른쪽)를 정확히 구분하여 "나:" 또는 "상대방이름:" 형식으로 추출해주세요
2. 상대방의 이름이 보이면 그 이름을 그대로 사용해주세요 (예: "민지:", "지훈:", "수진:" 등)
3. 상대방 이름이 보이지 않으면 "상대:"를 사용해주세요
4. 이모티콘은 그대로 유지해주세요
5. 시간 정보는 제외해주세요
6. 순서대로 정확하게 추출해주세요 (위에서 아래로)
7. 한국어 대화만 추출해주세요`;

    // 두 번째 이미지인 경우 첫 번째 이미지의 맥락 제공
    if (isSecondImage && previousContext) {
      // 이전 맥락에서 상대방 이름 추출
      const nameMatch = previousContext.match(/^([^:]+):/);
      const opponentName = nameMatch && !nameMatch[1].includes("나") && !nameMatch[1].includes("상대") 
        ? nameMatch[1].trim() 
        : null;
      
      prompt += `

중요: 이것은 두 번째 이미지입니다. 이전 대화 맥락:
${previousContext}

위 맥락을 참고하여, 이 이미지의 대화도 동일한 형식으로 추출해주세요.
- 왼쪽 메시지(회색) = "${opponentName || "상대"}:" (이전 맥락과 동일한 이름 사용)
- 오른쪽 메시지(초록색) = "나:"
각 메시지가 누구의 말인지 정확히 구분하여 접두사를 붙여주세요.`;
    }

    prompt += `\n\n텍스트만 응답해주세요. 다른 설명은 필요 없습니다.`;

    // Gemini Vision API 호출 (타임아웃 적용)
    const result = await withTimeout(
      model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]),
      45000 // OCR은 더 오래 걸릴 수 있으므로 45초
    );

    const response = result.response;
    const extractedText = response.text().trim();

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        { error: "이미지에서 텍스트를 추출하지 못했어요. 더 선명한 스크린샷을 업로드해주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
    });

  } catch (error) {
    const errorResponse = createErrorResponse(error, "이미지 처리 중 오류가 발생했습니다");
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status }
    );
  }
}
