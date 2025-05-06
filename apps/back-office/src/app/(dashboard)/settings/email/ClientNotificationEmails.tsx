"use client";

import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from "@mcw/ui";
import { ChevronDown, Pencil } from "lucide-react";
import EmailTemplateEditSidebar from "./EmailTemplateEditSidebar";
import { useEmailTemplates, useEmailTemplate } from "./hooks/useEmailTemplate";
import { useForm } from "@tanstack/react-form";
import { UpdateTemplateData } from "./types";

const reminderEmailTabs = [
  { label: "Client emails", value: "client" },
  { label: "Contact and couple emails", value: "contact" },
];

export default function ClientNotificationEmails() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const form = useForm({
    defaultValues: {
      autoTab: "client",
      reminderTab: "client",
      remindersOn: true,
      reminderTime: "48",
      isAutoSectionOpen: true,
      isReminderSectionOpen: true,
      isBillingSectionOpen: true,
      openIndexes: new Set<number>(),
      openReminderIndexes: new Set<number>(),
      openBillingIndexes: new Set<number>(),
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  const { templates, isLoading } = useEmailTemplates();
  const selectedTemplate =
    editIndex !== null && templates ? templates[editIndex] : null;
  const templateId = selectedTemplate?.id;
  const { updateTemplate, isUpdating } = useEmailTemplate(templateId);

  const toggleOpen = (i: number) => {
    const currentIndexes = form.getFieldValue("openIndexes") as Set<number>;
    const next = new Set(currentIndexes);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
    }
    form.setFieldValue("openIndexes", next);
  };

  const toggleReminderOpen = (i: number) => {
    const currentIndexes = form.getFieldValue(
      "openReminderIndexes",
    ) as Set<number>;
    const next = new Set(currentIndexes);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
    }
    form.setFieldValue("openReminderIndexes", next);
  };

  const toggleBillingOpen = (i: number) => {
    const currentIndexes = form.getFieldValue(
      "openBillingIndexes",
    ) as Set<number>;
    const next = new Set(currentIndexes);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
    }
    form.setFieldValue("openBillingIndexes", next);
  };

  const handleEdit = (i: number) => {
    setEditIndex(i);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setEditIndex(null), 300);
  };

  const handleSave = (formData: UpdateTemplateData) => {
    if (!templateId) return;
    updateTemplate(formData, {
      onSuccess: () => {
        closeDrawer();
      },
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Automated emails */}
      <section className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            aria-label={
              form.getFieldValue("isAutoSectionOpen")
                ? "Collapse section"
                : "Expand section"
            }
            onClick={() =>
              form.setFieldValue(
                "isAutoSectionOpen",
                !form.getFieldValue("isAutoSectionOpen"),
              )
            }
            className="transition-transform"
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-900 transition-transform ${form.getFieldValue("isAutoSectionOpen") ? "" : "rotate-180"}`}
            />
          </button>
          <h2 className="font-semibold text-lg">Automated emails</h2>
        </div>
        {form.getFieldValue("isAutoSectionOpen") && (
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
                <TabsTrigger
                  value="client"
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
                  Client emails
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
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
                  Contact and couple emails
                </TabsTrigger>
              </TabsList>
              <TabsContent value="client">
                <div className="divide-y divide-gray-200">
                  {templates?.map((template, i) => (
                    <div key={template.id}>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-800">
                          {template.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={
                              (
                                form.getFieldValue("openIndexes") as Set<number>
                              ).has(i)
                                ? "Collapse"
                                : "Expand"
                            }
                            onClick={() => toggleOpen(i)}
                            className="transition-transform"
                          >
                            <ChevronDown
                              className={`w-5 h-5 text-gray-900 transition-transform ${(form.getFieldValue("openIndexes") as Set<number>).has(i) ? "rotate-180" : ""}`}
                            />
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="p-1"
                            onClick={() => handleEdit(i)}
                          >
                            <Pencil className="w-5 h-5 text-gray-900" />
                          </Button>
                        </div>
                      </div>
                      {(form.getFieldValue("openIndexes") as Set<number>).has(
                        i,
                      ) && (
                        <div className="bg-white border rounded-lg p-6 mt-2 mb-4">
                          <div className="font-semibold text-lg mb-2">
                            {template.name}
                          </div>
                          <div className="mb-2 flex flex-col gap-1">
                            <div className="flex gap-2 text-sm">
                              <span className="text-gray-500 w-16">From</span>{" "}
                              <span>yourprovider@simplepractice.com</span>
                            </div>
                            <div className="flex gap-2 text-sm">
                              <span className="text-gray-500 w-16">
                                Subject
                              </span>{" "}
                              <span>{template.subject}</span>
                            </div>
                            <div className="flex gap-2 text-sm items-start">
                              <span className="text-gray-500 w-16">
                                Message
                              </span>
                              <span className="whitespace-pre-line">
                                {template.content}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Type: {template.type}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: {template.isActive ? "Active" : "Inactive"}
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
      <section className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={
                form.getFieldValue("isReminderSectionOpen")
                  ? "Collapse section"
                  : "Expand section"
              }
              onClick={() =>
                form.setFieldValue(
                  "isReminderSectionOpen",
                  !form.getFieldValue("isReminderSectionOpen"),
                )
              }
              className="transition-transform"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-900 transition-transform ${form.getFieldValue("isReminderSectionOpen") ? "" : "rotate-180"}`}
              />
            </button>
            <h2 className="font-semibold text-lg">Reminder emails</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Reminders are on</span>
            <Switch
              checked={form.getFieldValue("remindersOn")}
              onCheckedChange={(checked) =>
                form.setFieldValue("remindersOn", checked)
              }
            />
          </div>
        </div>
        {form.getFieldValue("isReminderSectionOpen") && (
          <>
            <p className="text-gray-600 text-sm mb-4">
              Customize the content for your email reminders.
            </p>
            <div className="bg-[#EFF6FF] rounded p-3 text-xs text-gray-600 mb-2">
              Clients only receive reminders if they're also enabled at the
              client level.
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-400 text-[#374151]">
                Send email reminder
              </span>
              <Select
                value={form.getFieldValue("reminderTime")}
                onValueChange={(value) =>
                  form.setFieldValue("reminderTime", value)
                }
              >
                <SelectTrigger className="w-28 h-8 text-sm font-400 text-[#374151]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm font-400 text-[#374151]">
                before start time of appointment
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              In addition, an email reminder is sent 10 minutes before the start
              time of Telehealth appointments.
              <br />
              Cancellation messages are sent upon the cancellation of an
              appointment.
            </div>
            <Tabs
              value={form.getFieldValue("reminderTab")}
              onValueChange={(value) =>
                form.setFieldValue("reminderTab", value)
              }
              className="mt-4"
            >
              <TabsList className="border-b bg-white justify-start gap-8">
                {reminderEmailTabs.map((tab) => (
                  <TabsTrigger
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
                    key={tab.value}
                    value={tab.value}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="client">
                <div className="divide-y divide-gray-200">
                  {[
                    "Appointment reminder",
                    "Telehealth appointment reminder",
                    "Document completion reminder",
                    "Cancellation message",
                  ].map((label, i) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-gray-800">{label}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={
                            (
                              form.getFieldValue(
                                "openReminderIndexes",
                              ) as Set<number>
                            ).has(i)
                              ? "Collapse"
                              : "Expand"
                          }
                          onClick={() => toggleReminderOpen(i)}
                          className="transition-transform"
                        >
                          <ChevronDown
                            className={`w-5 h-5 text-gray-900 transition-transform ${(form.getFieldValue("openReminderIndexes") as Set<number>).has(i) ? "rotate-180" : ""}`}
                          />
                        </button>
                        <Button size="icon" variant="ghost" className="p-1">
                          <Pencil className="w-5 h-5 text-gray-900" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="contact">
                <div className="text-gray-500 text-sm">
                  Contact and couple reminders coming soon...
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </section>

      {/* Billing document emails */}
      <section className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            aria-label={
              form.getFieldValue("isBillingSectionOpen")
                ? "Collapse section"
                : "Expand section"
            }
            onClick={() =>
              form.setFieldValue(
                "isBillingSectionOpen",
                !form.getFieldValue("isBillingSectionOpen"),
              )
            }
            className="transition-transform"
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-900 transition-transform ${form.getFieldValue("isBillingSectionOpen") ? "" : "rotate-180"}`}
            />
          </button>
          <h2 className="font-semibold text-lg">Billing document emails</h2>
        </div>
        {form.getFieldValue("isBillingSectionOpen") && (
          <>
            <p className="text-gray-600 text-sm mb-4">
              Customize the content for your billing document emails
            </p>
            <div className="divide-y divide-gray-200">
              {[
                "Default invoice emails",
                "Default statement emails",
                "Default superbill emails",
              ].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-800">{label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={
                        (
                          form.getFieldValue(
                            "openBillingIndexes",
                          ) as Set<number>
                        ).has(i)
                          ? "Collapse"
                          : "Expand"
                      }
                      onClick={() => toggleBillingOpen(i)}
                      className="transition-transform"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-gray-900 transition-transform ${(form.getFieldValue("openBillingIndexes") as Set<number>).has(i) ? "rotate-180" : ""}`}
                      />
                    </button>
                    <Button size="icon" variant="ghost" className="p-1">
                      <Pencil className="w-5 h-5 text-gray-900" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Edit Message Drawer */}
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
