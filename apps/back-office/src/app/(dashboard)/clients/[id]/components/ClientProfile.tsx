/* eslint-disable max-lines-per-function */
"use client";
import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import AdministrativeNoteDrawer from "./AdministrativeNoteDrawer";
import ShareModal from "./ShareModal";
import { StatementModal } from "./StatementModal";

import { Button } from "@mcw/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";
import { format } from "date-fns";

import OverviewTab from "./tabs/OverviewTab";
import BillingTab from "./tabs/BillingTab";
import MeasuresTab from "./tabs/MeasuresTab";
import FilesTab, { FilesTabRef } from "./tabs/FilesTab";
import { AddPaymentModal } from "./AddPaymentModal";
import {
  fetchInvoices,
  fetchSingleClientGroup,
  ClientGroupWithMembership,
} from "@/(dashboard)/clients/services/client.service";
import { Invoice, Payment } from "@prisma/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ClientBillingCard } from "./ClientBillingCard";
import { InvoicesDocumentsCard } from "./InvoicesDocumentsCard";
import { useQuery } from "@tanstack/react-query";
import { ClientInfoCard } from "./ClientInfoCard";
import Link from "next/link";
export function getClientGroupInfo(client: unknown) {
  if (!client) return "";
  const name = (
    client as {
      ClientGroupMembership: {
        Client: { legal_first_name: string; legal_last_name: string };
      }[];
    }
  ).ClientGroupMembership.map((m) =>
    `${m.Client?.legal_first_name ?? ""} ${m.Client?.legal_last_name ?? ""}`.trim(),
  )
    .filter(Boolean)
    .join(" & ");

  return name;
}

interface ClientProfileProps {
  clientId: string;
}

export interface InvoiceWithPayments extends Invoice {
  Payment: Payment[];
  ClientGroup: {
    name?: string;
    type?: string;
    available_credit?: number;
    ClientGroupMembership?: Array<{
      id: string;
      Client?: {
        id: string;
        legal_first_name?: string;
        legal_last_name?: string;
      };
    }>;
  };
  Appointment?: {
    start_date: Date;
    adjustable_amount: string;
  };
}

type Tabs = "overview" | "billing" | "measures" | "files";

