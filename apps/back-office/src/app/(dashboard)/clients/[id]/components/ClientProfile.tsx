/* eslint-disable max-lines-per-function */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronDown, Info } from "lucide-react";
import AdministrativeNoteDrawer from "./AdministrativeNoteDrawer";

import { Button } from "@mcw/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";
import { Badge } from "@mcw/ui";

import OverviewTab from "./tabs/OverviewTab";
import BillingTab from "./tabs/BillingTab";
import MeasuresTab from "./tabs/MeasuresTab";
import FilesTab from "./tabs/FilesTab";
import { AddPaymentModal } from "./AddPaymentModal";
import { fetchInvoices } from "@/(dashboard)/clients/services/client.service";
import { Invoice, Payment } from "@prisma/client";
import { useParams } from "next/navigation";

interface ClientProfileProps {
  clientId: string;
}

export interface InvoiceWithPayments extends Invoice {
  Payment: Payment[];
}

const formatDate = (date: Date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

export default function ClientProfile({
  clientId: _clientId,
}: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState("measures");
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceWithPayments[]>([]);

  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    const fetchInvoicesData = async () => {
      const [invoices, error] = await fetchInvoices({
        searchParams: { client_group_membership_id: id },
      });
      if (!error && invoices?.length) {
        setInvoices(invoices as InvoiceWithPayments[]);
      }
    };
    fetchInvoicesData();
  }, [id]);

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
            onValueChange={setActiveTab}
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
              <BillingTab />
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
        <div className="col-span-12 lg:col-span-4 border-t lg:border-t-0 border-[#e5e7eb] p-4 sm:p-6">
          {/* Client Billing */}
          <div className="mb-8">
            <h3 className="font-medium mb-4">Client billing</h3>

            <div className="flex justify-between mb-2">
              <div className="text-sm">Client balance</div>
              <div className="text-sm font-medium text-red-500">$200</div>
            </div>

            <div className="flex justify-between mb-2">
              <div className="text-sm">Unallocated (1)</div>
              <div className="text-sm font-medium">$100</div>
            </div>

            <div className="flex justify-between mb-4">
              <div className="text-sm">Unpaid invoices (3)</div>
              <div className="text-sm font-medium">$300</div>
            </div>

            <Button
              className="w-full bg-[#2d8467] hover:bg-[#236c53]"
              onClick={() => setAddPaymentModalOpen(true)}
            >
              Add Payment
            </Button>
          </div>

          {/* Client Info */}
          <div className="mb-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-medium">Client info</h3>
              <button className="text-blue-500 hover:underline text-sm">
                Edit
              </button>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Invoices</h3>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>

            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id}>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-blue-500">
                      {invoice.invoice_number}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`bg-red-500 text-white text-xs ${invoice.status === "PAID" ? "bg-green-500" : ""}`}
                      >
                        {invoice.status}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {formatDate(invoice.issued_date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Documents Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <h3 className="font-medium">Billing documents</h3>
                <Info className="h-4 w-4 text-gray-400 ml-1" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-500">SB #0001</div>
                <div className="text-xs text-gray-500">02/01 - 02/05/2025</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-500">STMT #0001</div>
                <div className="text-xs text-gray-500">02/01 - 02/06/2025</div>
              </div>
            </div>
          </div>
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
