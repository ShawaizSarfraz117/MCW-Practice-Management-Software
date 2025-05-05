"use client";

import type React from "react";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  CreditCard,
  Heart,
  BarChart2,
  Clock,
  Eye,
  Settings,
  Bell,
  Send,
  Megaphone,
  ChevronsRightIcon,
  ChevronsLeftIcon,
} from "lucide-react";
import { cn } from "@mcw/utils";
import { useSidebar } from "../../contexts/SidebarContext";
import { Button } from "@mcw/ui";

// Update the Sidebar component to accept a 'mobile' prop
interface SidebarProps {
  mobile?: boolean;
}

export default function Sidebar({ mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { isShrunk, toggleShrink } = useSidebar();

  return (
    <div
      className={cn(
        "bg-white flex-col  transition-all duration-300 ease-in-out",

        mobile
          ? "flex"
          : `hidden md:flex border-r ${isShrunk ? "w-[70px]" : "w-[230px] min-w-[230px]"} border-[#e5e7eb]`, // Use flex instead of block
      )}
    >
      <div
        className={cn(
          "py-4 border-b h-20 border-[#e5e7eb] flex items-center justify-between",
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
        {!mobile && (
          <Button size="icon" variant="ghost" onClick={toggleShrink}>
            {isShrunk ? (
              <ChevronsRightIcon className="w-5 h-5" />
            ) : (
              <ChevronsLeftIcon className="w-5 h-5" />
            )}
          </Button>
        )}
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
          active={pathname === "/insurance"}
          href="/insurance"
          icon={<Heart className="w-5 h-5" />}
          label="Insurance"
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
          active={pathname === "/supervision"}
          href="/supervision"
          icon={<Eye className="w-5 h-5" />}
          label="Supervision"
        />
        <SidebarItem
          active={pathname === "/settings"}
          href="/settings"
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
        />
        <SidebarItem
          active={pathname === "/reminders"}
          badge={
            <span className="flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-[#e5e7eb]">
              95+
            </span>
          }
          href="/reminders"
          icon={<Bell className="w-5 h-5" />}
          label="Reminders"
        />
        <SidebarItem
          active={pathname === "/requests"}
          href="/requests"
          icon={<Send className="w-5 h-5" />}
          label="Requests"
        />
        <SidebarItem
          active={pathname === "/marketing"}
          href="/marketing"
          icon={<Megaphone className="w-5 h-5" />}
          label="Marketing"
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
