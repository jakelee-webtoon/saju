"use client";

type TabId = "home" | "chat" | "reply" | "my";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  chatBadge?: boolean;
}

const tabs: { id: TabId; label: string; icon: string; activeIcon: string }[] = [
  { id: "home", label: "홈", icon: "🏠", activeIcon: "🏠" },
  { id: "chat", label: "대화분석", icon: "💬", activeIcon: "💬" },
  { id: "reply", label: "답장", icon: "✨", activeIcon: "✨" },
  { id: "my", label: "MY", icon: "👤", activeIcon: "👤" },
];

export default function BottomNav({ activeTab, onTabChange, chatBadge = false }: BottomNavProps) {
  return (
    <nav 
      className="fixed left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // 모바일 브라우저 주소창 변화에도 고정
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="flex items-center h-16">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? "text-[#1a1a2e]" : "text-gray-400"
                }`}
              >
                {/* 활성 상태 배경 pill */}
                <div className={`absolute top-2 w-12 h-8 rounded-full transition-colors ${isActive ? "bg-indigo-100" : "bg-transparent"}`} />
                
                {/* 아이콘 */}
                <span className="relative text-xl mb-0.5 w-6 h-6 flex items-center justify-center">
                  {tab.icon}
                  
                  {/* 카톡 배지 */}
                  {tab.id === "chat" && chatBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </span>
                
                {/* 라벨 */}
                <span className={`relative text-[10px] font-medium transition-colors ${isActive ? "text-[#1a1a2e]" : "text-gray-400"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export type { TabId };
