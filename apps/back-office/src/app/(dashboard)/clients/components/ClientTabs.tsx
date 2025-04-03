/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@mcw/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";
import { ClientForm } from "./ClientForm";
import { Client } from "./SelectExistingClient";
import { forwardRef, useImperativeHandle } from "react";
import { Plus, X } from "lucide-react";

interface ClientTabsProps {
  clientType: string;
  form: any; // We'll improve this type later
  onSelectExisting: (show: boolean) => void;
  activeTab: string;
  clientTabs: Array<{ id: string; label: string }>;
  setActiveTab: (tab: string) => void;
  setClientTabs: (tabs: Array<{ id: string; label: string }>) => void;
  selectedClient: Client | null;
  onClientRemoved: () => void;
}

export const ClientTabs = forwardRef<{ submit: () => void }, ClientTabsProps>(
  (
    {
      clientType,
      form,
      setActiveTab,
      activeTab,
      clientTabs,
      setClientTabs,
      onSelectExisting,
      selectedClient,
      onClientRemoved,
    },
    ref,
  ) => {
    // const [activeTab, setActiveTab] = useState("");
    // const [clientTabs, setClientTabs] = useState<
    //   Array<{ id: string; label: string }>
    // >([]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit();
      },
    }));

    // useEffect(() => {
    //   // Initialize tabs based on clientType
    //   if (clientType === "minor") {
    //     setClientTabs([
    //       { id: "client", label: "Client" },
    //       { id: "contact", label: "Contact" },
    //     ]);
    //     setActiveTab("client");
    //   } else if (clientType === "couple") {
    //     setClientTabs([
    //       { id: "client-1", label: "Client 1" },
    //       { id: "client-2", label: "Client 2" },
    //     ]);
    //     setActiveTab("client-1");
    //   } else if (clientType === "family") {
    //     setClientTabs([{ id: "client-1", label: "Client 1" }]);
    //     setActiveTab("client-1");
    //   }
    // }, [clientType]);

    const addClientTab = () => {
      const newTabId = `client-${clientTabs.length + 1}`;
      const newTabLabel = `Client ${clientTabs.length + 1}`;
      setClientTabs([...clientTabs, { id: newTabId, label: newTabLabel }]);
      setActiveTab(newTabId);
      form.setFieldValue(`clients.${newTabId}`, {});
    };

    const handleExistingClientClick = () => {
      if (selectedClient) {
        // If there's a selected client, remove it
        form.setFieldValue("clients.contact", {});
        onClientRemoved();
      } else {
        // If no client is selected, show the selection dialog
        onSelectExisting(true);
      }
    };

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-[#e5e7eb] overflow-x-auto">
          <div className="px-4 sm:px-6">
            <TabsList className="h-[40px] bg-transparent p-0 w-auto">
              {clientTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                    activeTab === tab.id
                      ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]"
                      : "text-gray-500"
                  }`}
                  value={tab.id}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
              {clientType === "family" && (
                <button
                  className="flex items-center px-4 h-10 text-[#2d8467] hover:bg-gray-50"
                  onClick={addClientTab}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Client
                </button>
              )}
            </TabsList>
          </div>
        </div>
        {clientTabs.map((tab) => (
          <TabsContent
            key={tab.id}
            className="mt-0 pb-16 lg:pb-6"
            value={tab.id}
          >
            <form.Field name={`clients.${tab.id}`}>
              {(field: any) => (
                <>
                  {tab.id === "contact" && (
                    <div className="px-6 mt-2">
                      <Button
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                        variant="outline"
                        onClick={handleExistingClientClick}
                      >
                        {selectedClient ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {selectedClient
                          ? "Remove Existing"
                          : "Add Existing Client or Contact"}
                      </Button>
                    </div>
                  )}
                  <ClientForm
                    clientType={clientType}
                    field={field}
                    selectedClient={selectedClient}
                  />
                </>
              )}
            </form.Field>
          </TabsContent>
        ))}
      </Tabs>
    );
  },
);
