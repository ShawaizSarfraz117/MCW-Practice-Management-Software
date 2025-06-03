import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  toast,
} from "@mcw/ui";
import { useState } from "react";
import BillingInvoicesSection from "./BillingInvoicesSection";
import BillingSuperbillsSection from "./BillingSuperbillsSection";

export type BillingSettingsFormData = {
  autoInvoiceCreation: "daily" | "weekly" | "monthly";
  pastDueDays: number;
  emailClientPastDue: boolean;
  invoiceIncludePracticeLogo: boolean;
  invoiceFooterInfo: string;
  superbillDayOfMonth: number;
  superbillIncludePracticeLogo: boolean;
  superbillIncludeSignatureLine: boolean;
  superbillIncludeDiagnosisDescription: boolean;
  superbillFooterInfo: string;
  billingDocEmailDelayMinutes: number;
  createMonthlyStatementsForNewClients: boolean;
  createMonthlySuperbillsForNewClients: boolean;
  defaultNotificationMethod: "email" | "sms";
};

async function fetchBillingSettings() {
  const response = await fetch("/api/billingSettings");
  if (!response.ok) {
    throw new Error("Failed to fetch billing settings");
  }
  return response.json();
}

async function updateBillingSettings(data: BillingSettingsFormData) {
  const response = await fetch("/api/billingSettings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update billing settings");
  }
  return response.json();
}

export default function BillingSettingsForm() {
  const { data: initialData, isLoading } = useQuery({
    queryKey: ["billingSettings"],
    queryFn: fetchBillingSettings,
  });

  const [formData, setFormData] = useState<BillingSettingsFormData>(
    initialData || {
      autoInvoiceCreation: "daily",
      pastDueDays: 30,
      emailClientPastDue: true,
      invoiceIncludePracticeLogo: true,
      invoiceFooterInfo: "",
      superbillDayOfMonth: 1,
      superbillIncludePracticeLogo: true,
      superbillIncludeSignatureLine: true,
      superbillIncludeDiagnosisDescription: true,
      superbillFooterInfo: "",
      billingDocEmailDelayMinutes: 0,
      createMonthlyStatementsForNewClients: true,
      createMonthlySuperbillsForNewClients: true,
      defaultNotificationMethod: "email",
    },
  );

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateBillingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingSettings"] });
      toast({
        title: "Billing settings updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: error.message || "Failed to update billing settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync(formData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Client Billing Documents
            </h1>
            <p className="text-[#6B7280] text-base">
              Automate invoices and billing workflows
            </p>
          </div>
          <form className="inline" onSubmit={handleSubmit}>
            <Button
              disabled={mutation.isPending}
              type="submit"
              variant="default"
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-1 pt-5">
            <CardTitle className="font-semibold text-gray-900 text-xl">
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <BillingInvoicesSection
              formData={formData}
              setFormData={setFormData}
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
            <BillingSuperbillsSection
              formData={formData}
              setFormData={setFormData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
