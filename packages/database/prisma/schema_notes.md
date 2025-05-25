# SCHEMA_NOTES.md - Prisma Schema Review & Domain Documentation Guide (v2)

**Date:** May 25, 2025
**Last Updated:** May 26, 2025 (Incorporating insights from further domain analysis/simulated new context)

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

_(This section reflects previously discussed modifications. See Section 10 for ongoing evolution considerations.)_

### 3.1 Data Type and Field Adjustments (Considered Applied or Pending Final Verification)

- **Applied (based on recent review, verify final implementation):**

  - `Appointment.appointment_fee`: Changed to `Decimal? @db.Decimal(10,2)`
  - `Appointment.adjustable_amount`: Changed to `Decimal? @db.Decimal(10,2)`
  - `Appointment.write_off`: Changed to `Decimal? @db.Decimal(10,2)`
  - `ClientGroup.available_credit`: Changed to `Decimal @db.Decimal(10,2) @default(0)`
  - `ClinicianServices.custom_rate`: Changed to `Decimal? @db.Decimal(10,2)`
  - `Payment.credit_applied`: Changed to `Decimal? @db.Decimal(10,2)`
  - `ClientGroupServices.custom_rate`: Changed to `Decimal @db.Decimal(10,2)`
  - `DiagnosisTreatmentPlan.is_signed`: Changed to `Boolean? @default(false)`
  - `ClinicalInfo.NPI_number`: Data type changed to `String`.
  - `License.expiration_date`: Changed to `DateTime @db.Date`
  - `StatementItem.date`: Changed to `DateTime @db.Date`
  - `AppointmentNotes.survey_answer_id`: Changed to `String?`.

- **Previously Suggested (and now mostly confirmed or schema already aligns):**

  - `GoodFaithEstimate.client_zip_code`: `String? @db.VarChar(20)`
  - `GoodFaithEstimate.total_cost`: `Decimal @db.Decimal(10,2)`
  - `GoodFaithServices.fee`: `Decimal @db.Decimal(10,2)`
  - `StatementItem.charges`, `payments`, `balance`: `Decimal @db.Decimal(10,2)`
  - `ClientAdress.address_line2`: `String?`

- **Monetary Values Note:** The standard for all monetary values is `Decimal @db.Decimal(10,2)` storing dollars, not cents. This is documented in section 8.1.

### 3.2 Uniqueness Constraints Added (`@unique`) (Verified)

- Existing `@unique` constraints in `schema.prisma` are confirmed as intentional for fields like `Tag.name`, `Invoice.invoice_number`, etc.
- `GoodFaithEstimate.[client_id, provided_date] @unique`: Business rule confirmation for this specific composite key is still advised.

## 4. Key Business Rules & Workflows

_(This section outlines high-level rules and workflows. More detailed explanations or refinements based on new context are integrated into Section 7 or proposed as new sub-sections if substantial.)_

### 4.1 Client & Group Management

- **Client Groups**: Every appointment is associated with a `ClientGroup`. For individual clients, a single-member `ClientGroup` is created, potentially transparently to the user in some UI contexts.
  - Types: 'individual', 'couple', 'family', 'minor'.
  - Groups manage shared billing preferences, `available_credit`, and can be the subject of `Statement` and `Superbill` generation.
- **New Client Onboarding Workflow (Refined based on new context for 7.1.2):**
  1. Prospective client submits an `AppointmentRequest` via portal or staff enters details. If new, `RequestContactItems` capture their information.
  2. System performs a preliminary check for existing clients based on email/phone from `RequestContactItems` to flag potential duplicates for staff review.
  3. Staff reviews the `AppointmentRequest`. If approved for a new client:
     a. A new `Client` record is created from validated `RequestContactItems`.
     b. A corresponding single-member `ClientGroup` of type 'individual' is created, linking to the new `Client`. The `ClientGroup.name` can be derived from the client's name.
     c. The `AppointmentRequest.client_id` is updated to link to the new `Client`.
     d. (If applicable) A `ClientProfile` may be partially populated.
  4. If the request is for an existing client, it's linked to their `Client.id` and primary `ClientGroup.id`.
  5. The request status moves: 'PENDING_REVIEW' → ('DUPLICATE_NEEDS_REVIEW') → 'ACCEPTED'/'DECLINED' → 'CONVERTED_TO_APPOINTMENT'.
