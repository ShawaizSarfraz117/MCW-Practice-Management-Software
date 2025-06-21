import { prisma } from "@mcw/database";
import { z } from "zod";
import { randomUUID } from "crypto";
import type {
  PortalSettings,
  WidgetSettings,
  CalendarSettings,
  ContactFormSettings,
  ClientCareSettingsData,
} from "@mcw/types";

// Comprehensive settings dictionary structure
export const CLIENT_CARE_SETTINGS_DICTIONARY = {
  // Client Portal Settings
  portal: {
    general: {
      isEnabled: {
        type: "boolean",
        default: false,
        label: "Enable Client Portal",
      },
      domainUrl: { type: "string", default: null, label: "Portal Domain URL" },
      welcomeMessage: {
        type: "string",
        default: null,
        label: "Welcome Message",
      },
    },
    appointments: {
      isAppointmentRequestsEnabled: {
        type: "boolean",
        default: false,
        label: "Enable Online Appointment Requests",
      },
      appointmentStartTimes: {
        type: "string",
        default: null,
        label: "Available Start Times",
      },
      requestMinimumNotice: {
        type: "string",
        default: null,
        label: "Minimum Notice Period",
      },
      maximumRequestNotice: {
        type: "string",
        default: null,
        label: "Maximum Booking Window",
      },
      allowNewClientsRequest: {
        type: "boolean",
        default: false,
        label: "Allow New Client Requests",
      },
      requestsFromNewIndividuals: {
        type: "boolean",
        default: false,
        label: "Accept Individual Requests",
      },
      requestsFromNewCouples: {
        type: "boolean",
        default: false,
        label: "Accept Couple Requests",
      },
      requestsFromNewContacts: {
        type: "boolean",
        default: false,
        label: "Accept Contact Requests",
      },
      isPrescreenNewClients: {
        type: "boolean",
        default: false,
        label: "Prescreen New Clients",
      },
      cardForAppointmentRequest: {
        type: "boolean",
        default: false,
        label: "Require Credit Card",
      },
    },
    documents: {
      isUploadDocumentsAllowed: {
        type: "boolean",
        default: false,
        label: "Allow Document Uploads",
      },
    },
  },

  // Appointment Request Widget Settings
  widget: {
    general: {
      widgetCode: {
        type: "string",
        default: null,
        label: "Appointment Request Widget Embed Code",
      },
    },
  },

  // Calendar Display Settings
  calendar: {
    display: {
      startTime: {
        type: "string",
        default: "7:00 AM",
        label: "Calendar Start Time",
      },
      endTime: {
        type: "string",
        default: "11:00 PM",
        label: "Calendar End Time",
      },
      viewMode: { type: "string", default: "week", label: "Default View Mode" },
      showWeekends: { type: "boolean", default: true, label: "Show Weekends" },
      cancellationNoticeHours: {
        type: "number",
        default: 24,
        label: "Cancellation Notice (hours)",
      },
    },
  },

  // Contact Form Settings
  contactForm: {
    general: {
      isEnabled: {
        type: "boolean",
        default: false,
        label: "Enable Contact Form",
      },
      link: { type: "string", default: null, label: "Contact Form Link" },
      widgetCode: {
        type: "string",
        default: null,
        label: "Contact Form Widget Embed Code",
      },
    },
  },
} as const;

// Type definitions
export type SettingCategory = keyof typeof CLIENT_CARE_SETTINGS_DICTIONARY;

// Validation schemas for each category
const portalSettingsSchema = z.object({
  general: z
    .object({
      isEnabled: z.boolean().optional(),
      domainUrl: z.string().nullable().optional(),
      welcomeMessage: z.string().nullable().optional(),
    })
    .optional(),
  appointments: z
    .object({
      isAppointmentRequestsEnabled: z.boolean().optional(),
      appointmentStartTimes: z.string().nullable().optional(),
      requestMinimumNotice: z.string().nullable().optional(),
      maximumRequestNotice: z.string().nullable().optional(),
      allowNewClientsRequest: z.boolean().optional(),
      requestsFromNewIndividuals: z.boolean().optional(),
      requestsFromNewCouples: z.boolean().optional(),
      requestsFromNewContacts: z.boolean().optional(),
      isPrescreenNewClients: z.boolean().optional(),
      cardForAppointmentRequest: z.boolean().optional(),
    })
    .optional(),
  documents: z
    .object({
      isUploadDocumentsAllowed: z.boolean().optional(),
    })
    .optional(),
});

