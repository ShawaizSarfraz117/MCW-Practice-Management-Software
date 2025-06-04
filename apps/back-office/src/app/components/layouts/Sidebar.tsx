"use client";

import type React from "react";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  CreditCard,
  BarChart2,
  Clock,
  Settings,
  Send,
  ChevronsRightIcon,
  ChevronsLeftIcon,
} from "lucide-react";
import { cn } from "@mcw/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button, useIsMobile } from "@mcw/ui";

interface SidebarProps {
  isSheet?: boolean;
}

export default function Sidebar({ isSheet = false }: SidebarProps) {
  const pathname = usePathname();
  const { isShrunk, toggleShrink } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "bg-white border-r border-[#e5e7eb] flex flex-col transition-all duration-300 ease-in-out",
        isShrunk ? "w-[70px]" : "w-[230px] min-w-[230px]",
        !isSheet ? (isMobile ? "hidden" : "flex") : "flex", // Use flex instead of block
      )}
    >
      <div
        className={cn(
          "py-4 border-b border-[#e5e7eb] flex items-center justify-between",
          isShrunk ? "justify-center" : "px-7",
        )}
      >
        {!isShrunk && (
          <Link className="block" href="/">
            <h1
              className={cn(
                "text-2xl font-bold text-[#2d8467]",
                isShrunk && "text-center", // Center text when shrunk
              )}
            >
              MCW
            </h1>
          </Link>
        )}
        <Button size="icon" variant="ghost" onClick={toggleShrink}>
          {isShrunk ? (
            <ChevronsRightIcon className="w-5 h-5" />
          ) : (
            <ChevronsLeftIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      <nav className="py-2 flex-grow">
        <SidebarItem
          active={pathname === "/calendar"}
          href="/calendar"
          icon={<Calendar className="w-5 h-5" />}
          label="Calendar"
        />
        <SidebarItem
          active={pathname.includes("/clients")}
          href="/clients"
          icon={<Users className="w-5 h-5" />}
          label="Clients"
        />
        <SidebarItem
          active={pathname.startsWith("/billing")}
          href="/billing"
          icon={<CreditCard className="w-5 h-5" />}
          label="Billing"
        />
        <SidebarItem
          active={pathname === "/analytics"}
          href="/analytics"
          icon={<BarChart2 className="w-5 h-5" />}
          label="Analytics"
        />
        <SidebarItem
          active={pathname === "/activity"}
          href="/activity"
          icon={<Clock className="w-5 h-5" />}
          label="Activity"
        />
        <SidebarItem
          active={pathname === "/settings"}
          href="/settings"
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
        />
        <SidebarItem
          active={pathname === "/requests"}
          href="/requests"
          icon={<Send className="w-5 h-5" />}
          label="Requests"
        />
      </nav>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: React.ReactNode;
}

function SidebarItem({
  icon,
  label,
  href,
  active = false,
  badge,
}: SidebarItemProps) {
  const { isShrunk } = useSidebar();

  return (
    <Link
      className={cn(
        "flex items-center justify-between py-3 text-sm font-medium border-l-4 border-transparent transition-colors",
        active
          ? "bg-[#d1e4de] text-[#2d8467]  border-[#2d8467]"
          : "text-[#4b5563] hover:bg-gray-50 ",
        isShrunk ? "px-0 justify-center" : "px-6",
      )}
      href={href}
      title={isShrunk ? label : undefined}
    >
      <div
        className={cn("flex items-center", isShrunk ? "justify-center" : "")}
      >
        <div className={cn(isShrunk ? "mx-auto" : "mr-3")}>{icon}</div>
        {!isShrunk && <span>{label}</span>}
      </div>
      {!isShrunk && badge && <div>{badge}</div>}
    </Link>
  );
}
