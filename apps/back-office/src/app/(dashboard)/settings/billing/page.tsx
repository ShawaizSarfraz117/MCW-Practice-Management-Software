"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@mcw/ui";
import { useState } from "react";
import AutomaticInvoiceSection from "./components/AutomaticInvoiceSection";
import Superbills from "./components/Superbills";

export default function SettingsBillingPage() {
  const [autoInvoice, setAutoInvoice] = useState("daily");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Saving settings:", {
      autoInvoice,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold text-2xl text-[#1F2937]">
            Client Billing Documents
          </h1>
          <p className="mt-1 text-base text-[#4B5563]">
            Automate invoices and billing workflows
          </p>
        </div>
        <Button
          className="bg-[#2D8467] hover:bg-[#256a53] text-white"
          type="button"
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-1 pt-5">
          <CardTitle className="font-semibold text-gray-900 text-xl">
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <AutomaticInvoiceSection
            defaultValue={autoInvoice}
            onChange={(value) => setAutoInvoice(value)}
          />
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-1 pt-5">
          <CardTitle className="font-semibold text-gray-900 text-xl">
            Superbills
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Superbills />
        </CardContent>
      </Card>
    </form>
  );
}
