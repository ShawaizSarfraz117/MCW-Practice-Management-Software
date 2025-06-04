"use client";

import { Dispatch, SetStateAction } from "react";

interface AnalyticsHeaderProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

export function AnalyticsHeader({
  activeTab,
  setActiveTab,
}: AnalyticsHeaderProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
      <div>
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "dashboard"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "reports"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("reports")}
          >
            Reports
          </button>
        </div>
      </div>
    </div>
  );
}
