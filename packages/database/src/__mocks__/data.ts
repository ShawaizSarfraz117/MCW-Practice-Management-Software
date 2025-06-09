/* eslint-disable max-lines */
import {
  defineClinicianFactory,
  defineClientFactory,
  defineLocationFactory,
  defineUserFactory,
  defineAppointmentFactory,
  defineAppointmentTagFactory,
  defineAuditFactory,
  defineClientContactFactory,
  defineClientGroupFactory,
  defineClientGroupMembershipFactory,
  defineClientReminderPreferenceFactory,
  defineClinicianClientFactory,
  defineClinicianLocationFactory,
  defineCreditCardFactory,
  defineInvoiceFactory,
  definePaymentFactory,
  definePracticeServiceFactory,
  defineRoleFactory,
  defineSurveyAnswersFactory,
  defineSurveyTemplateFactory,
  defineTagFactory,
  defineUserRoleFactory,
  defineProductFactory,
  registerScalarFieldValueGenerator,
  defineEmailTemplateFactory,
  defineBillingSettingsFactory,
  defineAppointmentRequestsFactory,
  defineRequestContactItemsFactory,
  defineClientGroupChartNoteFactory,
} from "@mcw/database/fabbrica";
import { generateUUID } from "@mcw/utils";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import {
  Clinician,
  User,
  Client,
  Location,
  Tag,
  Appointment,
  Audit,
  ClientContact,
  ClientGroup,
  ClientGroupMembership,
  ClientReminderPreference,
  ClinicianClient,
  PracticeService,
  CreditCard,
  Invoice,
  Payment,
  Role,
  SurveyTemplate,
  SurveyAnswers,
  EmailTemplate,
  Product,
  ClinicianLocation,
  AppointmentRequests,
  RequestContactItems,
  ClientGroupChartNote,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { BillingSettings } from "../types/billing.js";
registerScalarFieldValueGenerator({
  Decimal: () =>
    new Decimal(faker.number.float({ min: 0, max: 10, fractionDigits: 2 })),
});
// User factory for generating mock data without Prisma
export const UserFactory = {
  build: <T extends Partial<User>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password_hash: bcrypt.hashSync(faker.internet.password(), 10),
    last_login: faker.date.recent(),
    date_of_birth: faker.date.past(),
    phone: faker.phone.number(),
    profile_photo: faker.image.url(),
    ...overrides,
  }),
};
// User factory for Prisma operations
export const UserPrismaFactory = defineUserFactory({
  defaultData: () => UserFactory.build(),
});
// Clinician factory for generating mock data
export const ClinicianFactory = {
  build: <T extends Partial<Clinician>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    address: faker.location.streetAddress(),
    percentage_split: faker.number.float({ min: 0, max: 100 }),
    is_active: true,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    ...overrides,
  }),
};
// Clinician factory for Prisma operations
export const ClinicianPrismaFactory = defineClinicianFactory({
  defaultData: () => {
    return {
      ...ClinicianFactory.build(),
      User: UserPrismaFactory,
    };
  },
  traits: {
    disabled: {
      data: {
        is_active: false,
      },
    },
  },
});
// Client factory for generating mock data
export const ClientFactory = {
  build: <T extends Partial<Client>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    legal_first_name: faker.person.firstName(),
    legal_last_name: faker.person.lastName(),
    is_waitlist: false,
    is_active: true,
    preferred_name: faker.person.firstName(),
    date_of_birth: faker.date.past(),
    referred_by: faker.person.fullName(),
    ...overrides,
  }),
};
// Client factory for Prisma operations
export const ClientPrismaFactory = defineClientFactory({
  defaultData: () => ClientFactory.build(),
});
export const LocationFactory = {
  build: <T extends Partial<Location>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    color: faker.internet.color(),
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
    ...overrides,
  }),
};
export const ClinicianLocationFactory = {
  build: <T extends Partial<ClinicianLocation>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    is_primary: faker.datatype.boolean(),
    ...overrides,
  }),
};
export const TagFactory = {
  build: <T extends Partial<Tag>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    name: faker.word.sample(),
    color: faker.internet.color(),
    ...overrides,
  }),
};
export const AppointmentFactory = {
  build: <T extends Partial<Appointment>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    User: UserPrismaFactory,
    start_date: faker.date.future(),
    end_date: faker.date.future(),
    type: faker.helpers.arrayElement(["APPOINTMENT", "EVENT"]),
    status: faker.helpers.arrayElement(["scheduled", "completed", "cancelled"]),
    notes: faker.lorem.paragraph(),
    ...overrides,
  }),
};
export const AuditFactory = {
  build: <T extends Partial<Audit>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    action: faker.helpers.arrayElement(["create", "update", "delete"]),
    table_name: faker.helpers.arrayElement([
      "client",
      "appointment",
      "payment",
    ]),
    old_values: JSON.stringify({}),
    new_values: JSON.stringify({}),
    created_at: faker.date.recent(),
    ...overrides,
  }),
};
export const ClientContactFactory = {
  build: <T extends Partial<ClientContact>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    relationship: faker.helpers.arrayElement(["parent", "spouse", "guardian"]),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    ...overrides,
  }),
};
export const ClientGroupFactory = {
  build: <T extends Partial<ClientGroup>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(["FAMILY", "INDIVIDUAL", "ORGANIZATION"]),
    name: faker.company.name(),
    administrative_notes: null,
    ...overrides,
  }),
};
export const ClientReminderPreferenceFactory = {
  build: <T extends Partial<ClientReminderPreference>>(
    overrides: T = {} as T,
  ) => ({
    id: faker.string.uuid(),
    email_enabled: faker.datatype.boolean(),
    sms_enabled: faker.datatype.boolean(),
    reminder_time: faker.number.int({ min: 1, max: 72 }), // hours before appointment
    ...overrides,
  }),
};
export const ClinicianClientFactory = {
  build: <T extends Partial<ClinicianClient>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    assigned_at: faker.date.past(),
    is_primary: faker.datatype.boolean(),
    ...overrides,
  }),
};
export const PracticeServiceFactory = {
  build: <T extends Partial<PracticeService>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(["INDIVIDUAL", "GROUP", "FAMILY"]),
    code: faker.string.alphanumeric(5).toUpperCase(),
    description: faker.lorem.sentence(),
    rate: new Decimal(
      faker.number.float({ min: 50, max: 1000, fractionDigits: 2 }),
    ),
    duration: faker.number.int({ min: 30, max: 120 }),
    color: faker.internet.color(),
    is_default: faker.datatype.boolean(),
    bill_in_units: faker.datatype.boolean(),
    available_online: faker.datatype.boolean(),
    allow_new_clients: faker.datatype.boolean(),
    require_call: faker.datatype.boolean(),
    block_before: faker.number.int({ min: 0, max: 30 }),
    block_after: faker.number.int({ min: 0, max: 30 }),
    ...overrides,
  }),
};
export const ProductFactory = {
  build: <T extends Partial<Product>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    price: new Decimal(
      faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
    ),
    ...overrides,
  }),
};
export const ProductPrismaFactory = defineProductFactory({
  defaultData: () => ProductFactory.build(),
});
// PracticeService Prisma factory
export const PracticeServicePrismaFactory = definePracticeServiceFactory({
  defaultData: () => PracticeServiceFactory.build(),
});
export const CreditCardFactory = {
  build: <T extends Partial<CreditCard>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    Client: ClientFactory.build(),
    last_four: faker.finance.creditCardNumber("####"),
    expiry_month: faker.date.future().getMonth() + 1,
    expiry_year: faker.date.future().getFullYear(),
    card_type: faker.helpers.arrayElement(["visa", "mastercard", "amex"]),
    is_default: faker.datatype.boolean(),
    ...overrides,
  }),
};
export const InvoiceFactory = {
  build: <T extends Partial<Invoice>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    amount: faker.number.float({ min: 50, max: 1000, fractionDigits: 2 }),
    status: faker.helpers.arrayElement(["draft", "sent", "paid", "void"]),
    due_date: faker.date.future(),
    issued_date: faker.date.recent(),
    ...overrides,
  }),
  buildComplete: (overrides = {}) => {
    const issuedDate = new Date();
    const dueDate = new Date(issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    return {
      id: generateUUID(),
      invoice_number: "INV-1234",
      client_group_id: generateUUID(),
      appointment_id: null, // Set to null to avoid foreign key constraint
      clinician_id: generateUUID(),
      issued_date: issuedDate,
      due_date: dueDate,
      amount: new Decimal(100),
      status: "PENDING",
      ClientGroupMembership: null,
      Appointment: null,
      Clinician: null,
      Payment: [],
      ...overrides,
    };
  },
};
export const PaymentFactory = {
  build: <T extends Partial<Payment>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    amount: faker.number
      .float({ min: 50, max: 1000, fractionDigits: 2 })
      .toString(),
    payment_method: faker.helpers.arrayElement([
      "credit_card",
      "bank_transfer",
      "cash",
    ]),
    status: faker.helpers.arrayElement(["pending", "completed", "failed"]),
    transaction_id: faker.string.alphanumeric(10),
    payment_date: faker.date.recent(),
    ...overrides,
  }),
};
export const RoleFactory = {
  build: <T extends Partial<Role>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(["admin", "clinician", "receptionist"]),
    ...overrides,
  }),
};
export const SurveyTemplateFactory = {
  build: <T extends Partial<SurveyTemplate>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    questions: JSON.stringify([
      {
        question: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(["text", "multiple_choice", "rating"]),
        options: faker.helpers.arrayElements(
          ["option1", "option2", "option3"],
          3,
        ),
      },
    ]),
    ...overrides,
  }),
};
export const SurveyAnswersFactory = {
  build: <T extends Partial<SurveyAnswers>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    answers: JSON.stringify({
      answers: [
        {
          question_id: faker.string.uuid(),
          answer: faker.lorem.sentence(),
        },
      ],
    }),
    submitted_at: faker.date.recent(),
    ...overrides,
  }),
};
// Location Prisma factory
export const LocationPrismaFactory = defineLocationFactory({
  defaultData: () => LocationFactory.build(),
});
// Tag Prisma factory
export const TagPrismaFactory = defineTagFactory({
  defaultData: () => TagFactory.build(),
});
// Appointment Prisma factory
export const AppointmentPrismaFactory = defineAppointmentFactory({
  defaultData: () => ({
    ...AppointmentFactory.build(),
    Client: ClientPrismaFactory,
    Clinician: ClinicianPrismaFactory,
    User: UserPrismaFactory,
    Location: LocationPrismaFactory,
  }),
});
// AppointmentTag Prisma factory
export const AppointmentTagPrismaFactory = defineAppointmentTagFactory({
  defaultData: () => ({
    Appointment: AppointmentPrismaFactory,
    Tag: TagPrismaFactory,
  }),
});
// Audit Prisma factory
export const AuditPrismaFactory = defineAuditFactory({
  defaultData: () => ({
    ...AuditFactory.build(),
    Client: ClientPrismaFactory,
    User: UserPrismaFactory,
  }),
});
// ClientContact Prisma factory
export const ClientContactPrismaFactory = defineClientContactFactory({
  defaultData: () => ({
    ...ClientContactFactory.build(),
    Client: ClientPrismaFactory,
  }),
});
// ClientGroup Prisma factory
export const ClientGroupPrismaFactory = defineClientGroupFactory({
  defaultData: () => ClientGroupFactory.build(),
});
// ClientGroupMembership Prisma factory
export const ClientGroupMembershipPrismaFactory =
  defineClientGroupMembershipFactory({
    defaultData: () => ({
      Client: ClientPrismaFactory,
      ClientGroup: ClientGroupPrismaFactory,
    }),
  });
