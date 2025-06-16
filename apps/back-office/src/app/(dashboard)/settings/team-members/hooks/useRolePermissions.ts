export interface RoleCategory {
  roleId: string;
  category: string;
  roleTitle: string;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  roleCategories?: RoleCategory[];
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
  clinicianLevel?: ClinicianLevel;
}

export interface RolePermissions {
  clientCare: string[];
  operations: string[];
}

export type ClinicianLevel =
  | "Basic"
  | "Billing"
  | "Full client list"
  | "Entire practice";

export type RoleType =
  | "ADMIN"
  | "ADMIN.PRACTICE-MANAGER"
  | "ADMIN.PRACTICE-BILLER"
  | "CLINICIAN.BASIC"
  | "CLINICIAN.BILLING"
  | "CLINICIAN.FULL-CLIENT-LIST"
  | "CLINICIAN.ENTIRE-PRACTICE"
  | "CLINICIAN.SUPERVISOR"
  | "Clinician"
  | "Supervisor"
  | "Practice Owner"
  | "Practice Administrator"
  | "Practice Biller"
  | "Practice Scheduler"
  | "Front Desk Staff"
  | "Clinician with entire practice access"
  | "Senior Therapist"
  | "Practice Supervisor"
  | "Intern/Student";

export interface RoleInfo {
  title: RoleType;
  description: string;
}

export const CLINICIAN_LEVEL_DESCRIPTIONS: Record<ClinicianLevel, string> = {
  Basic: "Can schedule and add documentation for their clients",
  Billing: "Can bill, schedule, and add documentation for their clients",
  "Full client list":
    "Can bill, schedule, and add documentation for their clients. Can see profiles and appointments for all clients.",
  "Entire practice":
    "Can bill, schedule, and add documentation for all clients in the practice. Can see most reports and practice settings.",
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  ADMIN: "Full access to all practice features and settings",
  "ADMIN.PRACTICE-MANAGER":
    "Manages practice operations, team members, and settings",
  "ADMIN.PRACTICE-BILLER":
    "Handles client payments, insurance claims, and financial reports",
  "CLINICIAN.BASIC": "Can schedule and add documentation for their clients",
  "CLINICIAN.BILLING":
    "Can bill, schedule, and add documentation for their clients",
  "CLINICIAN.FULL-CLIENT-LIST":
    "Can bill, schedule, and add documentation for their clients. Can see profiles and appointments for all clients.",
  "CLINICIAN.ENTIRE-PRACTICE":
    "Can bill, schedule, and add documentation for all clients in the practice. Can see most reports and practice settings.",
  "CLINICIAN.SUPERVISOR": "Supervises other clinicians and reviews their work",
  Clinician: "For team members who treat clients",
  Supervisor: "For team members who supervise a pre-licensed clinician",
  "Practice Owner": "Full access to all practice features and settings",
  "Practice Administrator":
    "For team members who make administrative decisions for the practice",
  "Practice Biller":
    "For team members who handle client payments and insurance",
  "Practice Scheduler": "For team members who manage the practice calendar",
  "Front Desk Staff": "Handles check-ins and basic administrative tasks",
  "Clinician with entire practice access":
    "Full clinical access with practice-wide permissions",
  "Senior Therapist": "Clinical supervision and team leadership capabilities",
  "Practice Supervisor": "Oversees clinical operations and team performance",
  "Intern/Student": "Limited access under supervision",
};

