"use client";

export type TabType = "history";

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function TabNavigation({
  _activeTab,
  setActiveTab,
}: TabNavigationProps) {
  return (
    <div className="mb-4 flex">
      <div className="flex">
        <button
          className="px-4 py-2 text-base font-medium border-b-2 border-[#2D8467] text-[#000000]"
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>
    </div>
  );
}
