/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { useState, useRef, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { Label } from "@mcw/ui";
import { ClientTabs } from "./ClientTabs";
import { ClientForm } from "./ClientForm";
import { SelectExistingClient, Client } from "./SelectExistingClient";
import { createClient } from "../services/client.service";
import {
  validateClient,
  hasErrors,
  ValidationErrors,
} from "../utils/validation";

interface CreateClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAppointmentDate?: string;
  fetchClientData: () => void;
}

export interface EmailEntry {
  value: string;
  type: string;
  permission: string;
}

export interface PhoneEntry {
  value: string;
  type: string;
  permission: string;
}

export interface FormState {
  is_contact_only?: boolean;
  clientType: string;
  legalFirstName: string;
  legalLastName: string;
  preferredName: string;
  dob: string;
  status: string;
  addToWaitlist: boolean;
  primaryClinicianId: string;
  locationId: string;
  emails: EmailEntry[];
  phones: PhoneEntry[];
  notificationOptions: {
    upcomingAppointments: boolean;
    incompleteDocuments: boolean;
    cancellations: boolean;
  };
  contactMethod: {
    text: boolean;
    voice: boolean;
  };
  is_responsible_for_billing?: boolean;
  isExisting?: boolean;
  clientId?: string;
}

interface FormValues {
  clientType: string;
  clients: Record<string, FormState>;
}

