"use client";

export type TabType = "history" | "signin" | "hipaa";

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function TabNavigation({
  activeTab,
  setActiveTab,
}: TabNavigationProps) {
  return (
    <div className="mb-4 flex">
      <div className="flex">
        <button
          className={`px-4 py-2 text-base font-normal ${
            activeTab === "history"
              ? "border-b-2 border-[#2D8467] text-[#000000] font-medium"
              : "text-gray-800"
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        <button
          className={`px-4 py-2 text-base font-normal ${
            activeTab === "signin"
              ? "border-b-2 border-[#2D8467] text-[#000000] font-medium"
              : "text-gray-800"
          }`}
          onClick={() => setActiveTab("signin")}
        >
          Sign In Events
        </button>
        <button
          className={`px-4 py-2 text-base font-normal ${
            activeTab === "hipaa"
              ? "border-b-2 border-[#2D8467] text-[#000000] font-medium"
              : "text-gray-800"
          }`}
          onClick={() => setActiveTab("hipaa")}
        >
          HIPAA Audit Log
        </button>
      </div>
    </div>
  );
}
