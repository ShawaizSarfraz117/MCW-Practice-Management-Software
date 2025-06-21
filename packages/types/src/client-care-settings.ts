// Client Care Settings Types - Shared across the platform

export interface ClientCareSettingsResponse {
  message: string;
  data: ClientCareSettingsData;
}

export interface ClientCareSettingsData {
  portal: PortalSettings;
  widget: WidgetSettings;
  calendar: CalendarSettings;
  contactForm: ContactFormSettings;
  demographicsForm: DemographicsFormSettings;
  documentFormat: DocumentFormatSettings;
}

// Portal Settings
export interface PortalSettings {
  general: {
    isEnabled: boolean;
    domainUrl: string | null;
    welcomeMessage: string | null;
  };
  appointments: {
    isAppointmentRequestsEnabled: boolean;
    appointmentStartTimes: string | null;
    requestMinimumNotice: string | null;
    maximumRequestNotice: string | null;
    allowNewClientsRequest: boolean;
    requestsFromNewIndividuals: boolean;
    requestsFromNewCouples: boolean;
    requestsFromNewContacts: boolean;
    isPrescreenNewClients: boolean;
    cardForAppointmentRequest: boolean;
  };
  documents: {
    isUploadDocumentsAllowed: boolean;
  };
}

// Widget Settings
export interface WidgetSettings {
  general: {
    widgetCode: string | null;
  };
}

// Calendar Settings
export interface CalendarSettings {
  display: {
    startTime: string;
    endTime: string;
    viewMode: "day" | "week" | "month";
    showWeekends: boolean;
    cancellationNoticeHours: number;
  };
}

// Contact Form Settings
export interface ContactFormSettings {
  general: {
    isEnabled: boolean;
    link: string | null;
    widgetCode: string | null;
  };
}

// Demographics Form Settings
export interface DemographicsFormSettings {
  fields: {
    nameTheyGoBy: boolean;
    insurance: boolean;
    genderIdentity: boolean;
  };
}

// Document Format Settings
export interface DocumentFormatSettings {
  general: {
    includePracticeLogo: boolean;
    footerInformation: string | null;
  };
}

// Deep partial type helper
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// Update request types
export type UpdateClientCareSettingsRequest =
  | { category: "portal"; settings: Partial<PortalSettings> }
  | { category: "widget"; settings: Partial<WidgetSettings> }
  | { category: "calendar"; settings: Partial<CalendarSettings> }
  | { category: "contactForm"; settings: Partial<ContactFormSettings> }
  | {
      category: "demographicsForm";
      settings: Partial<DemographicsFormSettings>;
    }
  | { category: "documentFormat"; settings: Partial<DocumentFormatSettings> };

// Individual client portal permissions (existing functionality)
export interface ClientPortalPermission {
  id: string;
  clientId: string;
  email: string;
  allowAppointmentRequests: boolean;
  useSecureMessaging: boolean;
  accessBillingDocuments: boolean;
  receiveAnnouncements: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface UpdateClientPortalPermissionRequest {
  email?: string;
  allowAppointmentRequests?: boolean;
  useSecureMessaging?: boolean;
  accessBillingDocuments?: boolean;
  receiveAnnouncements?: boolean;
  isActive?: boolean;
}