const widgetSettingsSchema = z.object({
  general: z
    .object({
      widgetCode: z.string().nullable().optional(),
    })
    .optional(),
});

const calendarSettingsSchema = z.object({
  display: z
    .object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      viewMode: z.enum(["day", "week", "month"]).optional(),
      showWeekends: z.boolean().optional(),
      cancellationNoticeHours: z.number().optional(),
    })
    .optional(),
});

const contactFormSettingsSchema = z.object({
  general: z
    .object({
      isEnabled: z.boolean().optional(),
      link: z.string().nullable().optional(),
      widgetCode: z.string().nullable().optional(),
    })
    .optional(),
});

export const settingsValidationSchemas = {
  portal: portalSettingsSchema,
  widget: widgetSettingsSchema,
  calendar: calendarSettingsSchema,
  contactForm: contactFormSettingsSchema,
};

// Service class
export class ClientCareSettingsService {
  // Get all settings for a clinician
  // Note: Portal settings are per-clinician (stored in ClientPortalSettings table)
  // while calendar, widget, and contact form settings are practice-wide (stored in PracticeSettings table)
  async getAllSettings(clinicianId: string): Promise<ClientCareSettingsData> {
    // Check if we're using the new structure or need to migrate from old
    const existingPortalSettings = await prisma.clientPortalSettings.findFirst({
      where: { clinician_id: clinicianId },
    });

    if (existingPortalSettings) {
      // Migrate from old structure to new dictionary structure
      const migratedSettings = await this.migrateFromOldStructure({
        is_enabled: existingPortalSettings.is_enabled,
        domain_url: existingPortalSettings.domain_url,
        welcome_message: existingPortalSettings.welcome_message,
        is_appointment_requests_enabled:
          existingPortalSettings.is_appointment_requests_enabled || undefined,
        appointment_start_times: existingPortalSettings.appointment_start_times,
        request_minimum_notice: existingPortalSettings.request_minimum_notice,
        maximum_request_notice: existingPortalSettings.maximum_request_notice,
        allow_new_clients_request:
          existingPortalSettings.allow_new_clients_request,
        requests_from_new_individuals:
          existingPortalSettings.requests_from_new_individuals,
        requests_from_new_couples:
          existingPortalSettings.requests_from_new_couples,
        requests_from_new_contacts:
          existingPortalSettings.requests_from_new_contacts,
        is_prescreen_new_clinets:
          existingPortalSettings.is_prescreen_new_clinets,
        card_for_appointment_request:
          existingPortalSettings.card_for_appointment_request,
        is_upload_documents_allowed:
          existingPortalSettings.is_upload_documents_allowed,
      });

      // Also check for other settings in PracticeSettings
      const widgetSettings = await this.getPracticeSettingsCategory(
        clinicianId,
        "widget",
      );
      const calendarSettings = await this.getPracticeSettingsCategory(
        clinicianId,
        "calendar",
      );
      const contactFormSettings = await this.getPracticeSettingsCategory(
        clinicianId,
        "contactForm",
      );

      return {
        ...migratedSettings,
        widget: (widgetSettings ||
          this.getDefaultCategorySettings("widget")) as WidgetSettings,
        calendar: (calendarSettings ||
          this.getDefaultCategorySettings("calendar")) as CalendarSettings,
        contactForm: (contactFormSettings ||
          this.getDefaultCategorySettings(
            "contactForm",
          )) as ContactFormSettings,
      };
    }

    // Check if any settings exist in PracticeSettings
    const allSettings = this.getDefaultSettings();

    for (const category of [
      "portal",
      "widget",
      "calendar",
      "contactForm",
    ] as const) {
      const categorySettings = await this.getPracticeSettingsCategory(
        clinicianId,
        category,
      );
      if (categorySettings) {
        (allSettings as unknown as Record<string, unknown>)[category] =
          categorySettings;
      }
    }

    return allSettings;
  }

  // Get settings for a specific category
  async getCategorySettings(
    clinicianId: string,
    category: SettingCategory,
  ): Promise<
    PortalSettings | WidgetSettings | CalendarSettings | ContactFormSettings
  > {
    const allSettings = await this.getAllSettings(clinicianId);
    const categorySettings = allSettings[category];

    if (!categorySettings) {
      return this.getDefaultCategorySettings(category);
    }

    // Return with proper type based on category
    switch (category) {
      case "portal":
        return categorySettings as PortalSettings;
      case "widget":
        return categorySettings as WidgetSettings;
      case "calendar":
        return categorySettings as CalendarSettings;
      case "contactForm":
        return categorySettings as ContactFormSettings;
      default:
        return categorySettings;
    }
  }

