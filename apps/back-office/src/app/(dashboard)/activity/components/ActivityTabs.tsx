"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ActivityTabs() {
  const pathname = usePathname();
  const activeClassNames =
    "px-4 py-2 text-[#2d8467] font-medium border-b-2 border-[#2d8467]";
  const inActiveClassNames = "px-4 py-2 text-[#6b7280]";

  return (
    <div className="border-b border-[#e5e7eb] mb-6">
      <div className="flex">
        <Link
          className={
            pathname === "/activity" ? activeClassNames : inActiveClassNames
          }
          href="/activity"
        >
          History
        </Link>
        <Link
          className={
            pathname === "/activity/sign-in-events"
              ? activeClassNames
              : inActiveClassNames
          }
          href="/activity/sign-in-events"
        >
          Sign In Events
        </Link>
        <Link
          className={
            pathname === "/activity/hipaa-audit-log"
              ? activeClassNames
              : inActiveClassNames
          }
          href="/activity/hipaa-audit-log"
        >
          HIPAA Audit Log
        </Link>
      </div>
    </div>
  );
}
