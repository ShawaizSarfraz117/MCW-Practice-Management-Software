"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AnalyticsHeader() {
  const pathname = usePathname();
  const isActiveTab = (tab: string) => pathname.includes(`/analytics/${tab}`);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
      <div>
        <div className="flex">
          <Link
            href="/analytics/dashboard"
            className={`px-4 py-2 font-medium text-sm ${
              isActiveTab("dashboard")
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/analytics/reports"
            className={`px-4 py-2 font-medium text-sm ${
              isActiveTab("reports")
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