// ClientGroupChartNote factory for generating mock data
export const ClientGroupChartNoteFactory = {
  build: <T extends Partial<ClientGroupChartNote>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    text: faker.lorem.paragraph(),
    note_date: faker.date.recent(),
    // client_group_id is intentionally omitted here, will be handled by relation in Prisma factory
    ...overrides,
  }),
};
// ClientGroupChartNote Prisma factory
export const ClientGroupChartNotePrismaFactory =
  defineClientGroupChartNoteFactory({
    defaultData: async (options) => {
      const { client_group_id, ...baseData } =
        ClientGroupChartNoteFactory.build(
          options.overrides as Partial<ClientGroupChartNote>,
        ); // Added type assertion
      return {
        ...baseData,
        ClientGroup: options.ClientGroup ?? ClientGroupPrismaFactory,
      };
    },
  });
// ClientReminderPreference Prisma factory
export const ClientReminderPreferencePrismaFactory =
  defineClientReminderPreferenceFactory({
    defaultData: () => ({
      ...ClientReminderPreferenceFactory.build(),
      Client: ClientPrismaFactory,
      ClientContact: ClientContactPrismaFactory,
    }),
  });
// ClinicianClient Prisma factory
export const ClinicianClientPrismaFactory = defineClinicianClientFactory({
  defaultData: () => ({
    ...ClinicianClientFactory.build(),
    Client: ClientPrismaFactory,
    Clinician: ClinicianPrismaFactory,
  }),
});
// ClinicianLocation Prisma factory
export const ClinicianLocationPrismaFactory = defineClinicianLocationFactory({
  defaultData: () => ({
    ...ClinicianLocationFactory.build(),
    Clinician: ClinicianPrismaFactory,
    Location: LocationPrismaFactory,
  }),
});
// CreditCard Prisma factory
export const CreditCardPrismaFactory = defineCreditCardFactory({
  defaultData: () => ({
    ...CreditCardFactory.build(),
    Client: ClientPrismaFactory,
  }),
});
// Invoice Prisma factory
export const InvoicePrismaFactory = defineInvoiceFactory({
  defaultData: () => ({
    ...InvoiceFactory.build(),
    Appointment: AppointmentPrismaFactory,
    ClientGroup: ClientGroupPrismaFactory,
    Clinician: ClinicianPrismaFactory,
    amount: faker.number
      .float({ min: 50, max: 1000, fractionDigits: 2 })
      .toString(),
  }),
});
// Payment Prisma factory
export const PaymentPrismaFactory = definePaymentFactory({
  defaultData: () => ({
    ...PaymentFactory.build(),
    Invoice: InvoicePrismaFactory,
    amount: faker.number
      .float({ min: 50, max: 1000, fractionDigits: 2 })
      .toString(),
  }),
});
// Role Prisma factory
export const RolePrismaFactory = defineRoleFactory({
  defaultData: () => RoleFactory.build(),
});
// UserRole Prisma factory
export const UserRolePrismaFactory = defineUserRoleFactory({
  defaultData: () => ({
    User: UserPrismaFactory,
    Role: RolePrismaFactory,
  }),
});
// SurveyTemplate Prisma factory
export const SurveyTemplatePrismaFactory = defineSurveyTemplateFactory({
  defaultData: () => SurveyTemplateFactory.build(),
});
// SurveyAnswers Prisma factory
export const SurveyAnswersPrismaFactory = defineSurveyAnswersFactory({
  defaultData: () => ({
    ...SurveyAnswersFactory.build(),
    Appointment: AppointmentPrismaFactory,
    Client: ClientPrismaFactory,
    SurveyTemplate: SurveyTemplatePrismaFactory,
  }),
});
// Helper to create a valid invoice object with proper UUID formats
export const mockInvoice = (overrides = {}) => {
  return InvoiceFactory.buildComplete(overrides);
};
// Helper to create a valid superbill object with proper format
export const mockSuperbill = (overrides = {}) => {
  const issuedDate = new Date();
  return {
    id: generateUUID(),
    superbill_number: 5001,
    client_group_id: generateUUID(),
    appointment_id: generateUUID(),
    issued_date: issuedDate,
    amount: new Decimal(150),
    service_code: "90837",
    service_description: "Therapy Session",
    diagnosis_code: "F41.9",
    units: 1,
    pos: "02",
    provider_name: "Test Provider",
    provider_email: "provider@example.com",
    provider_license: "LMFT123456",
    client_name: "Test Client",
    status: "CREATED",
    created_by: generateUUID(),
    created_at: issuedDate,
    paid_amount: new Decimal(0),
    ClientGroup: {
      id: generateUUID(),
      name: "Test Group",
    },
    ...overrides,
  };
};
// Helper to create a valid statement object with proper format
export const mockStatement = (overrides = {}) => {
  const createdDate = new Date();
  const startDate = new Date(createdDate);
  startDate.setMonth(startDate.getMonth() - 1);
  return {
    id: generateUUID(),
    statement_number: 2001,
    client_group_id: generateUUID(),
    start_date: startDate,
    end_date: createdDate,
    created_at: createdDate,
    beginning_balance: new Decimal(250),
    invoices_total: new Decimal(100),
    payments_total: new Decimal(75),
    ending_balance: new Decimal(275),
    provider_name: "Test Provider",
    provider_email: "provider@example.com",
    provider_phone: "555-123-4567",
    client_group_name: "Test Group",
    client_name: "John Doe",
    client_email: "client@example.com",
    created_by: generateUUID(),
    ClientGroup: {
      id: generateUUID(),
      name: "Test Group",
    },
    ...overrides,
  };
};
export const EmailTemplateFactory = {
  build: <T extends Partial<EmailTemplate>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    name: faker.lorem.words(3),
    subject: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    type: faker.helpers.arrayElement(["automated", "reminder", "billing"]),
    email_type: faker.helpers.arrayElement(["client", "contact and couples"]),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    created_by: faker.string.uuid(),
    ...overrides,
  }),
};
export const EmailTemplatePrismaFactory = defineEmailTemplateFactory({
  defaultData: () => EmailTemplateFactory.build(),
});
// BillingSettings factory for generating mock data
export const BillingSettingsFactory = {
  build: <T extends Partial<BillingSettings>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    clinician_id: faker.string.uuid(),
    autoInvoiceCreation: faker.helpers.arrayElement([
      "daily",
      "monthly",
      "manual",
    ]),
    pastDueDays: faker.number.int({ min: 1, max: 60 }),
    emailClientPastDue: faker.datatype.boolean(),
    invoiceIncludePracticeLogo: faker.datatype.boolean(),
    invoiceFooterInfo: faker.lorem.sentence(),
    superbillDayOfMonth: faker.number.int({ min: 1, max: 28 }),
    superbillIncludePracticeLogo: faker.datatype.boolean(),
    superbillIncludeSignatureLine: faker.datatype.boolean(),
    superbillIncludeDiagnosisDescription: faker.datatype.boolean(),
    superbillFooterInfo: faker.lorem.sentence(),
    billingDocEmailDelayMinutes: faker.number.int({ min: 0, max: 120 }),
    createMonthlyStatementsForNewClients: faker.datatype.boolean(),
    createMonthlySuperbillsForNewClients: faker.datatype.boolean(),
    defaultNotificationMethod: faker.helpers.arrayElement([
      "none",
      "email",
      "sms",
    ]),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    ...overrides,
  }),
};
export const BillingSettingsPrismaFactory = defineBillingSettingsFactory({
  defaultData: () => {
    const { clinician_id, ...rest } = BillingSettingsFactory.build();
    return {
      ...rest,
      Clinician: ClinicianPrismaFactory,
    };
  },
});

