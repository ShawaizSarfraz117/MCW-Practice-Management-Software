"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ClientBreadcrumbProps {
  clientId: string;
  clientName: string;
}

const ClientBreadcrumb = ({ clientId, clientName }: ClientBreadcrumbProps) => {
  const pathname = usePathname();

  // Determine the current route and breadcrumb structure
  const isMainClientPage = pathname === `/clients/${clientId}`;
  const isEditPage = pathname.includes(`/clients/${clientId}/edit`);
  const isCreatePage = pathname.includes(`/clients/${clientId}/create`);

  // Helper function to check if a string looks like a UUID or ID
  const isUuidOrId = (str: string) => {
    // Check for UUID pattern or other ID patterns
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const numericId = /^\d+$/;
    return uuidPattern.test(str) || numericId.test(str);
  };

  // Determine the final breadcrumb item based on route
  let finalBreadcrumb = "";
  if (isEditPage) {
    finalBreadcrumb = "Edit client";
  } else if (isCreatePage) {
    finalBreadcrumb = "Create";
  } else if (!isMainClientPage) {
    // For other sub-routes, find the last meaningful pathname segment
    const pathParts = pathname.split("/").filter((part) => part !== "");

    // Work backwards to find the last non-UUID/ID segment
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (!isUuidOrId(part) && part !== "clients") {
        // Handle special cases for better display names
        if (part === "goodFaithEstimate") {
          finalBreadcrumb = "Good Faith Estimate";
        } else if (part === "edit") {
          finalBreadcrumb = "Edit";
        } else {
          // Capitalize first letter and convert camelCase to spaced words
          finalBreadcrumb = part
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
        }
        break;
      }
    }

    // Fallback if no meaningful segment found
    if (!finalBreadcrumb) {
      finalBreadcrumb = "Details";
    }
  }

  return (
    <div className="text-sm text-gray-500 overflow-x-auto whitespace-nowrap mb-4">
      <Link className="hover:text-gray-700 hover:underline" href="/clients">
        Clients and contacts
      </Link>
      <span className="mx-2">/</span>

      {/* Client name - clickable if we're on a sub-route, otherwise just text */}
      {!isMainClientPage ? (
        <>
          <Link
            className="hover:text-gray-700 hover:underline"
            href={`/clients/${clientId}`}
          >
            {clientName}&apos;s profile
          </Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700 font-medium">{finalBreadcrumb}</span>
        </>
      ) : (
        <span className="text-gray-700 font-medium">
          {clientName}&apos;s profile
        </span>
      )}
    </div>
  );
};

export default ClientBreadcrumb;
