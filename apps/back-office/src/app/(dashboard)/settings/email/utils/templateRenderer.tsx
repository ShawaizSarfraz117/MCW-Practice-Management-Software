import React from "react";
import { ClientGroupData, ClinicianData, MacroKey, MacroMap } from "../types";

// Helper functions for template rendering
const getClientContactInfo = (
  clientGroup: ClientGroupData | null,
  type: string,
): string | null => {
  if (!clientGroup?.ClientGroupMembership?.[0]?.Client?.ClientContact) {
    return null;
  }
  return (
    clientGroup.ClientGroupMembership[0].Client.ClientContact.find(
      (contact) => contact.type === type,
    )?.value ?? null
  );
};

const getClientEmail = (clientGroup: ClientGroupData | null): string | null => {
  if (!clientGroup?.ClientGroupMembership?.[0]?.Client?.ClientContact) {
    return null;
  }
  return (
    clientGroup.ClientGroupMembership[0].Client.ClientContact.find(
      (contact) => contact.contact_type === "EMAIL",
    )?.value ?? null
  );
};

const createMacroMap = (
  clientGroup: ClientGroupData | null,
  clinician: ClinicianData | null,
): MacroMap => {
  const now = new Date();
  const currentDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentTime = now.toLocaleTimeString();

  return {
    // Clinician macros
    clinician: clinician
      ? `${clinician.first_name} ${clinician.last_name}`
      : "Dr. John Doe",
    clinician_full_name: clinician
      ? `${clinician.first_name} ${clinician.last_name}`
      : "Dr. John Doe",
    clinician_first_name: clinician?.first_name || "John",
    clinician_last_name: clinician?.last_name || "Doe",
    clinician_email: clinician?.User?.email || "john.doe@clinic.com",

    // Practice macros
    practice: "Wellness Clinic",
    practice_address_line1: "123 Main St",
    practice_address_line2: "Suite 100",
    practice_city: "Springfield",
    practice_email: "info@wellness.com",
    practice_full_name: "Wellness Clinic Full Name",
    practice_full_office_address: "123 Main St, Springfield, ST 12345",
    practice_location: "Springfield",
    practice_name: "Wellness Clinic",
    practice_phone_number: "(555) 123-4567",
    practice_state: "ST",
    practice_video_location: "https://video.wellness.com",
    practice_zip_code: "12345",
    practice_map_link: "https://maps.example.com",

    // Client macros
    client: clientGroup?.name || "Jane Smith",
    client_document_requests_size:
      clientGroup?.ClientGroupMembership?.length?.toString() || "2",
    client_document_request_names:
      clientGroup?.ClientGroupMembership?.map(
        (m) => m.Client.legal_first_name,
      ).join(", ") || "Insurance Card, ID",
    client_full_name: clientGroup?.name || "Jane Smith",
    client_full_name_formatted: clientGroup?.name || "Smith, Jane",
    client_first_name: clientGroup?.name?.split(" ")[0] || "Jane",
    client_first_name_formatted: clientGroup?.name?.split(" ")[0] || "Jane",
    client_last_name:
      clientGroup?.name?.split(" ").slice(1).join(" ") || "Smith",
    client_mobile_number:
      getClientContactInfo(clientGroup, "MOBILE") || "(555) 987-6543",
    client_home_number:
      getClientContactInfo(clientGroup, "HOME") || "(555) 111-2222",
    client_work_number:
      getClientContactInfo(clientGroup, "WORK") || "(555) 333-4444",
    client_fax_number:
      getClientContactInfo(clientGroup, "FAX") || "(555) 555-5555",
    client_email_address: getClientEmail(clientGroup) || "jane.smith@email.com",
    client_address_line1: "456 Elm St",
    client_address_line2: "Apt 2B",
    client_city: "Springfield",
    client_zip_code: "12345",
    client_state: "ST",
    client_birth_date: "01/01/1990",
    client_gender: "Female",
    client_first_appointment_date: "July 10, 2024",
    client_first_appointment_time: "10:00 AM",
    client_most_recent_appointment_date: "July 1, 2024",
    client_most_recent_appointment_time: "2:00 PM",
    client_next_appointment_date: "July 20, 2024",
    client_next_appointment_time: "11:00 AM",
    client_legally_admissible_first_name:
      clientGroup?.name?.split(" ")[0] || "Jane",
    recipient_legally_admissible_first_name: clinician?.first_name || "John",

    // Links
    links: "https://portal.com",
    appointment_reminder_links: "https://reminder.com",

    // Date/Time macros
    date: currentDate,
    time: currentTime,
  };
};

