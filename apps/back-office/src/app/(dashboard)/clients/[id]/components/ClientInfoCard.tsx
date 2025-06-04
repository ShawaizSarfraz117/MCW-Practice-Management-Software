import { ClientGroup, ClientGroupMembership, Client } from "@prisma/client";
import { useRouter } from "next/navigation";
interface ClientInfoCardProps {
  clientGroup: ClientGroup & {
    ClientGroupMembership: (ClientGroupMembership & {
      Client: Client;
    })[];
  };
}

export function ClientInfoCard({ clientGroup }: ClientInfoCardProps) {
  const router = useRouter();
  // Collapsible section states
  return (
    <div className="p-4 sm:p-6 border border-[#e5e7eb] rounded-md">
      <div className="flex justify-between mb-2">
        <h3 className="font-medium">Client info</h3>

        <button
          className="text-blue-500 hover:underline text-sm"
          onClick={() => router.push(`/clients/${clientGroup.id}/edit`)}
        >
          Edit
        </button>
      </div>
      {clientGroup?.ClientGroupMembership?.map((membership) => (
        <div
          key={membership.Client.id}
          className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
        >
          <div className="text-sm text-blue-500">
            {membership?.Client?.legal_first_name}{" "}
            {membership?.Client?.legal_last_name}
          </div>
        </div>
      ))}
    </div>
  );
}
