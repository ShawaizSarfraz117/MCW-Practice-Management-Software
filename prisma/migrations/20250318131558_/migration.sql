-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "location_id" TEXT,
    "created_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "client_id" TEXT,
    "clinician_id" TEXT,
    "appointment_fee" REAL,
    "service_id" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_rule" TEXT,
    "cancel_appointments" BOOLEAN,
    "notify_cancellation" BOOLEAN,
    "recurring_appointment_id" TEXT,
    CONSTRAINT "Appointment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Appointment_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "Clinician" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Appointment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_recurring_appointment_id_fkey" FOREIGN KEY ("recurring_appointment_id") REFERENCES "Appointment" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Appointment_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "PracticeService" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppointmentTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointment_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "AppointmentTag_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "AppointmentTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Audit" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT,
    "user_id" TEXT,
    "datetime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" TEXT,
    "event_text" TEXT NOT NULL,
    "is_hipaa" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Audit_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legal_first_name" TEXT NOT NULL,
    "legal_last_name" TEXT NOT NULL,
    "is_waitlist" BOOLEAN NOT NULL DEFAULT false,
    "primary_clinician_id" TEXT,
    "primary_location_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "preferred_name" TEXT,
    "date_of_birth" DATETIME,
    "referred_by" TEXT,
    CONSTRAINT "Client_primary_clinician_id_fkey" FOREIGN KEY ("primary_clinician_id") REFERENCES "Clinician" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Client_primary_location_id_fkey" FOREIGN KEY ("primary_location_id") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "permission" TEXT NOT NULL,
    "contact_type" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "ClientContact_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "ClientGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ClientGroupMembership" (
    "client_group_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "role" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_contact_only" BOOLEAN NOT NULL DEFAULT false,
    "is_responsible_for_billing" BOOLEAN,

    PRIMARY KEY ("client_group_id", "client_id"),
    CONSTRAINT "ClientGroupMembership_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "ClientGroupMembership_client_group_id_fkey" FOREIGN KEY ("client_group_id") REFERENCES "ClientGroup" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "ClientReminderPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ClientReminderPreference_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Clinician" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "percentage_split" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    CONSTRAINT "Clinician_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicianClient" (
    "client_id" TEXT NOT NULL,
    "clinician_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("client_id", "clinician_id"),
    CONSTRAINT "ClinicianClient_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "ClinicianClient_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "Clinician" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "ClinicianLocation" (
    "clinician_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("clinician_id", "location_id"),
    CONSTRAINT "ClinicianLocation_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "Clinician" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClinicianLocation_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicianServices" (
    "clinician_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "custom_rate" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("clinician_id", "service_id"),
    CONSTRAINT "ClinicianServices_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "Clinician" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClinicianServices_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "PracticeService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "card_type" TEXT NOT NULL,
    "last_four" TEXT NOT NULL,
    "expiry_month" INTEGER NOT NULL,
    "expiry_year" INTEGER NOT NULL,
    "cardholder_name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "billing_address" TEXT,
    "token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditCard_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "client_group_id" TEXT,
    "appointment_id" TEXT,
    "clinician_id" TEXT NOT NULL,
    "issued_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Invoice_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Invoice_client_group_id_fkey" FOREIGN KEY ("client_group_id") REFERENCES "ClientGroup" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Invoice_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "Clinician" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "payment_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "credit_card_id" TEXT,
    "transaction_id" TEXT,
    "status" TEXT NOT NULL,
    "response" TEXT,
    CONSTRAINT "Payment_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "CreditCard" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "PracticeService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "color" TEXT
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SurveyAnswers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "content" TEXT,
    "frequency" TEXT,
    "completed_at" DATETIME,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" DATETIME,
    "status" TEXT NOT NULL,
    "appointment_id" TEXT,
    "is_signed" BOOLEAN,
    "is_locked" BOOLEAN,
    CONSTRAINT "SurveyAnswers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "SurveyAnswers_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "SurveyTemplate" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "SurveyAnswers_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "SurveyTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "frequency_options" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "updated_at" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "requires_signature" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login" DATETIME
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    PRIMARY KEY ("user_id", "role_id"),
    CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AppointmentTag_appointment_id_idx" ON "AppointmentTag"("appointment_id");

-- CreateIndex
CREATE INDEX "AppointmentTag_tag_id_idx" ON "AppointmentTag"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTag_appointment_id_tag_id_key" ON "AppointmentTag"("appointment_id", "tag_id");

-- CreateIndex
CREATE INDEX "ClientGroupMembership_client_id_idx" ON "ClientGroupMembership"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClientReminderPreference_client_id_reminder_type_key" ON "ClientReminderPreference"("client_id", "reminder_type");

-- CreateIndex
CREATE UNIQUE INDEX "Clinician_user_id_key" ON "Clinician"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeService_code_key" ON "PracticeService"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
