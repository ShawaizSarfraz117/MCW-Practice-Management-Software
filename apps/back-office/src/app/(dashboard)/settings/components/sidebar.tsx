"use client";

import { MenuItem, ProfileSidebarProps } from "@/types/profile";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const menuItems = {
  operations: [
    {
      label: "Profile",
      children: [
        {
          label: "Profile and security",
          id: "profile-security",
          description: "Personal info and security preferences",
        },
        {
          label: "Clinical info",
          id: "clinical-info",
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
        },
        {
          label: "Locations",
          id: "locations",
        },
      ],
    },
    {
      label: "Team",
      children: [
        {
          label: "Team Members",
          id: "team-members",
        },
        {
          label: "Roles & Permissions",
          id: "roles",
        },
      ],
    },
  ],
  billing: [
    {
      label: "Client billing and insurance",
      id: "billing",
    },
    {
      label: "Payment processing",
      id: "payment",
    },
    {
      label: "Services and products",
      id: "services",
    },
  ],
  clientCare: [
    {
      label: "Scheduling and inquiries",
      id: "scheduling",
    },
    {
      label: "Documentation",
      id: "documentation",
    },
    {
      label: "Client notifications",
      id: "notifications",
    },
    {
      label: "Messaging",
      id: "messaging",
    },
  ],
};

export default function ProfileSidebar({
  activeSection,
  onSectionChange,
}: ProfileSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuLabel)
        ? prev.filter((item) => item !== menuLabel)
        : [...prev, menuLabel],
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const isExpanded = expandedMenus.includes(item.label);
    const isActive = item.id === activeSection;

    return (
      <div key={item.label}>
        {item.children ? (
          // Parent menu item with children
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
                {item.children.map((child) => renderMenuItem(child))}
              </div>
            )}
          </div>
        ) : (
          // Leaf menu item
          <div
            className={`cursor-pointer ${
              isActive ? "bg-green-50 rounded-md p-3 my-1" : "py-2 text-sm"
            }`}
            onClick={() => item.id && onSectionChange(item.id)}
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
        )}
      </div>
    );
  };

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <input
            className="w-full rounded-md border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm"
            placeholder="Search"
            type="text"
          />
        </div>
      </div>

      {/* Operations Section */}
      <div className="px-4 py-2">
        <div className="text-xs font-semibold text-green-600">OPERATIONS</div>
        <div className="mt-2">
          {menuItems.operations.map((item) => renderMenuItem(item))}
        </div>
      </div>

      {/* Billing Section */}
      <div className="mt-4 px-4 py-2">
        <div className="text-xs font-semibold text-green-600">BILLING</div>
        <div className="mt-2">
          {menuItems.billing.map((item) => renderMenuItem(item))}
        </div>
      </div>

      {/* Client Care Section */}
      <div className="mt-4 px-4 py-2">
        <div className="text-xs font-semibold text-green-600">CLIENT CARE</div>
        <div className="mt-2">
          {menuItems.clientCare.map((item) => renderMenuItem(item))}
        </div>
      </div>
    </div>
  );
}
