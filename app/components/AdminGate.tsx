"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminOderId } from "@/app/lib/authz/admin";
import { getCurrentUserProfile } from "@/app/lib/firebase/userServiceClient";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<{ oderId: string } | null>(null);

  useEffect(() => {
    (async () => {
      const userProfile = await getCurrentUserProfile(); // { oderId }
      setProfile(userProfile);
      const ok = isAdminOderId(userProfile?.oderId);
      setAllowed(ok);
      if (!ok) {
        // 권한이 없어도 oderId 확인을 위해 리다이렉트하지 않음
        // router.replace("/");
      }
    })();
  }, [router]);

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
          <p className="text-purple-700 font-medium">권한 확인 중...</p>
        </div>
      </div>
    );
  }
  
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center max-w-md p-6">
          <p className="text-red-600 font-medium mb-4">접근 권한이 없습니다</p>
          {profile?.oderId && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
              <p className="font-medium text-gray-700 mb-2">현재 로그인된 oderId:</p>
              <p className="text-gray-900 font-mono break-all mb-2">{profile.oderId}</p>
              <p className="text-xs text-gray-500">
                이 값을 <code className="bg-gray-200 px-1 rounded">app/lib/authz/admin.ts</code>의 <code className="bg-gray-200 px-1 rounded">ADMIN_ODER_IDS</code>에 추가하세요
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
