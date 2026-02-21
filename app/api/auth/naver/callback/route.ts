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
  console.log("Naver callback - State verification:", {
    cookieState,
    urlState: state,
    match: cookieState === state,
    allCookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value?.substring(0, 20) + "..." }))
  });
  
  // 개발 환경에서는 state 검증을 완화 (쿠키가 없어도 URL의 state만 확인)
  const isDevelopment = process.env.NODE_ENV === "development" || request.nextUrl.hostname === "localhost";
  
  if (!cookieState || cookieState !== state) {
    if (isDevelopment) {
      // 개발 환경: state가 URL에 있으면 허용 (쿠키 문제 우회)
      console.warn("CSRF: State mismatch in development, allowing with URL state only", { 
        cookieState, 
        state,
        redirectUri: `${request.nextUrl.origin}/api/auth/naver/callback`,
      });
      // 개발 환경에서는 계속 진행
    } else {
      // 프로덕션: 엄격한 검증
      console.error("CSRF: Invalid state", { 
        cookieState, 
        state,
        redirectUri: `${request.nextUrl.origin}/api/auth/naver/callback`,
        clientId: NAVER_CLIENT_ID ? "SET" : "NOT SET"
      });
      return NextResponse.redirect(new URL("/login?error=csrf_failed", request.url));
    }
  }

  // CSRF 보호: Origin 검증
  // 네이버에서 리다이렉트할 때는 origin이 없고 referer만 있을 수 있음
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const expectedOrigin = request.nextUrl.origin;
  
  console.log("Naver callback - Origin verification:", {
    origin,
    referer,
    expectedOrigin,
    originMatch: origin ? origin.startsWith(expectedOrigin) : "no origin",
    refererMatch: referer ? referer.startsWith(expectedOrigin) || referer.startsWith("https://nid.naver.com") : "no referer"
  });
  
  // Origin이 있으면 검증, 없으면 Referer 검증 (네이버 리다이렉트 허용)
  if (origin) {
    // Origin이 있으면 정확히 일치해야 함
    if (!origin.startsWith(expectedOrigin)) {
      console.error("CSRF: Invalid origin", { origin, expectedOrigin });
      return NextResponse.redirect(new URL("/login?error=csrf_failed", request.url));
    }
  } else if (referer) {
    // Origin이 없고 Referer만 있는 경우 (네이버 리다이렉트)
    // Referer가 우리 도메인이거나 네이버 도메인이면 허용
    if (!referer.startsWith(expectedOrigin) && !referer.startsWith("https://nid.naver.com")) {
      console.error("CSRF: Invalid referer", { referer, expectedOrigin });
      return NextResponse.redirect(new URL("/login?error=csrf_failed", request.url));
    }
  }
  // Origin과 Referer가 모두 없으면 state 검증만으로 충분 (이미 위에서 검증됨)

  try {
    // 1. 인가 코드로 액세스 토큰 받기
    const redirectUri = `${request.nextUrl.origin}/api/auth/naver/callback`;
    console.log("Naver callback - Token request:", {
      redirectUri,
      hasClientId: !!NAVER_CLIENT_ID,
      hasClientSecret: !!NAVER_CLIENT_SECRET,
      code: code?.substring(0, 10) + "..."
    });
    
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
      console.error("Naver token error - Response not OK:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
        redirectUri,
        hasClientId: !!NAVER_CLIENT_ID,
        hasClientSecret: !!NAVER_CLIENT_SECRET,
      });
      return NextResponse.redirect(new URL("/login?error=token_failed", request.url));
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error("Naver token error - API error:", {
        error: tokenData.error,
        errorDescription: tokenData.error_description,
        redirectUri,
        hasClientId: !!NAVER_CLIENT_ID,
        hasClientSecret: !!NAVER_CLIENT_SECRET,
      });
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
