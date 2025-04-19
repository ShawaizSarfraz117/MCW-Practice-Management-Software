"use client";

import { useState } from "react";
import TopBar from "@/components/layouts/Topbar";
import ProfileSidebar from "./components/sidebar";
import Profile from "./components/Profile";
import ClinicalInfo from "./components/clinical-info/ClinicalInfo";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile-security");
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          {/* <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div> */}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <button
            className="mt-2 text-sm text-red-500 hover:text-red-700"
            onClick={() => setError(null)}
          >
            Try again
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case "profile-security":
        return <Profile />;
      case "clinical-info":
        return <ClinicalInfo />;
      // Add more cases for other sections
      default:
        return (
          <div>
            <h1 className="text-2xl font-semibold">
              {activeSection
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </h1>
            <p className="mt-2 text-gray-600">
              This section is under construction
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen">
      <ProfileSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1">
        <TopBar showMenuBar={false} showSearch={false} />
        <div className="bg-white p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