  // Update settings for a specific category
  async updateCategorySettings(
    clinicianId: string,
    category: SettingCategory,
    settings:
      | Partial<PortalSettings>
      | Partial<WidgetSettings>
      | Partial<CalendarSettings>
      | Partial<ContactFormSettings>,
  ): Promise<
    PortalSettings | WidgetSettings | CalendarSettings | ContactFormSettings
  > {
    // Validate settings
    const schema = settingsValidationSchemas[category];
    const validationResult = schema.safeParse(settings);

    if (!validationResult.success) {
      throw new Error(`Invalid settings: ${validationResult.error.message}`);
    }

    // For now, we'll continue using the existing ClientPortalSettings table
    // but structure the data to match our dictionary pattern
    if (category === "portal") {
      await this.updatePortalSettings(
        clinicianId,
        settings as Partial<PortalSettings>,
      );
      // Return the updated settings in the expected format
      return await this.getCategorySettings(clinicianId, category);
    }

    // For other categories, we'll need to implement storage
    // This could be in PracticeSettings or a new table
    await this.updatePracticeSettings(clinicianId, category, settings);
    return await this.getCategorySettings(clinicianId, category);
  }

  // Private helper methods
  private getDefaultSettings(): ClientCareSettingsData {
    const defaults: Record<
      string,
      Record<string, Record<string, unknown>>
    > = {};

    for (const [category, sections] of Object.entries(
      CLIENT_CARE_SETTINGS_DICTIONARY,
    )) {
      defaults[category] = {};
      for (const [section, settings] of Object.entries(sections)) {
        defaults[category][section] = {};
        for (const [key, config] of Object.entries(settings)) {
          defaults[category][section][key] = (
            config as { default: unknown }
          ).default;
        }
      }
    }

    return defaults as unknown as ClientCareSettingsData;
  }

  private getDefaultCategorySettings(
    category: SettingCategory,
  ): PortalSettings | WidgetSettings | CalendarSettings | ContactFormSettings {
    const categoryDefaults: Record<string, Record<string, unknown>> = {};
    const categoryDict = CLIENT_CARE_SETTINGS_DICTIONARY[category];

    for (const [section, settings] of Object.entries(categoryDict)) {
      categoryDefaults[section] = {};
      for (const [key, config] of Object.entries(settings)) {
        categoryDefaults[section][key] = (
          config as { default: unknown }
        ).default;
      }
    }

    return categoryDefaults as unknown as
      | PortalSettings
      | WidgetSettings
      | CalendarSettings
      | ContactFormSettings;
  }

  private async migrateFromOldStructure(oldSettings: {
    is_enabled?: boolean;
    domain_url?: string | null;
    welcome_message?: string | null;
    is_appointment_requests_enabled?: boolean;
    appointment_start_times?: string | null;
    request_minimum_notice?: string | null;
    maximum_request_notice?: string | null;
    allow_new_clients_request?: boolean;
    requests_from_new_individuals?: boolean;
    requests_from_new_couples?: boolean;
    requests_from_new_contacts?: boolean;
    is_prescreen_new_clinets?: boolean;
    card_for_appointment_request?: boolean;
    is_upload_documents_allowed?: boolean;
  }): Promise<ClientCareSettingsData> {
    const newSettings = this.getDefaultSettings();

    // Map old ClientPortalSettings to new structure (with camelCase for frontend)
    newSettings.portal = {
      general: {
        isEnabled: oldSettings.is_enabled ?? false,
        domainUrl: oldSettings.domain_url ?? null,
        welcomeMessage: oldSettings.welcome_message ?? null,
      },
      appointments: {
        isAppointmentRequestsEnabled:
          oldSettings.is_appointment_requests_enabled ?? false,
        appointmentStartTimes: oldSettings.appointment_start_times ?? null,
        requestMinimumNotice: oldSettings.request_minimum_notice ?? null,
        maximumRequestNotice: oldSettings.maximum_request_notice ?? null,
        allowNewClientsRequest: oldSettings.allow_new_clients_request ?? false,
        requestsFromNewIndividuals:
          oldSettings.requests_from_new_individuals ?? false,
        requestsFromNewCouples: oldSettings.requests_from_new_couples ?? false,
        requestsFromNewContacts:
          oldSettings.requests_from_new_contacts ?? false,
        isPrescreenNewClients: oldSettings.is_prescreen_new_clinets ?? false,
        cardForAppointmentRequest:
          oldSettings.card_for_appointment_request ?? false,
      },
      documents: {
        isUploadDocumentsAllowed:
          oldSettings.is_upload_documents_allowed ?? false,
      },
    };

    return newSettings;
  }

