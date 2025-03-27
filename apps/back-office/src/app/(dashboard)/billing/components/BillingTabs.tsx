"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BillingTabs() {
  const pathname = usePathname();
  const activeClassNames =
    "px-4 py-2 text-[#2d8467] font-medium border-b-2 border-[#2d8467]";
  const inActiveClassNames = "px-4 py-2 text-[#6b7280]";

  return (
    <div className="border-b border-[#e5e7eb] mb-6">
      <div className="flex">
        <Link
          className={
            pathname === "/billing" ? activeClassNames : inActiveClassNames
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
  );
}
