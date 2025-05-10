"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mcw/ui";
import { EditTeamMember } from "../components/EditTeamMember";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function TeamMemberEditPage() {
  const params = useParams();
  const memberId = params.id as string;

  // TODO: Replace with actual API call
  const { data: member, isLoading } = useQuery({
    queryKey: ["teamMember", memberId],
    queryFn: async () => {
      // Placeholder data - replace with actual API call
      return {
        id: memberId,
        name: "Alam Naqvi",
        email: "alam@mcwtlycw.com",
        role: "Clinician with entire practice access",
        specialty: "Behavioral health therapy",
        npiNumber: "1234567890",
        license: {
          type: "LMFT",
          number: "1234",
          expirationDate: "2025-07-11",
          state: "AL",
        },
        services: ["Individual Therapy", "Group Therapy", "Family Therapy"],
      };
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!member) {
    return <div>Team member not found</div>;
  }

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/settings">Settings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/settings/team-members">Team members</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{member.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <EditTeamMember member={member} />
    </div>
  );
}