// Special button components
const SignInButton = () => (
  <button
    className="ml-4 px-6 py-3 bg-[#059669] text-white rounded-md font-sm text-md"
    key="sign-in"
  >
    SIGN IN
  </button>
);

const CalendarButtons = () => (
  <div className="inline-block align-middle" key="calendar-buttons">
    <div className="flex gap-4 mt-2">
      <button className="bg-[#faf9f6] px-4 py-2 rounded-md font-semibold text-lg">
        iCloud
      </button>
      <button className="bg-[#faf9f6] px-4 py-2 rounded-md font-semibold text-lg">
        Google
      </button>
      <button className="bg-[#faf9f6] px-4 py-2 rounded-md font-semibold text-lg">
        Outlook
      </button>
    </div>
  </div>
);

const VideoLink = () => (
  <span className="text-[#059669] underline font-semibold" key="video-link">
    Join Your Video Appointment
  </span>
);

export function renderTemplateWithButton(
  content: string,
  clientGroup: ClientGroupData | null,
  clinician: ClinicianData | null,
) {
  if (!content) return null;

  const signInLinkRegex = /^{{link}}$|^{link}$/i;
  const reminderLinkRegex =
    /({{[^}]*?(reminder[\s_-]*link|link[\s_-]*reminder)[^}]*}}|{[^}]*?(reminder[\s_-]*link|link[\s_-]*reminder)[^}]*})/gi;
  const videoLinkRegex =
    /({{[^}]*?(video[\s_-]*link|link[\s_-]*video)[^}]*}}|{[^}]*?(video[\s_-]*link|link[\s_-]*video)[^}]*})/gi;
  const macroRegex = /{{([a-zA-Z0-9_]+)}}|{([a-zA-Z0-9_]+)}/g;

  const macroMap = createMacroMap(clientGroup, clinician);

  const splitRegex = new RegExp(
    `({{link}}|{link}|${reminderLinkRegex.source}|${videoLinkRegex.source})`,
    "gi",
  );

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = splitRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    if (signInLinkRegex.test(match[0])) {
      parts.push(<SignInButton />);
    } else if (reminderLinkRegex.test(match[0])) {
      parts.push(<CalendarButtons />);
    } else if (videoLinkRegex.test(match[0])) {
      parts.push(<VideoLink />);
    }
    lastIndex = match.index + match[0].length;
    signInLinkRegex.lastIndex = 0;
    reminderLinkRegex.lastIndex = 0;
    videoLinkRegex.lastIndex = 0;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  const processedParts: React.ReactNode[] = [];
  parts.forEach((part, idx) => {
    if (part == null) return;
    if (typeof part === "string") {
      const replaced = part.replace(
        macroRegex,
        (_, doubleCurly, singleCurly) => {
          const macroKey = (
            doubleCurly ||
            singleCurly ||
            ""
          ).toLowerCase() as MacroKey;
          return macroMap[macroKey] ?? `{${macroKey}}`;
        },
      );
      processedParts.push(replaced);
    } else if (React.isValidElement(part)) {
      processedParts.push(React.cloneElement(part, { key: `special-${idx}` }));
      if (
        typeof parts[idx + 1] === "string" &&
        (parts[idx + 1] as string).trim() !== ""
      ) {
        processedParts.push(<br key={`break-after-special-${idx}`} />);
      }
    }
  });

  return <>{processedParts}</>;
}
