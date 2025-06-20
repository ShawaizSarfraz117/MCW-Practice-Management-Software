"use client";
import { Button } from "@mcw/ui";
import ClientPortalCard from "./components/client-portal";
import AppointmentRequestsCard from "./components/appointment-requests";
import FileUploadCard from "./components/file-upload";
import ClientPortalGreetingCard from "./components/client-portal-greeting";
import { useClientPortalSettings } from "./hooks/useClientPortalSettings";

export default function ClientPortalDashboard() {
  const { settings, loading, saving, hasChanges, stageChanges, saveChanges } =
    useClientPortalSettings();

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Client Portal Permissions
            </h1>
            <p className="text-[#6B7280] text-base">
              Online appointment requests, client permissions and greetings.
            </p>
          </div>
          <Button
            disabled={!hasChanges || saving}
            variant="default"
            onClick={saveChanges}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        <ClientPortalCard
          loading={loading}
          settings={settings}
          stageChanges={stageChanges}
        />
        <AppointmentRequestsCard
          loading={loading}
          settings={settings}
          stageChanges={stageChanges}
        />
        <FileUploadCard
          loading={loading}
          settings={settings}
          stageChanges={stageChanges}
        />
        <ClientPortalGreetingCard
          loading={loading}
          settings={settings}
          stageChanges={stageChanges}
        />
      </div>
    </div>
  );
}
