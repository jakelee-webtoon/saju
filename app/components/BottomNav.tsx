"use client";

type TabId = "home" | "love" | "chat" | "me";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  chatBadge?: boolean;
}

const tabs: { id: TabId; label: string; icon: string; activeIcon: string }[] = [
  { id: "home", label: "홈", icon: "🏠", activeIcon: "🏠" },
  { id: "love", label: "연애", icon: "💕", activeIcon: "💗" },
  { id: "chat", label: "카톡", icon: "💬", activeIcon: "💬" },
  { id: "me", label: "나", icon: "👤", activeIcon: "👤" },
];

export default function BottomNav({ activeTab, onTabChange, chatBadge = false }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all ${
                  isActive ? "text-[#1a1a2e]" : "text-gray-400"
                }`}
              >
                {/* 활성 상태 배경 pill */}
                {isActive && (
                  <div className="absolute top-2 w-12 h-8 rounded-full bg-indigo-100" />
                )}
                
                {/* 아이콘 */}
                <span className={`relative text-xl mb-0.5 ${isActive ? "scale-110" : ""} transition-transform`}>
                  {isActive ? tab.activeIcon : tab.icon}
                  
                  {/* 카톡 배지 */}
                  {tab.id === "chat" && chatBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </span>
                
                {/* 라벨 */}
                <span className={`relative text-[10px] font-medium ${isActive ? "text-[#1a1a2e]" : "text-gray-400"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* iPhone Safe Area */}
      <div className="h-safe-area-bottom bg-white" />
    </nav>
  );
}

export type { TabId };
