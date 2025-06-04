"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@mcw/ui";
import { Info } from "lucide-react";
import { useState } from "react";

const TABS = [
  { label: "Appointment reminders", value: "appointment" },
  { label: "Telehealth reminders", value: "telehealth" },
  { label: "Document reminders", value: "document" },
  { label: "Cancellation message", value: "cancellation" },
];

const REMINDER_TIMES = [
  { label: "24 hours", value: "24h" },
  { label: "12 hours", value: "12h" },
  { label: "2 hours", value: "2h" },
  { label: "1 hour", value: "1h" },
  { label: "30 minutes", value: "30m" },
];

const DEFAULT_TEXTS = {
  appointment:
    "Reminder for {client_first_name_formatted} appointment on {appointment_date} at {appointment_time} with {practice_name}.",
  telehealth:
    "Your telehealth appointment is scheduled for {appointment_date} at {appointment_time}.",
  document:
    "Please review and sign your documents before your appointment on {appointment_date}.",
  cancellation:
    "Your appointment on {appointment_date} has been cancelled. Please contact us to reschedule.",
};

export default function TextSettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("appointment");

  // State for each tab's content
  const [tabSettings, setTabSettings] = useState(
    Object.fromEntries(
      TABS.map((tab) => [
        tab.value,
        {
          reminderTime: "24h",
          text: DEFAULT_TEXTS[tab.value as keyof typeof DEFAULT_TEXTS],
        },
      ]),
    ),
  );

  const handleReminderTimeChange = (tabValue: string, time: string) => {
    setTabSettings((prev) => ({
      ...prev,
      [tabValue]: {
        ...prev[tabValue],
        reminderTime: time,
      },
    }));
  };

  const handleTextChange = (tabValue: string, text: string) => {
    setTabSettings((prev) => ({
      ...prev,
      [tabValue]: {
        ...prev[tabValue],
        text,
      },
    }));
  };

  return (
    <>
      {/* Header */}
      <h1 className="text-2xl font-semibold mb-2 text-gray-900">Text</h1>
      <p className="text-gray-600 mb-6 text-base">
        Automate reminder text messages.
      </p>

      {/* Info alert with toggle */}
      <Alert className="flex items-center gap-4 bg-blue-50 border-0 mb-6 p-5 sm:p-6">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-base font-semibold text-gray-900 mb-0">
            Text Reminders
          </AlertTitle>
          <AlertDescription className="text-sm text-gray-700 mt-0">
            Customize the content for your text reminders. Note: Clients only
            receive reminders if they are also enabled at the client level.{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Learn more
            </a>
          </AlertDescription>
        </div>
        <div className="flex items-start ml-4">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-transparent flex justify-start items-center gap-2 sm:gap-6 p-0 rounded-none h-auto min-h-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={`pb-2 font-normal h-full border data-[state=active]:border-b-2 data-[state=active]:rounded-md text-sm transition data-[state=active]:!shadow-none data-[state=active]:text-[#2D8467] data-[state=active]:bg-[#2D8467]/20 border-b-4 border-transparent focus:outline-none`}
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="pt-6 px-0">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Form */}
              <Card className="flex-1 bg-white border border-gray-200 shadow-sm rounded-xl p-0">
                <CardContent className="p-6">
                  {/* Reminder time select */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label
                      htmlFor={`reminder-time-${t.value}`}
                      className="text-sm text-gray-700 font-medium mr-2 mb-0"
                    >
                      Send text reminder
                    </Label>
                    <div className="w-40">
                      <Select
                        value={tabSettings[t.value].reminderTime}
                        onValueChange={(val) =>
                          handleReminderTimeChange(t.value, val)
                        }
                      >
                        <SelectTrigger
                          id={`reminder-time-${t.value}`}
                          className="h-9 text-sm bg-white border-gray-300"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REMINDER_TIMES.map((rt) => (
                            <SelectItem
                              key={rt.value}
                              value={rt.value}
                              className="text-sm"
                            >
                              {rt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-sm text-gray-700 ml-0 sm:ml-2">
                      before start time of appointment
                    </span>
                  </div>

                  {/* Textarea */}
                  <CardHeader className="py-2 !px-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1 p-0">
                      Customize text reminder
                    </CardTitle>
                  </CardHeader>
                  <div className="flex flex-row lg:flex-col">
                    <div className="flex flex-col w-2/3 mr-20 justify-start items-start mb-2">
                      <div className="w-full border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <Textarea
                          value={tabSettings[t.value].text}
                          onChange={(e) =>
                            handleTextChange(t.value, e.target.value)
                          }
                          rows={5}
                          maxLength={500}
                          className="resize-none text-sm bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-[#2D8467]"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex gap-2">
                            <Button
                              variant="link"
                              className="text-[#2D8467] px-0 h-auto text-[16px] font-medium"
                            >
                              Add information
                            </Button>
                            <Button
                              variant="link"
                              className="text-[#2D8467] px-0 h-auto text-[16px] font-medium"
                            >
                              Add confirm / cancel link
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {tabSettings[t.value].text.length}/500
                      </div>
                    </div>
                    <div className="flex flex-col border-l-[10px] border-r-[10px] border-t-[10px] rounded-t-3xl p-5 bg-[#F4F4F4] border-[#DADADA] w-[350px] h-[500px] justify-start items-center gap-4">
                      <div className="w-[60px] h-[20px] bg-[#DADADA] rounded-3xl"></div>
                      <div className="w-full max-w-xs shadow-lg">
                        <div className="flex flex-col items-center">
                          <div className="relative w-[295px] h-[110px] border border-gray-200 bg-white rounded-lg shadow-sm flex items-center justify-center">
                            <div className="absolute top-2 left-2 text-[11px] text-gray-500 whitespace-pre-line leading-tight">
                              {tabSettings[t.value].text}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