  private async updatePortalSettings(
    clinicianId: string,
    settings: Partial<PortalSettings>,
  ): Promise<unknown> {
    const flatSettings: Record<string, unknown> = {};

    // Convert from camelCase to snake_case and flatten the nested structure
    if (settings.general) {
      if (settings.general.isEnabled !== undefined) {
        flatSettings.is_enabled = settings.general.isEnabled;
      }
      if (settings.general.domainUrl !== undefined) {
        flatSettings.domain_url = settings.general.domainUrl;
      }
      if (settings.general.welcomeMessage !== undefined) {
        flatSettings.welcome_message = settings.general.welcomeMessage;
      }
    }

    if (settings.appointments) {
      if (settings.appointments.isAppointmentRequestsEnabled !== undefined) {
        flatSettings.is_appointment_requests_enabled =
          settings.appointments.isAppointmentRequestsEnabled;
      }
      if (settings.appointments.appointmentStartTimes !== undefined) {
        flatSettings.appointment_start_times =
          settings.appointments.appointmentStartTimes;
      }
      if (settings.appointments.requestMinimumNotice !== undefined) {
        flatSettings.request_minimum_notice =
          settings.appointments.requestMinimumNotice;
      }
      if (settings.appointments.maximumRequestNotice !== undefined) {
        flatSettings.maximum_request_notice =
          settings.appointments.maximumRequestNotice;
      }
      if (settings.appointments.allowNewClientsRequest !== undefined) {
        flatSettings.allow_new_clients_request =
          settings.appointments.allowNewClientsRequest;
      }
      if (settings.appointments.requestsFromNewIndividuals !== undefined) {
        flatSettings.requests_from_new_individuals =
          settings.appointments.requestsFromNewIndividuals;
      }
      if (settings.appointments.requestsFromNewCouples !== undefined) {
        flatSettings.requests_from_new_couples =
          settings.appointments.requestsFromNewCouples;
      }
      if (settings.appointments.requestsFromNewContacts !== undefined) {
        flatSettings.requests_from_new_contacts =
          settings.appointments.requestsFromNewContacts;
      }
      if (settings.appointments.isPrescreenNewClients !== undefined) {
        flatSettings.is_prescreen_new_clinets =
          settings.appointments.isPrescreenNewClients;
      }
      if (settings.appointments.cardForAppointmentRequest !== undefined) {
        flatSettings.card_for_appointment_request =
          settings.appointments.cardForAppointmentRequest;
      }
    }

    if (settings.documents) {
      if (settings.documents.isUploadDocumentsAllowed !== undefined) {
        flatSettings.is_upload_documents_allowed =
          settings.documents.isUploadDocumentsAllowed;
      }
    }

    const existing = await prisma.clientPortalSettings.findFirst({
      where: { clinician_id: clinicianId },
    });

    if (existing) {
      return prisma.clientPortalSettings.update({
        where: { id: existing.id },
        data: flatSettings,
      });
    } else {
      return prisma.clientPortalSettings.create({
        data: {
          id: randomUUID(),
          clinician_id: clinicianId,
          ...flatSettings,
        },
      });
    }
  }

  private async updatePracticeSettings(
    _clinicianId: string,
    category: string,
    settings:
      | Partial<PortalSettings>
      | Partial<WidgetSettings>
      | Partial<CalendarSettings>
      | Partial<ContactFormSettings>,
  ): Promise<unknown> {
    // Save each setting as an individual key-value pair
    const updates: Promise<unknown>[] = [];

    // Iterate through sections and settings
    for (const [_section, sectionSettings] of Object.entries(settings)) {
      if (typeof sectionSettings === "object" && sectionSettings !== null) {
        for (const [setting, value] of Object.entries(sectionSettings)) {
          // Create simpler key like: calendar_start_time, appointment_request_widget_code, etc.
          let key: string;
          if (category === "widget" && setting === "widgetCode") {
            key = "appointment_request_widget_code";
          } else {
            key = `${category}_${this.camelToSnake(setting)}`;
          }

          // Convert value to string for storage
          // SQL Server doesn't allow null in value field, so use empty string for null
          const stringValue = value === null ? "" : String(value);

          // Find existing setting
          const existing = await prisma.practiceSettings.findFirst({
            where: { key },
          });

          if (existing) {
            updates.push(
              prisma.practiceSettings.update({
                where: { id: existing.id },
                data: { value: stringValue },
              }),
            );
          } else {
            updates.push(
              prisma.practiceSettings.create({
                data: {
                  id: randomUUID(),
                  key,
                  value: stringValue,
                },
              }),
            );
          }
        }
      }
    }

    // Execute all updates
    await Promise.all(updates);
    return { success: true };
  }

