"use client";

import { useEffect, useState } from "react";
import AdminGate from "@/app/components/AdminGate";
import { getCurrentUserProfile } from "@/app/lib/firebase/userServiceClient";

interface SearchResult {
  oderId: string;
  email: string | null;
  nickname: string | null;
  provider: string | null;
  arrowBalance: number;
}

export default function AdminPage() {
  const [currentOderId, setCurrentOderId] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchNickname, setSearchNickname] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOderId, setSelectedOderId] = useState("");

  useEffect(() => {
    (async () => {
      const profile = await getCurrentUserProfile();
      setCurrentOderId(profile?.oderId || null);
    })();
  }, []);

  async function handleSearch() {
    if (!searchEmail && !searchNickname) {
      alert("이메일 또는 닉네임을 입력해주세요");
      return;
    }

    if (!currentOderId) {
      alert("로그인이 필요합니다");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/admin/search-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterOderId: currentOderId,
          email: searchEmail.trim() || undefined,
          nickname: searchNickname.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(`검색 실패: ${json.error}`);
        setSearchResults([]);
      } else {
        setSearchResults(json.users || []);
        if (json.users && json.users.length === 0) {
          alert("검색 결과가 없습니다");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("검색 중 오류가 발생했습니다");
    } finally {
      setIsSearching(false);
    }
  }
  async function handleSubmit(formData: FormData) {
    const targetOderId = String(formData.get("targetOderId")).trim();
    const amount = Number(formData.get("amount"));
    const reason = String(formData.get("reason")).trim();

    // 입력 검증
    if (!targetOderId || !reason) {
      alert("모든 필드를 입력해주세요");
      return;
    }
    if (isNaN(amount) || amount === 0) {
      alert("유효한 금액을 입력해주세요 (0이 아닌 숫자)");
      return;
    }
    if (reason.length > 200) {
      alert("사유는 200자 이내로 입력해주세요");
      return;
    }

    if (!currentOderId) {
      alert("로그인이 필요합니다");
      return;
    }

    const res = await fetch("/api/admin/grant-arrows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        requesterOderId: currentOderId,
        targetOderId, 
        amount, 
        reason 
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      alert(`오류: ${json.error || "알 수 없는 오류가 발생했습니다"}`);
    } else {
      alert(`완료 (새 잔액: ${json.newBalance})`);
    }
  }

  return (
    <AdminGate>
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">Admin · 화살 지급</h1>
        
        {/* 사용자 검색 섹션 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-sm font-bold mb-3 text-gray-700">사용자 검색</h2>
          <div className="space-y-2 mb-3">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="이메일로 검색"
              className="w-full border p-2 rounded text-sm"
            />
            <input
              type="text"
              value={searchNickname}
              onChange={(e) => setSearchNickname(e.target.value)}
              placeholder="닉네임으로 검색"
              className="w-full border p-2 rounded text-sm"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSearching ? "검색 중..." : "검색"}
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">검색 결과:</p>
              {searchResults.map((user) => (
                <div
                  key={user.oderId}
                  className={`p-2 rounded border cursor-pointer text-sm ${
                    selectedOderId === user.oderId
                      ? "bg-blue-200 border-blue-400"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedOderId(user.oderId)}
                >
                  <p className="font-mono text-xs break-all">{user.oderId}</p>
                  <p className="text-gray-600">
                    {user.nickname && `${user.nickname} `}
                    {user.email && `(${user.email})`}
                  </p>
                  <p className="text-xs text-gray-500">
                    화살: {user.arrowBalance} | {user.provider}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form action={handleSubmit} className="space-y-3">
          <div>
            <input
              name="targetOderId"
              value={selectedOderId}
              onChange={(e) => setSelectedOderId(e.target.value)}
              placeholder="targetOderId (검색 결과 클릭 또는 직접 입력)"
              className="w-full border p-2"
            />
            {selectedOderId && (
              <p className="text-xs text-gray-500 mt-1">
                선택된 oderId: <span className="font-mono">{selectedOderId}</span>
              </p>
            )}
          </div>
          <input name="amount" type="number" placeholder="amount (음수=회수)" className="w-full border p-2" />
          <input name="reason" placeholder="reason" className="w-full border p-2" />
          <button className="w-full bg-black text-white p-2 rounded">실행</button>
        </form>
      </div>
    </AdminGate>
  );
}