/**
 * Factory helper for creating appointments with all relations
 * This creates the exact shape returned by prisma.appointment.findUnique with includes
 * Used in unit tests to mock the response from re-querying after creation
 */
type AppointmentWithRelations = Appointment & {
  AppointmentTag?: Array<{
    id: string;
    appointment_id: string;
    tag_id: string;
    Tag: { id: string; name: string; color: string | null };
  }>;
  ClientGroup?:
    | (ClientGroup & {
        ClientGroupMembership: Array<
          ClientGroupMembership & { Client?: Client }
        >;
      })
    | null;
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  Location?: {
    id: string;
    name: string;
    address: string;
  } | null;
};

export function createAppointmentWithRelations(
  appointment: Partial<Appointment>,
  relations: {
    clientGroup?: Partial<ClientGroup>;
    clinician?: Partial<Clinician>;
    location?: Partial<Location>;
    tags?: Array<{ id: string; name: string; color: string | null }>;
  } = {},
): AppointmentWithRelations {
  const { clientGroup, clinician, location, tags = [] } = relations;

  return {
    ...appointment,
    AppointmentTag: tags.map((tag, index) => ({
      id: `appt-tag-${index}`,
      appointment_id: appointment.id as string,
      tag_id: tag.id,
      Tag: tag,
    })),
    ClientGroup: clientGroup
      ? {
          ...clientGroup,
          // Ensure all required fields
          id: clientGroup.id as string,
          type: clientGroup.type as string,
          name: clientGroup.name as string,
          is_active: clientGroup.is_active ?? true,
          available_credit: clientGroup.available_credit ?? new Decimal(0),
          created_at: clientGroup.created_at ?? new Date(),
          auto_monthly_statement_enabled:
            clientGroup.auto_monthly_statement_enabled ?? false,
          auto_monthly_superbill_enabled:
            clientGroup.auto_monthly_superbill_enabled ?? false,
          first_seen_at: clientGroup.first_seen_at ?? null,
          notes: clientGroup.notes ?? null,
          clinician_id: clientGroup.clinician_id ?? null,
          ClientGroupMembership: [],
        }
      : null,
    Clinician: clinician
      ? {
          id: clinician.id as string,
          first_name: clinician.first_name as string,
          last_name: clinician.last_name as string,
        }
      : null,
    Location: location
      ? {
          id: location.id as string,
          name: location.name as string,
          address: location.address as string,
        }
      : null,
  } as AppointmentWithRelations;
}

