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

  // CSRF 보호: state 검증 (쿠키에서 확인)
  const cookieState = request.cookies.get("naver_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    console.error("CSRF: Invalid state", { cookieState, state });
    return NextResponse.redirect(new URL("/login?error=csrf_failed", request.url));
  }

  // CSRF 보호: Origin 검증
  const origin = request.headers.get("origin") || request.headers.get("referer");
  const expectedOrigin = request.nextUrl.origin;
  if (origin && !origin.startsWith(expectedOrigin)) {
    console.error("CSRF: Invalid origin", origin);
    return NextResponse.redirect(new URL("/login?error=csrf_failed", request.url));
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

    // 3. 사용자 정보를 쿠키로 전달 (URL 노출 방지)
    const naverUser = {
      id: `naver_${userData.response.id}`,
      nickname: userData.response.nickname || userData.response.name || "네이버 사용자",
      profileImage: userData.response.profile_image || "",
      email: userData.response.email || "",
      provider: "naver",
    };

    // 쿠키로 전달 (SameSite=Lax로 CSRF 방지, httpOnly=false로 클라이언트에서 읽기 가능)
    const response = NextResponse.redirect(
      new URL(`/login/callback?provider=naver&state=${state}`, request.url)
    );
    response.cookies.set("oauth_user", JSON.stringify(naverUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });
    response.cookies.set("oauth_token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });
    
    // 사용된 state 쿠키 삭제 (재사용 방지)
    response.cookies.delete("naver_oauth_state");
    return response;
  } catch (error) {
    console.error("Naver callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_failed", request.url));
  }
}