- **Client Roles**: Within a group, common roles are 'Primary Patient', 'Spouse/Partner', 'Child', 'Guardian', 'Emergency Contact'. The 'Primary Patient' is the main subject of care within that group context for clinical documentation.
- **Contact-Only Members**: These members (e.g., a non-attending parent who needs billing access for a minor, or an emergency contact) have specific, limited portal access if any, and primarily receive communications relevant to their role (e.g., billing, emergency). They do not have their own clinical record within that group's context.
- **Billing Responsibility**: One `ClientGroupMembership` record within a `ClientGroup` can be flagged as `is_responsible_for_billing`. Application logic must enforce that only one member can have this flag set to true at any given time within the same group.

### 4.2 Appointment Lifecycle

1.  **Request Phase**: As detailed in 4.1 (New Client Onboarding Workflow).
2.  **Scheduling Phase**:
    - Appointments are created from 'ACCEPTED' `AppointmentRequests` or directly by staff. If from a request, relevant data (client, service, requested time) is copied/linked to the new `Appointment` record. The `AppointmentRequest` status changes to 'CONVERTED_TO_APPOINTMENT'.
    - Recurring appointments: The `recurring_rule` (iCalendar RRULE) defines the series. Individual instances are distinct `Appointment` records linked by `recurring_appointment_id` to the parent/template appointment. Modifying the series can affect future instances.
3.  **Financial Phase**:
    - The `appointment_fee` is derived from `PracticeService.rate`, overridden by `ClinicianServices.custom_rate` or `ClientGroupServices.custom_rate` if applicable.
    - `adjustable_amount` and `write_off` are applied at the time of billing or reconciliation.

### 4.3 Billing Workflow

1.  **Invoice Generation**:
    - **Trigger**: Can be manual, upon `Appointment.status` changing to 'COMPLETED' (if `BillingSettings.autoInvoiceCreation` is 'ON_APPOINTMENT_COMPLETION'), or via scheduled batch jobs (weekly/monthly).
    - **Content**: If an `InvoiceItem` model is adopted (see 10.1.1), an `Invoice` can include multiple `InvoiceItem`s, each linking to a `PracticeService` (and potentially an `Appointment`) with its specific fee. If not, an `Invoice` may be more directly tied to a single `Appointment` or represent a sum for `Product`s.
    - Types: 'INVOICE', 'ADJUSTMENT_INVOICE', 'CREDIT_MEMO'. (Refined terms)
2.  **Payment Processing**:
    - Payments are recorded against specific `Invoice`(s).
    - Application of `ClientGroup.available_credit` to a payment reduces the amount due from other payment methods. This transaction should debit `available_credit`.
3.  **Statement Generation**: `Statement`s aggregate `Invoice` and `Payment` records for a `ClientGroup` over a period, calculating a running balance.
4.  **Superbill Generation**: `Superbill`s aggregate `Appointment` details, including linked `Diagnosis` codes (from `DiagnosisTreatmentPlanItem` via `Client` and `PracticeService.code`), for a `ClientGroup`.

### 4.4 Notification System

- **Merge Tag Resolution**: A dedicated service/module will be responsible for resolving merge tags (e.g., `{{client_full_name}}`, `{{appointment_date_time_local}}`) using data from relevant entities (`Client`, `Appointment`, `Invoice`, etc.) before sending notifications. A standard list of available tags per template `type` will be maintained for developers.
- **Preference Hierarchy**:
  1. Global `PracticeSettings` (e.g., `reminders.appointment.sms.enabled:false`) can disable a channel practice-wide.
  2. If globally enabled, `ClientReminderPreference.is_enabled` determines if a specific client receives that type/channel of notification.
  3. If `ClientReminderPreference` doesn't exist for a type/channel, a practice default (e.g., from `BillingSettings.defaultNotificationMethod` for billing docs) might apply, or it defaults to off. This logic needs to be fully specified.

## 5. Key Areas for Design Review & Consideration (Schema-Wide)

_(Existing points remain valid. Emphasizing points affected by "new context" or requiring further action.)_

### 5.1 Referential Integrity (`onDelete`/`onUpdate`)

- **Action Reiteration:** This remains a critical task. Define rules for all significant relations. Example: Deleting a `ClientGroup` might require `Restrict` if active `Invoice`s or `Appointment`s exist, or `Cascade` to related non-critical records like `ClientBillingPreferences`.

### 5.2 Use of Enums for Constrained String Fields

