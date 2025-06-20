"use client";
import { Button, Card } from "@mcw/ui";
import { useCalendarSettings } from "./hooks/useCalendarSettings";

export default function CalendarSettingsPage() {
  const { settings, loading, saving, hasChanges, saveChanges, stageSetting } =
    useCalendarSettings();

  const handleStartTimeChange = (value: string) => {
    stageSetting("display", "startTime", value);
  };

  const handleEndTimeChange = (value: string) => {
    stageSetting("display", "endTime", value);
  };

  const handleViewModeChange = (value: string) => {
    stageSetting("display", "viewMode", value);
  };

  const handleCancellationNoticeChange = (value: string) => {
    const hours = parseInt(value.match(/\d+/)?.[0] || "24");
    stageSetting("display", "cancellationNoticeHours", hours);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937] mb-1">
              Calendar Settings
            </h1>
            <p className="text-[#6B7280] text-base">
              Configure calendar display and cancellation policies.
            </p>
          </div>
          <Button
            className="bg-[#188153] hover:bg-[#146945] text-white font-medium px-6 py-2 rounded-md"
            disabled={!hasChanges || saving}
            onClick={saveChanges}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        <Card className="rounded-xl shadow-sm border border-[#E5E7EB] bg-white p-6">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-[#1F2937]">
                Calendar display
              </span>
              <span className="bg-[#F3F4F6] text-[#6B7280] text-xs font-semibold px-2 py-1 rounded">
                PRACTICE SETTINGS
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-3">
              <select
                className="w-[277px] h-10 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white"
                value={settings?.display?.startTime || "7:00 AM"}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              >
                <option>6:00 AM</option>
                <option>7:00 AM</option>
                <option>8:00 AM</option>
                <option>9:00 AM</option>
              </select>
              <span className="self-center text-[#6B7280]">to</span>
              <select
                className="w-[277px] h-10 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white"
                value={settings?.display?.endTime || "11:00 PM"}
                onChange={(e) => handleEndTimeChange(e.target.value)}
              >
                <option>6:00 PM</option>
                <option>7:00 PM</option>
                <option>8:00 PM</option>
                <option>9:00 PM</option>
                <option>10:00 PM</option>
                <option>11:00 PM</option>
              </select>
            </div>
            <select
              className="w-[600px] h-10 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white"
              value={settings?.display?.viewMode || "week"}
              onChange={(e) => handleViewModeChange(e.target.value)}
            >
              <option value="week">Show full week</option>
              <option value="day">Show day view</option>
              <option value="month">Show month view</option>
            </select>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-[#1F2937]">
                Cancellation policy
              </span>
              <span className="bg-[#F3F4F6] text-[#6B7280] text-xs font-semibold px-2 py-1 rounded">
                PRACTICE SETTINGS
              </span>
            </div>
            <div className="text-[#374151] text-sm mb-3">
              How many hours before their appointment must a client cancel via
              text, voice reminders, or the Client Portal to avoid penalty?
            </div>
            <select
              className="w-[277px] h-10 sm:w-64 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white"
              value={`At least ${settings?.display?.cancellationNoticeHours || 24} hours`}
              onChange={(e) => handleCancellationNoticeChange(e.target.value)}
            >
              <option>At least 12 hours</option>
              <option>At least 24 hours</option>
              <option>At least 48 hours</option>
              <option>At least 72 hours</option>
            </select>
          </div>
        </Card>
      </div>
    </div>
  );
}
