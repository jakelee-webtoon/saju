import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getRequestIdentifier,
  createErrorResponse,
} from "@/app/lib/security/apiSecurity";
import { getOrCreateSessionId } from "@/app/lib/cost/tracking";
import { extractFromImages } from "@/app/lib/chat/extractService";

// 동적 라우팅 강제 (에러 페이지 방지)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/chat/extract
 * 이미지 → 정규화된 대화 JSON (Vision 호출 1회로 고정, 캐시)
 */
export async function POST(request: NextRequest) {
  try {
    const identifier = getRequestIdentifier(request);
    const sessionId = getOrCreateSessionId(request);

    // Rate Limiting 체크
    const rateLimitCheck = checkRateLimit(identifier, 'ocr');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.reason || "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
    const formData = await request.formData();
    const images: File[] = [];
    
    // 최대 3개 이미지 수집
    for (let i = 1; i <= 3; i++) {
      const file = formData.get(`image${i}`) as File;
      if (file) {
        images.push(file);
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "이미지를 업로드해주세요" },
        { status: 400 }
      );
    }

    const locale = (formData.get("locale") as string) || "ko-KR";

    // Extract 서비스 호출 (공통 로직 사용)
    const extractResult = await extractFromImages(
      images,
      locale,
      sessionId,
      identifier
    );

    // 캐시 히트 여부 확인
    const wasCached = (extractResult as any)._wasCached || false;
    const { _wasCached, ...resultWithoutFlag } = extractResult as any;

    return NextResponse.json(
      {
        success: true,
        cached: wasCached,
        ...resultWithoutFlag,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    } catch (error) {
      console.error("[Extract] Error:", error);
      const errorResponse = createErrorResponse(error, "이미지 처리 중 오류가 발생했습니다");
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
    console.error("[Extract] Top-level error:", error);
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
