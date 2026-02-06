import { NextRequest, NextResponse } from "next/server";

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // 에러 처리
  if (error) {
    console.error("Kakao auth error:", error);
    return NextResponse.redirect(new URL("/login?error=kakao_auth_failed", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    // 1. 인가 코드로 액세스 토큰 받기
    const redirectUri = `${request.nextUrl.origin}/api/auth/kakao/callback`;
    
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: redirectUri,
        code: code,
        ...(KAKAO_CLIENT_SECRET && { client_secret: KAKAO_CLIENT_SECRET }),
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token error:", errorData);
      return NextResponse.redirect(new URL("/login?error=token_failed", request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. 액세스 토큰으로 사용자 정보 가져오기
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    if (!userResponse.ok) {
      console.error("User info error:", await userResponse.text());
      return NextResponse.redirect(new URL("/login?error=user_info_failed", request.url));
    }

    const userData = await userResponse.json();

    // 3. 사용자 정보를 쿼리 파라미터로 전달 (클라이언트에서 localStorage에 저장)
    const kakaoUser = {
      id: String(userData.id),
      nickname: userData.kakao_account?.profile?.nickname || "사용자",
      profileImage: userData.kakao_account?.profile?.profile_image_url || "",
      email: userData.kakao_account?.email || "",
    };

    // URL-safe하게 인코딩
    const userParam = encodeURIComponent(JSON.stringify(kakaoUser));
    const tokenParam = encodeURIComponent(accessToken);

    return NextResponse.redirect(
      new URL(`/login/callback?user=${userParam}&token=${tokenParam}`, request.url)
    );
  } catch (error) {
    console.error("Kakao callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_failed", request.url));
  }
}