/**
 * Factory helper for creating events (type='EVENT') with all relations
 */
export function createEventWithRelations(
  event: Partial<Appointment>,
  relations: {
    clinician?: Partial<Clinician>;
    location?: Partial<Location>;
  } = {},
) {
  return createAppointmentWithRelations(
    {
      ...event,
      type: "EVENT",
      client_group_id: null,
    },
    {
      ...relations,
      clientGroup: undefined,
    },
  );
}

// AppointmentRequests factory for generating mock data
export const AppointmentRequestsFactory = {
  build: <T extends Partial<AppointmentRequests>>(overrides: T = {} as T) => {
    const startTime = faker.date.future();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    return {
      id: faker.string.uuid(),
      clinician_id: faker.string.uuid(),
      client_id: faker.helpers.maybe(() => faker.string.uuid(), {
        probability: 0.7,
      }),
      service_id: faker.string.uuid(),
      appointment_for: faker.helpers.arrayElement([
        "individual",
        "couple",
        "family",
      ]),
      reasons_for_seeking_care: faker.lorem.paragraph(),
      mental_health_history: faker.lorem.paragraph(),
      additional_notes: faker.lorem.sentence(),
      start_time: startTime,
      end_time: endTime,
      status: faker.helpers.arrayElement(["pending", "accepted", "archived"]),
      received_date: faker.date.recent(),
      updated_at: faker.date.recent(),
      ...overrides,
    };
  },
};

