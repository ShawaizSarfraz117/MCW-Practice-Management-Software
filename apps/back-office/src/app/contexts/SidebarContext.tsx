"use client";

import { useIsMobile } from "@mcw/ui";
import React, { createContext, useState, useContext, useMemo } from "react";

interface SidebarContextType {
  isShrunk: boolean;
  toggleShrink: () => void;
  setIsShrunk: (isShrunk: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isShrunk, setIsShrunk] = useState(false);
  const isMobile = useIsMobile();

  const toggleShrink = () => {
    setIsShrunk((prev) => !prev);
  };

  const value = useMemo(
    () => ({
      isShrunk: isMobile ? false : isShrunk,
      toggleShrink,
      setIsShrunk,
    }),
    [isMobile, isShrunk],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