const clientGroups: { type: string; name: string }[] = [
  { type: "adult", name: "Adult" },
  { type: "minor", name: "Minor" },
  { type: "couple", name: "Couple" },
  { type: "family", name: "Family" },
];
export function CreateClientDrawer({
  open,
  onOpenChange,
  defaultAppointmentDate = "Tuesday, Oct 22, 2025 @ 12:00 PM",
  fetchClientData,
}: CreateClientDrawerProps) {
  const [clientType, setClientType] = useState("adult");
  const [activeTab, setActiveTab] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedClients, setSelectedClients] = useState<
    Record<string, Client | null>
  >({});
  const [clientTabs, setClientTabs] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, ValidationErrors>
  >({});

  const [showSelectExisting, setShowSelectExisting] = useState(false);

  const tabsRef = useRef<{ submit: () => void }>(null);

  const defaultClientData: FormState = {
    clientType: clientType,
    legalFirstName: "",
    legalLastName: "",
    preferredName: "",
    dob: "",
    status: "active",
    addToWaitlist: false,
    primaryClinicianId: "",
    locationId: "",
    emails: [],
    phones: [],
    notificationOptions: {
      upcomingAppointments: true,
      incompleteDocuments: false,
      cancellations: false,
    },
    contactMethod: {
      text: true,
      voice: false,
    },
  };

  // Function to reset form state
  const resetFormState = () => {
    setClientType("adult");
    setActiveTab("");
    setSelectedClients({});
    setClientTabs([]);
    setValidationErrors({});
    setShowSelectExisting(false);

    // Reset form to default values
    form.setFieldValue("clientType", "adult");
    form.setFieldValue("clients", {
      "client-1": { ...defaultClientData },
    });
  };

  // Handle drawer close
  const handleDrawerOpenChange = (isOpen: boolean) => {
    // If trying to close the drawer programmatically or with escape/clicking outside,
    // we prevent it from closing by not calling onOpenChange
    if (!isOpen) {
      // We don't call onOpenChange here, which effectively prevents automatic closing
      // The drawer will only close when the X button is clicked
      return;
    } else {
      // Reset validation errors when opening the drawer
      setValidationErrors({});
      // Set initial client type and form data
      const initialClientType =
        clientGroups.length > 0 ? clientGroups[0].type : "adult";
      setClientType(initialClientType);
      form.setFieldValue("clientType", initialClientType);
      form.setFieldValue("clients", {
        "client-1": { ...defaultClientData, clientType: initialClientType },
      });
    }
    onOpenChange(isOpen);
  };

  // @ts-expect-error - TODO: Fix form typing
  const form = useForm<FormValues>({
    defaultValues: {
      clientType: "minor",
      clients: {
        "client-1": { ...defaultClientData },
      },
    },
    validatorAdapter: {
      validate: (values: FormValues) => {
        // Validate each client
        const clientsValidation = Object.entries(values.clients).reduce(
          (acc, [key, client]) => {
            const isContactTab = clientType === "minor" && key === "client-2";
            const errors = validateClient(client, isContactTab);

            if (hasErrors(errors)) {
              acc[key] = { meta: { errors } };
            }

            return acc;
          },
          {} as Record<string, unknown>,
        );

        return {
          clientType: values.clientType,
          clients: clientsValidation,
        };
      },
    },
    onSubmit: async ({ value }) => {
      // Validate all clients before submitting
      const allClientsValid = Object.entries(value.clients).every(
        ([key, client]) => {
          const isContactTab = clientType === "minor" && key === "client-2";
          const errors = validateClient(client, isContactTab);
          if (hasErrors(errors)) {
            setValidationErrors((prev) => ({ ...prev, [key]: errors }));
            return false;
          }
          return true;
        },
      );

      if (!allClientsValid) {
        return;
      }

      setIsLoading(true);
      const structuredData = structureData(value);
      await createClient({ body: structuredData });
      setIsLoading(false);
      resetFormState();
      onOpenChange(false);
      fetchClientData();
    },
  });

  useEffect(() => {
    let initialTabs;
    let initialClients: Record<string, FormState>;

    switch (clientType) {
      case "minor":
        initialTabs = [
          { id: "client-1", label: "Client" },
          { id: "client-2", label: "Contact" },
        ];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
          "client-2": { ...defaultClientData, clientType },
        };
        break;
      case "couple":
        initialTabs = [
          { id: "client-1", label: "Client 1" },
          { id: "client-2", label: "Client 2" },
        ];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
          "client-2": { ...defaultClientData, clientType },
        };
        break;
      case "family":
        initialTabs = [{ id: "client-1", label: "Client 1" }];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
        };
        break;
      case "adult":
      default:
        initialTabs = [{ id: "client-1", label: "Client" }];
        initialClients = {
          "client-1": { ...defaultClientData, clientType },
        };
    }

    setClientTabs(initialTabs);
    setActiveTab("client-1");

    // First set the client type
    form.setFieldValue("clientType", clientType);

    // Then set each client individually to ensure proper state updates
    Object.entries(initialClients).forEach(([key, value]) => {
      form.setFieldValue(`clients.${key}`, value);
    });

    // Reset form state to only include the initial clients
    form.setFieldValue("clients", initialClients);

    setSelectedClients({});
  }, [clientType]);

  const structureData = (values: FormValues) => {
    // Filter out empty or undefined client objects
    const filteredClients = Object.entries(values.clients).reduce(
      (acc, [key, value]) => {
        if (value && Object.keys(value).length > 0) {
          const clientNum = key.split("-")[1] || "1";
          acc[`client${clientNum}`] = value;
          acc[`client${clientNum}`].is_contact_only =
            clientNum == "2" && clientType === "minor";
        }
        return acc;
      },
      {} as Record<string, FormState>,
    );
    return {
      clientGroup: clientType,
      ...filteredClients,
    };
  };

  const handleSelectExistingClient = (selectedClientParam: Client) => {
    // Store selected client for the current tab only
    setSelectedClients((prev) => ({
      ...prev,
      [activeTab]: selectedClientParam,
    }));

    // Get email from ClientContact array if it exists
    const emailContact = selectedClientParam.ClientContact?.find(
      (contact) => contact.contact_type === "EMAIL",
    );

    // Get phone from ClientContact array if it exists
    const phoneContact = selectedClientParam.ClientContact?.find(
      (contact) => contact.contact_type === "PHONE",
    );

    const mappedClient: FormState = {
      clientType: clientType,
      legalFirstName: selectedClientParam.legal_first_name || "",
      legalLastName: selectedClientParam.legal_last_name || "",
      preferredName: selectedClientParam.preferred_name || "",
      dob: "",
      status: "active",
      addToWaitlist: false,
      primaryClinicianId: "",
      locationId: "",
      emails: emailContact
        ? [
            {
              value: emailContact.value,
              type: "primary",
              permission: "allowed",
            },
          ]
        : [],
      phones: phoneContact
        ? [
            {
              value: phoneContact.value,
              type: "primary",
              permission: "allowed",
            },
          ]
        : [],
      notificationOptions: {
        upcomingAppointments: true,
        incompleteDocuments: false,
        cancellations: false,
      },
      contactMethod: {
        text: true,
        voice: false,
      },
      isExisting: true,
      clientId: selectedClientParam.id,
    };

    // Clear validation errors for populated fields
    setValidationErrors((prev) => {
      const updatedErrors = { ...prev };
      if (updatedErrors[activeTab]) {
        const tabErrors = { ...updatedErrors[activeTab] };
        // Remove errors for fields that now have values
        if (selectedClientParam.legal_first_name)
          delete tabErrors.legalFirstName;
        if (selectedClientParam.legal_last_name) delete tabErrors.legalLastName;
        if (emailContact) delete tabErrors.emails;
        if (phoneContact) delete tabErrors.phones;
        updatedErrors[activeTab] = tabErrors;
      }
      return updatedErrors;
    });

    // Only set the active tab's data
    form.setFieldValue(`clients.${activeTab}`, mappedClient);
    setShowSelectExisting(false);
  };

  const handleClientRemoved = () => {
    // Remove selected client for active tab only
    setSelectedClients((prev) => {
      const updated = { ...prev };
      delete updated[activeTab];
      return updated;
    });
  };

  // Function to clear validation error for a specific field in a specific tab
  const clearValidationError = (tabId: string, fieldName: string) => {
    if (validationErrors[tabId]?.[fieldName]) {
      setValidationErrors((prev) => {
        const updatedErrors = { ...prev };
        if (updatedErrors[tabId]) {
          const updatedTabErrors = { ...updatedErrors[tabId] };
          delete updatedTabErrors[fieldName];
          updatedErrors[tabId] = updatedTabErrors;
        }
        return updatedErrors;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleDrawerOpenChange}>
      <SheetContent
        className="sm:max-w-[500px] p-0 gap-0 [&>button]:hidden"
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {showSelectExisting ? (
          <SelectExistingClient
            selectedClient={selectedClients[activeTab] || null}
            onBack={() => setShowSelectExisting(false)}
            onSelect={handleSelectExistingClient}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-xl font-semibold">Create client</h2>
                <p className="text-sm text-gray-500">
                  Appointment: {defaultAppointmentDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-8 w-8"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    resetFormState();
                    onOpenChange(false);
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
                <Button
                  className="bg-[#2d8467] hover:bg-[#236c53]"
                  disabled={isLoading}
                  onClick={() => {
                    // Manual validation for active tab only
                    const formData = form.getFieldValue("clients");
                    const currentTabClient = formData?.[activeTab];
                    const isContactTab =
                      clientType === "minor" && activeTab === "client-2";

                    const currentTabErrors = validateClient(
                      currentTabClient,
                      isContactTab,
                    );
                    const isValid = !hasErrors(currentTabErrors);

                    // Update validation errors in state - only update for the active tab
                    setValidationErrors((prev) => ({
                      ...prev,
                      [activeTab]: currentTabErrors,
                    }));

                    if (isValid) {
                      // If all tabs are valid, then submit
                      let allTabsValid = true;

                      // Check if we need to validate all tabs or just the current one
                      if (clientType !== "adult") {
                        // For family, couple, or minor types, validate all tabs
                        for (const tab of clientTabs) {
                          const tabClient = formData?.[tab.id];
                          const isTabContactTab =
                            clientType === "minor" && tab.id === "client-2";
                          const tabErrors = validateClient(
                            tabClient,
                            isTabContactTab,
                          );

                          if (hasErrors(tabErrors)) {
                            allTabsValid = false;
                            setActiveTab(tab.id);
                            break;
                          }
                        }
                      }

                      if (allTabsValid) {
                        form.handleSubmit();
                      }
                    }
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto h-[calc(100vh-72px)] pb-10">
              {/* Client Type */}
              <div className="px-6 pt-6">
                <RadioGroup
                  className="flex gap-4"
                  defaultValue="minor"
                  value={clientType}
                  onValueChange={(newClientType) => {
                    setClientType(newClientType);
                    // Clear all validation errors when changing client type
                    setValidationErrors({});
                  }}
                >
                  {clientGroups.map((group) => (
                    <div
                      key={group.type}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem id={group.type} value={group.type} />
                      <Label className="cursor-pointer" htmlFor={group.type}>
                        {group.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              {clientType !== "adult" ? (
                <ClientTabs
                  ref={tabsRef}
                  activeTab={activeTab}
                  clearValidationError={(fieldName) =>
                    clearValidationError(activeTab, fieldName)
                  }
                  clientTabs={clientTabs}
                  clientType={clientType}
                  form={form}
                  selectedClient={selectedClients[activeTab] || null}
                  setActiveTab={setActiveTab}
                  setClientTabs={setClientTabs}
                  validationErrors={validationErrors[activeTab] || {}}
                  onClientRemoved={handleClientRemoved}
                  onSelectExisting={setShowSelectExisting}
                />
              ) : (
                <form.Field name="clients.client-1">
                  {(field) => (
                    <ClientForm
                      clearValidationError={(fieldName) =>
                        clearValidationError("client-1", fieldName)
                      }
                      clientType={clientType}
                      field={field}
                      selectedClient={selectedClients["client-1"] || null}
                      tabId="client-1"
                      validationErrors={validationErrors["client-1"] || {}}
                    />
                  )}
                </form.Field>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
