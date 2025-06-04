"use client";
import { Button, Card } from "@mcw/ui";

export default function CalendarSettingsPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937] mb-1">
              Client Portal Permissions
            </h1>
            <p className="text-[#6B7280] text-base">
              Online appointment requests, client permissions and greetings.
            </p>
          </div>
          <Button className="bg-[#188153] hover:bg-[#146945] text-white font-medium px-6 py-2 rounded-md">
            Save Changes
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
              <select className="w-[277px] h-10 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white">
                <option>7:00 AM</option>
              </select>
              <span className="self-center text-[#6B7280]">to</span>
              <select className="w-[277px] h-10 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white">
                <option>11:00 PM</option>
              </select>
            </div>
            <select className="w-[600px] h-10 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white">
              <option>Show full week</option>
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
            <select className="w-[277px] h-10 sm:w-64 p-2 border border-[#E5E7EB] rounded-md text-sm bg-white">
              <option>At least 24 hours</option>
            </select>
          </div>
        </Card>
      </div>
    </div>
  );
}
