"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@mcw/utils";

interface BreadcrumbNavProps {
  items: Array<{
    label: string;
    href: string;
  }>;
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-2 text-sm text-[#4B5563]",
        className,
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {index === items.length - 1 ? (
            <span>{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-[#2D8467]">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
