import { Button } from "@mcw/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";
import { ClientForm, ClientFormRef } from "./ClientForm";
import { forwardRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";

interface ClientTabsProps {
  clientType: string;
  onSubmit: (values: object) => void;
}

export const ClientTabs = forwardRef<ClientFormRef, ClientTabsProps>(
  function ClientTabs({ clientType, onSubmit }, ref) {
    const [activeTab, setActiveTab] = useState("");
    const [clientTabs, setClientTabs] = useState<
      Array<{ id: string; label: string }>
    >([]);

    useEffect(() => {
      // Initialize tabs based on clientType
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
    }, [clientType]);

    const addClientTab = () => {
      const newTabId = `client-${clientTabs.length + 1}`;
      const newTabLabel = `Client ${clientTabs.length + 1}`;
      setClientTabs([...clientTabs, { id: newTabId, label: newTabLabel }]);
      setActiveTab(newTabId);
    };

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-[#e5e7eb] overflow-x-auto">
          <div className="px-4 sm:px-6">
            <TabsList className="h-[40px] bg-transparent p-0 w-auto">
              {clientTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                    activeTab === tab.id
                      ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]"
                      : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
              {clientType === "family" && (
                <button
                  onClick={addClientTab}
                  className="flex items-center px-4 h-10 text-[#2d8467] hover:bg-gray-50"
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
            value={tab.id}
            className="mt-0 pb-16 lg:pb-6"
          >
            {tab.id === "contact" ? (
              <>
                <div className="px-6 mt-2">
                  <Button
                    variant="outline"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Add Existing Client or Contact
                  </Button>
                </div>
                <ClientForm
                  ref={ref}
                  clientType={clientType}
                  onSubmit={onSubmit}
                />
              </>
            ) : (
              <ClientForm
                ref={ref}
                clientType={clientType}
                onSubmit={onSubmit}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    );
  },
);
