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

  // Determine the final breadcrumb item based on route
  let finalBreadcrumb = "";
  if (isEditPage) {
    finalBreadcrumb = "Edit client";
  } else if (isCreatePage) {
    finalBreadcrumb = "Create";
  } else if (!isMainClientPage) {
    // For other sub-routes, try to extract the page name from pathname
    const pathParts = pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    finalBreadcrumb = lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }

  return (
    <div className="text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
      <Link className="hover:text-gray-700" href="/clients">
        Clients and contacts
      </Link>
      <span className="mx-1">/</span>

      {/* Client name - clickable if we're on a sub-route, otherwise just text */}
      {!isMainClientPage ? (
        <>
          <Link className="hover:text-gray-700" href={`/clients/${clientId}`}>
            {clientName}&apos;s profile
          </Link>
          <span className="mx-1">/</span>
          <span>{finalBreadcrumb}</span>
        </>
      ) : (
        <span>{clientName}&apos;s profile</span>
      )}
    </div>
  );
};

export default ClientBreadcrumb;
