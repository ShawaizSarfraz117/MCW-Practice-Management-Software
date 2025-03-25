"use client";

import TopBar from "@/components/layouts/Topbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeClassNames =
    "px-4 py-2 text-[#2d8467] font-medium border-b-2 border-[#2d8467]";
  const inActiveClassNames = "px-4 py-2 text-[#6b7280]";

  return (
    <div className="flex h-screen bg-[#ffffff]">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TopBar />

        {/* Content */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold text-[#1f2937] mb-6">
            Billing
          </h1>

          {/* Tabs */}
          <div className="border-b border-[#e5e7eb] mb-6">
            <div className="flex">
              <Link
                className={
                  pathname === "/billing"
                    ? activeClassNames
                    : inActiveClassNames
                }
                href="/billing"
              >
                Recent Activity
              </Link>
              <Link
                className={
                  pathname === "/billing/documents"
                    ? activeClassNames
                    : inActiveClassNames
                }
                href="/billing/documents"
              >
                Billing Documents
              </Link>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
