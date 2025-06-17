import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@mcw/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchSingleClientGroup } from "@/(dashboard)/clients/services/client.service";

interface ClientInfo {
  preferred_name?: string;
  legal_first_name?: string;
  legal_last_name?: string;
}

interface ClientGroupMembership {
  Client: ClientInfo;
}

interface ClientGroup {
  ClientGroupMembership?: ClientGroupMembership[];
}

// Helper function to extract client name from client group
function getClientGroupInfo(clientGroup: ClientGroup) {
  if (!clientGroup?.ClientGroupMembership) {
    return "";
  }

  const memberNames = clientGroup.ClientGroupMembership.map(
    (membership: ClientGroupMembership) => {
      const client = membership.Client;
      const firstName =
        client?.preferred_name || client?.legal_first_name || "";
      const lastName = client?.legal_last_name || "";
      return `${firstName} ${lastName}`.trim();
    },
  ).filter(Boolean);

  return memberNames.join(" & ");
}

export default function NavigationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const params = useParams();

  // Fetch client data to get the name
  const { data: clientGroup } = useQuery({
    queryKey: ["clientGroup", params.id],
    queryFn: () => fetchSingleClientGroup({ id: params.id as string }),
    enabled: !!params.id,
  });

  const clientName = clientGroup ? getClientGroupInfo(clientGroup) : "";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#2d8467] hover:bg-[#236c53] flex items-center gap-1">
          New
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onSelect={() =>
            router.push(`/clients/${params.id}/diagnosisAndTreatmentPlan`)
          }
        >
          Diagnosis and treatment plan
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            router.push(`/clients/${params.id}/goodFaithEstimate`)
          }
        >
          Good faith estimate
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push(`/clients/${params.id}/mentalStatusExam`)}
        >
          Mental Status Exam
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            const searchParams = new URLSearchParams();
            if (clientName) {
              searchParams.set("clientName", clientName);
            }
            router.push(
              `/clients/${params.id}/scoredMeasure?${searchParams.toString()}`,
            );
          }}
        >
          Scored Measure
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push(`/clients/${params.id}/otherDocuments`)}
        >
          Other document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