  // Get settings from PracticeSettings
  private async getPracticeSettingsCategory(
    _clinicianId: string,
    category: string,
  ): Promise<
    | PortalSettings
    | WidgetSettings
    | CalendarSettings
    | ContactFormSettings
    | null
  > {
    // Get all settings for this category with simpler keys
    let settings;
    if (category === "widget") {
      // Special case for widget - look for appointment_request_widget_code
      settings = await prisma.practiceSettings.findMany({
        where: {
          key: "appointment_request_widget_code",
        },
      });
    } else {
      settings = await prisma.practiceSettings.findMany({
        where: {
          key: {
            startsWith: `${category}_`,
          },
        },
      });
    }

    if (settings.length === 0) {
      return null;
    }

    // Reconstruct the nested object from individual settings
    const result: Record<string, Record<string, unknown>> = {};

    for (const setting of settings) {
      let fieldName: string;
      let section: string;

      if (setting.key === "appointment_request_widget_code") {
        // Special case for widget code
        fieldName = "widgetCode";
        section = "general";
      } else {
        // Parse simpler key like: calendar_start_time
        const keyParts = setting.key.split("_");
        // Remove category prefix
        const fieldParts = keyParts.slice(1); // Remove 'calendar_', 'widget_', etc.
        fieldName = this.snakeToCamel(fieldParts.join("_")); // e.g., "start_time" -> "startTime"

        // Determine section based on field name
        section = this.getSettingSection(category, fieldName);
      }

      if (!result[section]) {
        result[section] = {};
      }

      // Parse value based on expected type
      let value: unknown = setting.value;
      if (setting.value !== null && setting.value !== "") {
        // Try to parse as boolean
        if (setting.value === "true") value = true;
        else if (setting.value === "false") value = false;
        // Try to parse as number
        else if (/^\d+$/.test(setting.value))
          value = parseInt(setting.value, 10);
        else if (/^\d+\.\d+$/.test(setting.value))
          value = parseFloat(setting.value);
        // Otherwise keep as string
      } else if (setting.value === "") {
        // Empty string represents null
        value = null;
      }

      result[section][fieldName] = value;
    }

    return result as unknown as
      | PortalSettings
      | WidgetSettings
      | CalendarSettings
      | ContactFormSettings;
  }

  // Helper method to convert camelCase to snake_case
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  // Helper method to convert snake_case to camelCase
  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  // Helper method to determine which section a field belongs to
  private getSettingSection(category: string, fieldName: string): string {
    // Map field names to their sections based on the category
    const sectionMappings: Record<string, Record<string, string>> = {
      calendar: {
        startTime: "display",
        endTime: "display",
        viewMode: "display",
        showWeekends: "display",
        cancellationNoticeHours: "display",
      },
      widget: {
        widgetCode: "general",
      },
      contactForm: {
        isEnabled: "general",
        link: "general",
        widgetCode: "general",
      },
      portal: {
        isEnabled: "general",
        domainUrl: "general",
        welcomeMessage: "general",
        isAppointmentRequestsEnabled: "appointments",
        appointmentStartTimes: "appointments",
        requestMinimumNotice: "appointments",
        maximumRequestNotice: "appointments",
        allowNewClientsRequest: "appointments",
        requestsFromNewIndividuals: "appointments",
        requestsFromNewCouples: "appointments",
        requestsFromNewContacts: "appointments",
        isPrescreenNewClients: "appointments",
        cardForAppointmentRequest: "appointments",
        isUploadDocumentsAllowed: "documents",
      },
    };

    return sectionMappings[category]?.[fieldName] || "general";
  }
}

// Export singleton instance
export const clientCareSettingsService = new ClientCareSettingsService();
