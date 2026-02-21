import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/app/lib/firebase/admin";
import { isAdminOderId } from "@/app/lib/authz/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { requesterOderId, targetOderId, amount, reason } = await req.json();

    // Admin 권한 체크 (클라이언트에서 전달한 oderId 검증)
    if (!requesterOderId || !isAdminOderId(requesterOderId)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }


    // 타입 및 값 검증
    if (!targetOderId || typeof targetOderId !== "string" || !targetOderId.trim()) {
      return NextResponse.json({ error: "invalid_targetOderId" }, { status: 400 });
    }
    if (typeof amount !== "number" || isNaN(amount) || !isFinite(amount)) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    if (!reason || typeof reason !== "string" || !reason.trim() || reason.length > 200) {
      return NextResponse.json({ error: "invalid_reason" }, { status: 400 });
    }

    const ref = adminDb.collection("users").doc(targetOderId);

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("user_not_found");

      const current = Number(snap.data()?.arrowBalance ?? 0);
      const next = current + amount;
      if (next < 0) throw new Error("insufficient_balance");

      tx.update(ref, {
        arrowBalance: next,
        arrowBalanceUpdatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(adminDb.collection("adminLog").doc(), {
        targetOderId,
        amount,
        reason,
        actor: requesterOderId,
        createdAt: FieldValue.serverTimestamp(),
      });

      return next;
    });

    return NextResponse.json({ success: true, newBalance: result });
  } catch (e: any) {
    console.error("Admin grant arrows error:", e);
    
    // 인증 관련 에러
    if (e.message?.includes("token") || e.message?.includes("auth") || e.code === "auth/invalid-token") {
      return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    }
    
    // 비즈니스 로직 에러
    const knownErrors = ["user_not_found", "insufficient_balance"];
    if (knownErrors.includes(e.message)) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    
    // 알 수 없는 에러는 상세 정보 숨김
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다" }, { status: 500 });
  }
}