// AppointmentRequests Prisma factory
export const AppointmentRequestsPrismaFactory =
  defineAppointmentRequestsFactory({
    defaultData: () => ({
      ...AppointmentRequestsFactory.build(),
      PracticeService: PracticeServicePrismaFactory,
    }),
  });

// RequestContactItems factory for generating mock data
export const RequestContactItemsFactory = {
  build: <T extends Partial<RequestContactItems>>(overrides: T = {} as T) => ({
    id: faker.string.uuid(),
    appointment_request_id: faker.string.uuid(),
    type: faker.helpers.arrayElement(["individual", "couple", "family"]),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    preferred_name: faker.helpers.maybe(() => faker.person.firstName()),
    date_of_birth: faker.helpers.maybe(() => faker.date.past()),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    payment_method: faker.helpers.maybe(() =>
      faker.helpers.arrayElement(["credit_card", "insurance", "cash"]),
    ),
    is_client_minor: faker.helpers.maybe(() => faker.datatype.boolean()),
    ...overrides,
  }),
};

// RequestContactItems Prisma factory
export const RequestContactItemsPrismaFactory =
  defineRequestContactItemsFactory({
    defaultData: () => ({
      ...RequestContactItemsFactory.build(),
      AppointmentRequests: AppointmentRequestsPrismaFactory,
    }),
  });
export const PracticeSettingsFactory = {
  build: <T extends Partial<{ id: string; key: string; value: string }>>(
    overrides: T = {} as T,
  ) => ({
    id: faker.string.uuid(),
    key: faker.helpers.arrayElement([
      "is-text-reminders-enabled",
      "practice-name",
      "timezone",
      "default-language",
    ]),
    value: faker.lorem.word(),
    ...overrides,
  }),
};
