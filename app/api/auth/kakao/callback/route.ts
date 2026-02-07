import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  // CSRF 보호: Origin 검증
  const origin = request.headers.get("origin") || request.headers.get("referer");
  const expectedOrigin = request.nextUrl.origin;
  if (origin && !origin.startsWith(expectedOrigin)) {
    console.error("CSRF: Invalid origin", origin);
    return NextResponse.redirect(new URL("/login?error=csrf_failed", request.url));
  }

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

    // 3. 사용자 정보를 쿠키로 전달 (URL 노출 방지)
    const kakaoUser = {
      id: String(userData.id),
      nickname: userData.kakao_account?.profile?.nickname || "사용자",
      profileImage: userData.kakao_account?.profile?.profile_image_url || "",
      email: userData.kakao_account?.email || "",
    };

    // 쿠키로 전달 (SameSite=Lax로 CSRF 방지, httpOnly=false로 클라이언트에서 읽기 가능)
    const response = NextResponse.redirect(
      new URL("/login/callback?provider=kakao", request.url)
    );
    response.cookies.set("oauth_user", JSON.stringify(kakaoUser), {
      httpOnly: false, // 클라이언트에서 읽어서 localStorage에 저장해야 함
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1분 후 자동 삭제
      path: "/",
    });
    response.cookies.set("oauth_token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Kakao callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_failed", request.url));
  }
}
