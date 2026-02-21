import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/app/lib/firebase/admin";
import { isAdminOderId } from "@/app/lib/authz/admin";
import type { Query } from "firebase-admin/firestore";

/**
 * Admin용 사용자 검색 API
 * 이메일, 닉네임, 또는 이름(birthInfo.name)으로 사용자 검색
 */
export async function POST(req: Request) {
  try {
    const { requesterOderId, email, nickname, name } = await req.json();

    // Admin 권한 체크
    if (!requesterOderId || !isAdminOderId(requesterOderId)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (!email && !nickname && !name) {
      return NextResponse.json({ error: "email, nickname, 또는 name이 필요합니다" }, { status: 400 });
    }

    const usersRef = adminDb.collection("users");
    let query: Query = usersRef;

    // 이메일로 검색 (최우선)
    if (email) {
      query = query.where("email", "==", email);
    }
    // 닉네임으로 검색
    else if (nickname) {
      query = query.where("nickname", "==", nickname);
    }
    // 이름으로 검색 (birthInfo.name)
    else if (name) {
      query = query.where("birthInfo.name", "==", name);
    }

    const snapshot = await query.limit(10).get();

    if (snapshot.empty) {
      return NextResponse.json({ users: [] });
    }

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        oderId: doc.id,
        email: data.email || null,
        nickname: data.nickname || null,
        name: data.birthInfo?.name || null,
        provider: data.provider || null,
        arrowBalance: data.arrowBalance || 0,
      };
    });

    return NextResponse.json({ users });
  } catch (e: any) {
    console.error("Admin search user error:", e);
    return NextResponse.json({ error: e.message || "검색 실패" }, { status: 500 });
  }
}
