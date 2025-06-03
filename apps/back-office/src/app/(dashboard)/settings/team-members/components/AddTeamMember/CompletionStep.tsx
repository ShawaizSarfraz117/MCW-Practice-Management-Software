"use client";

import { Button } from "@mcw/ui";
import { CheckCircle2 } from "lucide-react";
import { TeamMember } from "@/(dashboard)/settings/team-members/hooks/useRolePermissions";

interface CompletionStepProps {
  teamMemberData: Partial<TeamMember>;
  onClose: () => void;
}

export default function CompletionStep({
  teamMemberData,
  onClose,
}: CompletionStepProps) {
  const fullName =
    `${teamMemberData.firstName || ""} ${teamMemberData.lastName || ""}`.trim();

  return (
    <div className="flex flex-col items-center py-6 text-center space-y-4">
      <div className="rounded-full bg-green-50 p-3">
        <CheckCircle2 className="h-12 w-12 text-[#2D8467]" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          Team Member Created Successfully
        </h3>
        <p className="text-gray-600 max-w-md">
          {fullName} has been added to your team as a {teamMemberData.role}.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 w-full mt-6 max-w-md">
        <div className="flex flex-col space-y-3 text-left">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{fullName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{teamMemberData.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">{teamMemberData.role}</p>
          </div>

          {teamMemberData.specialty && (
            <div>
              <p className="text-sm text-gray-500">Specialty</p>
              <p className="font-medium">{teamMemberData.specialty}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex space-x-3 w-full justify-center">
        <Button
          className="bg-[#2D8467] text-white hover:bg-[#256b53]"
          onClick={onClose}
        >
          Done
        </Button>
        <Button variant="outline">View Team Member</Button>
      </div>
    </div>
  );
}
