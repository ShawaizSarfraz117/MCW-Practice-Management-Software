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
import Link from "next/link";
import { useClinicianDetails } from "../services/member.service";
import Loading from "@/components/Loading";

// Import the TeamMember type from useRolePermissions instead of defining our own
import { TeamMember } from "../hooks/useRolePermissions";

export default function TeamMemberEditPage() {
  const params = useParams();
  const memberId = params.id as string;

  const {
    data: clinicianDetails,
    isLoading,
    error,
  } = useClinicianDetails(memberId);

  // Format member data for the EditTeamMember component
  const formatMemberData = (): TeamMember | null => {
    if (!clinicianDetails) return null;

    const formattedMember: TeamMember & {
      clinicalInfoId?: number;
      clinicianId?: string | null;
      licenses?: Array<{
        id?: number;
        license_type: string;
        license_number: string;
        expiration_date: string;
        state: string;
      }>;
    } = {
      id: memberId,
      clinicianId: clinicianDetails?.Clinician?.id || null,
      firstName:
        clinicianDetails.Clinician?.first_name ||
        clinicianDetails.email.split("@")[0],
      lastName: clinicianDetails.Clinician?.last_name || "",
      email: clinicianDetails.email,
      roles: clinicianDetails.UserRole?.map((ur) => ur.Role.name) || [],
    };

    // Set the clinical info ID if available
    if (
      clinicianDetails.clinicalInfos &&
      clinicianDetails.clinicalInfos.length > 0
    ) {
      formattedMember.clinicalInfoId = Number(
        clinicianDetails.clinicalInfos[0].id,
      );
      formattedMember.npiNumber = String(
        clinicianDetails.clinicalInfos[0].NPI_number || "",
      );
      formattedMember.specialty =
        clinicianDetails.clinicalInfos[0].speciality || "";
    }

    // Format licenses array if available from Clinician.License
    if (
      clinicianDetails.Clinician?.License &&
      clinicianDetails.Clinician.License.length > 0
    ) {
      formattedMember.licenses = clinicianDetails.Clinician.License.map(
        (license) => {
          return {
            id: Number(license.id),
            license_type: license.license_type || "",
            license_number: license.license_number || "",
            expiration_date:
              typeof license.expiration_date === "string"
                ? license.expiration_date
                : license.expiration_date.toISOString().split("T")[0],
            state: license.state || "",
          };
        },
      );

      // For backward compatibility with components that use the single license format
      const primaryLicense = clinicianDetails.Clinician.License[0];
      formattedMember.license = {
        type: primaryLicense.license_type || "",
        number: primaryLicense.license_number || "",
        expirationDate:
          typeof primaryLicense.expiration_date === "string"
            ? primaryLicense.expiration_date
            : primaryLicense.expiration_date.toISOString().split("T")[0],
        state: primaryLicense.state || "",
      };
    }

    // Handle services if available
    if (
      clinicianDetails.Clinician?.ClinicianServices &&
      clinicianDetails.Clinician.ClinicianServices.length > 0
    ) {
      formattedMember.services =
        clinicianDetails.Clinician.ClinicianServices.map(
          (service) =>
            service.PracticeService.name || service.PracticeService.type,
        );
    }

    return formattedMember;
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading team member details..." />;
  }

  if (error) {
    return <div>Error loading team member: {(error as Error).message}</div>;
  }

  if (!clinicianDetails) {
    return <div>Team member not found</div>;
  }

  const formattedMember = formatMemberData();

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
            <BreadcrumbPage>
              {formattedMember
                ? `${formattedMember.firstName} ${formattedMember.lastName}`
                : ""}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {formattedMember && <EditTeamMember member={formattedMember} />}
    </div>
  );
}
