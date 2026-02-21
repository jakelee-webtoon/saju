import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase/admin";

/**
 * Firebase 커스텀 토큰 생성 API
 * 클라이언트에서 호출하여 Firebase Auth 토큰을 받습니다.
 */
export async function POST(req: Request) {
  try {
    const { userId, provider } = await req.json();
    
    if (!userId || !provider) {
      return NextResponse.json({ error: "userId와 provider가 필요합니다" }, { status: 400 });
    }
    
    // Firebase 커스텀 토큰 생성
    // uid는 userId를 사용 (users 컬렉션의 문서 ID와 동일)
    const customToken = await adminAuth.createCustomToken(userId, {
      provider,
    });
    
    return NextResponse.json({ token: customToken });
  } catch (e: any) {
    console.error("Custom token creation error:", e);
    
    // Firebase Admin SDK 인증 오류인 경우 명확한 메시지
    if (e.message?.includes("default credentials") || e.message?.includes("credential")) {
      return NextResponse.json(
        { 
          error: "Firebase Admin SDK 인증이 필요합니다. 서비스 계정 키를 설정해주세요.",
          details: "Firebase Console > 프로젝트 설정 > 서비스 계정에서 키를 다운로드하고 .env.local에 설정하세요."
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ error: e.message || "토큰 생성 실패" }, { status: 500 });
  }
}
