import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ========================
// Rate Limiter
// ========================
const RATE_LIMIT_WINDOW = 60 * 1000; // 1분
const RATE_LIMIT_MAX = 10; // OCR도 무거우므로 10회로 제한

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetAt) requestCounts.delete(key);
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  // Rate Limiting 체크
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const isSecondImage = formData.get("isSecondImage") === "true";
    const previousContext = formData.get("previousContext") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "이미지 파일이 필요해요" },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드할 수 있어요" },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (5MB) - 일반 스크린샷은 1-3MB 정도
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "이미지 크기는 5MB 이하여야 해요" },
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

요구사항:
1. 대화 형식을 유지해주세요 (예: "나: ...", "상대: ...")
2. 이모티콘은 그대로 유지해주세요
3. 시간 정보는 제외해주세요
4. 순서대로 정확하게 추출해주세요
5. 한국어 대화만 추출해주세요`;

    // 두 번째 이미지인 경우 첫 번째 이미지의 맥락 제공
    if (isSecondImage && previousContext) {
      prompt += `

중요: 이것은 두 번째 이미지입니다. 이전 대화 맥락:
${previousContext}

위 맥락을 참고하여, 이 이미지의 대화도 반드시 "나: ..." 또는 "상대: ..." 형식으로 추출해주세요.
각 메시지가 누구의 말인지 정확히 구분하여 접두사를 붙여주세요.`;
    }

    prompt += `\n\n텍스트만 응답해주세요. 다른 설명은 필요 없습니다.`;

    // Gemini Vision API 호출
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

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
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "이미지 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
