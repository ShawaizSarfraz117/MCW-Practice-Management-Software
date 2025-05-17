export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialty?: string;
  npiNumber?: string;
  license?: {
    type: string;
    number: string;
    expirationDate: string;
    state: string;
  };
  clinicianId?: string | null;
  services?: string[];
}

export interface RolePermissions {
  clientCare: string[];
  operations: string[];
}

export type RoleType =
  | "Practice Owner"
  | "Practice Administrator"
  | "Clinician with entire practice access"
  | "Senior Therapist"
  | "Practice Supervisor"
  | "Practice Biller"
  | "Front Desk Staff"
  | "Intern/Student";

export interface RoleInfo {
  title: RoleType;
  description: string;
}

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  "Practice Owner": "Full access to all practice features and settings",
  "Practice Administrator": "Manages practice operations and team members",
  "Clinician with entire practice access":
    "Full clinical access with practice-wide permissions",
  "Senior Therapist": "Clinical supervision and team leadership capabilities",
  "Practice Supervisor": "Oversees clinical operations and team performance",
  "Practice Biller": "Handles billing, payments, and financial operations",
  "Front Desk Staff": "Handles check-ins and basic administrative tasks",
  "Intern/Student": "Limited access under supervision",
};

export const ROLE_PERMISSIONS: Record<RoleType, RolePermissions> = {
  "Practice Owner": {
    clientCare: [
      "View and create chart notes",
      "View completed questionnaires and scored measures",
      "View and manage client documents",
      "View and manage intake documents",
      "Full access to all client records",
    ],
    operations: [
      "View and manage financial dashboards",
      "Full practice management access",
      "Manage team members and roles",
      "Configure practice settings",
    ],
  },
  "Practice Administrator": {
    clientCare: [
      "View chart notes",
      "View client documents",
      "View intake documents",
      "Manage client records",
    ],
    operations: [
      "View financial dashboards",
      "Manage practice settings",
      "Manage team members",
    ],
  },
  "Clinician with entire practice access": {
    clientCare: [
      "View and create chart notes",
      "View completed questionnaires and scored measures",
      "View and manage client documents",
      "View and manage intake documents",
      "Access to all client records",
    ],
    operations: ["View financial dashboards", "Basic practice management"],
  },
  "Senior Therapist": {
    clientCare: [
      "View and create chart notes",
      "View completed questionnaires",
      "View and manage client documents",
      "View intake documents",
    ],
    operations: ["View financial summaries", "Team supervision capabilities"],
  },
  "Practice Supervisor": {
    clientCare: [
      "View and create chart notes",
      "View client documents",
      "View intake documents",
      "Supervise team activities",
    ],
    operations: ["View team performance metrics", "Basic financial access"],
  },
  "Practice Biller": {
    clientCare: [
      "View basic client information",
      "View billing-related documents",
    ],
    operations: [
      "Full financial dashboard access",
      "Manage billing and payments",
      "Generate financial reports",
    ],
  },
  "Front Desk Staff": {
    clientCare: [
      "View basic client information",
      "Manage appointments",
      "Handle check-ins",
    ],
    operations: ["Basic scheduling access", "View daily reports"],
  },
  "Intern/Student": {
    clientCare: [
      "View assigned client notes",
      "Create draft chart notes",
      "View limited client documents",
    ],
    operations: ["Limited scheduling access", "View assigned tasks"],
  },
};

export const useRolePermissions = () => {
  const getRolePermissions = (role: RoleType) => ROLE_PERMISSIONS[role];
  const getRoleDescription = (role: RoleType) => ROLE_DESCRIPTIONS[role];

  return {
    getRolePermissions,
    getRoleDescription,
    ROLE_PERMISSIONS,
    ROLE_DESCRIPTIONS,
  };
};
