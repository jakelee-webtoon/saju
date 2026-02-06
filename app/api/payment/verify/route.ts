import { NextRequest, NextResponse } from "next/server";

const PORTONE_API_KEY = process.env.PORTONE_API_KEY || "";
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";

interface PortOneTokenResponse {
  code: number;
  message: string;
  response?: {
    access_token: string;
    expired_at: number;
    now: number;
  };
}

interface PortOnePaymentResponse {
  code: number;
  message: string;
  response?: {
    imp_uid: string;
    merchant_uid: string;
    amount: number;
    status: string;
    paid_at: number;
    pay_method: string;
    name: string;
    buyer_name?: string;
    buyer_email?: string;
  };
}

/**
 * PortOne 액세스 토큰 발급
 */
async function getPortOneToken(): Promise<string | null> {
  try {
    const response = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imp_key: PORTONE_API_KEY,
        imp_secret: PORTONE_API_SECRET,
      }),
    });

    const data: PortOneTokenResponse = await response.json();
    
    if (data.code === 0 && data.response?.access_token) {
      return data.response.access_token;
    }
    
    console.error("PortOne token error:", data.message);
    return null;
  } catch (error) {
    console.error("PortOne token fetch error:", error);
    return null;
  }
}

/**
 * 결제 정보 조회
 */
async function getPaymentInfo(
  accessToken: string,
  impUid: string
): Promise<PortOnePaymentResponse["response"] | null> {
  try {
    const response = await fetch(`https://api.iamport.kr/payments/${impUid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data: PortOnePaymentResponse = await response.json();
    
    if (data.code === 0 && data.response) {
      return data.response;
    }
    
    console.error("PortOne payment info error:", data.message);
    return null;
  } catch (error) {
    console.error("PortOne payment fetch error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imp_uid, merchant_uid, expected_amount } = body;

    if (!imp_uid || !merchant_uid || !expected_amount) {
      return NextResponse.json(
        { success: false, message: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 테스트 모드 체크 (환경변수 없으면 테스트로 간주)
    if (!PORTONE_API_KEY || !PORTONE_API_SECRET) {
      console.log("PortOne API keys not set - running in test mode");
      // 테스트 모드에서는 검증 스킵하고 성공 처리
      return NextResponse.json({
        success: true,
        message: "테스트 모드 - 결제 검증 스킵",
        data: {
          imp_uid,
          merchant_uid,
          amount: expected_amount,
          status: "paid",
        },
      });
    }

    // 1. 액세스 토큰 발급
    const accessToken = await getPortOneToken();
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "PortOne 인증에 실패했습니다." },
        { status: 500 }
      );
    }

    // 2. 결제 정보 조회
    const paymentInfo = await getPaymentInfo(accessToken, imp_uid);
    if (!paymentInfo) {
      return NextResponse.json(
        { success: false, message: "결제 정보를 조회할 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 결제 검증
    // - 주문번호 일치 확인
    if (paymentInfo.merchant_uid !== merchant_uid) {
      return NextResponse.json(
        { success: false, message: "주문번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // - 결제 금액 일치 확인
    if (paymentInfo.amount !== expected_amount) {
      return NextResponse.json(
        { success: false, message: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // - 결제 상태 확인
    if (paymentInfo.status !== "paid") {
      return NextResponse.json(
        { success: false, message: `결제가 완료되지 않았습니다. (상태: ${paymentInfo.status})` },
        { status: 400 }
      );
    }

    // 4. 검증 성공
    return NextResponse.json({
      success: true,
      message: "결제가 정상적으로 확인되었습니다.",
      data: {
        imp_uid: paymentInfo.imp_uid,
        merchant_uid: paymentInfo.merchant_uid,
        amount: paymentInfo.amount,
        status: paymentInfo.status,
        paid_at: paymentInfo.paid_at,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "결제 검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
