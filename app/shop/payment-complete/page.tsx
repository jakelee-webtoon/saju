"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPayment } from "@/app/lib/payment";
import { addArrowSync } from "@/app/lib/cupid/arrowBalance";

function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "fail">("loading");
  const [message, setMessage] = useState("결제 확인 중...");

  useEffect(() => {
    async function processPayment() {
      const impUid = searchParams.get("imp_uid");
      const merchantUid = searchParams.get("merchant_uid");
      const impSuccess = searchParams.get("imp_success");
      const errorMsg = searchParams.get("error_msg");

      // 모바일 결제 실패
      if (impSuccess === "false") {
        setStatus("fail");
        setMessage(errorMsg || "결제가 취소되었습니다.");
        return;
      }

      if (!impUid || !merchantUid) {
        setStatus("fail");
        setMessage("결제 정보가 없습니다.");
        return;
      }

      // localStorage에서 결제 정보 가져오기
      const pendingPayment = localStorage.getItem("pendingPayment");
      if (!pendingPayment) {
        setStatus("fail");
        setMessage("결제 정보를 찾을 수 없습니다.");
        return;
      }

      const { amount, arrows, packageName } = JSON.parse(pendingPayment);

      // 결제 검증
      const result = await verifyPayment(impUid, merchantUid, amount);
      
      if (result.success) {
        // 화살 충전
        await addArrowSync(arrows);
        localStorage.removeItem("pendingPayment");
        
        setStatus("success");
        setMessage(`${packageName} 구매 완료!\n💘 화살 ${arrows}개가 충전되었습니다.`);
      } else {
        setStatus("fail");
        setMessage(result.message || "결제 검증에 실패했습니다.");
      }
    }

    processPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-6">
      <div className="w-full max-w-sm text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6" />
            <p className="text-purple-700 font-medium">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-purple-900 mb-4">결제 완료!</h1>
            <p className="text-purple-700 whitespace-pre-line mb-8">{message}</p>
            <button
              onClick={() => router.replace("/shop")}
              className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              상점으로 돌아가기
            </button>
          </>
        )}

        {status === "fail" && (
          <>
            <div className="text-6xl mb-6">😢</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">결제 실패</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <button
              onClick={() => router.replace("/shop")}
              className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              다시 시도하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <PaymentCompleteContent />
    </Suspense>
  );
}
