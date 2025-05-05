"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import SettingsSidebar from "./_components/SettingsSidebar";
import { useEffect } from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setIsShrunk } = useSidebar();

  useEffect(() => {
    setIsShrunk(true);

    return () => {
      setIsShrunk(false);
    };
  }, [setIsShrunk]);

  return (
    <div className="flex flex-1 h-full">
      <SettingsSidebar />
      <div className="flex-1 p-6 overflow-y-auto">{children}</div>
    </div>
  );
}
