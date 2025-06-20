/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus } from "lucide-react";
import AdministrativeNoteDrawer from "./AdministrativeNoteDrawer";
import ShareDocumentsFlow from "./ShareDocumentsFlow";
import AdministrativeNoteCard from "./AdministrativeNoteCard";
import { StatementModal } from "./StatementModal";

import { Button } from "@mcw/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";

import OverviewTab from "./tabs/OverviewTab";
import BillingTab from "./tabs/BillingTab";
import MeasuresTab from "./tabs/MeasuresTab";
import FilesTabGroup, { FilesTabRef } from "./tabs/FilesTabGroup";
import { AddPaymentModal } from "./AddPaymentModal";
import {
  fetchInvoices,
  fetchSingleClientGroup,
} from "@/(dashboard)/clients/services/client.service";
import { Invoice, Payment } from "@prisma/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ClientBillingCard } from "./ClientBillingCard";
import { InvoicesDocumentsCard } from "./InvoicesDocumentsCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientInfoHeader } from "./ClientInfoHeader";
import { ClientInfoCard } from "./ClientInfoCard";
import { useToast } from "@mcw/ui";
import { ClientGroupFromAPI } from "../edit/components/ClientEdit";

export function getClientGroupInfo(client: unknown) {
  if (!client) return "";
  const clientData = client as {
    ClientGroupMembership?: {
      Client?: { legal_first_name: string; legal_last_name: string };
    }[];
  };

  if (!clientData.ClientGroupMembership) return "";

  const name = clientData.ClientGroupMembership.map((m) =>
    m.Client
      ? `${m.Client.legal_first_name ?? ""} ${m.Client.legal_last_name ?? ""}`.trim()
      : "",
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
    name: string;
    type: string;
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
interface AdministrativeNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string | Date;
  authorName: string;
}

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
  const [administrativeNotes, setAdministrativeNotes] = useState<
    AdministrativeNote[]
  >([]);
  const [editingNote, setEditingNote] = useState<AdministrativeNote | null>(
    null,
  );
  const { id } = useParams();
  const searchParams = useSearchParams();

  const currentTab = (searchParams.get("tab") as Tabs) || "overview";
  const [activeTab, setActiveTab] = useState(currentTab);
  const router = useRouter();
  const filesTabRef = useRef<FilesTabRef>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse administrative notes from client group data
  const parseAdministrativeNotes = (
    notesString: string | null,
  ): AdministrativeNote[] => {
    if (!notesString) return [];
    try {
      const parsed = JSON.parse(notesString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse administrative notes:", error);
      return [];
    }
  };

  const { data: clientGroup } = useQuery({
    queryKey: ["clientGroup", id],
    queryFn: async () => {
      const response = (await fetchSingleClientGroup({
        id: id as string,
        searchParams: {},
      })) as { data: ClientGroupFromAPI } | null;

      if (response?.data) {
        const clientGroupData = response.data;
        setCredit(Number(clientGroupData.available_credit) || 0);

        if (clientGroupData.ClientGroupMembership?.length) {
          const name = getClientGroupInfo(clientGroupData);
          setClientName(name || "");
        }

        // Parse and set administrative notes from the response
        // Always attempt to parse administrative notes, even if null
        const notes = parseAdministrativeNotes(
          clientGroupData.administrative_notes as string | null,
        );
        setAdministrativeNotes(notes);

        return clientGroupData;
      }
      return null;
    },
    enabled: !!id, // Only run when id exists
  });

  const fetchInvoicesData = useCallback(async () => {
    const [response, error] = await fetchInvoices({
      searchParams: { clientGroupId: id },
    });
    if (!error && response) {
      const invoiceResponse = response as InvoiceWithPayments[];

      if (invoiceResponse?.length) {
        setInvoices(invoiceResponse);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchInvoicesData();
  }, [fetchInvoicesData]);

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

  // handleShare removed - not currently used

  const handleUpload = () => {
    setActiveTab("files");
    // Small delay to ensure tab is switched before triggering upload
    setTimeout(() => {
      filesTabRef.current?.triggerFileUpload();
    }, 100);
  };

  const handleNoteSaved = () => {
    // Refetch client group data to get updated administrative notes
    queryClient.invalidateQueries({ queryKey: ["clientGroup", id] });
  };

  const handleEditNote = (note: AdministrativeNote) => {
    setEditingNote(note);
    setAdminNoteModalOpen(true);
  };

  const handleNoteModalClose = (open: boolean) => {
    setAdminNoteModalOpen(open);
    if (!open) {
      setEditingNote(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(
        `/api/clients/${id}/administrative-notes/${noteId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setAdministrativeNotes((prev) =>
          prev.filter((note) => note.id !== noteId),
        );
        toast({
          title: "Success",
          description: "Administrative note deleted successfully.",
          variant: "success",
        });
      } else {
        throw new Error("Failed to delete note");
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast({
        title: "Error",
        description: "Failed to delete administrative note.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = () => {
    // Prevent adding more than 1 note
    if (administrativeNotes.length >= 1) {
      toast({
        title: "Limit Reached",
        description:
          "You can only have one administrative note. Please edit or delete the existing note.",
        variant: "destructive",
      });
      return;
    }
    setAdminNoteModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full mt-2">
      {/* Breadcrumb */}
      <AdministrativeNoteDrawer
        editingNote={editingNote}
        open={adminNoteModalOpen}
        onNoteSaved={handleNoteSaved}
        onOpenChange={handleNoteModalClose}
      />
      {addPaymentModalOpen && (
        <AddPaymentModal
          clientName={clientName}
          fetchInvoicesData={fetchInvoicesData}
          open={addPaymentModalOpen}
          onOpenChange={setAddPaymentModalOpen}
        />
      )}
      <ShareDocumentsFlow
        clientGroupId={id as string}
        clients={
          clientGroup?.ClientGroupMembership?.map((m) => ({
            id: m.Client?.id || "",
            name: `${m.Client?.legal_first_name || ""} ${m.Client?.legal_last_name || ""}`.trim(),
            email: m.Client?.ClientContact?.find(
              (c) => c.contact_type === "EMAIL" && c.is_primary,
            )?.value,
          })) || []
        }
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
      <StatementModal clientName={clientName} />
      {/* Client Header */}
      <div className="px-4 sm:px-6 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          {clientGroup ? (
            <ClientInfoHeader
              clientGroupId={id as string}
              clientInfo={clientGroup}
            />
          ) : null}
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
          {/* Administrative Notes Section - Show if any notes exist */}
          {administrativeNotes.length > 0 && (
            <div className="p-4 sm:p-6 border-b border-[#e5e7eb]">
              {administrativeNotes.map((note) => (
                <AdministrativeNoteCard
                  key={note.id}
                  clientName={clientName}
                  dateOfBirth="09/15/1995"
                  note={note}
                  onDelete={handleDeleteNote}
                  onEdit={handleEditNote}
                />
              ))}
            </div>
          )}

          <Tabs
            className="w-full"
            defaultValue="measures"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <div className="border-b border-[#e5e7eb] overflow-x-auto">
              <div className="px-4 sm:px-6 flex justify-between items-center">
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
                {/* Add Administrative Note Button */}
                {administrativeNotes.length === 0 && (
                  <Button
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    size="sm"
                    variant="ghost"
                    onClick={handleAddNote}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Administrative Note
                  </Button>
                )}
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
                setSuperbillDialogOpen={setSuperbillDialogOpen}
                superbillDialogOpen={superbillDialogOpen}
              />
            </TabsContent>

            <TabsContent value="measures">
              <MeasuresTab clientId={Array.isArray(id) ? id[0] : id} />
            </TabsContent>

            <TabsContent value="files">
              <FilesTabGroup
                ref={filesTabRef}
                clientGroupId={id as string}
                clients={
                  clientGroup?.ClientGroupMembership?.map((m) => ({
                    id: m.Client?.id || "",
                    name: `${m.Client?.legal_first_name || ""} ${m.Client?.legal_last_name || ""}`.trim(),
                  })) || []
                }
                onShareFile={() => setShareModalOpen(true)}
              />
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
            onClick={handleAddNote}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Administrative Note
          </Button>
        </div>
      </div>
    </div>
  );
}
