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
import { useForm } from "@tanstack/react-form";
import { EmailTemplate, ClientGroupData, ClinicianData } from "../types";
import { renderTemplateWithButton } from "../utils/templateRenderer";

interface ReminderEmailsProps {
  templates: EmailTemplate[];
  clientData: ClientGroupData | null;
  clinicianData: ClinicianData | null;
  onEdit: (template: EmailTemplate) => void;
}

export function ReminderEmails({
  templates,
  clientData,
  clinicianData,
  onEdit,
}: ReminderEmailsProps) {
  const [isReminderSectionOpen, setIsReminderSectionOpen] = useState(true);
  const [openReminderIndexes, setOpenReminderIndexes] = useState<Set<string>>(
    new Set(),
  );

  const form = useForm({
    defaultValues: {
      reminderTab: "client",
      remindersOn: true,
      reminderTime: "48",
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  const reminderTemplates = templates.filter(
    (template) => template.type === "reminder",
  );
  const reminderEmailTabs = [
    { label: "Client reminders", value: "client" },
    { label: "Contact and couple reminders", value: "contact" },
  ];

  const toggleReminderOpen = (templateId: string) => {
    setOpenReminderIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  return (
    <section className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={
              isReminderSectionOpen ? "Collapse section" : "Expand section"
            }
            onClick={() => setIsReminderSectionOpen(!isReminderSectionOpen)}
            className="transition-transform"
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-900 transition-transform ${isReminderSectionOpen ? "" : "rotate-180"}`}
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
      {isReminderSectionOpen && (
        <>
          <p className="text-gray-600 text-sm mb-4">
            Customize the content for your email reminders.
          </p>
          <div className="bg-[#EFF6FF] rounded p-3 text-xs text-gray-600 mb-2">
            Clients only receive reminders if they're also enabled at the client
            level.
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
            onValueChange={(value) => form.setFieldValue("reminderTab", value)}
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
                {reminderTemplates.map((template) => (
                  <div key={template.id}>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-800">
                        {template.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={
                            openReminderIndexes.has(template.id)
                              ? "Collapse"
                              : "Expand"
                          }
                          onClick={() => toggleReminderOpen(template.id)}
                          className="transition-transform"
                        >
                          <ChevronDown
                            className={`w-5 h-5 text-gray-900 transition-transform ${openReminderIndexes.has(template.id) ? "rotate-180" : ""}`}
                          />
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="p-1"
                          onClick={() => onEdit(template)}
                        >
                          <Pencil className="w-5 h-5 text-gray-900" />
                        </Button>
                      </div>
                    </div>
                    {openReminderIndexes.has(template.id) && (
                      <div className="bg-white border rounded-lg p-6 mt-2 mb-4">
                        <div className="font-semibold text-lg mb-2">
                          {template.name}
                        </div>
                        <div className="mb-2 flex flex-col gap-1">
                          <div className="flex gap-2 text-sm">
                            <span className="text-gray-500 w-16">From</span>{" "}
                            <span>yourprovider@mcw.com</span>
                          </div>
                          <div className="flex gap-2 text-sm">
                            <span className="text-gray-500 w-16">Subject</span>{" "}
                            <span className="whitespace-pre-line flex items-center flex-wrap">
                              {renderTemplateWithButton(
                                template.subject || "",
                                clientData,
                                clinicianData,
                              )}
                            </span>
                          </div>
                          <div className="flex gap-2 text-sm items-start">
                            <span className="text-gray-500 w-16">Message</span>
                            <span className="whitespace-pre-line flex items-center flex-wrap">
                              {renderTemplateWithButton(
                                template.content,
                                clientData,
                                clinicianData,
                              )}
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
                Contact and couple reminders coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </section>
  );
}
