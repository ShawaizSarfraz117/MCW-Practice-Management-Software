# SCHEMA_NOTES.md - Prisma Schema Review & Domain Documentation Guide (v2)

**Date:** May 25, 2025
**Last Updated:** May 25, 2025 (Incorporating feedback from AI review of schema.prisma.txt)

## 1. Introduction

This document serves as a central knowledge base for understanding the `schema.prisma` of our practice management system. Its purpose is to:

- Clarify the business domain logic as reflected in the data model.
- Guide discussions for refining the schema and related software design.
- Capture key decisions, business rules, and workflows.
- Support a Domain-Driven Design (DDD) approach by defining entities, value objects, aggregates, and the ubiquitous language.
- Provide sufficient information for both human developers and AI assistants to implement features accurately.

This is a living document and should be updated iteratively as our understanding evolves.

## 2. Domain Overview

The MCW Practice Management Software is a HIPAA-compliant system designed for mental health practices. It manages:

- **Client Management**: Individual clients, groups (families, couples), contacts, and their relationships
- **Appointment Scheduling**: Appointments, recurring appointments, availability management, and appointment requests
- **Billing & Financial Management**: Invoices, payments, statements, superbills, credit management
- **Clinical Documentation**: Notes, surveys, treatment plans, diagnoses
- **Practice Operations**: Clinician management, locations, services, notifications
- **Portal Access**: Client portal permissions and secure messaging

## 3. Summary of Suggested Schema Modifications for Review

