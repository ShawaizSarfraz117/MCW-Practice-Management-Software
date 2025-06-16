"use client";

import DataTable from "@/components/table/DataTable";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@mcw/ui";
import { SafeUserWithRelations } from "@mcw/types";

interface MemberTableProps {
  rows: SafeUserWithRelations[];
  onRowClick: (row: object) => void;
}

// Use the shared type from @mcw/types instead of creating a local interface
export type TeamMember = SafeUserWithRelations;

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

    // Map role names to display-friendly names
    const roleDisplayMap: Record<string, string> = {
      ADMIN: "Admin",
      "ADMIN.PRACTICE-MANAGER": "Admin - Practice Manager",
      "ADMIN.PRACTICE-BILLER": "Admin - Practice Biller",
      "CLINICIAN.BASIC": "Clinician - Basic Access",
      "CLINICIAN.BILLING": "Clinician - Billing Access",
      "CLINICIAN.FULL-CLIENT-LIST": "Clinician - Full Client List",
      "CLINICIAN.ENTIRE-PRACTICE": "Clinician - Entire Practice",
      "CLINICIAN.SUPERVISOR": "Clinician - Supervisor",
    };

    const roleNames = member.UserRole.map((ur) => {
      const roleName = ur.Role.name;
      return roleDisplayMap[roleName] || roleName;
    });

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

  const getLicenseInfo = (member: TeamMember) => {
    if (
      !member.Clinician ||
      !member.Clinician.License ||
      member.Clinician.License.length === 0
    ) {
      return "No license";
    }

    const license = member.Clinician.License[0];
    const expirationDate = new Date(license.expiration_date);
    const isExpired = expirationDate < new Date();

    return {
      number: license.license_number,
      state: license.state,
      isExpired,
      expirationDate: expirationDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    };
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
      key: "license",
      label: "License",
      value: "license",
      formatter: (value: unknown) => {
        const member = value as TeamMember;
        const licenseInfo = getLicenseInfo(member);

        if (licenseInfo === "No license") {
          return <div className="text-gray-500 text-sm">{licenseInfo}</div>;
        }

        return (
          <div className="text-sm">
            <div className="text-gray-700">
              {licenseInfo.number} ({licenseInfo.state})
            </div>
            <div
              className={
                licenseInfo.isExpired ? "text-red-600" : "text-gray-500"
              }
            >
              Exp: {licenseInfo.expirationDate}
            </div>
          </div>
        );
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
