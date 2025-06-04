"use client";

import React, { createContext, useState, useContext, useMemo } from "react";

interface SidebarContextType {
  isShrunk: boolean;
  toggleShrink: () => void;
  setIsShrunk: (isShrunk: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isShrunk, setIsShrunk] = useState(false);

  const toggleShrink = () => {
    setIsShrunk((prev) => !prev);
  };

  const value = useMemo(
    () => ({ isShrunk, toggleShrink, setIsShrunk }),
    [isShrunk],
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