_(These are based on the AI's review during the initial commenting and subsequent detailed review of `schema.prisma`. Please verify each point against your requirements.)_

### 3.1 Data Type and Field Adjustments (Applied or Pending Verification)

- **Applied (based on recent review, verify final implementation):**

  - `Appointment.appointment_fee`: Changed from `Decimal?` to `Decimal? @db.Decimal(10,2)`
  - `Appointment.adjustable_amount`: Changed from `Decimal?` to `Decimal? @db.Decimal(10,2)`
  - `Appointment.write_off`: Changed from `Decimal?` to `Decimal? @db.Decimal(10,2)`
  - `ClientGroup.available_credit`: Changed from `Decimal @default(0)` to `Decimal @db.Decimal(10,2) @default(0)`
  - `ClinicianServices.custom_rate`: Changed from `Decimal?` to `Decimal? @db.Decimal(10,2)`
  - `Payment.credit_applied`: Changed from `Decimal?` to `Decimal? @db.Decimal(10,2)`
  - `ClientGroupServices.custom_rate`: Changed from `Decimal` to `Decimal @db.Decimal(10,2)`
  - `DiagnosisTreatmentPlan.is_signed`: Changed from `String? @default("0") @db.NChar(10)` to `Boolean? @default(false)`
  - `ClinicalInfo.NPI_number`: Data type changed from `Float` to `String` (to match `Clinician.NPI_number` and standard NPI format).
  - `License.expiration_date`: Changed from `DateTime` to `DateTime @db.Date`
  - `StatementItem.date`: Changed from `DateTime` to `DateTime @db.Date`
  - `AppointmentNotes.survey_answer_id`: Changed from `String` to `String?` (as notes may not always originate from a survey).

- **Previously Suggested (and now mostly confirmed or schema already aligns):**

  - `GoodFaithEstimate.client_zip_code`: Changed from `Int?` to `String? @db.VarChar(20)` (Schema reflects this)
  - `GoodFaithEstimate.total_cost`: Changed from `Int` to `Decimal @db.Decimal(10,2)` (Schema reflects this)
  - `GoodFaithServices.fee`: Changed from `Int` to `Decimal @db.Decimal(10,2)` (Schema reflects this)
  - `StatementItem.charges`, `payments`, `balance`: Changed from `Int` to `Decimal @db.Decimal(10,2)` (Schema reflects this)
  - `ClientAdress.address_line2`: Made optional (`String?`) (Schema reflects this)

- **Question for Team (Reiteration):** Original `Int` types for monetary values were likely placeholders. The change to `Decimal @db.Decimal(10,2)` storing dollars (not cents) is now consistently applied and documented in section 8.1.

### 3.2 Uniqueness Constraints Added (`@unique`) (Verified)

- The following fields were reviewed, and existing `@unique` constraints in `schema.prisma` are confirmed as intentional based on `schema_notes.md` initial suggestions:
  - `Tag.name`
  - `EmailTemplate.name`
  - `Invoice.invoice_number`
  - `PracticeService.code`
  - `ReminderTextTemplates.type`
  - `PracticeSettings.key`
  - `ClinicalInfo.user_id`
  - `CreditCard.token`
  - `Diagnosis.code`
  - `ClientFiles.[client_group_file_id, client_id]`
  - `ClientGroupServices.[client_group_id, service_id]`
  - `ClientBillingPreferences.client_group_id`
  - `GoodFaithEstimate.[client_id, provided_date]` (Still noted: actual uniqueness rule for GFE needs business confirmation, though the constraint is present).

## 4. Key Business Rules & Workflows

### 4.1 Client & Group Management

- **Client Groups**: Every appointment is associated with a `ClientGroup`, not individual clients.
  - Types: 'individual', 'couple', 'family', 'minor'.
  - Groups can have available credit that can be applied to payments.
  - Groups have billing preferences and can generate automatic monthly statements/superbills.
- **Client Roles**: Within a group, clients can have roles (e.g., primary, spouse, child, guardian).
- **Contact-Only Members**: Some group members may be contacts only (e.g., emergency contacts, guardians not receiving services).
- **Billing Responsibility**: One member per group can be marked as responsible for billing. Invariant: Only one member can be responsible.

### 4.2 Appointment Lifecycle

1. **Request Phase** (Optional):
   - New clients can submit `AppointmentRequests` through the portal.
   - Requests include contact details in `RequestContactItems`.
   - Status transitions: 'PENDING_REVIEW' → 'ACCEPTED'/'DECLINED' → 'CONVERTED_TO_APPOINTMENT'.
2. **Scheduling Phase**:
   - Appointments must respect `AppointmentLimit` (daily limits per clinician).
   - Appointments can be recurring with iCalendar RRULE format (e.g., "FREQ=WEEKLY;COUNT=10;BYDAY=MO,WE").
   - Recurring appointments have a parent-child relationship via `recurring_appointment_id`.
3. **Financial Phase**:
   - `appointment_fee` is the base charge, stored as `Decimal(10,2)`.
   - `adjustable_amount` allows for session-specific adjustments (can be negative for credits), stored as `Decimal(10,2)`.
   - `write_off` tracks amounts that won't be collected, stored as `Decimal(10,2)`.
   - Appointments link to invoices (one-to-one relationship currently, see section 10.1.2 for discussion).

### 4.3 Billing Workflow

1. **Invoice Generation**:
   - Can be manual or automatic (based on `BillingSettings.autoInvoiceCreation`).
   - Types: 'INVOICE', 'ADJUSTMENT', 'CREDIT'.
   - Invoice numbers are sequential and unique (e.g., "INV #1", "INV #2").
2. **Payment Processing**:
   - Payments can apply credits from `ClientGroup.available_credit`.
   - Credit cards are tokenized and tokens stored securely (`CreditCard.token`).
3. **Statement Generation**:
   - Aggregates invoices and payments for a date range.
   - Includes running balance calculations.
   - Can be generated automatically monthly based on `ClientGroup.auto_monthly_statement_enabled`.
4. **Superbill Generation**:
   - For insurance reimbursement. See Glossary (13).
   - Links appointments with diagnoses and service codes.
   - Can be generated automatically monthly based on `ClientGroup.auto_monthly_superbill_enabled`.

### 4.4 Notification System

- **Email Templates**: Dynamic templates (`EmailTemplate`) with merge tags (e.g., `{{client_full_name}}`, `{{appointment_date}}`).
- **SMS Templates**: Dynamic templates (`ReminderTextTemplates`) with merge tags.
- **Reminder Types**: appointment reminders, document reminders, cancellation notices, billing notifications.
- **Client Preferences**: Each client can set notification preferences by type and channel via `ClientReminderPreference`.

## 5. Key Areas for Design Review & Consideration (Schema-Wide)

### 5.1 Referential Integrity (`onDelete`/`onUpdate`)

- Many relations currently use `onDelete: NoAction`. This was re-confirmed as a critical discussion point.
- **Discussion Point:** What is the desired cascading behavior for key entities? (e.g., Deleting a `ClientGroup`: What happens to `Appointments`, `Invoices`? Deleting a `Clinician` or `User`?)
- **Action:** Review and explicitly define `onDelete`/`onUpdate` rules (`Cascade`, `SetNull`, `Restrict`) for all critical relationships. Document the strategy. For example:
  - `AppointmentNotes` on `Appointment` deletion.
  - `Payment` on `Invoice` deletion.
  - `License` on `Clinician` deletion.

### 5.2 Use of Enums for Constrained String Fields

- Fields like `Appointment.status`, `Appointment.type`, `Invoice.status`, `EmailTemplate.type`, `ClientGroup.type`, `ClientContact.contact_type` and many others currently use `String`.
- **Consideration:** Define Prisma `enum` types for these to improve type safety, make allowed values explicit in the schema, and improve developer experience. This was re-confirmed as a high-priority consideration.
- **Action (if not enums):** Continue to meticulously document the defined set of allowed string values for each such field within this `SCHEMA_NOTES.md` (especially section 8.3) and in `schema.prisma` comments.

### 5.3 Potential Redundancy/Overlap & Data Model Refinements

- **`ClinicalInfo` vs. `Clinician`:** Overlapping fields (`speciality`, `NPI_number`, `taxonomy_code`) are still noted. The `ClinicalInfo.NPI_number` type has been aligned to `String` (pending schema update). The consensus is to consolidate `ClinicalInfo` fields into `Clinician` and deprecate `ClinicalInfo`.
- **`ClientContact.type` vs. `ClientContact.contact_type`:** Purpose and distinction need ongoing clarification to ensure consistent use. Current `schema.prisma` comments provide a working distinction: `contact_type` as category ('EMAIL', 'PHONE') and `type` as sub-category ('HOME', 'WORK'). Ensure this is the intended final model.
- **`PracticeService.type` Field Naming**: The field `type` in `PracticeService` is used for the service name. Consider renaming to `name` for better clarity and consistency.
- **`AppointmentNotes` User Relations**: Fields `created_by` and `unlocked_by` in `AppointmentNotes` should be explicitly linked via relations to the `User` model.

### 5.4 Review of Optional Fields (`?`)

- **Discussion Point:** Are all optional fields correctly reflecting business logic where data might genuinely be absent? Review especially for foreign keys and fields like `AppointmentNotes.survey_answer_id` (now confirmed optional).

### 5.5 Default Values

- **`Availability` model:** `end_time`, `start_time`, `end_date`, `start_date` all have `@default(now())`. This remains unusual for availability planning and requires confirmation if intended or if these should always be explicitly set. This was re-confirmed as a key discussion point.
- **Primary Key Defaults**: Review all tables for consistent default ID generation (e.g., using `@default(dbgenerated("newid()"))` for UUIDs in SQL Server). Several tables identified in recent review are missing this.

### 5.6 Naming Conventions

- Current mix: `PascalCase` for models, mostly `snake_case` for fields, `PascalCase` for relation fields.
- **Action:** Document this as the standard if intentional, or discuss refining for greater consistency (e.g., `PracticeService.type` to `PracticeService.name`).

## 6. Aggregate Boundaries & Domain Model

_(This section's content remains valid but should be reviewed in light of any decisions made from Section 5 discussions.)_

### 6.1 Client Aggregate

- **Root**: `Client`
- **Entities**: `ClientProfile`, `ClientAdress`, `ClientContact`, `ClientReminderPreference`
- **Invariants**:
  - A client must have at least one contact method.
  - Primary contact designations must be unique per type.

### 6.2 ClientGroup Aggregate

- **Root**: `ClientGroup`
- **Entities**: `ClientGroupMembership`, `ClientBillingPreferences`, `Invoice`, `Statement`, `Superbill`
- **Value Objects**: `ClientGroupFile` (though `ClientGroupFile` itself has an ID, its lifecycle is tied to `ClientGroup`)
- **Invariants**:
  - Available credit (`available_credit`) cannot be negative.
  - Only one member can be responsible for billing (`ClientGroupMembership.is_responsible_for_billing`).

### 6.3 Appointment Aggregate

- **Root**: `Appointment`
- **Entities**: `AppointmentNotes`, `AppointmentTag`
- **Invariants**:
  - Recurring appointments must maintain parent-child relationships via `recurring_appointment_id`.
  - Start date must be before end date.
  - Cannot exceed daily appointment limits (`AppointmentLimit`).

### 6.4 Clinician Aggregate

- **Root**: `Clinician`
- **Entities**: `License`, `BillingAddress`, `BillingSettings`, `AppointmentLimit`
- **Value Objects**: `ClinicianServices`, `ClinicianLocation`
- **Invariants**:
  - Each clinician is linked to exactly one user account (`User.id`).
  - Billing addresses (`BillingAddress`) must be unique per type (e.g., one 'PRACTICE', one 'MAILING').

## 7. Model-Specific Explanations & Clarifying Questions (Domain Deep Dive)

### 7.1 Client Management & Groupings

- **Models:** `Client`, `ClientProfile`, `ClientAdress`, `ClientContact`, `ClientGroup`, `ClientGroupMembership`
- **Apparent Purpose:** Manages individual client demographic, contact, and detailed profile information. `ClientGroup` associates multiple `Client` records for billing and appointments.
- **Clarifying Questions/Updates:**
  1. **Client vs. ClientGroup for Appointments:** Confirmed: An `Appointment` always has `client_group_id`. Individual clients are handled by being in a single-member `ClientGroup`.
  2. **New Client Onboarding (Video `/0` Context):**
     - `AppointmentRequests.client_id` is optional; new client details are in `RequestContactItems`. The workflow for converting `RequestContactItem` to `Client` and `ClientGroup` (or adding to existing) still needs detailed documentation.
     - How are duplicate clients handled during this intake process? (Open question)
  3. **`ClientGroupMembership.role`:** Typical roles: 'Primary', 'Spouse', 'Child', 'Guardian'. Continue to refine this list as needed.
  4. **`ClientGroupMembership.is_contact_only`:** Use case: for members like emergency contacts or guardians not receiving direct services. They might receive specific communications. See Glossary (13).
  5. **`ClientContact.type` vs. `contact_type`:** Current distinction: `contact_type` is category ('EMAIL', 'PHONE'), `type` is sub-category ('HOME', 'WORK'). Ensure this meets all use cases.
  6. **`Client.referred_by`:** Currently free text. Decision point: keep as free text or link to a structured referral source entity.
  7. **Aggregate Boundaries:** `ClientGroup` as AR for `Invoice`, `Statement`, `Superbill` seems appropriate. `Client` as AR for `ClientProfile`, `ClientAdress`, `ClientContact` also seems appropriate. Define consistency rules more explicitly.

### 7.2 Appointments & Scheduling

- **Models:** `Appointment`, `AppointmentRequests`, `Availability`, `PracticeService`, `AppointmentNotes`, `AppointmentTag`, `AppointmentLimit`
- **Apparent Purpose:** Manages requests, scheduled appointments, availability, services, and notes. (Video `/0` context for requests).
- **Clarifying Questions/Updates:**
  1. **Appointment Lifecycle (Video `/0` Context):** `AppointmentRequests.status` transitions: 'PENDING_REVIEW' → 'ACCEPTED'/'DECLINED' → 'CONVERTED_TO_APPOINTMENT'. How an accepted request becomes an `Appointment` (data copy vs. link) needs detailed workflow.
  2. **`Appointment.recurring_rule`:** Format is iCalendar RRULE. Management of instances (generation, modification, deletion linked to parent) is via `recurring_appointment_id`.
  3. **`Appointment.title`:** Used when a specific title is needed beyond `PracticeService.name/description`.
  4. **`Appointment.type`:** Defined values are 'APPOINTMENT', 'EVENT'.
  5. **`AppointmentNotes.type`:** Defined types like 'PROGRESS_NOTE', 'SOAP_NOTE', 'PRIVATE_NOTE'. How these relate to `SurveyTemplate.type` if a note originates from a survey (via `AppointmentNotes.survey_answer_id`) needs consideration in application logic.
  6. **`Availability` Defaults:** Date/time defaults (`@default(now())`) remain under review (Section 5.5).
  7. **`PracticeService.code`:** Can be internal or standard industry codes (e.g., CPT).
  8. **`AppointmentNotes` User Relations**: `created_by` and `unlocked_by` fields in `AppointmentNotes` should be formally linked to the `User` model.
  9. **Aggregate Boundaries:** `Appointment` as AR for `AppointmentNotes` and `AppointmentTag` is appropriate.

### 7.3 Billing & Finance

- **Models:** `Invoice`, `Payment`, `Statement`, `Superbill`, `CreditCard`, `BillingSettings`, `ClientBillingPreferences`, `GoodFaithEstimate`, `Product`
- **Apparent Purpose:** Manages invoicing, payments, statements, superbills, credit cards, and billing settings. (Video `/2` context for income/billing reports).
- **Clarifying Questions/Updates:**
  1. **Invoice Generation (Video `/2` Context):**
     - `Invoice.appointment_id` or `Invoice.client_group_id` can be `null` (e.g., for `Product` sales not tied to an appointment/group).
     - Workflow: `Appointment` financial fields (`appointment_fee`, `adjustable_amount`, `write_off`) inform invoice amounts. If `InvoiceItem` model is added (see 10.1.1), this relationship becomes more complex.
  2. **Income Report (Video `/2` Context):** This report uses `appointment_fee` adjusted by `adjustable_amount` or `write_off` from `Appointment`. `Payment` records also contribute to "Client Payments" and net income calculations. Clarify exact calculation logic.
  3. **Billing Outstanding Balances Report (Video `/2` Context):**
     - Clarify calculations for "Services provided," "Uninvoiced," "Invoiced," "Client paid," "Client balance" from schema entities.
     - Current schema: `Invoice.appointment_id` is one-to-one optional. If an invoice covers multiple appointments, an `InvoiceItem` model linking to `Appointment` would be needed.
  4. **`BillingSettings.clinician_id`:** If `null`, these are global practice settings. If present, clinician-specific overrides. The `@unique` constraint on nullable `clinician_id` needs careful implementation to allow one global (null) and multiple clinician-specific records.
  5. **`StatementItem` Data Types:** Confirmed `Decimal(10,2)` for monetary values. Units are dollars.
  6. **`Product` Model:** How are products sold and invoiced? Are they line items on an `Invoice`? (Reinforces need to consider `InvoiceItem` model).
  7. **Aggregate Boundaries:**
     - Is `Invoice` an Aggregate Root for `Payment`? (Likely, as payments are always tied to an invoice).
     - `ClientGroup` remains AR for `Statement` and `Superbill`.

### 7.4 Notifications

- **Models:** `EmailTemplate`, `ReminderTextTemplates`, `ClientReminderPreference`, `PracticeSettings` (for enabling features).
- **Apparent Purpose:** Manages templates for email/SMS and client preferences. (Video `/6` context).
- **Clarifying Questions/Updates:**
  1. **Dynamic Data/Merge Tags (Video `/6` Context):** Placeholders (e.g., `{{client_full_name}}`, `{{appointment_date}}`) in templates are processed by application logic. A standard list of available merge tags should be documented for developers.
  2. **Template `type` and `email_type`:** Controlled vocabularies for `EmailTemplate.type` (e.g., 'AUTOMATED', 'REMINDER', 'BILLING') and `email_type` (e.g., 'CLIENT', 'CONTACT', 'COUPLE') should be finalized and documented (or converted to enums). Similarly for `ReminderTextTemplates.type` (e.g., 'APPOINTMENT_REMINDER', 'TELEHEALTH_LINK').
  3. **`PracticeSettings` vs. `ClientReminderPreference`:** How global `PracticeSettings` (e.g., `reminders.appointment.sms.enabled`) interact with individual `ClientReminderPreference` needs defined logic (e.g., practice setting must be on for client preference to take effect).

### 7.5 User Management & Permissions

- **Models:** `User`, `Clinician`, `Role`, `Permission`, `UserRole`, `ClinicalInfo`
- **Apparent Purpose:** Manages system user accounts, clinician links, and RBAC.
- **Clarifying Questions/Updates:**
  1. **Client Portal Authentication:** How do clients authenticate? Are they `User` records with a "Client" `Role`, or a separate mechanism (e.g., via `ClientContact` details and one-time codes/magic links)? Current schema suggests clients are not `User` records. This needs to be explicitly defined.
  2. **`ClinicalInfo` Purpose (Reiteration):** To be deprecated in favor of `Clinician` fields. `NPI_number` in `ClinicalInfo` aligned to `String` type (pending schema update).
  3. **Default Roles & Permissions:** Core `Role` definitions (e.g., 'Admin', 'Clinician', 'Staff', potentially 'ClientPortalUser' if distinct from `Client`) and associated key `Permission` slugs need to be defined.

### 7.6 Documents, Surveys & Files

- **Models:** `SurveyTemplate`, `SurveyAnswers`, `ClientFiles`, `ClientGroupFile`
- **Apparent Purpose:** Manages form/survey templates, responses, and file uploads/sharing. (Video `/0` context linking `SurveyAnswers` to `AppointmentRequests`).
- **Clarifying Questions/Updates:**
  1. **Workflow for `ClientGroupFile` -> `ClientFiles`:**
     - A file is uploaded as a `ClientGroupFile` (linked to `ClientGroup`). Then `ClientFiles` links a specific `Client` (from that group) to this `ClientGroupFile` and adds a `status`.
     - Use case: Tracking individual acknowledgment/completion/view status for a document shared with a group (e.g., each family member views a policy).
  2. **`ClientFiles` and `SurveyAnswers` Link:** `ClientFiles.survey_answers_id` links a file record to a survey response, e.g., if the "file" is the PDF rendering of a completed `SurveyAnswers` record.
  3. **`SurveyTemplate.type`:** Typical values include 'INTAKE', 'CONSENT', 'ASSESSMENT', 'FEEDBACK', 'SCREENING'.
  4. **Document Signing:** `SurveyAnswers.is_signed`, `AppointmentNotes.is_signed`, `DiagnosisTreatmentPlan.is_signed` are now `Boolean?`. The process for digital signing (integrated e-signature vs. external) and how `signed_ipaddress`, `signed_time` etc. are captured needs to be detailed.

## 8. Data Type Clarifications & Standards

### 8.1 Monetary Values

- All monetary fields (e.g., `appointment_fee`, `adjustable_amount`, `write_off`, `Invoice.amount`, `Payment.amount`, `Product.price`, `ClientGroup.available_credit`, `GoodFaithEstimate.total_cost`, `GoodFaithServices.fee`, `StatementItem.charges/payments/balance`, `ClinicianServices.custom_rate`, `ClientGroupServices.custom_rate`) **must** use `Decimal` type with precision (10,2), e.g., `@db.Decimal(10,2)`.
- Values are stored in dollars (not cents). This standard has been applied in the latest schema review.

### 8.2 Date/Time Handling

- All timestamps (`DateTime` fields representing a point in time) are stored in UTC.
- Application layer is responsible for converting to/from practice or user local time zones for display. Practice timezone is specified in `PracticeInformation.time_zone`.
- Date-only fields (e.g., `Client.date_of_birth`, `License.expiration_date`, `StatementItem.date`, `AppointmentLimit.date`) use `@db.Date`.

### 8.3 Status Enumerations (Current String Values)

While Prisma enums are recommended (see 5.2), the following string values are currently standardized based on schema comments and this document. This list should be maintained or replaced by enums.

**`Appointment.status`**:

- 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'

**`Appointment.type`**:

- 'APPOINTMENT' (client sessions), 'EVENT' (non-client activities like staff meetings)

**`AppointmentRequests.status`**:

- 'PENDING_REVIEW', 'ACCEPTED', 'DECLINED', 'CONVERTED_TO_APPOINTMENT'

**`Invoice.status`**:

- 'UNPAID', 'PAID', 'PARTIAL', 'CREDIT', 'VOID'

**`Invoice.type`**:

- 'INVOICE', 'ADJUSTMENT', 'CREDIT'

**`Payment.status`**:

- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'

**`ClientGroup.type`**:

- 'individual', 'couple', 'family', 'minor'

**`SurveyAnswers.status`**:

- 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'SUBMITTED' (Example values from schema.prisma comment, to be confirmed)

**`ClientFiles.status`**:

- 'PENDING_VIEW', 'VIEWED', 'ACTION_PENDING', 'COMPLETED', 'SIGNED' (Example values from schema.prisma comment, to be confirmed)

**`Superbill.status`**:

- 'DRAFT', 'FINAL', 'SUBMITTED_TO_CLIENT', 'VOID' (Example values from schema.prisma comment, to be confirmed)

## 9. Key Design Decisions

### 9.1 Soft Deletes

- Most key entities should use `is_active: Boolean` flags rather than hard deletes to maintain audit trails and allow data recovery. This is inconsistently applied; review for broader adoption.

### 9.2 UUID Primary Keys

- All tables use UUID (`@db.UniqueIdentifier`) for primary keys, typically generated server-side with `newid()` for SQL Server (`@default(dbgenerated("newid()"))`). This should be consistently applied to all tables.

### 9.3 Audit & Compliance

- `Audit` table tracks HIPAA-relevant events and other significant actions.
- Signed documents (`AppointmentNotes`, `SurveyAnswers`, `DiagnosisTreatmentPlan`) track IP addresses and timestamps when `is_signed` is true.
- All PHI access must be logged in the `Audit` table.

### 9.4 Flexibility vs. Structure

- Many fields are optional to support gradual data collection and varying use cases.
- JSON storage is used sparingly (e.g., `ClientProfile.race_ethnicity`, `PracticeInformation.phone_numbers`). Use only when a structured alternative is overly complex or data is truly schemaless.

## 10. Migration & Evolution Considerations

### 10.1 Potential Schema Improvements (Existing and New)

1.  **Invoice Line Items**: Add `InvoiceItem` table for multiple services/products per `Invoice`, linking to `PracticeService` and `Product`. This supports more complex billing scenarios than the current optional one-to-one `Invoice` to `Appointment` link. (Reiteration)
2.  **Appointment-Invoice Relationship**: If `InvoiceItem` is introduced, the direct `Invoice.appointment_id` might become redundant or change purpose (e.g., link to a primary appointment if invoice summarizes multiple). (Reiteration)
3.  **Enum Standardization**: Migrate constrained string status/type fields to Prisma `enum` types. (High Priority - Reiteration)
4.  **Address Standardization**: Consolidate various address implementations (e.g., `Clinician.address`, `Location.address` text fields vs. structured fields like in `ClientAdress`). Aim for a reusable `Address` embedded type or linked entity if possible.
5.  **`ClinicalInfo` Deprecation**: Complete migration of fields from `ClinicalInfo` to `Clinician` and remove `ClinicalInfo`.
6.  **`PracticeInformation` Consolidation**: Evaluate consolidating fields from `PracticeInformation` into `PracticeSettings` if appropriate, or clearly define the distinction.
7.  **User Links in `AppointmentNotes`**: Add foreign key relations from `AppointmentNotes.created_by` and `AppointmentNotes.unlocked_by` to `User.id`.
8.  **Standardize Default ID Generation**: Ensure all tables use `@default(dbgenerated("newid()"))` (or equivalent for the DB) for their UUID primary keys.

### 10.2 Performance Optimizations

- Indexes are present for foreign keys and some commonly queried fields.
- Consider additional composite indexes based on query patterns, for example:
  - `Appointment.start_date` + `clinician_id` + `status`
  - `Invoice.client_group_id` + `status` + `due_date`
  - `Client.legal_last_name` + `legal_first_name` (for searching)

## 11. Integration Points

### 11.1 External Systems

- **Payment Processing**: Credit card tokenization via external gateway (current model with `CreditCard.token` supports this).
- **Telehealth**: Integration fields/flags are present but specific external system hooks are TBD.
- **Insurance**: Superbill generation is for client submission; direct EDI claim submission is a future consideration.

### 11.2 Portal Access

- Controlled via boolean flags on `Client` entity (`allow_online_appointment`, `access_billing_documents`, `use_secure_messaging`).
- `ClientPortalSettings` manages portal features like appointment requests.
- Client authentication mechanism for portal access needs explicit definition (see 7.5.1).

## 12. General Documentation & Best Practices to Consider

- **Ubiquitous Language:** Actively identify and use consistent domain terminology (from business experts) in `schema.prisma` comments, this document, and code. Maintain the `Glossary` (Section 13).
- **Business Rules Not in Schema:** Explicitly document critical business rules enforced at the application level (e.g., complex validation, state transition guards not covered by DB constraints).
- **Data Flow & Workflow Diagrams:** For key processes (client intake, appointment lifecycle, billing cycle), create/update simple diagrams (e.g., using Mermaid.js in Markdown) to visualize data flow and entity interactions.
- **Maintainability:** Assign ownership for keeping this document and schema comments up-to-date. Integrate updates into the development workflow.

## 13. Glossary

- **Superbill**: An itemized form used by healthcare providers that lists services provided to a patient, which patients can submit to insurance companies for reimbursement.
- **Adjustment**: A modification to the standard appointment fee (positive or negative), represented by `Appointment.adjustable_amount`.
- **Write-off**: An amount that the practice has decided not to collect from the client, represented by `Appointment.write_off`.
- **Available Credit**: Prepaid or credited amounts associated with a `ClientGroup` that can be applied to future services or payments.
- **Contact-Only**: A person associated with a client group (via `ClientGroupMembership`) who receives communications or is listed for contact purposes but is not a patient receiving direct clinical services within that group context.
- **Recurring Rule**: An iCalendar RRULE string (e.g., "FREQ=WEEKLY;COUNT=10;BYDAY=MO,WE") defining the recurrence pattern for appointments or availability.

## 14. Open Questions & Future Considerations

1.  **Multi-Practice Support**: Current schema assumes a single practice. Future multi-tenancy needs architectural planning.
2.  **Direct Insurance Integration**: Capabilities for direct insurance claim submission (EDI).
3.  **Inventory Management**: For practices that sell `Product` items in significant volume.
4.  **Group Session Support**: Current `Appointment` model links to one `ClientGroup`. How are group therapy sessions with multiple distinct client groups/individuals in a single time slot managed?
5.  **Waitlist Management**: More sophisticated waitlist features beyond the `Client.is_waitlist` flag (e.g., position, preferences, automated offers).
6.  **Client Portal Authentication**: Finalize and document the exact mechanism for client portal login and session management.
7.  **Duplicate Client Handling**: Define the strategy and tools for identifying and merging duplicate client records, especially during intake.
8.  **Global Settings Strategy**: For `BillingSettings` and `ClientPortalSettings`, confirm the approach for handling global (practice-wide) settings versus clinician-specific overrides, especially concerning the nullable `clinician_id @unique` pattern.

## 15. Next Steps

1.  **Team Review:** Discuss this updated `SCHEMA_NOTES.md` document with the development team and any available domain experts.
2.  **Answer Clarifying Questions:** Collaboratively work through remaining open questions (especially in Section 7 and 14). Document answers directly in this file or link to where they are documented.
3.  **Make Design Decisions:** Based on discussions (e.g., for points in Section 5 and 10), make and record key design decisions.
4.  **Update `schema.prisma`:**

- Incorporate any further structural changes agreed upon (e.g., enums, `InvoiceItem` model).
- Refine `///` comments based on deeper understanding gained from these discussions.

5.  **Evolve This Document:** Continuously update `SCHEMA_NOTES.md` as new insights are gained, new features are developed, or existing logic is clarified.

---

**Note**: This document should be reviewed and updated whenever significant schema changes are made or new business requirements are identified.
