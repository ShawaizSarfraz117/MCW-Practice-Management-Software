"use client";

import { useState } from "react";
import TopBar from "@/components/layouts/Topbar";
import ProfileSidebar from "./components/sidebar";
import Profile from "./components/Profile";
import ClinicalInfo from "./components/clinical-info/ClinicalInfo";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile-security");

  const renderContent = () => {
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
