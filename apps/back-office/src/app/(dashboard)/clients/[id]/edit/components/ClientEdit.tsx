"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";
import { ClientDetailsCard } from "./ClientDetailsCard";
import { useQuery } from "@tanstack/react-query";
import { fetchClientGroups } from "../../../services/client.service";
import Link from "next/link";

// Matching the structure in ClientDetailsCard
interface ClientMembership {
  client_id: string;
  client_group_id: string;
  created_at: Date;
  role: string | null;
  is_contact_only: boolean;
  is_responsible_for_billing: boolean | null;
  Client: {
    id: string;
    legal_first_name: string;
    legal_last_name: string;
    is_active: boolean;
    address?: string | null;
    receive_reminders?: boolean;
    has_portal_access?: boolean;
    last_login_at?: Date | null;
    is_responsible_for_billing?: boolean;
    ClientContact: Array<{
      id: string;
      value: string;
      contact_type: string;
      is_primary?: boolean;
    }>;
  };
}

// The structure returned from the API - may differ slightly from our ideal types
interface ClientGroupFromAPI {
  id: string;
  name: string;
  ClientGroupMembership: ClientMembership[];
}

export default function ClientEdit({
  clientGroupId,
}: {
  clientGroupId: string;
}) {
  const [activeTab, setActiveTab] = useState("clients");

  // Fetch client group data
  const { data: clientGroupData, isLoading } = useQuery({
    queryKey: ["clientGroup", clientGroupId],
    queryFn: async () => {
      const [data, error] = await fetchClientGroups({
        searchParams: { id: clientGroupId },
      });

      if (error) {
        throw error;
      }

      return data;
    },
  });

  // Check if clientGroupData is of type ClientGroupWithMembership
  const isClientGroup =
    clientGroupData && "ClientGroupMembership" in clientGroupData;

  // Extract client group data safely
  const clientData = isClientGroup
    ? (clientGroupData as unknown as ClientGroupFromAPI)
    : null;

  if (isLoading) {
    return <div className="p-6">Loading client information...</div>;
  }

  if (!clientData) {
    return <div className="p-6">Client group not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <nav className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/clients">Clients and contacts</Link>
          <span className="mx-2">/</span>
          <Link href={`/clients/${clientGroupId}`}>{clientData.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Edit client</span>
        </nav>
        <h1 className="text-2xl font-semibold mb-4">
          Edit client {clientData.name}
        </h1>
      </div>

      <Tabs
        defaultValue="clients"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b border-[#e5e7eb] overflow-x-auto">
          <TabsList className="h-[40px] bg-transparent p-0 w-auto">
            <TabsTrigger
              className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "couple-info" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
              value="couple-info"
            >
              Couple Info
            </TabsTrigger>
            <TabsTrigger
              className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "clients" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
              value="clients"
            >
              Clients
            </TabsTrigger>
            <TabsTrigger
              className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "billing" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
              value="billing"
            >
              Billing and Insurance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="couple-info">
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Couple Information</h2>
            {/* Clients tab content would go here */}
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">
              Manage this Couple's individual details and access
            </h2>
            <p className="text-gray-600 mb-6">
              Edit the individual details for each Client, and manage what
              features they have access to.
              <a className="ml-1 text-blue-600 hover:underline" href="#">
                Learn more
              </a>
            </p>

            {clientData.ClientGroupMembership.map((membership) => (
              <ClientDetailsCard
                key={membership.client_id}
                client={membership}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Billing and Insurance</h2>
            {/* Billing tab content would go here */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