export default function ClientProfile({
  clientId: _clientId,
}: ClientProfileProps) {
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceWithPayments[]>([]);
  const [creditAmount, setCredit] = useState<number>(0);
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [superbillDialogOpen, setSuperbillDialogOpen] = useState(false);
  const { id } = useParams();
  const searchParams = useSearchParams();

  const currentTab = (searchParams.get("tab") as Tabs) || "overview";
  const [activeTab, setActiveTab] = useState(currentTab);
  const router = useRouter();
  const filesTabRef = useRef<FilesTabRef>(null);

  // Helper function to get the next appointment date
  const getNextAppointmentDate = (): string | null => {
    if (!invoices.length) return null;

    const nextAppointment = invoices.find(
      (inv) => inv.Appointment && inv.Appointment.start_date > new Date(),
    );

    if (nextAppointment?.Appointment?.start_date) {
      return format(nextAppointment.Appointment.start_date, "MM/dd/yyyy");
    }

    return null;
  };

  const { data: clientGroup } = useQuery({
    queryKey: ["clientGroup", id],
    queryFn: async () => {
      const response = (await fetchSingleClientGroup({
        id: id as string,
        searchParams: {},
      })) as { data: ClientGroupWithMembership } | null;

      if (response?.data) {
        const clientGroupData = response.data;
        setCredit(Number(clientGroupData.available_credit) || 0);

        if (clientGroupData.ClientGroupMembership?.length) {
          const name = getClientGroupInfo(clientGroupData);
          setClientName(name || "");
        }
        return clientGroupData;
      }
      return null;
    },
    enabled: !!id, // Only run when id exists
  });

  const fetchInvoicesData = async () => {
    const [response, error] = await fetchInvoices({
      searchParams: { clientGroupId: id },
    });
    if (!error && response) {
      const invoiceResponse = response as InvoiceWithPayments[];

      if (invoiceResponse?.length) {
        setInvoices(invoiceResponse);
      }
    }
  };

  useEffect(() => {
    fetchInvoicesData();
  }, [id]);

  useEffect(() => {
    // Handle invoice related URL parameters
    const invoiceId = searchParams.get("invoiceId");
    const superbillId = searchParams.get("superbillId");
    const type = searchParams.get("type");
    const appointmentId = searchParams.get("appointmentId");

    if ((invoiceId || appointmentId) && type === "payment") {
      setAddPaymentModalOpen(true);
    }
    if (invoiceId && type === "invoice") {
      setInvoiceDialogOpen(true);
    }
    if (superbillId && type === "superbill") {
      setSuperbillDialogOpen(true);
    }

    // Handle tab URL parameter
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["overview", "billing", "measures", "files"].includes(tabParam)
    ) {
      setActiveTab(tabParam as Tabs);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as Tabs);

    const params = new URLSearchParams(searchParams.toString());
    // Set or update the tab parameter
    params.set("tab", value);

    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleShare = (
    selectedUsers: { id: string; name: string; initials: string }[],
  ) => {
    console.log("Sharing with users:", selectedUsers);
  };

  const handleUpload = () => {
    setActiveTab("files");
    // Small delay to ensure tab is switched before triggering upload
    setTimeout(() => {
      filesTabRef.current?.triggerFileUpload();
    }, 100);
  };

  return (
    <div className="flex flex-col h-full mt-2">
      {/* Breadcrumb */}
      <AdministrativeNoteDrawer
        open={adminNoteModalOpen}
        onOpenChange={setAdminNoteModalOpen}
      />
      {addPaymentModalOpen && (
        <AddPaymentModal
          clientName={clientName}
          fetchInvoicesData={fetchInvoicesData}
          open={addPaymentModalOpen}
          onOpenChange={setAddPaymentModalOpen}
        />
      )}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
      />
      <StatementModal clientName={clientName} />
      {/* Client Header */}
      <div className="px-4 sm:px-6 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{clientName}</h1>
          <div className="text-sm text-gray-500 mb-2 flex flex-wrap gap-2 items-center">
            {clientGroup && "type" in clientGroup ? clientGroup.type : ""}
            {getNextAppointmentDate() && (
              <>
                <span className="text-gray-300">|</span>
                <span>Next Appt: {getNextAppointmentDate()}</span>
                <span className="text-gray-300">|</span>
              </>
            )}
            <Link href="/calendar" className="text-[#2d8467] hover:underline">
              Schedule appointment
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href={`/clients/${id}/edit`}
              className="text-[#2d8467] hover:underline"
            >
              Edit
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-white text-xs sm:text-sm"
            variant="outline"
            onClick={() => setShareModalOpen(true)}
          >
            Share
          </Button>
          <Button
            className="bg-white text-xs sm:text-sm"
            variant="outline"
            onClick={handleUpload}
          >
            Upload
          </Button>
          <Button className="bg-[#2d8467] hover:bg-[#236c53] text-xs sm:text-sm">
            Message
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-12 flex-1">
        {/* Left Side - Tabs */}
        <div className="col-span-12 lg:col-span-8 border-t lg:border-r border-[#e5e7eb]">
          {/* Add Administrative Note Button - Fixed at the top */}
          <div className="hidden lg:block sticky top-0 z-10">
            <div className="absolute right-4 top-1">
              <Button
                className="text-blue-500 hover:bg-blue-50"
                variant="ghost"
                onClick={() => setAdminNoteModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Administrative Note
              </Button>
            </div>
          </div>
          <Tabs
            className="w-full"
            defaultValue="measures"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <div className="border-b border-[#e5e7eb] overflow-x-auto">
              <div className="px-4 sm:px-6">
                <TabsList className="h-[40px] bg-transparent p-0 w-auto">
                  <TabsTrigger
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "overview" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                    value="overview"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "billing" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                    value="billing"
                  >
                    Billing
                  </TabsTrigger>
                  <TabsTrigger
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "measures" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                    value="measures"
                  >
                    Measures
                  </TabsTrigger>
                  <TabsTrigger
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "files" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                    value="files"
                  >
                    Files
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>

            <TabsContent value="billing">
              <BillingTab
                addPaymentModalOpen={addPaymentModalOpen}
                fetchInvoicesData={fetchInvoicesData}
                invoiceDialogOpen={invoiceDialogOpen}
                setInvoiceDialogOpen={setInvoiceDialogOpen}
                superbillDialogOpen={superbillDialogOpen}
                setSuperbillDialogOpen={setSuperbillDialogOpen}
              />
            </TabsContent>

            <TabsContent value="measures">
              <MeasuresTab />
            </TabsContent>

            <TabsContent value="files">
              <FilesTab ref={filesTabRef} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-4 pt-0 border-[#e5e7eb] p-4 sm:p-6 space-y-4">
          <ClientBillingCard
            credit={creditAmount}
            invoices={invoices}
            onAddPayment={() => setAddPaymentModalOpen(true)}
          />

          <ClientInfoCard
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clientGroup={clientGroup as any}
          />
          <InvoicesDocumentsCard invoices={invoices} />
        </div>
      </div>

      {/* Mobile Add Administrative Note Button - Fixed at the bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-[#e5e7eb] bg-white">
        <div className="px-4 sm:px-6 py-2">
          <Button
            className="text-blue-500 hover:bg-blue-50 w-full justify-center"
            variant="ghost"
            onClick={() => setAdminNoteModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Administrative Note
          </Button>
        </div>
      </div>
    </div>
  );
}