- **Action Reiteration:** Prioritize migration of fields like `Appointment.status`, `Invoice.status`, `ClientGroup.type` to Prisma `enum` types to enhance data integrity and developer experience. Section 8.3 lists current string values as an interim step.

### 5.3 Potential Redundancy/Overlap & Data Model Refinements

- **`ClinicalInfo` Deprecation**: Actively plan migration of any remaining data from `ClinicalInfo` to `Clinician` and schedule removal of the `ClinicalInfo` table.
- **`PracticeService.type` Renaming**: Rename to `PracticeService.name` for clarity.
- **`AppointmentNotes` User Relations**: Ensure `created_by` and `unlocked_by` fields are properly FK-linked to `User.id`.

### 5.5 Default Values

- **`Availability` Date/Time Defaults**: This remains a high-priority discussion point. If `@default(now())` is not desired, they must be made required or nullable without default.
- **Primary Key Defaults**: Standardize on `@default(dbgenerated("newid()"))` for all UUID PKs.

## 6. Aggregate Boundaries & Domain Model

_(Refinements based on "new context" are integrated below.)_

### 6.1 Client Aggregate

- **Root**: `Client`
- **Entities**: `ClientProfile`, `ClientAdress` (one-to-many), `ClientContact` (one-to-many), `ClientReminderPreference` (one-to-many).
- **Value Objects**: Potentially an `Address` value object could be used within `ClientAdress` if addresses are treated as immutable snapshots.
- **Invariants**:
  - A `Client` must have at least one `ClientContact` marked as `is_primary` for essential communication.
  - `Client.date_of_birth` if present, must be a valid date in the past.
- **Domain Events**: `ClientCreated`, `ClientProfileUpdated`, `ClientContactAdded`, `ClientArchived` (`is_active` set to false).

### 6.2 ClientGroup Aggregate

