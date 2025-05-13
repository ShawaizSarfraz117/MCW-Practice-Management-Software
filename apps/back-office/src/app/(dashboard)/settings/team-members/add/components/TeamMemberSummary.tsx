import { useRef } from "react";

// Define the TeamMember type inline to avoid import issues
interface TeamMember {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  specialty?: string;
  npiNumber?: string;
  license?: {
    type: string;
    number: string;
    expirationDate: string;
    state: string;
  };
  services?: string[];
}

interface TeamMemberSummaryProps {
  teamMemberData: Partial<TeamMember>;
  isHidden: boolean;
}

export default function TeamMemberSummary({
  teamMemberData,
  isHidden,
}: TeamMemberSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const fullName =
    `${teamMemberData.firstName || ""} ${teamMemberData.lastName || ""}`.trim();

  return (
    <div className={`${isHidden ? "hidden" : ""} lg:relative`}>
      <div
        ref={summaryRef}
        className="bg-white rounded-lg border border-gray-200 shadow-sm lg:sticky lg:top-4"
      >
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Team Member Summary
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {teamMemberData.role && (
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium text-gray-900">{teamMemberData.role}</p>
            </div>
          )}

          {fullName && (
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{fullName}</p>
            </div>
          )}

          {teamMemberData.email && (
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">
                {teamMemberData.email}
              </p>
            </div>
          )}

          {teamMemberData.specialty && (
            <div>
              <p className="text-sm text-gray-500">Specialty</p>
              <p className="font-medium text-gray-900">
                {teamMemberData.specialty}
              </p>
            </div>
          )}

          {teamMemberData.npiNumber && (
            <div>
              <p className="text-sm text-gray-500">NPI Number</p>
              <p className="font-medium text-gray-900">
                {teamMemberData.npiNumber}
              </p>
            </div>
          )}

          {teamMemberData.license?.type && (
            <div>
              <p className="text-sm text-gray-500">License</p>
              <p className="font-medium text-gray-900">
                {teamMemberData.license.type} ({teamMemberData.license.state}){" "}
                {teamMemberData.license.number}
              </p>
              {teamMemberData.license.expirationDate && (
                <p className="text-sm text-gray-500">
                  Expires: {teamMemberData.license.expirationDate}
                </p>
              )}
            </div>
          )}

          {teamMemberData.services && teamMemberData.services.length > 0 && (
            <div>
              <p className="text-sm text-gray-500">Services</p>
              <ul className="list-disc pl-5 mt-1">
                {teamMemberData.services.map(
                  (service: string, index: number) => (
                    <li key={index} className="text-sm text-gray-900">
                      {service}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {!fullName &&
            !teamMemberData.email &&
            !teamMemberData.specialty &&
            !teamMemberData.npiNumber &&
            !teamMemberData.license?.type &&
            (!teamMemberData.services ||
              teamMemberData.services.length === 0) && (
              <p className="text-gray-500 italic">
                Complete the form to see the team member details here.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
