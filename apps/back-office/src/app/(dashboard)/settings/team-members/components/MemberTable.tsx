"use client";

import DataTable from "@/components/table/DataTable";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@mcw/ui";

interface MemberTableProps {
  rows: TeamMember[];
  onRowClick: (row: object) => void;
}

// Define the expected shape of team member data from the API
export interface TeamMember {
  id: string;
  email: string;
  password_hash: string;
  last_login?: string | Date | null;
  UserRole: {
    Role: {
      id: string;
      name: string;
    };
  }[];
  Clinician: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

const MemberTable = ({ rows, onRowClick }: MemberTableProps) => {
  const getInitials = (member: TeamMember) => {
    if (member.Clinician) {
      return `${member.Clinician.first_name.charAt(0)}${member.Clinician.last_name.charAt(0)}`;
    }
    const name = member.email.split("@")[0];
    return name.charAt(0).toUpperCase();
  };

  const getMemberName = (member: TeamMember) => {
    if (member.Clinician) {
      return `${member.Clinician.first_name} ${member.Clinician.last_name}`;
    }
    return member.email.split("@")[0];
  };

  const getRoleName = (member: TeamMember) => {
    if (!member.UserRole || member.UserRole.length === 0) {
      return "No role assigned";
    }

    const roleNames = member.UserRole.map((ur) => ur.Role.name);

    if (roleNames.includes("Admin")) {
      return "Admin";
    }

    if (roleNames.includes("Clinician")) {
      return member.Clinician
        ? "Clinician with entire practice access"
        : "Clinician";
    }

    return roleNames.join(", ");
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "Never";

    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${formattedDate} at ${formattedTime}`;
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      value: "name",
      formatter: (value: unknown) => {
        const member = value as TeamMember;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>{getInitials(member)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-gray-900">
                {getMemberName(member)}
              </div>
              <div className="text-gray-500">{member.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      label: "Role",
      value: "UserRole",
      formatter: (value: unknown) => {
        const member = value as TeamMember;
        return <div className="text-gray-700">{getRoleName(member)}</div>;
      },
    },
    {
      key: "lastSignIn",
      label: "Last sign in",
      value: "last_login",
      formatter: (value: unknown) => {
        const member = value as TeamMember;
        return (
          <div className="text-gray-700">{formatDate(member.last_login)}</div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      value: "id",
      formatter: (_value: unknown) => {
        return (
          <div className="text-right">
            <Badge className="bg-white text-[#2D8467] hover:bg-gray-50 border-0 cursor-pointer">
              Edit
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows as unknown as Record<string, unknown>[]}
      onRowClick={onRowClick}
    />
  );
};

export default MemberTable;
