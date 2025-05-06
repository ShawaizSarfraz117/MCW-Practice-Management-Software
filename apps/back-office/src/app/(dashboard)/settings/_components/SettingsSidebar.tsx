"use client";

import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  id?: string;
  href?: string;
  description?: string;
  children?: MenuItem[];
}

const menuItems = {
  operations: [
    {
      label: "Profile",
      children: [
        {
          label: "Profile and security",
          id: "profile-security",
          href: "/settings/profile-security",
          description: "Personal info and security preferences",
        },
        {
          label: "Clinical info",
          id: "clinical-info",
          href: "/settings/clinical-info",
          description: "NPI number and licenses",
        },
      ],
    },
    {
      label: "Practice",
      children: [
        {
          label: "Practice Info",
          id: "practice-info",
          href: "/settings/practice-info",
        },
        {
          label: "Locations",
          id: "locations",
          href: "/settings/locations",
        },
      ],
    },
    {
      label: "Team",
      children: [
        {
          label: "Team Members",
          id: "team-members",
          href: "/settings/team-members",
        },
        {
          label: "Roles & Permissions",
          id: "roles",
          href: "/settings/roles",
        },
      ],
    },
  ],
  billing: [
    {
      label: "Client billing and insurance",
      id: "billing",
      href: "/settings/billing",
    },
    {
      label: "Payment processing",
      id: "payment",
      href: "/settings/payment",
    },
    {
      label: "Services and products",
      children: [
        {
          label: "Services",
          id: "service",
          href: "/settings/service",
          description: "Manage services and set rates.",
        },
        {
          label: "Products",
          id: "product",
          href: "/settings/product",
          description: "Manage products and set rates",
        },
      ],
    },
  ],
  clientCare: [
    {
      label: "Scheduling and inquiries",
      id: "scheduling",
      href: "/settings/scheduling",
    },
    {
      label: "Documentation",
      id: "documentation",
      href: "/settings/documentation",
    },
    {
      label: "Client notifications",
      id: "notifications",
      href: "/settings/notifications",
    },
    {
      label: "Messaging",
      id: "messaging",
      href: "/settings/messaging",
    },
  ],
};

export default function SettingsSidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  useEffect(() => {
    let foundParentLabel: string | null = null;
    Object.values(menuItems).forEach((section) => {
      section.forEach((item: MenuItem) => {
        if (
          item.children &&
          item.children.some((child: MenuItem) => child.href === pathname)
        ) {
          foundParentLabel = item.label;
        }
      });
    });

    if (foundParentLabel) {
      setExpandedMenus([foundParentLabel]);
    }
  }, [pathname]);

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuLabel)
        ? prev.filter((item) => item !== menuLabel)
        : [...prev, menuLabel],
    );
  };

  const renderMenuItem = (item: MenuItem): JSX.Element => {
    const isExpanded = expandedMenus.includes(item.label);
    const isActive = item.href === pathname;

    return (
      <div key={item.label}>
        {item.children ? (
          <div>
            <div
              className="flex cursor-pointer items-center justify-between py-2 text-sm"
              onClick={() => toggleMenu(item.label)}
            >
              <span>{item.label}</span>
              <ChevronDown
                className={`h-4 w-4 transform transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
            {isExpanded && (
              <div className="ml-2">
                {item.children.map((child: MenuItem) => renderMenuItem(child))}
              </div>
            )}
          </div>
        ) : item.href ? (
          <Link href={item.href} legacyBehavior={false}>
            <div
              className={`cursor-pointer ${
                isActive
                  ? "bg-green-50 border-l-4 border-primary rounded-sm p-3 my-1"
                  : "py-2 text-sm"
              }`}
            >
              <div
                className={`${
                  isActive ? "text-green-700 font-medium" : ""
                } text-sm`}
              >
                {item.label}
              </div>
              {item.description && (
                <div
                  className={`mt-1 text-xs ${
                    isActive ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {item.description}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="py-2 text-sm text-gray-400">{item.label}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 top-1 flex-shrink-0 border-r border-gray-200 h-full overflow-y-auto bg-white">
      <div className="p-4">
        <div className="py-2">
          <div className="text-xs font-semibold uppercase text-primary tracking-wider">
            Operations
          </div>
          <div className="mt-2 ml-2 space-y-1">
            {menuItems.operations.map((item) => renderMenuItem(item))}
          </div>
        </div>

        <div className="mt-4 py-2">
          <div className="text-xs font-semibold uppercase text-primary tracking-wider">
            Billing
          </div>
          <div className="mt-2 ml-2 space-y-1">
            {menuItems.billing.map((item) => renderMenuItem(item))}
          </div>
        </div>

        <div className="mt-4 py-2">
          <div className="text-xs font-semibold uppercase text-primary tracking-wider">
            Client Care
          </div>
          <div className="mt-2 ml-2 space-y-1">
            {menuItems.clientCare.map((item) => renderMenuItem(item))}
          </div>
        </div>
      </div>
    </div>
  );
}
