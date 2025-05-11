"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@mcw/ui";
import { ChevronDown, Pencil } from "lucide-react";
import EmailTemplateEditSidebar from "./EmailTemplateEditSidebar";
import { useEmailTemplates, useEmailTemplate } from "./hooks/useEmailTemplate";
import { useForm } from "@tanstack/react-form";
import {
  UpdateTemplateData,
  EmailTemplate,
  ClientGroupData,
  ClinicianData,
} from "./types";
import { ReminderEmails } from "./components/ReminderEmails";
import { BillingEmails } from "./components/BillingEmails";
import { renderTemplateWithButton } from "./utils/templateRenderer";

const automatedEmailTabs = [
  { label: "Client emails", value: "client" },
  { label: "Contact and couple emails", value: "contact" },
];

export default function ClientNotificationEmails() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [clientData, setClientData] = useState<ClientGroupData | null>(null);
  const [clinicianData, setClinicianData] = useState<ClinicianData | null>(
    null,
  );
  const {
    error,
    templates,
    isLoading,
    openIndexes,
    setOpenIndexes,
    isAutoSectionOpen,
    setIsAutoSectionOpen,
  } = useEmailTemplates();

  useEffect(() => {
    const fetchClientGroupData = async () => {
      try {
        const response = await fetch("/api/client/group");
        const data = await response.json();
        setClientData(data.data[0]);
      } catch (error) {
        console.error("Error fetching client group data:", error);
      }
    };

    const fetchClinicianData = async () => {
      try {
        const response = await fetch("/api/clinician");
        const data = await response.json();
        setClinicianData(data[0]);
      } catch (error) {
        console.error("Error fetching clinician data:", error);
      }
    };

    fetchClientGroupData();
    fetchClinicianData();
  }, []);

  const form = useForm({
    defaultValues: {
      autoTab: "client",
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  const { updateTemplate, isUpdating } = useEmailTemplate(selectedTemplate?.id);

  const automatedTemplates =
    templates?.filter((template) => template.type === "automated") || [];

  const toggleOpen = (templateId: string) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedTemplate(null), 300);
  };

  const handleSave = (formData: UpdateTemplateData) => {
    if (!selectedTemplate?.id) return;
    updateTemplate(formData, {
      onSuccess: () => {
        closeDrawer();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Automated emails */}
      <section className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            aria-label={
              isAutoSectionOpen ? "Collapse section" : "Expand section"
            }
            onClick={() => setIsAutoSectionOpen(!isAutoSectionOpen)}
            className="transition-transform"
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-900 transition-transform ${isAutoSectionOpen ? "" : "rotate-180"}`}
            />
          </button>
          <h2 className="font-semibold text-lg">Automated emails</h2>
        </div>
        {isAutoSectionOpen && (
          <>
            <p className="text-gray-600 text-sm mb-4">
              You can view and customize the content of these templates.{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Learn more
              </a>
            </p>
            <Tabs
              value={form.getFieldValue("autoTab")}
              onValueChange={(value) => form.setFieldValue("autoTab", value)}
              className="mb-4"
            >
              <TabsList className="border-b bg-white justify-start gap-8">
                {automatedEmailTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`
                      pb-2 font-normal text-sm transition
                      data-[state=active]:!bg-transparent
                      data-[state=active]:!shadow-none
                      data-[state=active]:!rounded-none
                      data-[state=active]:text-[#2D8467]
                      data-[state=active]:border-b-2
                      data-[state=active]:border-[#2D8467]
                      border-b-4 border-transparent
                      focus:outline-none
                    `}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="client">
                <div className="divide-y divide-gray-200">
                  {automatedTemplates.map((template) => (
                    <div key={template.id}>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-800">
                          {template.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={
                              openIndexes.has(template.id)
                                ? "Collapse"
                                : "Expand"
                            }
                            onClick={() => toggleOpen(template.id)}
                            className="transition-transform"
                          >
                            <ChevronDown
                              className={`w-5 h-5 text-gray-900 transition-transform ${openIndexes.has(template.id) ? "rotate-180" : ""}`}
                            />
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="p-1"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="w-5 h-5 text-gray-900" />
                          </Button>
                        </div>
                      </div>
                      {openIndexes.has(template.id) && (
                        <div className="bg-white border rounded-lg p-6 mt-2 mb-4">
                          <div className="font-semibold text-lg mb-2">
                            {template.name}
                          </div>
                          <div className="mb-2 flex flex-col gap-1">
                            <div className="flex gap-2 text-sm">
                              <span className="text-gray-500 w-16">From</span>{" "}
                              <span>yourprovider@mcw.com</span>
                            </div>
                            <div className="flex gap-2 text-sm mt-3">
                              <span className="text-gray-500 w-16">
                                Subject
                              </span>{" "}
                              <span className="whitespace-pre-line flex items-center flex-wrap">
                                {renderTemplateWithButton(
                                  template.subject || "",
                                  clientData,
                                  clinicianData,
                                )}
                              </span>
                            </div>
                            <div className="flex gap-2 text-sm items-start mt-3">
                              <span className="text-gray-500 w-16">
                                Message
                              </span>
                              <span className="whitespace-pre-line flex items-center flex-wrap">
                                {renderTemplateWithButton(
                                  template.content,
                                  clientData,
                                  clinicianData,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="contact">
                <div className="text-gray-500 text-sm">
                  Contact and couple emails coming soon...
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </section>

      {/* Reminder emails */}
      <ReminderEmails
        templates={templates}
        clientData={clientData}
        clinicianData={clinicianData}
        onEdit={handleEdit}
      />

      {/* Billing document emails */}
      <BillingEmails
        templates={templates}
        clientData={clientData}
        clinicianData={clinicianData}
        onEdit={handleEdit}
      />

      <EmailTemplateEditSidebar
        open={drawerOpen}
        onClose={closeDrawer}
        template={selectedTemplate}
        onSave={handleSave}
        isUpdating={isUpdating}
      />
    </div>
  );
}
