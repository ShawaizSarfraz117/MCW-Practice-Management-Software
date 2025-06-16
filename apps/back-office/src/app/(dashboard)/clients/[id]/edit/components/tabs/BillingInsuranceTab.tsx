/* eslint-disable max-lines-per-function */
"use client";

import { useState, useEffect } from "react";
import {
  Checkbox,
  Button,
  toast,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { showErrorToast } from "@mcw/utils";
import { Trash2 } from "lucide-react";
import {
  fetchServices,
  createBillingPreference,
} from "@/(dashboard)/clients/services/client.service";

interface BillingInsuranceTabProps {
  clientGroupId: string;
  responsibleClientName?: string;
}

interface ClientGroupService {
  service_id: string;
  custom_rate: number;
}

interface BillingPreferences {
  client_group_id: string;
  email_generated_invoices: boolean;
  email_generated_statements: boolean;
  email_generated_superbills: boolean;
  notify_new_invoices: boolean;
  notify_new_statements: boolean;
  notify_new_superbills: boolean;
  clientGroupServices?: ClientGroupService[];
}

interface Service {
  id: string;
  type: string;
  code: string;
  rate: number;
}

interface DefaultService {
  serviceId: string;
  rate: number;
}

export function BillingInsuranceTab({
  clientGroupId,
  responsibleClientName = "Client",
}: BillingInsuranceTabProps) {
  const [billingPreferences, setBillingPreferences] =
    useState<BillingPreferences>({
      client_group_id: clientGroupId,
      email_generated_invoices: false,
      email_generated_statements: false,
      email_generated_superbills: false,
      notify_new_invoices: false,
      notify_new_statements: false,
      notify_new_superbills: false,
    });

  const [autogenerateBilling, setAutogenerateBilling] = useState({
    statements: false,
    superbills: false,
  });

  const [emailOption, setEmailOption] = useState<string>("send-with-attached");
  const [defaultServices, setDefaultServices] = useState<DefaultService[]>([]);

  // Fetch services data
  const { data: servicesData = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const [response, error] = await fetchServices();
      if (error) throw error;
      return response as Service[];
    },
  });

  // Fetch existing billing preferences
  const { data: existingPreferences } = useQuery({
    queryKey: ["billingPreferences", clientGroupId],
    queryFn: async () => {
      const response = await fetch(
        `/api/client/group/billing-preference?client_group_id=${clientGroupId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch billing preferences");
      return response.json();
    },
    enabled: !!clientGroupId,
  });

  // Update local state when existing preferences are loaded
  useEffect(() => {
    if (existingPreferences && !existingPreferences.error) {
      setBillingPreferences((prev) => ({
        ...prev,
        email_generated_invoices:
          existingPreferences.email_generated_invoices || false,
        email_generated_statements:
          existingPreferences.email_generated_statements || false,
        email_generated_superbills:
          existingPreferences.email_generated_superbills || false,
        notify_new_invoices: existingPreferences.notify_new_invoices || false,
        notify_new_statements:
          existingPreferences.notify_new_statements || false,
        notify_new_superbills:
          existingPreferences.notify_new_superbills || false,
      }));

      // Update email option based on existing preferences
      if (
        existingPreferences.notify_new_invoices ||
        existingPreferences.notify_new_statements ||
        existingPreferences.notify_new_superbills
      ) {
        setEmailOption("send-with-link");
      } else if (
        existingPreferences.email_generated_invoices ||
        existingPreferences.email_generated_statements ||
        existingPreferences.email_generated_superbills
      ) {
        setEmailOption("send-with-attached");
      }

      // Set autogenerate settings from client group
      if (existingPreferences.clientGroup) {
        setAutogenerateBilling({
          statements:
            existingPreferences.clientGroup.auto_monthly_statement_enabled ||
            false,
          superbills:
            existingPreferences.clientGroup.auto_monthly_superbill_enabled ||
            false,
        });
      }

      // Set existing client group services
      if (
        existingPreferences.clientGroupServices &&
        existingPreferences.clientGroupServices.length > 0
      ) {
        setDefaultServices(
          existingPreferences.clientGroupServices.map(
            (service: { service_id: string; custom_rate: number }) => ({
              serviceId: service.service_id,
              rate: Number(service.custom_rate),
            }),
          ),
        );
      }
    }
  }, [existingPreferences]);

  // Save billing preferences mutation
  const saveBillingPreferencesMutation = useMutation({
    mutationFn: async (data: BillingPreferences) => {
      const [response, error] = await createBillingPreference({ body: data });
      if (error) throw error;
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Billing preferences saved successfully",
        variant: "success",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = servicesData.find((s) => s.id === serviceId);
    if (service) {
      if (index >= defaultServices.length) {
        // Adding a new service
        setDefaultServices([
          ...defaultServices,
          { serviceId, rate: Number(service.rate) },
        ]);
      } else {
        // Updating existing service
        const updatedServices = [...defaultServices];
        updatedServices[index] = { serviceId, rate: Number(service.rate) };
        setDefaultServices(updatedServices);
      }
    }
  };

  const handleRateChange = (index: number, rate: string) => {
    const updatedServices = [...defaultServices];
    updatedServices[index].rate = Number(rate);
    setDefaultServices(updatedServices);
  };

  const handleRemoveService = (index: number) => {
    setDefaultServices(defaultServices.filter((_, i) => i !== index));
  };

  const handleEmailOptionChange = (value: string) => {
    setEmailOption(value);
    // Don't automatically change checkbox values - let user control them
  };

  const handleSave = () => {
    // Update billing preferences based on autogenerate settings
    const updatedPreferences = {
      ...billingPreferences,
      email_generated_statements: autogenerateBilling.statements,
      email_generated_superbills: autogenerateBilling.superbills,
    };

    // Prepare the request body with clientGroupServices
    const requestBody: BillingPreferences = {
      ...updatedPreferences,
      clientGroupServices: defaultServices
        .filter((service) => service.serviceId) // Only include services with selected IDs
        .map((service) => ({
          service_id: service.serviceId,
          custom_rate: service.rate,
        })),
    };

    saveBillingPreferencesMutation.mutate(requestBody);
  };

  const handleCancel = () => {
    // Reset to original state or navigate back
    window.history.back();
  };

  return (
    <div className="space-y-6">
      {/* Autogenerate Billing Documents */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Autogenerate Billing Documents
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <Checkbox
              checked={autogenerateBilling.statements}
              id="auto-statements"
              onCheckedChange={(checked) =>
                setAutogenerateBilling((prev) => ({
                  ...prev,
                  statements: !!checked,
                }))
              }
            />
            <label className="ml-2 text-sm" htmlFor="auto-statements">
              Automatically create monthly Statements for this client
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={autogenerateBilling.superbills}
              id="auto-superbills"
              onCheckedChange={(checked) =>
                setAutogenerateBilling((prev) => ({
                  ...prev,
                  superbills: !!checked,
                }))
              }
            />
            <label className="ml-2 text-sm" htmlFor="auto-superbills">
              Automatically create monthly Superbills for this client
            </label>
          </div>
        </div>
      </div>

      {/* Email Billing Notifications */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Email Billing Notifications
        </h3>
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
          <p className="text-sm">
            Billing notification settings will apply to{" "}
            <span className="font-semibold">{responsibleClientName}</span> who
            is responsible for this Client.
          </p>
          <button className="text-blue-600 text-sm mt-2 hover:underline">
            Manage their settings
          </button>
        </div>

        {/* Email Options Dropdown */}
        <div className="mb-4">
          <Select value={emailOption} onValueChange={handleEmailOptionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select email option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="send-with-attached">
                Send email with billing documents attached
              </SelectItem>
              <SelectItem value="send-with-link">
                Send email with link to Client Portal
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Email Options Checkboxes */}
        {emailOption === "send-with-attached" && (
          <div className="space-y-3 ml-6">
            <div className="flex items-center">
              <Checkbox
                checked={billingPreferences.email_generated_invoices}
                id="email-invoices"
                onCheckedChange={(checked) =>
                  setBillingPreferences((prev) => ({
                    ...prev,
                    email_generated_invoices: !!checked,
                  }))
                }
              />
              <label className="ml-2 text-sm" htmlFor="email-invoices">
                Email generated Invoices to this client
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={billingPreferences.email_generated_statements}
                id="email-statements"
                onCheckedChange={(checked) =>
                  setBillingPreferences((prev) => ({
                    ...prev,
                    email_generated_statements: !!checked,
                  }))
                }
              />
              <label className="ml-2 text-sm" htmlFor="email-statements">
                Email generated Statements to this client
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={billingPreferences.email_generated_superbills}
                id="email-superbills"
                onCheckedChange={(checked) =>
                  setBillingPreferences((prev) => ({
                    ...prev,
                    email_generated_superbills: !!checked,
                  }))
                }
              />
              <label className="ml-2 text-sm" htmlFor="email-superbills">
                Email generated Superbills to this client
              </label>
            </div>
          </div>
        )}

        {emailOption === "send-with-link" && (
          <div className="space-y-3 ml-6">
            <div className="flex items-center">
              <Checkbox
                checked={billingPreferences.notify_new_invoices}
                id="notify-invoices"
                onCheckedChange={(checked) =>
                  setBillingPreferences((prev) => ({
                    ...prev,
                    notify_new_invoices: !!checked,
                  }))
                }
              />
              <label className="ml-2 text-sm" htmlFor="notify-invoices">
                Notify client when new Invoices are available
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={billingPreferences.notify_new_statements}
                id="notify-statements"
                onCheckedChange={(checked) =>
                  setBillingPreferences((prev) => ({
                    ...prev,
                    notify_new_statements: !!checked,
                  }))
                }
              />
              <label className="ml-2 text-sm" htmlFor="notify-statements">
                Notify client when new Statements are available
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={billingPreferences.notify_new_superbills}
                id="notify-superbills"
                onCheckedChange={(checked) =>
                  setBillingPreferences((prev) => ({
                    ...prev,
                    notify_new_superbills: !!checked,
                  }))
                }
              />
              <label className="ml-2 text-sm" htmlFor="notify-superbills">
                Notify client when new Superbills are available
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Client Default Services */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Client Default Services</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_150px_auto] gap-4 items-center">
            <Label>Service Code</Label>
            <Label>Rate Per Unit</Label>
            <div />
          </div>

          {defaultServices.map((service, index) => (
            <div
              key={`service-${index}-${service.serviceId || "new"}`}
              className="grid grid-cols-[1fr_150px_auto] gap-4 items-center"
            >
              <Select
                value={service.serviceId}
                onValueChange={(value) => handleServiceSelect(index, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {servicesData.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} {s.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span>$</span>
                <input
                  className="w-full border rounded px-2 py-1.5"
                  min="0"
                  step="0.01"
                  type="number"
                  value={service.rate}
                  onChange={(e) => handleRateChange(index, e.target.value)}
                />
              </div>
              <button
                className="p-1 hover:bg-gray-100 rounded"
                type="button"
                onClick={() => handleRemoveService(index)}
              >
                <Trash2 className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}

          <Select
            value=""
            onValueChange={(value) => {
              if (value) {
                handleServiceSelect(defaultServices.length, value);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- select to add new service --" />
            </SelectTrigger>
            <SelectContent>
              {servicesData.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} {s.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          disabled={saveBillingPreferencesMutation.isPending}
          onClick={handleSave}
        >
          {saveBillingPreferencesMutation.isPending
            ? "Saving..."
            : "Save Client"}
        </Button>
      </div>
    </div>
  );
}
