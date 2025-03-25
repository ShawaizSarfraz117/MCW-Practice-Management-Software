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
} from "lucide-react";
import { cn } from "@mcw/utils";

// Update the Sidebar component to accept a 'mobile' prop
interface SidebarProps {
	mobile?: boolean;
}

export default function Sidebar({ mobile = false }: SidebarProps) {
	const pathname = usePathname();

	return (
		<div
			className={cn(
				"w-[230px] min-w-[230px] bg-white border-r border-[#e5e7eb]",
				!mobile && "hidden md:block", // Only hide on small screens if not mobile version
			)}
		>
			<div className="p-6 border-b border-[#e5e7eb]">
				<Link href="/" className="block">
					<h1 className="text-2xl font-bold text-[#2d8467]">MCW</h1>
				</Link>
			</div>

			<nav className="py-2">
				<SidebarItem
					active={pathname === "/calendar"}
					href="/calendar"
					icon={<Calendar className="w-5 h-5" />}
					label="Calendar"
				/>
				<SidebarItem
					icon={<Users className="w-5 h-5" />}
					label="Clients"
					href="/clients"
					active={pathname.includes("/clients")}
				/>
				<SidebarItem
					icon={<CreditCard className="w-5 h-5" />}
					label="Billing"
					href="/billing"
					active={pathname === "/billing"}
				/>
				<SidebarItem
					icon={<Heart className="w-5 h-5" />}
					label="Insurance"
					href="/insurance"
					active={pathname === "/insurance"}
				/>
				<SidebarItem
					icon={<BarChart2 className="w-5 h-5" />}
					label="Analytics"
					href="/analytics"
					active={pathname === "/analytics"}
				/>
				<SidebarItem
					icon={<Clock className="w-5 h-5" />}
					label="Activity"
					href="/activity"
					active={pathname === "/activity"}
				/>
				<SidebarItem
					icon={<Eye className="w-5 h-5" />}
					label="Supervision"
					href="/supervision"
					active={pathname === "/supervision"}
				/>
				<SidebarItem
					icon={<Settings className="w-5 h-5" />}
					label="Settings"
					href="/settings"
					active={pathname === "/settings"}
				/>
				<SidebarItem
					icon={<Bell className="w-5 h-5" />}
					label="Reminders"
					href="/reminders"
					active={pathname === "/reminders"}
					badge={
						<span className="flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-[#e5e7eb]">
							95+
						</span>
					}
				/>
				<SidebarItem
					icon={<Send className="w-5 h-5" />}
					label="Requests"
					href="/requests"
					active={pathname === "/requests"}
				/>
				<SidebarItem
					icon={<Megaphone className="w-5 h-5" />}
					label="Marketing"
					href="/marketing"
					active={pathname === "/marketing"}
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
	return (
		<Link
			href={href}
			className={cn(
				"flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors",
				active
					? "bg-[#d1e4de] text-[#2d8467] border-l-4 border-[#2d8467] pl-[22px]"
					: "text-[#4b5563] hover:bg-gray-50",
			)}
		>
			<div className="flex items-center">
				<div className="mr-3">{icon}</div>
				<span>{label}</span>
			</div>
			{badge && <div>{badge}</div>}
		</Link>
	);
}
