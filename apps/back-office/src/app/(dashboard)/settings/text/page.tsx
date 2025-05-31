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
import { useState, useEffect } from "react";
import { useReminderTemplates } from "./hooks/useTextReminders";
import { useTextReminderSettings } from "./hooks/usePracticeSettings";
import AddInformationDialog from "./components/AddInformationDialog";
import AddConfirmCancelLinkDialog from "./components/AddConfirmCancelLinkDialog";

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

interface TabContentProps {
  tab: { label: string; value: string };
  settings: { reminderTime: string; text: string };
  onReminderTimeChange: (time: string) => void;
  onTextChange: (text: string) => void;
}

function TabContent({
  tab,
  settings,
  onReminderTimeChange,
  onTextChange,
}: TabContentProps) {
  const [isAddInfoDialogOpen, setIsAddInfoDialogOpen] = useState(false);
  const [isAddConfirmCancelDialogOpen, setIsAddConfirmCancelDialogOpen] =
    useState(false);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Form */}
        <Card className="flex-1 bg-white border border-gray-200 shadow-sm rounded-xl p-0">
          <CardContent className="p-6">
            {/* Reminder time select */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Label
                className="text-sm text-gray-700 font-medium mr-2 mb-0"
                htmlFor={`reminder-time-${tab.value}`}
              >
                Send text reminder
              </Label>
              <div className="w-40">
                <Select
                  value={settings.reminderTime}
                  onValueChange={onReminderTimeChange}
                >
                  <SelectTrigger
                    className="h-9 text-sm bg-white border-gray-300"
                    id={`reminder-time-${tab.value}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_TIMES.map((rt) => (
                      <SelectItem
                        key={rt.value}
                        className="text-sm"
                        value={rt.value}
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
                    className="resize-none text-sm bg-white border-gray-300 focus-visible:ring-1 focus-visible:ring-[#2D8467]"
                    maxLength={500}
                    rows={5}
                    value={settings.text}
                    onChange={(e) => onTextChange(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex gap-2">
                      <Button
                        className="text-[#2D8467] px-0 h-auto text-[16px] font-medium"
                        variant="link"
                        onClick={() => setIsAddInfoDialogOpen(true)}
                      >
                        Add information
                      </Button>
                      <Button
                        className="text-[#2D8467] px-0 h-auto text-[16px] font-medium"
                        variant="link"
                        onClick={() => setIsAddConfirmCancelDialogOpen(true)}
                      >
                        Add confirm / cancel link
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {settings.text.length}/500
                </div>
              </div>
              <div className="flex flex-col border-l-[10px] border-r-[10px] border-t-[10px] rounded-t-3xl p-5 bg-[#F4F4F4] border-[#DADADA] w-[350px] h-[500px] justify-start items-center gap-4">
                <div className="w-[60px] h-[20px] bg-[#DADADA] rounded-3xl" />
                <div className="w-full max-w-xs shadow-lg">
                  <div className="flex flex-col items-center">
                    <div className="relative w-[295px] h-[110px] border border-gray-200 bg-white rounded-lg shadow-sm flex items-center justify-center">
                      <div className="absolute top-2 left-2 text-[11px] text-gray-500 whitespace-pre-line leading-tight">
                        {settings.text}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddInformationDialog
        isOpen={isAddInfoDialogOpen}
        onAddVariable={(variable) => {
          const currentText = settings.text || "";
          const newText = currentText + " " + variable;
          onTextChange(newText);
        }}
        onClose={() => setIsAddInfoDialogOpen(false)}
      />
      <AddConfirmCancelLinkDialog
        isOpen={isAddConfirmCancelDialogOpen}
        onAddVariable={(variable) => {
          const currentText = settings.text || "";
          const newText = currentText + " " + variable;
          onTextChange(newText);
        }}
        onClose={() => setIsAddConfirmCancelDialogOpen(false)}
      />
    </>
  );
}

export default function TextSettingsPage() {
  const [activeTab, setActiveTab] = useState("appointment");
  const {
    templates,
    isLoading: templatesLoading,
    updateTemplate,
    isUpdating: templatesUpdating,
  } = useReminderTemplates();
  const {
    settings: practiceSettings,
    isLoading: practiceLoading,
    updateSettings: updatePracticeSettings,
    isUpdating: practiceUpdating,
  } = useTextReminderSettings();

  // State for each tab's content
  const [tabSettings, setTabSettings] = useState(
    Object.fromEntries(
      TABS.map((tab) => [
        tab.value,
        {
          reminderTime: practiceSettings.reminderDuration,
          text: DEFAULT_TEXTS[tab.value as keyof typeof DEFAULT_TEXTS],
        },
      ]),
    ),
  );

  // Update local state when templates are loaded from API
  useEffect(() => {
    if (templates.length > 0) {
      const templatesData = Object.fromEntries(
        templates.map((template) => [
          template.type,
          {
            reminderTime:
              template.reminderTime || practiceSettings.reminderDuration,
            text: template.content,
          },
        ]),
      );

      setTabSettings((prev) => ({
        ...prev,
        ...templatesData,
      }));
    }
  }, [templates, practiceSettings.reminderDuration]);

  // Update local state when practice settings change
  useEffect(() => {
    setTabSettings((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([key, value]) => [
          key,
          {
            ...value,
            reminderTime:
              value.reminderTime || practiceSettings.reminderDuration,
          },
        ]),
      ),
    );
  }, [practiceSettings.reminderDuration]);

  const handleReminderTimeChange = (tabValue: string, time: string) => {
    console.log(`Reminder time changed for ${tabValue} to ${time}`);

    // Update the tab settings
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

  const handleGlobalSettingsChange = (isEnabled: boolean) => {
    updatePracticeSettings({
      isTextRemindersEnabled: isEnabled,
      reminderDuration: practiceSettings.reminderDuration,
    });
  };

  const handleSaveChanges = async () => {
    console.log("handleSaveChanges called");
    console.log("Current practice settings:", practiceSettings);
    console.log("Current tab settings:", tabSettings);

    try {
      // Get the current reminder time from the active tab
      const currentReminderTime =
        tabSettings[activeTab]?.reminderTime ||
        practiceSettings.reminderDuration;

      // Save practice settings first
      console.log("Updating practice settings...");
      await updatePracticeSettings({
        isTextRemindersEnabled: practiceSettings.isTextRemindersEnabled,
        reminderDuration: currentReminderTime,
      });

      // Update each template that has changed
      console.log("Updating templates...");
      const updatePromises = TABS.map(async (tab) => {
        const templateSettings = tabSettings[tab.value];
        if (templateSettings?.text) {
          console.log(`Updating template for ${tab.value}:`, templateSettings);
          return updateTemplate({
            type: tab.value,
            content: templateSettings.text,
          });
        }
      });

      await Promise.all(updatePromises.filter(Boolean));
      console.log("All updates completed");
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  const isLoading = templatesLoading || practiceLoading;
  const isUpdating = templatesUpdating || practiceUpdating;

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-gray-900">Text</h1>
          <p className="text-gray-600 text-base">
            Automate reminder text messages.
          </p>
        </div>
        <Button
          className="bg-[#2D8467] hover:bg-[#2D8467]/90 text-white"
          disabled={isUpdating || isLoading}
          onClick={handleSaveChanges}
        >
          {isUpdating ? "Saving..." : "Save changes"}
        </Button>
      </div>

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
            <a className="text-blue-600 hover:underline" href="#">
              Learn more
            </a>
          </AlertDescription>
        </div>
        <div className="flex items-start ml-4">
          <Switch
            checked={practiceSettings.isTextRemindersEnabled}
            onCheckedChange={handleGlobalSettingsChange}
          />
        </div>
      </Alert>

      {/* Tabs */}
      <Tabs className="mb-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent flex justify-start items-center gap-2 sm:gap-6 p-0 rounded-none h-auto min-h-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              className={`pb-2 font-normal h-full border data-[state=active]:border-b-2 data-[state=active]:rounded-md text-sm transition data-[state=active]:!shadow-none data-[state=active]:text-[#2D8467] data-[state=active]:bg-[#2D8467]/20 border-b-4 border-transparent focus:outline-none`}
              value={t.value}
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        {TABS.map((t) => (
          <TabsContent key={t.value} className="pt-6 px-0" value={t.value}>
            <TabContent
              settings={tabSettings[t.value]}
              tab={t}
              onReminderTimeChange={(time) =>
                handleReminderTimeChange(t.value, time)
              }
              onTextChange={(text) => handleTextChange(t.value, text)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
