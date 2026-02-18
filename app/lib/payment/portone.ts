"use client";

// PortOne (구 아임포트) SDK 타입 선언
declare global {
  interface Window {
    IMP: {
      init: (merchantId: string) => void;
      request_pay: (
        params: PaymentRequest,
        callback: (response: PaymentResponse) => void
      ) => void;
    };
  }
}

// 결제 요청 파라미터
export interface PaymentRequest {
  pg: string;                    // PG사 코드
  pay_method: string;            // 결제 방식
  merchant_uid: string;          // 주문번호 (고유값)
  name: string;                  // 상품명
  amount: number;                // 결제 금액
  buyer_email?: string;          // 구매자 이메일
  buyer_name?: string;           // 구매자 이름
  buyer_tel?: string;            // 구매자 전화번호
  m_redirect_url?: string;       // 모바일 결제 후 리다이렉트 URL
  app_scheme?: string;           // 앱 스킴 (앱 결제용)
}

// 결제 응답
export interface PaymentResponse {
  success: boolean;
  imp_uid: string;               // 포트원 결제 고유번호
  merchant_uid: string;          // 주문번호
  paid_amount?: number;          // 결제 금액
  error_code?: string;
  error_msg?: string;
}

// 환경변수
const PORTONE_MERCHANT_ID = process.env.NEXT_PUBLIC_PORTONE_MERCHANT_ID || "";

// 테스트용 PG 설정
const TEST_PG = {
  KAKAOPAY: "kakaopay.TC0ONETIME",           // 카카오페이 테스트
  TOSSPAY: "tosspay.tosstest",               // 토스페이 테스트  
  INICIS: "html5_inicis.INIpayTest",         // KG이니시스 테스트
  KCP: "kcp.T0000",                          // NHN KCP 테스트
};

/**
 * PortOne SDK 초기화
 */
export function initPortOne(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot initialize PortOne on server side"));
      return;
    }

    // 이미 초기화되어 있으면 바로 resolve
    if (window.IMP) {
      window.IMP.init(PORTONE_MERCHANT_ID);
      resolve();
      return;
    }

    // SDK 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    script.onload = () => {
      if (!PORTONE_MERCHANT_ID) {
        reject(new Error("NEXT_PUBLIC_PORTONE_MERCHANT_ID is not set"));
        return;
      }
      window.IMP.init(PORTONE_MERCHANT_ID);
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load PortOne SDK"));
    document.head.appendChild(script);
  });
}

/**
 * 주문번호 생성 (고유값)
 */
export function generateMerchantUid(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order_${timestamp}_${random}`;
}

/**
 * 결제 요청
 */
export function requestPayment(
  params: Omit<PaymentRequest, "pg" | "merchant_uid"> & { pgType?: keyof typeof TEST_PG }
): Promise<PaymentResponse> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.IMP) {
      resolve({
        success: false,
        imp_uid: "",
        merchant_uid: "",
        error_msg: "PortOne SDK가 초기화되지 않았습니다.",
      });
      return;
    }

    const merchantUid = generateMerchantUid();
    const pg = TEST_PG[params.pgType || "KAKAOPAY"];
    
    // 모바일 리다이렉트 URL 설정
    const redirectUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/shop/payment-complete`
      : "";

    window.IMP.request_pay(
      {
        pg,
        pay_method: params.pay_method || "card",
        merchant_uid: merchantUid,
        name: params.name,
        amount: params.amount,
        buyer_email: params.buyer_email,
        buyer_name: params.buyer_name,
        buyer_tel: params.buyer_tel,
        m_redirect_url: redirectUrl,
      },
      (response) => {
        resolve(response);
      }
    );
  });
}

/**
 * 결제 검증 (서버에서 확인)
 */
export async function verifyPayment(
  impUid: string,
  merchantUid: string,
  expectedAmount: number
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imp_uid: impUid,
        merchant_uid: merchantUid,
        expected_amount: expectedAmount,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Payment verification error:", error);
    return { success: false, message: "결제 검증에 실패했습니다." };
  }
}
