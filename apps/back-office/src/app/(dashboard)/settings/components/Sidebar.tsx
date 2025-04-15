"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@mcw/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";

interface SidebarProps {
  mobile?: boolean;
}

interface NavigationItem {
  label: string;
  href: string;
  description: string;
  children?: NavigationItem[];
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const OPERATIONS_ITEMS: NavigationSection = {
  title: "OPERATIONS",
  items: [
    {
      label: "Profile",
      href: "/settings/profile",
      description: "Manage your profile settings",
    },
    {
      label: "Practice",
      href: "/settings/practice",
      description: "Practice management settings",
    },
    {
      label: "Team",
      href: "/settings/team",
      description: "Team management settings",
    },
  ],
};

const BILLING_ITEMS: NavigationSection = {
  title: "BILLING",
  items: [
    {
      label: "Client billing and insurance",
      href: "/billing/client",
      description: "Manage client billing",
    },
    {
      label: "Payment processing",
      href: "/billing/payment",
      description: "Payment settings",
    },
    {
      label: "Services and products",
      href: "/settings/services-products",
      description: "Manage services and products",
      children: [
        {
          label: "Services",
          href: "/settings/services",
          description: "Manage services and set rates",
        },
        {
          label: "Products",
          href: "/settings/products",
          description: "Manage products and inventory",
        },
      ],
    },
  ],
};

const CLIENT_CARE_ITEMS: NavigationSection = {
  title: "CLIENT CARE",
  items: [
    {
      label: "Scheduling and inquiries",
      href: "/settings/scheduling",
      description: "Manage scheduling",
    },
    {
      label: "Documentation",
      href: "/settings/documentation",
      description: "Documentation settings",
    },
    {
      label: "Client notifications",
      href: "/settings/notifications",
      description: "Notification settings",
    },
    {
      label: "Messaging",
      href: "/settings/messaging",
      description: "Messaging settings",
    },
  ],
};

function NavigationSection({
  title,
  items,
  currentPath,
  onNavigate,
}: {
  title: string;
  items: NavigationItem[];
  currentPath: string;
  onNavigate: (href: string) => void;
}) {
  return (
    <div>
      <div>
        <p className="text-sm font-bold text-[#2D8467] text-14px leading-[14px]">
          {title}
        </p>
      </div>
      <Accordion
        type="single"
        collapsible
        className="w-full flex flex-col gap-3 mt-3"
      >
        {items.map((item, index) => (
          <AccordionItem key={item.href} value={`item-${index + 1}`}>
            <AccordionTrigger
              className="text-[16px] font-medium leading-[16px] text-[#374151] w-full text-left flex items-center justify-between"
              aria-label={`Toggle ${item.label} section`}
            >
              {item.label}
              <ChevronDown className="transition-transform duration-200 data-[state=open]:rotate-180" />
            </AccordionTrigger>
            <AccordionContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div className="mt-3">
                {item.children ? (
                  <div className="space-y-2">
                    {item.children.map((child) => (
                      <div
                        key={child.href}
                        className={cn(
                          "group rounded-lg h-[72px] flex flex-col item justify-center p-4 gap-1",
                          currentPath === child.href
                            ? "bg-[#DEECE7]"
                            : "hover:bg-[#DEECE7] cursor-pointer",
                        )}
                        onClick={() => onNavigate(child.href)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onNavigate(child.href);
                          }
                        }}
                        aria-current={
                          currentPath === child.href ? "page" : undefined
                        }
                      >
                        <h4
                          className={cn(
                            "text-[16px] font-bold leading-[16px]",
                            currentPath === child.href
                              ? "text-[#2D8467]"
                              : "text-[#1A202C] group-hover:text-[#2D8467]",
                          )}
                        >
                          {child.label}
                        </h4>
                        <p className="text-[12px] font-normal text-[#4B5563] leading-[16px]">
                          {child.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "group rounded-lg h-[72px] flex flex-col item justify-center p-4 gap-1",
                      currentPath === item.href
                        ? "bg-[#DEECE7]"
                        : "hover:bg-[#DEECE7] cursor-pointer",
                    )}
                    onClick={() => onNavigate(item.href)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onNavigate(item.href);
                      }
                    }}
                    aria-current={
                      currentPath === item.href ? "page" : undefined
                    }
                  >
                    <h4
                      className={cn(
                        "text-[16px] font-bold leading-[16px]",
                        currentPath === item.href
                          ? "text-[#2D8467]"
                          : "text-[#1A202C] group-hover:text-[#2D8467]",
                      )}
                    >
                      {item.label}
                    </h4>
                    <p className="text-[12px] font-normal text-[#4B5563] leading-[16px]">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default function Sidebar({ mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <div
      className={cn(
        "w-[230px] min-w-[320px] bg-white border-r border-[#e5e7eb] p-3",
        !mobile && "hidden md:block",
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <nav className="py-2 flex flex-col gap-5">
        <NavigationSection
          title={OPERATIONS_ITEMS.title}
          items={OPERATIONS_ITEMS.items}
          currentPath={pathname}
          onNavigate={handleNavigate}
        />
        <NavigationSection
          title={BILLING_ITEMS.title}
          items={BILLING_ITEMS.items}
          currentPath={pathname}
          onNavigate={handleNavigate}
        />
        <NavigationSection
          title={CLIENT_CARE_ITEMS.title}
          items={CLIENT_CARE_ITEMS.items}
          currentPath={pathname}
          onNavigate={handleNavigate}
        />
      </nav>
    </div>
  );
}