export const ROLE_PERMISSIONS: Record<RoleType, RolePermissions> = {
  ADMIN: {
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
  "ADMIN.PRACTICE-MANAGER": {
    clientCare: [
      "View client records",
      "Manage client documents",
      "View intake documents",
      "Access to all client profiles",
    ],
    operations: [
      "Manage team members and roles",
      "Configure practice settings",
      "View practice reports",
      "Manage practice operations",
      "Access scheduling for all clinicians",
    ],
  },
  "ADMIN.PRACTICE-BILLER": {
    clientCare: [
      "View basic client information",
      "Access billing-related documents",
      "View insurance information",
    ],
    operations: [
      "Full financial dashboard access",
      "Manage billing and payments",
      "Process insurance claims",
      "Generate financial reports",
      "Manage superbills and invoices",
      "View and edit billing settings",
    ],
  },
  "CLINICIAN.BASIC": {
    clientCare: [
      "View and create chart notes for their clients",
      "Schedule appointments for their clients",
      "Add documentation for their clients",
    ],
    operations: ["View own calendar", "Schedule own appointments"],
  },
  "CLINICIAN.BILLING": {
    clientCare: [
      "View and create chart notes for their clients",
      "Schedule appointments for their clients",
      "Add documentation for their clients",
      "Bill for their clients",
    ],
    operations: [
      "View own calendar",
      "Schedule own appointments",
      "Access billing features for own clients",
    ],
  },
  "CLINICIAN.FULL-CLIENT-LIST": {
    clientCare: [
      "View and create chart notes for their clients",
      "Schedule appointments for their clients",
      "Add documentation for their clients",
      "Bill for their clients",
      "View all client profiles",
      "View all appointments",
    ],
    operations: [
      "View practice calendar",
      "Schedule own appointments",
      "Access billing features for own clients",
      "View client directory",
    ],
  },
  "CLINICIAN.ENTIRE-PRACTICE": {
    clientCare: [
      "View and create chart notes for all clients",
      "Schedule appointments for all clients",
      "Add documentation for all clients",
      "Bill for all clients",
      "View all client profiles",
      "View all appointments",
    ],
    operations: [
      "View practice calendar",
      "Schedule any appointments",
      "Access billing features for all clients",
      "View client directory",
      "View most reports",
      "View practice settings",
    ],
  },
  "CLINICIAN.SUPERVISOR": {
    clientCare: [
      "View and create chart notes",
      "View completed questionnaires and scored measures",
      "View and manage client documents",
      "View and manage intake documents",
      "Supervise other clinicians",
      "Review supervised clinician work",
    ],
    operations: [
      "View supervisee calendars",
      "Review supervisee documentation",
      "Access supervision reports",
      "Schedule supervision sessions",
    ],
  },
  Clinician: {
    clientCare: [
      "View and create chart notes",
      "View completed questionnaires and scored measures",
      "View and manage client documents",
      "View and manage intake documents",
    ],
    operations: ["View calendar", "Schedule appointments"],
  },
  Supervisor: {
    clientCare: [
      "View and create chart notes",
      "View completed questionnaires",
      "View and manage client documents",
      "View intake documents",
      "Supervise clinicians",
    ],
    operations: ["View supervisee calendar", "Review supervisee work"],
  },
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
  "Practice Scheduler": {
    clientCare: ["View basic client information", "Manage practice calendar"],
    operations: ["Full calendar access", "Schedule for all clinicians"],
  },
  "Front Desk Staff": {
    clientCare: [
      "View basic client information",
      "Manage appointments",
      "Handle check-ins",
    ],
    operations: ["Basic scheduling access", "View daily reports"],
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
  "Intern/Student": {
    clientCare: [
      "View assigned client notes",
      "Create draft chart notes",
      "View limited client documents",
    ],
    operations: ["Limited scheduling access", "View assigned tasks"],
  },
};

export const CLINICIAN_LEVEL_PERMISSIONS: Record<
  ClinicianLevel,
  RolePermissions
> = {
  Basic: {
    clientCare: [
      "View and create chart notes for their clients",
      "Schedule appointments for their clients",
      "Add documentation for their clients",
    ],
    operations: ["View own calendar", "Schedule own appointments"],
  },
  Billing: {
    clientCare: [
      "View and create chart notes for their clients",
      "Schedule appointments for their clients",
      "Add documentation for their clients",
      "Bill for their clients",
    ],
    operations: [
      "View own calendar",
      "Schedule own appointments",
      "Access billing features for own clients",
    ],
  },
  "Full client list": {
    clientCare: [
      "View and create chart notes for their clients",
      "Schedule appointments for their clients",
      "Add documentation for their clients",
      "Bill for their clients",
      "View all client profiles",
      "View all appointments",
    ],
    operations: [
      "View practice calendar",
      "Schedule own appointments",
      "Access billing features for own clients",
      "View client directory",
    ],
  },
  "Entire practice": {
    clientCare: [
      "View and create chart notes for all clients",
      "Schedule appointments for all clients",
      "Add documentation for all clients",
      "Bill for all clients",
      "View all client profiles",
      "View all appointments",
    ],
    operations: [
      "View practice calendar",
      "Schedule any appointments",
      "Access billing features for all clients",
      "View client directory",
      "View most reports",
      "View practice settings",
    ],
  },
};

export const useRolePermissions = () => {
  const getRolePermissions = (role: RoleType) => ROLE_PERMISSIONS[role];
  const getRoleDescription = (role: RoleType) => ROLE_DESCRIPTIONS[role];
  const getClinicianLevelDescription = (level: ClinicianLevel) =>
    CLINICIAN_LEVEL_DESCRIPTIONS[level];
  const getClinicianLevelPermissions = (level: ClinicianLevel) =>
    CLINICIAN_LEVEL_PERMISSIONS[level];

  const getCombinedPermissions = (
    roles: RoleType[],
    clinicianLevel?: ClinicianLevel,
  ) => {
    const combinedPermissions: RolePermissions = {
      clientCare: [],
      operations: [],
    };

    roles.forEach((role) => {
      const permissions = ROLE_PERMISSIONS[role];
      if (!permissions) return;

      permissions.clientCare.forEach((permission) => {
        if (!combinedPermissions.clientCare.includes(permission)) {
          combinedPermissions.clientCare.push(permission);
        }
      });

      permissions.operations.forEach((permission) => {
        if (!combinedPermissions.operations.includes(permission)) {
          combinedPermissions.operations.push(permission);
        }
      });
    });

    if (clinicianLevel && roles.includes("Clinician")) {
      const levelPermissions = CLINICIAN_LEVEL_PERMISSIONS[clinicianLevel];

      levelPermissions.clientCare.forEach((permission) => {
        if (!combinedPermissions.clientCare.includes(permission)) {
          combinedPermissions.clientCare.push(permission);
        }
      });

      levelPermissions.operations.forEach((permission) => {
        if (!combinedPermissions.operations.includes(permission)) {
          combinedPermissions.operations.push(permission);
        }
      });
    }

    return combinedPermissions;
  };

  return {
    getRolePermissions,
    getRoleDescription,
    getClinicianLevelDescription,
    getClinicianLevelPermissions,
    getCombinedPermissions,
    ROLE_PERMISSIONS,
    ROLE_DESCRIPTIONS,
    CLINICIAN_LEVEL_DESCRIPTIONS,
    CLINICIAN_LEVEL_PERMISSIONS,
  };
};
