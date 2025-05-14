import { Button } from "@mcw/ui";
import ClientPortalCard from "./components/client-portal";
import AppointmentRequestsCard from "./components/appointment-requests";
import FileUploadCard from "./components/file-upload";
import ClientPortalGreetingCard from "./components/client-portal-greeting";

export default function ClientPortalDashboard() {
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
          <Button variant="default">Save Changes</Button>
        </div>
        <ClientPortalCard />
        <AppointmentRequestsCard />
        <FileUploadCard />
        <ClientPortalGreetingCard />
      </div>
    </div>
  );
}
