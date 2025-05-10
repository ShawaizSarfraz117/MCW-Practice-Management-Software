"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@mcw/ui";
import { useState } from "react";
import { CheckedState } from "@radix-ui/react-checkbox";
import AutomaticInvoiceSection from "./components/AutomaticInvoiceSection";
import GeneralBillingAutomations from "./components/GeneralBillingAutomations";

// Define types for our state
type Automations = {
  allowOnlinePayments: boolean;
  emailReminderPastDue: boolean;
  sendInvoiceEmail: boolean;
};

export default function SettingsBillingPage() {
  // State for form controls
  const [autoInvoice, setAutoInvoice] = useState("daily");
  const [generalAutomations, setGeneralAutomations] = useState<Automations>({
    allowOnlinePayments: true,
    emailReminderPastDue: true,
    sendInvoiceEmail: true,
  });

  // Handle general automation checkbox changes
  const handleAutomationChange = (key: keyof Automations) => {
    return (checked: CheckedState) => {
      if (typeof checked === "boolean") {
        setGeneralAutomations((prev) => ({
          ...prev,
          [key]: checked,
        }));
      }
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Here you would typically save to API
    console.log("Saving settings:", {
      autoInvoice,
      generalAutomations,
    });

    // Implement API call to save settings
    // Example: await fetch('/api/billing-settings', { method: 'POST', body: JSON.stringify({ autoInvoice, generalAutomations }) });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Main Heading and Save Button */}
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
          type="submit"
        >
          Save Changes
        </Button>
      </div>

      {/* Invoices Section */}
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

      {/* General Billing Automations Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-1 pt-5">
          <CardTitle className="font-semibold text-gray-900 text-xl">
            General billing automations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <GeneralBillingAutomations
            automations={generalAutomations}
            onAutomationChange={handleAutomationChange}
          />
        </CardContent>
      </Card>
    </form>
  );
}
