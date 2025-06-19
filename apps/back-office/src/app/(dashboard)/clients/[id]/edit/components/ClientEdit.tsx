/* eslint-disable max-lines-per-function */
"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@mcw/ui";
import { ClientDetailsCard } from "./ClientDetailsCard";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSingleClientGroup,
  createClientContact,
} from "@/(dashboard)/clients/services/client.service";
import Link from "next/link";
import { getClientGroupInfo } from "@/(dashboard)/clients/[id]/components/ClientProfile";
import { GroupInfo } from "./tabs/GroupInfo";
import { useSearchParams, useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { ContactAddDrawer } from "./ContactAddDrawer";
import { ClientFormValues } from "../types";
import { EmptyContactsState } from "./EmptyContactsState";
import { BillingInsuranceTab } from "./tabs/BillingInsuranceTab";
// Matching the structure in ClientDetailsCard
export interface ClientMembership {
  client_id: string;
  client_group_id: string;
  created_at: Date;
  type: string;
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
    preferred_name?: string | null;
    date_of_birth?: Date | null;
    middle_name?: string | null;
    suffix?: string | null;
    ClientContact: Array<{
      id: string;
      value: string;
      contact_type: string;
      type?: string;
      permission?: string;
      is_primary?: boolean;
    }>;
    ClientProfile?: {
      id: string;
      client_id: string;
      middle_name?: string | null;
      gender?: string | null;
      gender_identity?: string | null;
      relationship_status?: string | null;
      employment_status?: string | null;
      race_ethnicity?: string | null;
      race_ethnicity_details?: string | null;
      preferred_language?: string | null;
      notes?: string | null;
    };
    ClientAdress?: Array<{
      id: string;
      client_id: string;
      address_line1: string;
      address_line2: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
      is_primary: boolean;
    }>;
  };
}

// Client Group API response interface
export interface ClientGroupFromAPI {
  id: string;
  name: string;
  type: string;
  clinician_id?: string | null;
  is_active?: boolean;
  available_credit?: number;
  created_at?: Date | string | null;
  auto_monthly_statement_enabled?: boolean | null;
  auto_monthly_superbill_enabled?: boolean | null;
  first_seen_at?: Date | string | null;
  notes?: string | null;
  administrative_notes?: string | null;
  ClientGroupMembership: ClientMembership[];
}

export default function ClientEdit({
  clientGroupId,
}: {
  clientGroupId: string;
}) {
  const [activeTab, setActiveTab] = useState("group-info");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [clientContact, setClientContact] = useState<ClientGroupFromAPI | null>(
    null,
  );
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);

  // Set the active tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["group-info", "clients", "billing", "contacts"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchClientContactsData = async () => {
    const res = (await fetchSingleClientGroup({
      id: clientGroupId,
      searchParams: {
        isContactOnly: "true",
        includeProfile: "true",
        includeAdress: "true",
      },
    })) as { data: ClientGroupFromAPI } | null;
    if (res?.data) {
      setClientContact(res.data);
    }
  };

  useEffect(() => {
    if (activeTab === "contacts") {
      fetchClientContactsData();
    }
  }, [activeTab]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);

    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const {
    data: clientGroupData = {},
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["clientGroup", clientGroupId],
    queryFn: async () => {
      const data = (await fetchSingleClientGroup({
        id: clientGroupId,
        searchParams: {
          includeProfile: "true",
          includeAdress: "true",
        },
      })) as { data: ClientGroupFromAPI } | null;
      return data?.data;
    },
  });

  const isClientGroup =
    clientGroupData &&
    typeof clientGroupData === "object" &&
    "ClientGroupMembership" in clientGroupData;

  // Extract client group data safely
  const clientData = isClientGroup
    ? (clientGroupData as unknown as ClientGroupFromAPI)
    : null;

  const clientType = {
    adult: "Client",
    minor: "Minor",
    couple: "Couple",
    family: "Family",
  };

  const handleAddContact = () => {
    setIsContactDrawerOpen(true);
  };

  const handleSaveContact = async (contactData: ClientFormValues) => {
    const [_, err] = await createClientContact({
      body: { ...contactData, clientGroupId },
    });
    if (err) {
      toast({
        title: "Failed to create contact",
        variant: "destructive",
      });
      return;
    }
    setIsContactDrawerOpen(false);
    fetchClientContactsData();
    toast({
      title: "Contact created successfully",
      variant: "success",
    });
  };

  if (isLoading) {
    return <Loading className="items-center" />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold mb-4">
            Edit client{" "}
            <span className="text-[#2D8467]">
              {clientData ? (
                <Link href={`/clients/${clientData.id}`}>
                  {getClientGroupInfo(clientData)}
                </Link>
              ) : (
                ""
              )}
            </span>
          </h1>
          {activeTab === "contacts" && (
            <Button onClick={handleAddContact}>Add Contact</Button>
          )}
        </div>
      </div>

      <Tabs
        className="w-full"
        defaultValue="clients"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="border-b border-[#e5e7eb] overflow-x-auto">
          <TabsList className="h-[40px] bg-transparent p-0 w-auto">
            <TabsTrigger
              className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "group-info" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
              value="group-info"
            >
              {clientType[clientData?.type as keyof typeof clientType]} Info
            </TabsTrigger>

            <TabsTrigger
              className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "clients" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
              value="clients"
            >
              Clients
            </TabsTrigger>
            {clientData?.type === "adult" && (
              <TabsTrigger
                className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "contacts" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                value="contacts"
              >
                Contacts
              </TabsTrigger>
            )}
            <TabsTrigger
              className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "billing" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
              value="billing"
            >
              Billing Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="group-info">
          <div className="mt-6">
            {clientData && <GroupInfo clientGroup={clientData} />}
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <div className="mt-6">
            {clientData?.ClientGroupMembership.map((membership) => (
              <ClientDetailsCard
                key={membership.client_id}
                client={membership}
                type="client"
                onRefresh={refetch}
              />
            ))}
          </div>
        </TabsContent>
        {activeTab === "contacts" && (
          <TabsContent value="contacts">
            <div className="mt-6">
              {clientContact?.ClientGroupMembership &&
              clientContact.ClientGroupMembership.length > 0 ? (
                clientContact.ClientGroupMembership.map((membership) => (
                  <ClientDetailsCard
                    key={membership.client_id}
                    client={membership}
                    type="contact"
                    onRefresh={fetchClientContactsData}
                  />
                ))
              ) : (
                <EmptyContactsState
                  clientName={clientData?.name}
                  onAddContact={handleAddContact}
                />
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="billing">
          <div className="mt-6">
            {clientData && (
              <BillingInsuranceTab
                clientGroupId={clientGroupId}
                responsibleClientName={(() => {
                  const responsibleClient =
                    clientData.ClientGroupMembership.find(
                      (m) => m.is_responsible_for_billing,
                    )?.Client;
                  return responsibleClient
                    ? `${responsibleClient.legal_first_name || ""} ${responsibleClient.legal_last_name || ""}`.trim()
                    : clientData.name;
                })()}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ContactAddDrawer
        isOpen={isContactDrawerOpen}
        onClose={() => setIsContactDrawerOpen(false)}
        onSaveContact={handleSaveContact}
      />
    </div>
  );
}
