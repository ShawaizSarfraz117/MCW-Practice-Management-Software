/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { Label } from "@mcw/ui";
import { ClientTabs } from "./ClientTabs";
import { ClientForm } from "./ClientForm";
import { SelectExistingClient } from "./SelectExistingClient";

interface CreateClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAppointmentDate?: string;
}

interface EmailEntry {
  address: string;
  type: string;
  permission: string;
}

interface PhoneEntry {
  number: string;
  type: string;
  permission: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface FormState {
  clientType: string;
  legalFirstName: string;
  legalLastName: string;
  preferredName: string;
  dob: string;
  status: string;
  addToWaitlist: boolean;
  primaryClinician: string;
  location: string;
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
}

interface FormValues {
  clientType: string;
  clients: Record<string, FormState>;
}

export function CreateClientDrawer({
  open,
  onOpenChange,
  defaultAppointmentDate = "Tuesday, Oct 22, 2025 @ 12:00 PM",
}: CreateClientDrawerProps) {
  const [clientType, setClientType] = useState("minor");
  const [activeTab, setActiveTab] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientTabs, setClientTabs] = useState<
    Array<{ id: string; label: string }>
  >([]);

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
    primaryClinician: "travis",
    location: "stpete",
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

  // @ts-expect-error - TODO: Fix form typing
  const form = useForm<FormValues>({
    defaultValues: {
      clientType: "minor",
      clients: {
        client: defaultClientData,
        contact: defaultClientData,
      },
    },
    onSubmit: ({ value }) => {
      const structuredData = structureData(value);
      console.log("Form submitted:", structuredData);
    },
  });

  useEffect(() => {
    if (clientType === "minor") {
      setClientTabs([
        { id: "client", label: "Client" },
        { id: "contact", label: "Contact" },
      ]);
      setActiveTab("client");
    } else if (clientType === "couple") {
      setClientTabs([
        { id: "client-1", label: "Client 1" },
        { id: "client-2", label: "Client 2" },
      ]);
      setActiveTab("client-1");
    } else if (clientType === "family") {
      setClientTabs([{ id: "client-1", label: "Client 1" }]);
      setActiveTab("client-1");
    }

    form.setFieldValue("clientType", clientType);
    initializeFormForClientType(clientType);
    setSelectedClient(null);
  }, [clientType]);

  const initializeFormForClientType = (type: string) => {
    switch (type) {
      case "minor":
        form.reset({
          clientType: type,
          clients: {
            client: { ...defaultClientData, clientType: type },
            contact: { ...defaultClientData, clientType: type },
          },
        });
        break;
      case "couple":
        form.reset({
          clientType: type,
          clients: {
            "client-1": { ...defaultClientData, clientType: type },
            "client-2": { ...defaultClientData, clientType: type },
          },
        });
        break;
      case "family":
        form.reset({
          clientType: type,
          clients: {
            "client-1": { ...defaultClientData, clientType: type },
          },
        });
        break;
      case "adult":
        form.reset({
          clientType: type,
          clients: {
            client: { ...defaultClientData, clientType: type },
          },
        });
        break;
    }
  };

  const structureData = (values: FormValues) => {
    switch (values.clientType) {
      case "minor":
        return {
          client: values.clients.client,
          contact: values.clients.contact,
        };
      case "couple":
        return {
          client1: values.clients["client-1"],
          client2: values.clients["client-2"],
        };
      case "family":
        return Object.keys(values.clients).reduce(
          (acc, key, index) => ({
            ...acc,
            [`client${index + 1}`]: values.clients[key],
          }),
          {},
        );
      case "adult":
        return { client: values.clients.client };
      default:
        return {};
    }
  };

  const handleSelectExistingClient = (selectedClientParam: Client) => {
    setSelectedClient(selectedClientParam);
    const [firstName, lastName] = selectedClientParam.name.split(" ");
    const mappedClient: FormState = {
      clientType: clientType,
      legalFirstName: firstName || "",
      legalLastName: lastName || "",
      preferredName: "",
      dob: "",
      status: "active",
      addToWaitlist: false,
      primaryClinician: "travis",
      location: "stpete",
      emails: [
        {
          address: selectedClientParam.email,
          type: "primary",
          permission: "allowed",
        },
      ],
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
    form.setFieldValue("clients.contact", mappedClient);
    setShowSelectExisting(false);
  };

  const handleClientRemoved = () => {
    setSelectedClient(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-[500px] p-0 gap-0 overflow-auto [&>button]:hidden"
        side="right"
      >
        {showSelectExisting ? (
          <SelectExistingClient
            selectedClient={selectedClient}
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
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
                <Button
                  className="bg-[#2d8467] hover:bg-[#236c53]"
                  onClick={() => form.handleSubmit()}
                >
                  Continue
                </Button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto h-[calc(100vh-72px)]">
              {/* Client Type */}
              <div className="px-6 pt-6">
                <RadioGroup
                  className="flex gap-4"
                  defaultValue="minor"
                  value={clientType}
                  onValueChange={setClientType}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="adult" value="adult" />
                    <Label htmlFor="adult">Adult</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="minor" value="minor" />
                    <Label htmlFor="minor">Minor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="couple" value="couple" />
                    <Label htmlFor="couple">Couple</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="family" value="family" />
                    <Label htmlFor="family">Family</Label>
                  </div>
                </RadioGroup>
              </div>
              {clientType !== "adult" ? (
                <ClientTabs
                  ref={tabsRef}
                  activeTab={activeTab}
                  clientTabs={clientTabs}
                  clientType={clientType}
                  form={form}
                  selectedClient={selectedClient}
                  setActiveTab={setActiveTab}
                  setClientTabs={setClientTabs}
                  onClientRemoved={handleClientRemoved}
                  onSelectExisting={setShowSelectExisting}
                />
              ) : (
                <form.Field name="clients.client">
                  {(field: any) => (
                    <ClientForm
                      clientType={clientType}
                      field={field}
                      selectedClient={selectedClient}
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
