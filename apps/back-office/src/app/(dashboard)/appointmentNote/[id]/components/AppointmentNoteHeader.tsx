import { Button } from "@mcw/ui";
import { FileText, Video, MoreHorizontal } from "lucide-react";

interface AppointmentNoteHeaderProps {
  clientInfo: {
    legal_first_name: string;
    legal_last_name: string;
    date_of_birth?: string | null;
  } | null;
}

export function AppointmentNoteHeader({
  clientInfo,
}: AppointmentNoteHeaderProps) {
  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {clientInfo
              ? `${clientInfo.legal_first_name} ${clientInfo.legal_last_name}`
              : "Client"}
          </h1>
          <span className="text-gray-500">
            {clientInfo?.date_of_birth
              ? new Date(clientInfo.date_of_birth).toLocaleDateString()
              : "DOB not available"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost">
            <FileText className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost">
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
