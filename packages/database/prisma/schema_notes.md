# SCHEMA_NOTES.md - Prisma Schema Review & Domain Documentation Guide (v2)

**Date:** May 25, 2025  
**Last Updated:** [Current Date]

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

_(These are based on the AI's review during the initial commenting of `schema.prisma`. Please verify each point against your requirements.)_

### 3.1 Data Type Adjustments (Verify)

- `GoodFaithEstimate.client_zip_code`: Changed from `Int?` to `String? @db.VarChar(20)`
- `GoodFaithEstimate.total_cost`: Changed from `Int` to `Decimal @db.Decimal(10,2)`
- `GoodFaithServices.fee`: Changed from `Int` to `Decimal @db.Decimal(10,2)`
- `StatementItem.charges`, `payments`, `balance`: Changed from `Int` to `Decimal @db.Decimal(10,2)`
- `ClientAdress.address_line2`: Made optional (`String?`)
- **Question for Team:** Were original `Int` types for monetary values intentional (e.g., storing cents)? If so, revert and clarify units in `schema.prisma` comments.

### 3.2 Uniqueness Constraints Added (`@unique`) (Verify)

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
- `GoodFaithEstimate.[client_id, provided_date]` (This was an example; actual uniqueness for GFE needs confirmation)

## 4. Key Business Rules & Workflows

### 4.1 Client & Group Management

- **Client Groups**: Every appointment is associated with a `ClientGroup`, not individual clients
  - Types: 'individual', 'couple', 'family', 'minor'
  - Groups can have available credit that can be applied to payments
  - Groups have billing preferences and can generate automatic monthly statements/superbills
- **Client Roles**: Within a group, clients can have roles (e.g., primary, spouse, child)
- **Contact-Only Members**: Some group members may be contacts only (e.g., emergency contacts)
- **Billing Responsibility**: One member per group can be marked as responsible for billing

### 4.2 Appointment Lifecycle

1. **Request Phase** (Optional):
   - New clients can submit `AppointmentRequests` through the portal
   - Requests include contact details in `RequestContactItems`
   - Status transitions: 'PendingReview' → 'Accepted'/'Declined' → 'ConvertedToAppointment'
2. **Scheduling Phase**:
   - Appointments must respect `AppointmentLimit` (daily limits per clinician)
   - Appointments can be recurring with RRULE format (e.g., "FREQ=WEEKLY;COUNT=10;BYDAY=MO,WE")
   - Recurring appointments have a parent-child relationship via `recurring_appointment_id`
3. **Financial Phase**:
   - `appointment_fee` is the base charge
   - `adjustable_amount` allows for session-specific adjustments (can be negative for credits)
   - `write_off` tracks amounts that won't be collected
   - Appointments link to invoices (one-to-one relationship currently)

### 4.3 Billing Workflow

1. **Invoice Generation**:
   - Can be manual or automatic (based on `BillingSettings.autoInvoiceCreation`)
   - Types: 'INVOICE', 'ADJUSTMENT', 'CREDIT'
   - Invoice numbers are sequential (e.g., "INV #1", "INV #2")
2. **Payment Processing**:
   - Payments can apply credits from `ClientGroup.available_credit`
   - Credit cards are tokenized and stored securely
3. **Statement Generation**:
   - Aggregates invoices and payments for a date range
   - Includes running balance calculations
   - Can be generated automatically monthly
4. **Superbill Generation**:
   - For insurance reimbursement
   - Links appointments with diagnoses and service codes

### 4.4 Notification System

- **Email Templates**: Dynamic templates with merge tags (e.g., `{{client_full_name}}`)
- **Reminder Types**: appointment reminders, document reminders, cancellation notices
- **Client Preferences**: Each client can set notification preferences by type and channel

## 5. Key Areas for Design Review & Consideration (Schema-Wide)

### 5.1 Referential Integrity (`onDelete`/`onUpdate`)

- Many relations currently use `onDelete: NoAction`
- **Discussion Point:** What is the desired cascading behavior for key entities? (e.g., Deleting a `ClientGroup`: What happens to `Appointments`, `Invoices`? Deleting a `Clinician` or `User`?)
- **Action:** Review and explicitly define `onDelete` rules (`Cascade`, `SetNull`, `Restrict`) for critical relationships. Document the strategy.

### 5.2 Use of Enums for Constrained String Fields

- Fields like `Appointment.status`, `Appointment.type`, `Invoice.status`, `EmailTemplate.type` use `String`
- **Consideration:** Define Prisma `enum` types for these to improve type safety and make allowed values explicit
- **Action (if not enums):** Document the defined set of allowed string values for each such field within this `SCHEMA_NOTES.md`

### 5.3 Potential Redundancy/Overlap

- **`ClinicalInfo` vs. `Clinician`:** Overlapping fields (`speciality`, `NPI_number`, `taxonomy_code`). Clarify the distinct purpose of `ClinicalInfo`. `NPI_number` type mismatch (`Float` vs. `String`)
- **`ClientContact.type` vs. `ClientContact.contact_type`:** Purpose and distinction need clarification

### 5.4 Review of Optional Fields (`?`)

- **Discussion Point:** Are all optional fields correctly reflecting business logic where data might genuinely be absent? Review especially for foreign keys

### 5.5 Default Values

- **`Availability` model:** `end_time`, `start_time`, `end_date`, `start_date` all have `@default(now())`. This is unusual for availability planning
- **Discussion Point:** Confirm if this is intended or if these should always be explicitly set

### 5.6 Naming Conventions

- Current mix: `PascalCase` for models, mostly `snake_case` for fields, `PascalCase` for relation fields
- **Action:** Document this as the standard if intentional, or discuss refining for greater consistency

## 6. Aggregate Boundaries & Domain Model

### 6.1 Client Aggregate

- **Root**: `Client`
- **Entities**: `ClientProfile`, `ClientAdress`, `ClientContact`, `ClientReminderPreference`
- **Invariants**:
  - A client must have at least one contact method
  - Primary contact designations must be unique per type

### 6.2 ClientGroup Aggregate

- **Root**: `ClientGroup`
- **Entities**: `ClientGroupMembership`, `ClientBillingPreferences`, `Invoice`, `Statement`, `Superbill`
- **Value Objects**: `ClientGroupFile`
- **Invariants**:
  - Available credit cannot be negative
  - Only one member can be responsible for billing

### 6.3 Appointment Aggregate

- **Root**: `Appointment`
- **Entities**: `AppointmentNotes`, `AppointmentTag`
- **Invariants**:
  - Recurring appointments must maintain parent-child relationships
  - Start date must be before end date
  - Cannot exceed daily appointment limits

### 6.4 Clinician Aggregate

- **Root**: `Clinician`
- **Entities**: `License`, `BillingAddress`, `BillingSettings`, `AppointmentLimit`
- **Value Objects**: `ClinicianServices`, `ClinicianLocation`
- **Invariants**:
  - Each clinician is linked to exactly one user account
  - Billing addresses must be unique per type (e.g., one 'practice', one 'mailing')

## 7. Model-Specific Explanations & Clarifying Questions (Domain Deep Dive)

### 7.1 Client Management & Groupings

- **Models:** `Client`, `ClientProfile`, `ClientAdress`, `ClientContact`, `ClientGroup`, `ClientGroupMembership`
- **Apparent Purpose:** Manages individual client demographic, contact, and detailed profile information. `ClientGroup` appears to allow associating multiple `Client` records (e.g., for families, couples) for purposes like billing and appointments.
- **Clarifying Questions:**
  1. **Client vs. ClientGroup for Appointments:** An `Appointment` has `client_group_id`. How are appointments for individual clients handled if they are not part of a formal "group"? Is every `Client` implicitly in a single-member `ClientGroup`?
  2. **New Client Onboarding (Video `/0` Context):**
     - `AppointmentRequests.client_id` is optional, with new client details in `RequestContactItems`. Describe the workflow for converting a `RequestContactItem` into a `Client` and potentially a new `ClientGroup` or adding to an existing one.
     - How are duplicate clients handled during this intake process?
  3. **`ClientGroupMembership.role`:** What are the typical roles a `Client` can have within a `ClientGroup` (e.g., 'Primary', 'Spouse', 'Child', 'Guardian')?
  4. **`ClientGroupMembership.is_contact_only`:** What's the use case for a member being "contact only"? Do they have any portal access or receive notifications differently?
  5. **`ClientContact.type` vs. `contact_type`:** Please clarify the distinction and intended use of these fields.
  6. **`Client.referred_by`:** Is this free text, or does it link to another entity (e.g., another client, a referral source table)?
  7. **Aggregate Boundaries:** Could `ClientGroup` be an Aggregate Root for `ClientGroupMembership`, `Invoice`, `Statement`, `Superbill`? What are the consistency rules for this aggregate? Could `Client` be an Aggregate Root for `ClientProfile`, `ClientAdress`, `ClientContact`?

### 7.2 Appointments & Scheduling

- **Models:** `Appointment`, `AppointmentRequests`, `Availability`, `PracticeService`, `AppointmentNotes`, `AppointmentTag`, `AppointmentLimit`
- **Apparent Purpose:** Manages requests for appointments, confirmed scheduled appointments, clinician availability, defined services, and associated notes/tags. (Video `/0` context for requests).
- **Clarifying Questions:**
  1. **Appointment Lifecycle (Video `/0` Context):** Detail the state transitions for `AppointmentRequests.status` (e.g., 'PendingReview', 'Accepted', 'Declined', 'ConvertedToAppointment'). How does an accepted request become an `Appointment` record? Is data copied, or is there a link?
  2. **`Appointment.recurring_rule`:** What is the exact format/standard for this string (e.g., iCalendar RRULE)? How are instances of recurring appointments generated and managed? Does `recurring_appointment_id` link instances to a master definition?
  3. **`Appointment.title`:** When is this used, as distinct from the `PracticeService.name` or `description`?
  4. **`Appointment.type`:** What are the typical values (e.g., 'Telehealth', 'In-Person', 'Initial', 'Follow-up')? Consider an enum.
  5. **`AppointmentNotes.type`:** What are the defined types of notes (e.g., 'Progress Note', 'SOAP Note', 'Private Note')? How do these relate to `SurveyTemplate.type` if a note originates from a survey?
  6. **`Availability` Defaults:** As noted in section 5.5, clarify the `@default(now())` for date/time fields.
  7. **`PracticeService.code`:** Are these internal codes or standard industry codes (e.g., CPT)?
  8. **Aggregate Boundaries:** Is `Appointment` an Aggregate Root for `AppointmentNotes` and `AppointmentTag`?

### 7.3 Billing & Finance

- **Models:** `Invoice`, `Payment`, `Statement`, `Superbill`, `CreditCard`, `BillingSettings`, `ClientBillingPreferences`, `GoodFaithEstimate`, `Product`
- **Apparent Purpose:** Manages invoicing for appointments/products, payment tracking, client statements, superbills for insurance, credit card storage, and billing preferences/settings. (Video `/2` context for income/billing reports).
- **Clarifying Questions:**
  1. **Invoice Generation (Video `/2` Context):**
     - When would `Invoice.appointment_id` or `Invoice.client_group_id` be `null`? (e.g., for `Product` sales not tied to an appointment?)
     - Describe the workflow: How do `Appointment.appointment_fee`, `adjustable_amount`, `write_off` translate into `Invoice.amount` and its line items (if an `InvoiceItem` model were to be introduced)?
  2. **Income Report (Video `/2` Context):** This report uses `appointment_fee` minus `adjustable_amount` or `write_off`. Is the `Appointment` table the sole source for "Client Payments," "Gross Income," and "Net Income" as described in the video, or do `Payment` records also play a direct role in these report calculations?
  3. **Billing Outstanding Balances Report (Video `/2` Context):**
     - Clarify how "Services provided," "Uninvoiced," "Invoiced," "Client paid," and "Client balance" are calculated from the schema entities.
     - The video mentioned `invoice ID` in the `invoice` table links appointments to invoices. How is this represented if `Invoice.appointment_id` is one-to-one (an invoice per appointment) vs. one-to-many (an invoice covering multiple appointments)? The schema suggests one invoice can optionally link to one appointment.
  4. **`BillingSettings.clinician_id`:** If `null`, are these global practice settings? If present, are they clinician-specific overrides?
  5. **`StatementItem` Data Types:** Now `Decimal`. Confirm units for documentation.
  6. **`Product` Model:** How are products sold and invoiced? Are they line items on an `Invoice`? (Consider an `InvoiceItem` model if invoices can have multiple lines of services/products).
  7. **Aggregate Boundaries:**
     - Is `Invoice` an Aggregate Root for `Payment`?
     - Is `ClientGroup` the AR for `Statement` and `Superbill`?

### 7.4 Notifications

- **Models:** `EmailTemplate`, `ReminderTextTemplates`, `ClientReminderPreference`, `PracticeSettings` (for enabling features).
- **Apparent Purpose:** Manages templates for email and SMS notifications and client preferences for receiving them. (Video `/6` context).
- **Clarifying Questions:**
  1. **Dynamic Data/Merge Tags (Video `/6` Context):** How are placeholders (e.g., `{{client_full_name}}`, `{{appointment_date}}`) in `EmailTemplate.content` and `ReminderTextTemplates.content` defined and populated? Is there a standard list of available merge tags?
  2. **Template `type` and `email_type`:** What are the controlled vocabularies for `EmailTemplate.type` (automated, reminder, billing) and `email_type` (client, contact/couple)? Similarly for `ReminderTextTemplates.type` (appointment, telehealth, document, cancellation).
  3. **`PracticeSettings` vs. `ClientReminderPreference`:** How does the global enablement in `PracticeSettings` (e.g., `is reminder emails enabled`) interact with individual `ClientReminderPreference`? Do client preferences override if the global setting is off, or vice-versa?

### 7.5 User Management & Permissions

- **Models:** `User`, `Clinician`, `Role`, `Permission`, `UserRole`, `ClinicalInfo`
- **Apparent Purpose:** Manages system user accounts, links users to clinician profiles, and handles role-based access control.
- **Clarifying Questions:**
  1. **Client Portal Authentication:** How do clients authenticate for any portal features? Are they also `User` records with a specific "Client" `Role`, or is there a separate mechanism (e.g., via `ClientContact` details)?
  2. **`ClinicalInfo` Purpose (Reiteration):** What is the distinct role of `ClinicalInfo` given the fields in `Clinician`? Can this be consolidated or clarified? Why `NPI_number` as `Float`?
  3. **Default Roles & Permissions:** What are the core `Role` definitions (e.g., 'Admin', 'Clinician', 'Client') and what key `Permission`s (slugs) are associated with them initially?

### 7.6 Documents, Surveys & Files

- **Models:** `SurveyTemplate`, `SurveyAnswers`, `ClientFiles`, `ClientGroupFile`
- **Apparent Purpose:** Manages templates for forms/surveys, stores client responses, and handles associated file uploads and sharing. (Video `/0` context linking `SurveyAnswers` to `AppointmentRequests`).
- **Clarifying Questions:**
  1. **Workflow for `ClientGroupFile` -> `ClientFiles`:**
     - A file is uploaded as a `ClientGroupFile` (linked to `ClientGroup`). Then `ClientFiles` links a specific `Client` (from that group) to this `ClientGroupFile` and adds a `status`.
     - Can you describe a typical use case? Why track status per client for a group file? Is it for individual acknowledgment/completion of a document shared with a group?
  2. **`ClientFiles` and `SurveyAnswers` Link:** `ClientFiles` has an optional `survey_answers_id`. When is a client file directly linked to a specific set of survey answers in this way?
  3. **`SurveyTemplate.type`:** What are the typical values (e.g., 'Intake', 'Consent Form', 'Feedback Survey')?
  4. **Document Signing:** `SurveyAnswers.is_signed`, `AppointmentNotes.is_signed` etc. What is the process for digital signing? Is it integrated, or does it refer to an external process/uploaded signed document?

## 8. Data Type Clarifications & Standards

### 8.1 Monetary Values

- All monetary fields use `Decimal` type with precision (10,2)
- Fields: `appointment_fee`, `adjustable_amount`, `write_off`, `amount`, `price`, etc.
- Values are stored in dollars (not cents)

### 8.2 Date/Time Handling

- All timestamps are stored in UTC
- Appointment times consider practice timezone settings
- Date-only fields (e.g., `date_of_birth`) use `@db.Date`

### 8.3 Status Enumerations

While not using Prisma enums, the following string values are standardized:

**Appointment.status**:

- 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'

**Appointment.type**:

- 'APPOINTMENT', 'EVENT'

**Invoice.status**:

- 'UNPAID', 'PAID', 'PARTIAL', 'CREDIT', 'VOID'

**Payment.status**:

- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'

**ClientGroup.type**:

- 'individual', 'couple', 'family', 'minor'

## 9. Key Design Decisions

### 9.1 Soft Deletes

- Most entities use `is_active` flags rather than hard deletes
- Maintains audit trail and allows data recovery

### 9.2 UUID Primary Keys

- All tables use UUID (`@db.UniqueIdentifier`) for primary keys
- Generated server-side with `newid()` for SQL Server compatibility

### 9.3 Audit & Compliance

- `Audit` table tracks HIPAA-relevant events
- Signed documents track IP addresses and timestamps
- All PHI access is logged

### 9.4 Flexibility vs. Structure

- Many fields are optional to support gradual data collection
- JSON storage used sparingly (e.g., `race_ethnicity` array stored as JSON)

## 10. Migration & Evolution Considerations

### 10.1 Potential Schema Improvements

1. **Invoice Line Items**: Consider adding `InvoiceItem` table for multiple services per invoice
2. **Appointment-Invoice Relationship**: Currently one-to-one, may need one-to-many
3. **Enum Standardization**: Consider migrating string statuses to Prisma enums
4. **Address Standardization**: Consolidate various address implementations

### 10.2 Performance Optimizations

- Indexes added for foreign keys and commonly queried fields
- Consider additional indexes for:
  - `Appointment.start_date` + `clinician_id` composite
  - `Invoice.client_group_id` + `status` composite

## 11. Integration Points

### 11.1 External Systems

- **Payment Processing**: Credit card tokenization via external gateway
- **Telehealth**: Integration fields present but implementation pending
- **Insurance**: Superbill generation for claim submission

### 11.2 Portal Access

- Controlled via boolean flags on `Client` entity
- Permissions: `allow_online_appointment`, `access_billing_documents`, `use_secure_messaging`

## 12. General Documentation & Best Practices to Consider

- **Ubiquitous Language:** Actively identify and use consistent domain terminology (from your business experts) in `schema.prisma` comments, this document, and code. Consider a separate `GLOSSARY.md` if terms become numerous.
- **Business Rules Not in Schema:** Explicitly document critical business rules that are enforced at the application level rather than by database constraints.
- **Data Flow & Workflow Diagrams:** For key processes (client intake, appointment lifecycle, billing cycle), consider creating simple diagrams (e.g., using Mermaid.js in Markdown) to visualize data flow and entity interactions.
- **Maintainability:** Assign ownership for keeping this document and schema comments up-to-date. Integrate updates into your development workflow.

## 13. Glossary

- **Superbill**: An itemized form used by healthcare providers that lists services provided to a patient, which patients can submit to insurance companies for reimbursement
- **Adjustment**: A modification to the standard appointment fee (positive or negative)
- **Write-off**: An amount that the practice has decided not to collect from the client
- **Available Credit**: Prepaid or credited amounts that can be applied to future services
- **Contact-Only**: A person associated with a client group who receives communications but is not a patient
- **Recurring Rule**: An iCalendar RRULE string defining appointment recurrence patterns

## 14. Open Questions & Future Considerations

1. **Multi-Practice Support**: Current schema assumes single practice. Consider multi-tenancy needs.
2. **Insurance Integration**: Direct insurance claim submission capabilities
3. **Inventory Management**: For practices that sell products
4. **Group Session Support**: Multiple client groups in single appointment
5. **Waitlist Management**: More sophisticated waitlist features beyond boolean flag

## 15. Next Steps

1. **Team Review:** Discuss this `SCHEMA_NOTES.md` document with the development team and any available domain experts.
2. **Answer Clarifying Questions:** Collaboratively work through the questions in Section 7. Document answers directly in this file or link to where they are documented.
3. **Make Design Decisions:** Based on discussions (e.g., for points in Section 5), make and record key design decisions.
4. **Update `schema.prisma`:**
   - Incorporate any structural changes agreed upon.
   - Refine `///` comments based on deeper understanding gained.
5. **Evolve This Document:** Continuously update `SCHEMA_NOTES.md` as new insights are gained, new features are developed, or existing logic is clarified.

---

**Note**: This document should be reviewed and updated whenever significant schema changes are made or new business requirements are identified.
