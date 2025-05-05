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
  registerScalarFieldValueGenerator,
} from "@mcw/database/fabbrica";
import { generateUUID } from "@mcw/utils";
import bcrypt from "bcrypt";
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
  ClientReminderPreference,
  ClinicianClient,
  PracticeService,
  CreditCard,
  Invoice,
  Payment,
  Role,
  SurveyTemplate,
  SurveyAnswers,
  Product,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

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
    type: faker.helpers.arrayElement(["consultation", "therapy", "followup"]),
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
    description: faker.lorem.sentence(),
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

// ClientReminderPreference Prisma factory
export const ClientReminderPreferencePrismaFactory =
  defineClientReminderPreferenceFactory({
    defaultData: () => ({
      ...ClientReminderPreferenceFactory.build(),
      Client: ClientPrismaFactory,
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

// Product Factory for Mock Data
//===================================================

// Basic structure for a mock Product
export type MockProduct = Omit<Product, "createdAt" | "updatedAt" | "price"> & {
  createdAt: string; // Often easier to work with ISO strings in mocks
  updatedAt: string;
  price: string; // Represent Decimal as string for simplicity in mocks
};

let productSequence = 0; // Renamed to avoid conflict with other sequence vars if any

// Simple mock factory function
export const ProductFactory = (
  overrides?: Partial<MockProduct>,
): MockProduct => {
  productSequence += 1;
  return {
    id: `mock-product-${productSequence}`,
    name: `Mock Product ${productSequence}`,
    price: "100.00",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};
