/* eslint-disable max-lines-per-function */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdministrativeNoteDrawer from "./AdministrativeNoteDrawer";

import { Button } from "@mcw/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";

import OverviewTab from "./tabs/OverviewTab";
import BillingTab from "./tabs/BillingTab";
import MeasuresTab from "./tabs/MeasuresTab";
import FilesTab from "./tabs/FilesTab";
import { AddPaymentModal } from "./AddPaymentModal";
import { fetchInvoices } from "@/(dashboard)/clients/services/client.service";
import { Invoice, Payment } from "@prisma/client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ClientBillingCard } from "./ClientBillingCard";
import { InvoicesDocumentsCard } from "./InvoicesDocumentsCard";

interface ClientProfileProps {
  clientId: string;
}

export interface InvoiceWithPayments extends Invoice {
  Payment: Payment[];
}

export default function ClientProfile({
  clientId: _clientId,
}: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceWithPayments[]>([]);
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Calculate totals for invoice and payments
  const totalInvoiceAmount = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );
  const totalPaymentsAmount = invoices.reduce((sum, invoice) => {
    const invoicePayments =
      invoice.Payment?.reduce(
        (paymentSum, payment) => paymentSum + Number(payment.amount),
        0,
      ) || 0;
    return sum + invoicePayments;
  }, 0);
  const remainingBalance = totalInvoiceAmount - totalPaymentsAmount;

  const fetchInvoicesData = async () => {
    const [invoices, error] = await fetchInvoices({
      searchParams: { client_group_membership_id: id },
    });
    if (!error && invoices?.length) {
      setInvoices(invoices as InvoiceWithPayments[]);
    }
  };

  useEffect(() => {
    fetchInvoicesData();
  }, [id]);

  useEffect(() => {
    // Handle invoice related URL parameters
    const invoiceId = searchParams.get("invoiceId");
    const type = searchParams.get("type");
    if (invoiceId && type === "payment") {
      setAddPaymentModalOpen(true);
    }
    if (invoiceId && type === "invoice") {
      setInvoiceDialogOpen(true);
    }

    // Handle tab URL parameter
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["overview", "billing", "measures", "files"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Create a new URLSearchParams object from the current searchParams
    const params = new URLSearchParams(searchParams.toString());
    // Set or update the tab parameter
    params.set("tab", value);

    // Update the URL without refreshing the page
    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <AdministrativeNoteDrawer
        open={adminNoteModalOpen}
        onOpenChange={setAdminNoteModalOpen}
      />
      {addPaymentModalOpen && (
        <AddPaymentModal
          clientName="Jamie D. Appleseed"
          fetchInvoicesData={fetchInvoicesData}
          open={addPaymentModalOpen}
          onOpenChange={setAddPaymentModalOpen}
        />
      )}
      <div className="px-4 sm:px-6 py-4 text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
        <Link className="hover:text-gray-700" href="/clients">
          Clients and contacts
        </Link>
        <span className="mx-1">/</span>
        <span>Jamie D. Appleseed&apos;s profile</span>
      </div>
      {/* Client Header */}
      <div className="px-4 sm:px-6 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold mb-1">
            Jamie D. Appleseed
          </h1>
          <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
            <span>Adult</span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span>07/23/2009 (15)</span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span>Next Appt: 02/07/2025 (1 left)</span>
            <button className="text-blue-500 hover:underline">Edit</button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-white text-xs sm:text-sm" variant="outline">
            Share
          </Button>
          <Button className="bg-white text-xs sm:text-sm" variant="outline">
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
                invoiceDialogOpen={invoiceDialogOpen}
                setInvoiceDialogOpen={setInvoiceDialogOpen}
              />
            </TabsContent>

            <TabsContent value="measures">
              <MeasuresTab />
            </TabsContent>

            <TabsContent value="files">
              <FilesTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-4 pt-0 border-[#e5e7eb] p-4 sm:p-6 space-y-4">
          <ClientBillingCard
            invoices={invoices}
            remainingBalance={remainingBalance}
            totalInvoiceAmount={totalInvoiceAmount}
            totalPaymentsAmount={totalPaymentsAmount}
            onAddPayment={() => setAddPaymentModalOpen(true)}
          />

          <InvoicesDocumentsCard
            invoices={invoices}
            onInvoiceClick={() => setAddPaymentModalOpen(true)}
          />
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
