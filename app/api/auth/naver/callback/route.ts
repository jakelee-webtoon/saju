import { NextRequest, NextResponse } from "next/server";

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 에러 처리
  if (error) {
    console.error("Naver auth error:", error, errorDescription);
    return NextResponse.redirect(new URL("/login?error=naver_auth_failed", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    // 1. 인가 코드로 액세스 토큰 받기
    const redirectUri = `${request.nextUrl.origin}/api/auth/naver/callback`;
    
    const tokenResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: code,
        state: state,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Naver token error:", errorData);
      return NextResponse.redirect(new URL("/login?error=token_failed", request.url));
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error("Naver token error:", tokenData.error, tokenData.error_description);
      return NextResponse.redirect(new URL("/login?error=token_failed", request.url));
    }
    
    const accessToken = tokenData.access_token;

    // 2. 액세스 토큰으로 사용자 정보 가져오기
    const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Naver user info error:", await userResponse.text());
      return NextResponse.redirect(new URL("/login?error=user_info_failed", request.url));
    }

    const userData = await userResponse.json();

    if (userData.resultcode !== "00") {
      console.error("Naver user info error:", userData.message);
      return NextResponse.redirect(new URL("/login?error=user_info_failed", request.url));
    }

    // 3. 사용자 정보를 쿼리 파라미터로 전달 (클라이언트에서 localStorage에 저장)
    const naverUser = {
      id: `naver_${userData.response.id}`,
      nickname: userData.response.nickname || userData.response.name || "네이버 사용자",
      profileImage: userData.response.profile_image || "",
      email: userData.response.email || "",
      provider: "naver",
    };

    // URL-safe하게 인코딩
    const userParam = encodeURIComponent(JSON.stringify(naverUser));
    const tokenParam = encodeURIComponent(accessToken);

    return NextResponse.redirect(
      new URL(`/login/callback?user=${userParam}&token=${tokenParam}&provider=naver&state=${state}`, request.url)
    );
  } catch (error) {
    console.error("Naver callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_failed", request.url));
  }
}