- **Root**: `ClientGroup`
- **Entities**: `ClientGroupMembership` (one-to-many, part of the aggregate's consistency boundary), `ClientBillingPreferences` (one-to-one).
- **Associated Roots (Strongly Consistent Dependencies but Separate Aggregates)**: `Invoice`, `Statement`, `Superbill` are typically associated with a `ClientGroup` but are often Aggregates themselves due to their own complex lifecycle and rules. The `ClientGroup` would hold references (IDs) to these.
- **Value Objects**: `ClientGroupFile` could be considered as managed by `ClientGroup`, though its `ClientFiles` junction introduces per-client state.
- **Invariants**:
  - `available_credit` cannot be negative.
  - Only one `ClientGroupMembership` can have `is_responsible_for_billing = true`.
  - A `ClientGroup` of type 'individual' should typically have only one active, non-contact-only `ClientGroupMembership`.
- **Domain Events**: `ClientGroupCreated`, `MemberAddedToGroup`, `BillingResponsibleMemberChanged`, `CreditAppliedToGroup`.

### 6.3 Appointment Aggregate

- **Root**: `Appointment`
- **Entities**: `AppointmentNotes` (one-to-many, life cycle tied to appointment), `AppointmentTag` (many-to-many relationship, tags themselves are separate entities).
- **Invariants**:
  - `start_date` must be before `end_date`.
  - If `is_recurring` is true, `recurring_rule` must be present.
  - `status` transitions must follow a defined lifecycle (e.g., cannot go from 'CANCELLED' to 'COMPLETED' without intermediate steps).
- **Domain Events**: `AppointmentScheduled`, `AppointmentRescheduled`, `AppointmentCancelled`, `AppointmentCompleted`, `AppointmentNoShow`.

### 6.4 Clinician Aggregate

- **Root**: `Clinician`
- **Entities**: `License` (one-to-many), `BillingAddress` (one-to-many, unique by type), `BillingSettings` (one-to-one, clinician-specific overrides), `AppointmentLimit` (one-to-many).
- **Value Objects**: `ClinicianServices` (defines services offered by clinician, could be entity if has own lifecycle), `ClinicianLocation` (links to locations).
- **Invariants**:
  - `user_id` must link to an existing `User`.
  - An active `Clinician` must have at least one valid, non-expired `License` for the states they practice in (application-level check).
- **Domain Events**: `ClinicianRegistered`, `ClinicianLicenseAdded`, `ClinicianAvailabilityUpdated`.

## 7. Model-Specific Explanations & Clarifying Questions (Domain Deep Dive)

### 7.1 Client Management & Groupings

1.  **Client vs. ClientGroup for Appointments:**
    - **Answer:** Confirmed. All `Appointment`s are linked to a `ClientGroup.id`. For individual clients, a system-managed single-member `ClientGroup` of `type: 'individual'` is used. This `ClientGroup` can be created automatically during the conversion of an `AppointmentRequest` from a new individual client or when a new individual client is created directly.
2.  **New Client Onboarding (Video `/0` Context):**
    - **Answer/Refinement:** The workflow involves:
      1.  `AppointmentRequest` submitted, with new client details in `RequestContactItems`.
      2.  System flags potential duplicates based on `RequestContactItems` (e.g., email, phone) for staff review.
      3.  If confirmed new, staff action converts `RequestContactItems` data into a new `Client` record and a new `ClientGroup` (type 'individual'). `AppointmentRequest.client_id` is then populated.
      4.  If existing client, `AppointmentRequest` is linked to the existing `Client.id` (and their primary `ClientGroup.id`).
    - **Remaining Question:** The exact UI/UX for staff managing potential duplicates needs definition. What are the conflict resolution options (merge, link, create new despite warning)?
3.  **`ClientGroupMembership.role`:**
    - **Refined List:** Common roles include 'Primary Patient' (the individual whose clinical record is the focus for that group's services), 'Spouse/Partner', 'Child', 'Parent/Guardian', 'Emergency Contact', 'Other Family Member'. The specific set should be configurable or a well-defined list.
4.  **`ClientGroupMembership.is_contact_only`:**
    - **Clarification:** This flag is for individuals associated with the group for communication or logistical reasons but who are not the direct recipients of the clinical service being provided to the group (e.g., a parent arranging services for a minor child who is the 'Primary Patient', or an emergency contact who doesn't attend sessions). They would not typically have clinical notes or `SurveyAnswers` directly tied to them within the context of _that group's specific services_. Their portal access and notifications would be tailored to their 'contact-only' role (e.g., viewing bills if also `is_responsible_for_billing`, receiving group announcements if applicable).
5.  **`ClientContact.type` vs. `contact_type`:**
    - **Re-confirmation:** The distinction is:
      - `contact_type`: Broad category ('EMAIL', 'PHONE', 'SMS').
      - `type`: Specific label/use ('HOME', 'WORK', 'MOBILE', 'FAX', 'OTHER').
    - This structure appears adequate.
6.  **`Client.referred_by`:**
    - **Decision Point:** The "new context" (e.g., video showing referral tracking importance) suggests a need for more structured referral tracking than free text.
    - **Proposed Action:** Consider changing `referred_by` to `referral_source_id: String?` linking to a new `ReferralSource` entity (e.g., `ReferralSource { id, name, type ('Clinician', 'Practice', 'Website', 'Existing Client'), contact_details }`). This would allow for reporting on referral channels. If an existing client referred them, this could link to another `Client.id` or `ClientGroup.id` via a separate optional field like `referred_by_client_id`.
7.  **Aggregate Boundaries:**
    - **Clarification:** `ClientGroup` is the AR for `ClientGroupMembership` and `ClientBillingPreferences`. `Invoice`, `Statement`, `Superbill` are separate ARs but are strongly associated with a `ClientGroup` (often holding `client_group_id`). This allows them to have independent lifecycles and complexities while maintaining a clear link. For example, an `Invoice` can be voided independently of the `ClientGroup` status.

### 7.2 Appointments & Scheduling

1.  **Appointment Lifecycle (Video `/0` Context for Requests):**
    - **Refinement:** When an `AppointmentRequest` status becomes 'ACCEPTED', the system (or staff action via UI) triggers the creation of an `Appointment` record.
      - Key data like `clinician_id`, `service_id`, proposed `start_date`/`end_date` (which might be adjusted based on actual availability), and `client_group_id` (derived from `AppointmentRequest.client_id`) are used to populate the new `Appointment`.
      - The `AppointmentRequest` status is then updated to 'CONVERTED_TO_APPOINTMENT', and it might be linked to the `Appointment.id` for history (e.g., `Appointment.source_request_id`).
2.  **`Appointment.recurring_rule`:**
    - **Clarification:** The iCalendar RRULE is stored. Application logic parses this rule to:
      - Generate and display future projected instances on the calendar.
      - Create actual `Appointment` records for upcoming instances (e.g., for the next X weeks/months, or just before they occur). This avoids creating infinite records.
      - When editing a recurring series (e.g., changing time or rule), the application must handle updates to existing uncompleted child instances and regeneration of future ones. `cancel_appointments` flag on parent `Appointment` during update indicates if existing child instances should be cancelled or rescheduled.
3.  **`Appointment.title`:**
    - **Use Case:** This is used for `Appointment.type = 'EVENT'` (e.g., "Staff Weekly Sync", "Team Training on HIPAA") or for client appointments where the `PracticeService.name` is too generic and a more specific, user-facing title is needed for that single occurrence (e.g., service is "Family Therapy" but title is "Smith Family - Special Review Session").
4.  **`Appointment.type`:**
    - **Confirmed Values:** 'APPOINTMENT' (for client-facing, billable/clinical services) and 'EVENT' (for internal, non-billable activities like clinician unavailability blocks, meetings, trainings that need to be on the calendar).
5.  **`AppointmentNotes.type`:**
    - **Refined List & Relation to Surveys:** Types could include: 'PROGRESS_NOTE', 'SOAP_NOTE', 'PRIVATE_CLINICIAN_NOTE', 'CONTACT_LOG' (for phone calls/messages related to the appointment), 'SUPERVISION_NOTE'.
    - If a note is generated from a `SurveyAnswers` (e.g., an intake survey becomes the basis of the first session note), `AppointmentNotes.survey_answer_id` links them. The `AppointmentNotes.type` might be 'INTAKE_REVIEW' or similar, and its content would incorporate or reference the survey data.
6.  **`Availability` Defaults:** Remains an open discussion point (see 5.5).
7.  **`PracticeService.code`:**
    - **Clarification:** These can be a mix. For insurance-billable services, they would be standard CPT codes. For non-billable or cash-based services, they can be internal codes. The system should allow flagging whether a code is a standard (e.g., CPT) or internal one.
8.  **`AppointmentNotes` User Relations:**
    - **Action:** `created_by` should be a non-nullable foreign key to `User.id` (the clinician writing the note). `unlocked_by` should be an optional foreign key to `User.id`. This improves auditability.

### 7.3 Billing & Finance

1.  **Invoice Generation (Video `/2` Context):**
    - **Clarification for Null `appointment_id`/`client_group_id`:**
      - `Invoice.appointment_id` would be `null` if the invoice is for:
        - Multiple appointments (if not using `InvoiceItem`s per appointment).
        - Sale of `Product`(s) only.
        - A manual charge not tied to a specific session (e.g., a missed appointment fee if not modeled as an appointment type).
      - `Invoice.client_group_id` might be `null` in very rare B2B scenarios (e.g., invoicing another organization for a bulk service, not typical for this system). Generally, it will be present.
    - **Workflow with `InvoiceItem` (if adopted):**
      1.  `Appointment.appointment_fee`, `adjustable_amount`, `write_off` determine the net charge for _that specific appointment service_.
      2.  An `InvoiceItem` is created for this net charge, linking to the `Appointment.id` and `PracticeService.id`.
      3.  If `Product`s are sold, additional `InvoiceItem`s are created, linking to `Product.id`.
      4.  The `Invoice.amount` becomes the sum of all its `InvoiceItem.amount_due`.
2.  **Income Report (Video `/2` Context):**
    - **Clarification:**
      - "Gross Income (Billed)": Sum of `Invoice.amount` for 'INVOICE' type invoices issued in a period. Or, sum of `Appointment.appointment_fee` for appointments that _occurred_ in the period, regardless of invoicing status (clarify which definition is used).
      - "Adjustments/Write-offs": Sum of `Appointment.adjustable_amount` (if negative and considered a reduction of billable) + `Appointment.write_off` for appointments in the period. OR sum of `Invoice.amount` for 'ADJUSTMENT_INVOICE' (if negative) or 'CREDIT_MEMO' type invoices.
      - "Net Billed Income": Gross Income (Billed) - Adjustments/Write-offs.
      - "Client Payments Received": Sum of `Payment.amount` where `Payment.status = 'COMPLETED'` and `Payment.payment_date` is in the period, excluding refunds.
      - Report needs to clearly define if it's cash-basis (payments received) or accrual-basis (billed amounts).
3.  **Billing Outstanding Balances Report (Video `/2` Context):**
    - **Calculation Logic:**
      - "Services Provided (Value)": Sum of ( `Appointment.appointment_fee` + `Appointment.adjustable_amount` (if positive) ) for completed appointments not yet fully written off.
      - "Uninvoiced": Value of completed services not yet linked to an `Invoice`.
      - "Invoiced (Outstanding)": Sum of `Invoice.amount_due` (which is `Invoice.amount` - sum of related `Payment.amount`) for `Invoice.status = 'UNPAID'` or `'PARTIAL'`.
      - "Client Paid (Total)": Sum of all `Payment.amount` for the client/group.
      - "Client Balance (Overall)": Total Invoiced (all time) - Total Paid (all time) for a `ClientGroup`.
    - **Invoice ID linking**: The `Invoice.appointment_id` field provides a direct link if an invoice is for a single appointment. If an invoice covers multiple items (via `InvoiceItem`), then `InvoiceItem.appointment_id` would provide the link.
4.  **`BillingSettings.clinician_id`:**
    - **Clarification:**
      - If `clinician_id` is `null`, these are considered practice-wide default settings. There should be only one such record.
      - If `clinician_id` is present, these are overrides for that specific clinician. The `@unique` on `clinician_id` ensures a clinician can only have one override record.
5.  **`StatementItem` Data Types:** Already confirmed as `Decimal(10,2)`.
6.  **`Product` Model:**
    - **Workflow:** Products are typically sold and added as line items to an `Invoice`. This strongly suggests the need for an `InvoiceItem` model where `InvoiceItem` can link to either a `PracticeService` OR a `Product`.
7.  **Aggregate Boundaries:**
    - `Invoice` is an AR, and `Payment` records are part of its aggregate (a payment cannot exist without an invoice).
    - `ClientGroup` as AR for `Statement` and `Superbill` makes sense as these documents are contextually bound to the group's history.

### 7.4 Notifications

1.  **Dynamic Data/Merge Tags (Video `/6` Context):**
    - **Implementation Detail:** A central "TemplatingService" in the application backend would be responsible for:
      - Defining a registry of available merge tags (e.g., `{{Client.preferred_name}}`, `{{Appointment.start_date_local}}`, `{{Invoice.due_date}}`, `{{Clinician.full_name}}`).
      - Accepting a template ID/name and a context object (e.g., `Appointment.id`, `Invoice.id`).
      - Fetching necessary data based on the context object.
      - Performing the merge and returning the processed content.
    - A standard list of available merge tags for each template `type` (e.g., appointment reminder, invoice notification) should be documented for users creating templates and for developers.
2.  **Template `type` and `email_type`:**
    - **Controlled Vocabularies (to be converted to Enums):**
      - `EmailTemplate.type`: 'APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_CANCELLATION', 'INVOICE_NOTIFICATION', 'STATEMENT_NOTIFICATION', 'SUPERBILL_NOTIFICATION', 'SURVEY_ASSIGNMENT', 'SECURE_MESSAGE_NOTIFICATION', 'ACCOUNT_WELCOME'.
      - `EmailTemplate.email_type` (Target Audience): 'CLIENT_PRIMARY' (the main client), 'CLIENT_GROUP_MEMBERS' (all relevant members of a group), 'RESPONSIBLE_BILLING_CONTACT', 'EMERGENCY_CONTACT'.
      - `ReminderTextTemplates.type`: 'APPOINTMENT_REMINDER_SMS', 'APPOINTMENT_CONFIRMATION_SMS', 'TELEHEALTH_LINK_SMS'.
3.  **`PracticeSettings` vs. `ClientReminderPreference`:**
    - **Interaction Logic:**
      1.  A notification type/channel (e.g., Appointment Reminder via SMS) must be globally enabled in `PracticeSettings` (e.g., a key like `notifications.appointmentReminder.sms.enabled = true`).
      2.  If globally enabled, the system then checks `ClientReminderPreference` for the specific client and notification type/channel.
      3.  If a `ClientReminderPreference` exists and `is_enabled = true`, the notification is sent. If `is_enabled = false`, it's not sent.
      4.  If no `ClientReminderPreference` exists for that specific client/type/channel, a practice-defined default behavior applies (e.g., "opt-in by default" or "opt-out by default"). This default behavior itself could be a `PracticeSetting`. This needs to be explicitly decided.

### 7.5 User Management & Permissions

1.  **Client Portal Authentication:**
    - **Decision:** Clients are **not** standard `User` records. Client portal access is granted via flags on the `Client` entity (e.g., `allow_portal_access: Boolean`). Authentication would likely use the primary `ClientContact.value` (email) and a password-based system specific to clients, or passwordless (magic links). A separate `ClientPortalAccount` entity might be needed to store hashed passwords and last login specific to clients, linked one-to-one with `Client`.
2.  **`ClinicalInfo` Purpose (Reiteration):** Marked for deprecation. All relevant fields (`speciality`, `NPI_number`, `taxonomy_code`) are preferred on the `Clinician` model.
3.  **Default Roles & Permissions:**
    - **Core Roles:** 'SystemAdmin', 'PracticeManager', 'Clinician', 'BillingStaff', 'FrontDeskStaff'.
    - **Core Permissions (Slugs - examples):**
      - `clients.view`, `clients.create`, `clients.edit`, `clients.delete.soft`, `clients.access.phi`
      - `appointments.view.own`, `appointments.view.all`, `appointments.schedule`, `appointments.edit`, `appointments.cancel`
      - `billing.view.all`, `billing.generate.invoice`, `billing.record.payment`, `billing.manage.settings`
      - `users.manage`, `roles.manage`, `practice.settings.edit`
      - `reports.view.financial`, `reports.view.clinical`
      - `clinicalnotes.view.own`, `clinicalnotes.edit.own`, `clinicalnotes.sign.own`, `clinicalnotes.view.all` (for supervisors/auditors)

### 7.6 Documents, Surveys & Files

1.  **Workflow for `ClientGroupFile` -> `ClientFiles`:**
    - **Use Case Confirmed:** This structure is for tracking individual client interactions (view, completion, signature) with a document shared at the group level. E.g., a consent form (`ClientGroupFile` of `type='FORM'`, linked to a `SurveyTemplate`) is shared with a family (`ClientGroup`). Each family member (`Client`) who needs to sign gets a `ClientFiles` record linking them to the `ClientGroupFile`, and their individual `SurveyAnswers` (the filled consent) is linked to their `ClientFiles` entry.
2.  **`ClientFiles` and `SurveyAnswers` Link:**
    - **Clarification:** This link is used when the "file" being tracked for a client is effectively their response to a survey/form. For instance, a `ClientGroupFile` could be a "Consent for Treatment" template. When Client A fills it out, their `SurveyAnswers` record is created, and the `ClientFiles` record for Client A and this "Consent for Treatment" `ClientGroupFile` will link to that specific `SurveyAnswers.id`.
3.  **`SurveyTemplate.type`:**
    - **Refined Examples:** 'INTAKE_QUESTIONNAIRE', 'CONSENT_FOR_TREATMENT', 'CONSENT_FOR_TELEHEALTH', 'ROI_FORM' (Release of Information), 'CLINICAL_ASSESSMENT_MEASURE' (e.g., PHQ-9, GAD-7), 'FEEDBACK_SURVEY', 'CUSTOM_FORM'.
4.  **Document Signing:**
    - **Process Clarification (Example):**
      1.  A document (e.g., `SurveyAnswers`, `AppointmentNote`) is marked as requiring a signature.
      2.  Clinician (or client via portal for some forms) reviews the document.
      3.  Upon "signing" action:
          - `is_signed` is set to `true`.
          - `signed_time` is set to current UTC timestamp.
          - `signed_ipaddress` is captured from the user's request.
          - `signed_name` (and `signed_credentials` for clinicians) are recorded.
          - The document content should ideally become immutable or versioned upon signing. `is_locked` flag can facilitate this.
      4.  An `Audit` log entry is created for the signing event.

## 8. Data Type Clarifications & Standards

_(This section is mostly up-to-date from the previous review. Monetary values and Date/Time handling are key.)_

### 8.1 Monetary Values

- Confirmed: All use `Decimal @db.Decimal(10,2)`, storing dollars.

### 8.2 Date/Time Handling

- Confirmed: Timestamps in UTC; Date-only fields use `@db.Date`.

### 8.3 Status Enumerations

- **Action:** Continue to refine this list and strongly consider migrating to Prisma enums for type safety and explicit definitions within the schema itself.

## 9. Key Design Decisions

_(This section is mostly up-to-date.)_

### 9.2 UUID Primary Keys

- **Action:** Ensure `@default(dbgenerated("newid()"))` (or DB equivalent) is consistently applied to all UUID PKs.

## 10. Migration & Evolution Considerations

### 10.1 Potential Schema Improvements

_(Adding new items or refining existing ones based on "new context")_

1.  **`InvoiceItem` Model (Reiteration - High Priority):** Essential for flexible billing of multiple services, products, or appointments on a single invoice.
    - `InvoiceItem` fields: `id`, `invoice_id` (FK to `Invoice`), `item_type` ('SERVICE', 'PRODUCT', 'MANUAL_CHARGE'), `practice_service_id` (optional FK), `product_id` (optional FK), `description` (String), `quantity` (Decimal/Int), `unit_price` (Decimal(10,2)), `total_price` (Decimal(10,2)), `appointment_id` (optional FK).
2.  **`ReferralSource` Entity:** As discussed in 7.1.6, create a `ReferralSource` entity to structure referral tracking.
3.  **`ClientPortalAccount` Entity:** If clients authenticate with passwords, a separate entity linked to `Client` might be needed for `hashed_password`, `last_login_portal`, `failed_login_attempts_portal`, etc.
4.  **Structured Address Object:** Consider a reusable embedded/JSON type or a separate linked `Address` table for all address fields (`ClientAdress`, `Location`, `BillingAddress`) to ensure consistency and potentially integrate with address validation services.
5.  **Tagging System Expansion**: Evaluate if the current `Tag` model (linked only to `Appointment`) should be polymorphic or if other entities (e.g., `Client`, `Note`) need their own tagging mechanisms/tables.
6.  **Supervision Module**: For practices with supervisees, consider entities like `SupervisionLog`, linking clinician (supervisor), clinician (supervisee), appointment (supervised session), and supervision notes. (This is a larger new feature area).

## 11. Integration Points

_(This section is mostly up-to-date.)_

## 12. General Documentation & Best Practices to Consider

_(This section is mostly up-to-date.)_

## 13. Glossary

_(New/Refined terms based on "new context")_

- **Primary Patient (within a ClientGroup)**: The individual client member whose clinical care and documentation are the primary focus for services delivered to that client group.
- **Event (Appointment Type)**: A calendar entry for non-client, non-billable activities such as staff meetings, clinician unavailability, or training.
- **Merge Tag**: A placeholder (e.g., `{{Client.preferred_name}}`) in an `EmailTemplate` or `ReminderTextTemplate` that is dynamically replaced with actual data by the application before sending.

## 14. Open Questions & Future Considerations

_(Adding new questions based on "new context" and refinements)_

1.  **Client Portal Authentication Deep Dive**: What specific authentication methods will be supported for clients (password, magic link, SSO)? What are the security requirements (password complexity, MFA)? (Related to 7.5.1 and 10.1.3)
2.  **Duplicate Client Management Workflow**: What are the detailed steps and UI considerations for staff to review and resolve potential duplicate client records flagged by the system during intake?
3.  **Default Behavior for Client Preferences**: If a `ClientReminderPreference` is not explicitly set for a client/type/channel, what is the practice default (opt-in or opt-out)? How is this default configured? (Related to 7.4.3)
4.  **Immutable Signed Documents**: How is the immutability of signed documents (notes, surveys) technologically enforced? Versioning? Or simply locked fields?
5.  **Referral Source Linking**: If a `ReferralSource` entity is added, how will existing `Client.referred_by` free-text data be migrated or handled?
6.  **`Availability` Overlap/Conflict Resolution**: How should the system handle clinician attempts to create overlapping `Availability` blocks?
7.  **`InvoiceItem` and Tax/Discount Logic**: If `InvoiceItem` is added, how will taxes (if applicable) or invoice-level discounts be modeled and applied?
8.  **Telehealth Platform Integration Details**: Beyond generic flags, what specific fields or entities are needed to integrate with a chosen telehealth platform (e.g., storing meeting URLs, session passcodes)?
9.  **Data Retention and Archival Policies**: What are the business and legal requirements for data retention, especially for inactive clients, financial records, and audit logs? How will archival be handled?
10. **Complex Recurring Appointment Edits**: What is the desired behavior for complex edits to recurring appointment series (e.g., changing only selected future instances, exceptions to the rule)?

## 15. Next Steps

_(Standard next steps remain relevant)_

1.  **Team Review:** Discuss this updated `SCHEMA_NOTES.md`.
2.  **Answer Clarifying Questions:** Focus on remaining questions in Section 7 and new ones in Section 14.
3.  **Make Design Decisions:** Prioritize decisions on `InvoiceItem`, `ReferralSource`, Client Portal Auth, and Enum strategy.
4.  **Update `schema.prisma`:** Reflect decisions.
5.  **Evolve This Document:** Continue iterative updates.

---

**Note**: This document should be reviewed and updated whenever significant schema changes are made or new business requirements are identified.
