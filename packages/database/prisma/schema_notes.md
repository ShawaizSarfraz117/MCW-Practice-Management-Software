# SCHEMA_NOTES.md - Prisma Schema Review & Domain Documentation Guide (v2)

**Date:** May 25, 2025
**Last Updated:** May 26, 2025 (Incorporating insights from further domain analysis/simulated new context from "Video 3")

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
- **Appointment Scheduling**: Appointments, recurring appointments, availability management, appointment requests, and waitlist management.
- **Billing & Financial Management**: Invoices, payments, statements, superbills, credit management, and financial reconciliation.
- **Clinical Documentation**: Notes, surveys, treatment plans, diagnoses
- **Practice Operations**: Clinician management, locations, services, notifications, recurring internal events.
- **Portal Access**: Client portal lifecycle management (invitation, activation), permissions, and secure messaging.

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

- **Monetary Values Note:** The standard for all monetary values is `Decimal @db.Decimal(10,2)`, storing dollars, not cents. This is documented in section 8.1.

### 3.2 Uniqueness Constraints Added (`@unique`) (Verified)

- Existing `@unique` constraints in `schema.prisma` are confirmed as intentional for fields like `Tag.name`, `Invoice.invoice_number`, etc.
- `GoodFaithEstimate.[client_id, provided_date] @unique`: Business rule confirmation for this specific composite key is still advised.

## 4. Key Business Rules & Workflows

_(This section outlines high-level rules and workflows. More detailed explanations or refinements based on new context are integrated below.)_

### 4.1 Client & Group Management

- **Client Groups**: Every appointment is associated with a `ClientGroup`. For individual clients, a single-member `ClientGroup` is created, potentially transparently to the user in some UI contexts.
  - Types: 'individual', 'couple', 'family', 'minor'.
  - Groups manage shared billing preferences, `available_credit`, and can be the subject of `Statement` and `Superbill` generation.
- **New Client Onboarding Workflow (Refined based on new context for 7.1.2 and "Video 3" insights):**
  - All new AppointmentRequests (from portal or staff-entered for new prospects) are initially set to a 'PENDING_STAFF_REVIEW' status.
  1.  Prospective client submits an `AppointmentRequest` via portal or staff enters details. If new, `RequestContactItems` capture their information.
  2.  System performs a preliminary check for existing clients based on email/phone from `RequestContactItems` to flag potential duplicates for staff review.
  3.  Staff reviews the `AppointmentRequest` and potential duplicates. UI should offer clear resolution options:
      - **Merge:** If confirmed duplicate, guide staff to merge `RequestContactItems` data into the existing `Client` and `ClientProfile`, adding new `ClientContact` methods if applicable.
      - **Link to Existing:** Allow staff to link the `AppointmentRequest` to an existing `Client.id` and their primary `ClientGroup.id`.
      - **Create New (with override):** Allow creation of a new `Client` despite a potential duplicate flag, but require a staff note (logged in `Audit` trail).
  4.  If 'ACCEPTED' for a new client:
      a. A new `Client` record is created from validated `RequestContactItems`.
      b. A corresponding single-member `ClientGroup` of type 'individual' is created, linking to the new `Client`. The `ClientGroup.name` can be derived from the client's name.
      c. The `AppointmentRequest.client_id` is updated to link to the new `Client`.
      d. (If applicable) A `ClientProfile` may be partially populated.
      e. **Automated Intake Assignment:** Based on practice configuration (e.g., rules linking `PracticeService.id` from the `AppointmentRequest` to specific 'INTAKE_QUESTIONNAIRE' `SurveyTemplate`(s)), relevant surveys are assigned. This creates `SurveyAnswers` records (initially empty) linked to the `Client`.
      f. **Portal Invitation & Activation:** After initial review and Client creation, staff initiate a client portal invitation (as per video [01:59]) to the client's primary verified email from `ClientContact`. This invitation uses the mechanism (e.g. unique link or PIN) tracked by the `ClientPortalInvitation` model concept (see 10.1.8). The client uses this to activate their portal account (creating credentials in a `ClientPortalAccount` model), verify contacts, and set initial communication/feature preferences (e.g., for online payments [01:04], secure messaging, document access). Client portal permissions on the `Client` model (or `ClientPortalAccount`) are updated upon successful activation.
  5.  If the request is for an existing client, it's linked to their `Client.id` and primary `ClientGroup.id`.
  6.  Client activates portal, verifies contact methods, and completes assigned intake surveys.
  7.  Staff reviews completed intake forms (`SurveyAnswers` via `ClientFiles`) before the first `Appointment`.
  8.  The request status moves: 'PENDING_REVIEW' → ('DUPLICATE_NEEDS_REVIEW') → 'ACCEPTED'/'DECLINED' → 'CONVERTED_TO_APPOINTMENT'.
- **Client Roles**: Within a group, common roles are 'Primary Patient', 'Spouse/Partner', 'Child', 'Guardian', 'Emergency Contact'. The 'Primary Patient' is the main subject of care within that group context for clinical documentation.
- **Contact-Only Members**: These members (e.g., a non-attending parent who needs billing access for a minor, or an emergency contact) have specific, limited portal access if any, and primarily receive communications relevant to their role (e.g., billing, emergency). They do not have their own clinical record within that group's context.
- **Billing Responsibility**: One `ClientGroupMembership` record within a `ClientGroup` can be flagged as `is_responsible_for_billing`. Application logic must enforce that only one member can have this flag set to true at any given time within the same group. The "primary client for billing" (mentioned in video context [00:21]) is likely the `Client` record linked through this `is_responsible_for_billing` flag.

### 4.2 Appointment Lifecycle

1.  **Request Phase**: As detailed in 4.1 (New Client Onboarding Workflow).
2.  **Scheduling Phase**:
    - Appointments are created from 'ACCEPTED' `AppointmentRequests` or directly by staff. If from a request, relevant data (client, service, requested time) is copied/linked to the new `Appointment` record. The `AppointmentRequest` status changes to 'CONVERTED_TO_APPOINTMENT'.
    - Recurring client appointments: The `recurring_rule` (iCalendar RRULE) defines the series. Individual instances are distinct `Appointment` records linked by `recurring_appointment_id` to the parent/template appointment. Modifying the series can affect future instances and should trigger re-evaluation of `AppointmentLimit` for the clinician on affected dates.
3.  **Financial Phase**:
    - The `appointment_fee` is derived from `PracticeService.rate`, overridden by `ClinicianServices.custom_rate` or `ClientGroupServices.custom_rate` if applicable.
    - `adjustable_amount` and `write_off` are applied at the time of billing or reconciliation.
4.  **Appointment Status Transitions:**
    - `Appointment.status` transitions must follow a defined lifecycle (e.g., cannot go from 'CANCELLED' to 'COMPLETED' without intermediate steps). This lifecycle needs to be explicitly documented.
    - A `status` of 'NO_SHOW' should trigger appropriate billing logic (e.g., missed appointment fee).

### 4.2.A Recurring Event and Unavailability Management (New Sub-section)

- **Internal Events**: `Appointment.type = 'EVENT'` is used for internal activities like staff meetings, training, or clinician unavailability (which is an Appointment of type = 'EVENT'). These also utilize `Appointment.recurring_rule` for series.
- **Unavailability Blocks**:
  - A specific type of recurring 'EVENT' (e.g., `Appointment.title = 'Clinician Unavailability'`, "Video 3"/"Video 2" context) used by clinicians to block out time.
  - The system must enforce that clinician Unavailability blocks prevent the scheduling of conflicting client `Appointment`s.
  - Modifications to a clinician's recurring unavailability event (e.g., changing time, cancelling an instance) must trigger checks against existing scheduled client `Appointment`(s) to flag and manage potential conflicts. Staff are then responsible for manually contacting affected clients to reschedule.
- **Attendees for Events**: For simple internal events, attendees might be listed in `Appointment.title` or a description field. For events requiring formal tracking of `User` attendance, a separate linking mechanism or model might be considered in future iterations.

### 4.3 Billing Workflow

1.  **Invoice Generation**:
    - **Trigger**: Can be manual, upon `Appointment.status` changing to 'COMPLETED' (if `BillingSettings.autoInvoiceCreation` is 'ON_APPOINTMENT_COMPLETION'), or via scheduled batch jobs (weekly/monthly).
    - **Content**: If an `InvoiceItem` model is adopted (see 10.1.1), an `Invoice` can include multiple `InvoiceItem`s, each linking to a `PracticeService` (and potentially an `Appointment`) with its specific fee. If not, an `Invoice` may be more directly tied to a single `Appointment` or represent a sum for `Product`s.
    - Types: 'INVOICE', 'ADJUSTMENT_INVOICE', 'CREDIT_MEMO'.
    - An `Invoice.status` can only be set to 'CREDIT' if `Invoice.type = 'CREDIT_MEMO'`. Credit memos must be applicable towards other existing 'UNPAID' or 'PARTIAL' invoices for the same `ClientGroup` or result in an increase to `ClientGroup.available_credit` if not directly applied.
2.  **Payment Processing**:
    - Payments are recorded against specific `Invoice`(s).
    - Application of `ClientGroup.available_credit` to a payment reduces the amount due from other payment methods. This transaction should debit `available_credit` and be auditable.
3.  **Statement Generation**: `Statement`s aggregate `Invoice` and `Payment` records for a `ClientGroup` over a period, calculating a running balance.
4.  **Superbill Generation**: `Superbill`s aggregate `Appointment` details, including linked `Diagnosis` codes (from `DiagnosisTreatmentPlanItem` via `Client` and `PracticeService.code`), for a `ClientGroup`.

### 4.3.A Financial Reconciliation Procedures (New Sub-section)

- **Daily Reconciliation Process**: Financial reconciliation is a daily operational task. Staff utilize reports from the payment processor (e.g., Stripe) and compare them against `Payment` records within the system (insights from "Video 2"/"Video 3", schema_notes.md 7.3.8).
- **Matching**: The `Payment.transaction_id` serves as the primary key for matching these records.
- **Investigation**: The `Payment.response` field, containing raw data from the processor, is critical for investigating any identified discrepancies or transaction failures.
- **Status Updates**: Verified payments confirm updates to `Invoice.status` (e.g., to 'PAID' or 'PARTIAL').
- **Auditing**: This process also ensures that changes to `ClientGroup.available_credit` (both debits from payments and credits from refunds/credit memos) are correctly reflected and audited.
- **Manual Credit Adjustments**: Manual adjustments to `ClientGroup.available_credit` that are not the result of a standard payment application or credit memo must be processed by creating an `Invoice` of `type = 'ADJUSTMENT_INVOICE'`. This invoice can have a positive or negative amount. A negative amount on an 'ADJUSTMENT_INVOICE' effectively increases `ClientGroup.available_credit`. These adjustments must have detailed notes and are logged in the `Audit` trail.

### 4.3.B Billing Document Delivery Workflow (New Sub-section based on Video [02:50])

- **Document Statuses**: Invoices and Statements can have their delivery to the client tracked.
  - `Invoice.is_exported` can indicate if the document was sent to an external accounting system (video [02:50]).
  - A separate `Invoice.delivery_method` (or a more granular `delivery_status`) field tracks how (or if) the document was made available to the client (e.g., 'NOT_SENT', 'EMAILED_TO_CLIENT' (video [02:50]), 'VIEWED_ON_PORTAL', 'PRINTED_AND_MAILED'). This differentiates system/accounting export from client-facing delivery.
- **Workflow Example (Invoice):**
  1. Invoice is generated, initial `delivery_method` might be 'NOT_SENT' or 'PENDING_DELIVERY'.
  2. Staff can manually trigger an email delivery, updating `delivery_method` to 'EMAILED_TO_CLIENT' and recording the send time.
  3. If client views the invoice on the portal, `delivery_method` could be updated to 'VIEWED_ON_PORTAL' (if detailed tracking is implemented).
  4. Staff can mark an invoice as 'PRINTED_AND_MAILED'.
  5. Separately, `is_exported` is flagged when pushed to an accounting integration.
- **Notifications**: Delivery often triggers notifications (e.g., email informing client an invoice is available on the portal), governed by `ClientReminderPreference` and `PracticeSettings`.

### 4.4 Notification System

- **Merge Tag Resolution**: A dedicated service/module will be responsible for resolving merge tags (e.g., `{{client_full_name}}`, `{{appointment_date_time_local}}`) using data from relevant entities (`Client`, `Appointment`, `Invoice`, etc.) before sending notifications. A standard list of available tags per template `type` will be maintained for developers.
- **Preference Hierarchy & Activation:**
  1.  Global `PracticeSettings` (e.g., `reminders.appointment.sms.enabled:false`) can disable a channel practice-wide.
  2.  If globally enabled, `ClientReminderPreference.is_enabled` (for a client who has completed portal activation and verified contact methods) determines if they receive that type/channel of notification.
  3.  **Portal Activation Prerequisite & Preference Management:** `ClientReminderPreference` settings for a client are typically configured and managed by the client themselves via the client portal. This occurs after the client has successfully completed a staff-initiated portal invitation and account activation process. During activation, clients verify their primary contact methods (e.g., email, SMS-capable phone number) and can set initial communication preferences, including granular SMS opt-ins.
  4.  **SMS Opt-In:** For certain notification channels like SMS, an explicit opt-in within `ClientReminderPreference` (or during portal setup) is required for specific `reminder_type`s (e.g., billing notifications, non-urgent updates) due to compliance. For SMS, explicit opt-in for different categories of messages (e.g., appointment reminders vs. billing alerts) is managed by the client in the portal [01:04]. This could mean multiple `ClientReminderPreference` entries for the SMS channel with different `reminder_type`s, or a more complex preference object.
  5.  **Default Behavior:** If no `ClientReminderPreference` exists for a client _who has activated their portal access_, the default should generally be "opt-out" for non-essential communications. Practice-defined defaults for essential communications (e.g., appointment reminders for scheduled appointments if `ClientReminderPreference` is not set) should be configurable in `PracticeSettings` (e.g., `notifications.defaultBehavior.appointmentReminder.sms = 'opt_in_if_primary_verified_and_portal_active'`). This logic needs to be fully specified.

### 4.5 Client Portal Lifecycle Management (New Sub-section)

1.  **Invitation**:
    - Portal access is initiated by staff sending an invitation to the client's primary verified email address (`ClientContact.value` where `is_primary=true`).
    - This invitation could contain a unique, time-sensitive link or involve a PIN system for initial access, sent to the client's primary verified email address. The invitation mechanism (e.g., unique link or PIN as per video context from Q14.26) is tracked via the `ClientPortalInvitation` model (see 10.1.8).
2.  **Activation**:
    - Client uses the invitation link to access the portal.
    - They set up their account, which typically involves creating/confirming a password (managed via a `ClientPortalAccount` entity linked one-to-one with `Client`), verify contact methods, and set initial communication/feature preferences, including granular SMS opt-ins (e.g., for online payments [01:04], secure messaging, document access, as per video context).
3.  **Access Granted**:
    - Upon successful activation, a flag like `Client.allow_portal_access` (or equivalent status like `ClientPortalAccount.status = 'ACTIVE'`) is set.
    - `ClientPortalAccount.last_login_at` (on the new `ClientPortalAccount` model) can be updated.
    - Upon successful activation, client portal feature permissions (e.g., allowing online appointment requests, secure messaging, accessing billing documents, paying outstanding balances) are enabled based on practice settings and client-specific configurations.
4.  **Ongoing Access & Preferences**:
    - Clients can manage their `ClientContact` details and `ClientReminderPreference`s through the portal, subject to verification workflows for changes to critical contact info.
5.  **Deactivation/Archival**:
    - If a `Client` becomes inactive (`Client.is_active = false`), their portal access (`ClientPortalAccount.status`) should be automatically suspended or revoked.
    - Re-activation processes for returning clients need to be defined.

### 4.6 Waitlist Management Workflow (New Sub-section)

1.  **Adding to Waitlist**:
    - A `Client` is marked with `Client.is_waitlist = true`.
    - Additional details about their waitlist preferences (e.g., desired clinician(s), service(s), availability, urgency) should be captured. (Consider if this requires new fields on `Client` or a dedicated `WaitlistEntry` model).
2.  **Identifying Open Slots**:
    - When an `Appointment` is cancelled or a clinician adds new `Availability`, this creates potential openings.
3.  **Staff Review & Outreach**:
    - Staff can view a filtered list of clients on the waitlist based on criteria like:
      - Requested `clinician_id`.
      - Requested `service_id`.
      - Client-stated preferred days/times (if captured).
    - The system does _not_ automatically fill slots.
4.  **Scheduling from Waitlist**:
    - Staff contact the client from the waitlist to offer the slot.
    - If accepted, a new `Appointment` is scheduled, and `Client.is_waitlist` may be set to `false` or updated.
5.  **Managing Waitlist Entries**:
    - Regular review of the waitlist to remove clients no longer seeking services or update their preferences.

### 4.X Insurance Management Workflow (New Section)

- Defining client billing type ('self-pay', 'insurance' - implied by video context [00:21] on insurance details).
- Input/storage of detailed `ClientInsurancePolicy` data (including CMS fields - confirmed by video Q14.21).
- Workflow for creating/managing `InsuranceAuthorization` records (link to appointments, tracking usage, statuses - confirmed by video Q14.18).

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
- **Entities**: `ClientProfile`, `ClientAdress` (one-to-many), `ClientContact` (one-to-many), `ClientReminderPreference` (one-to-many). (Potentially `ClientPortalAccount` if added, and `ClientInsurancePolicy` if added - see below).
- **Value Objects**: Potentially an `Address` value object could be used within `ClientAdress` if addresses are treated as immutable snapshots.
- **Invariants**:
  - A `Client` must have at least one `ClientContact` marked as `is_primary` for essential communication, and this contact must be verified if used for portal activation/reminders (video context [01:59]).
  - `Client.date_of_birth` if present, must be a valid date in the past.
  - `ClientReminderPreference` settings are only effective if the associated `ClientContact` is verified and (for some channels/types) explicit opt-in is recorded, especially after portal activation.
  - A `Client`'s portal permissions (e.g., `allow_online_appointment`, `access_billing_documents`, `use_secure_messaging`) are critical for their interaction with the system and are typically set post-portal activation.
- **Domain Events**: `ClientCreated`, `ClientProfileUpdated`, `ClientContactAdded`, `ClientArchived` (`is_active` set to false), `ClientPortalInvitationSent`, `ClientPortalAccountActivated`, `ClientReminderPreferenceUpdated`, `ClientPortalPermissionsUpdated`.
- **Consideration for `ClientInsurancePolicy`**: Video context [00:21] on managing detailed client insurance information (insurance company, member ID, authorizations) suggests that client-specific insurance details might warrant its own `ClientInsurancePolicy` entity. This could be part of the `Client` aggregate or a closely related aggregate, linking to `Client.id` or `ClientGroup.id`. It would store insurance company name, member ID, group number, subscriber information, effective dates, copay/deductible details, CMS-required fields (see Q14.21 based on video context), and be the place where `InsuranceAuthorization` records link (see Q14.18 based on video context).

### 6.2 ClientGroup Aggregate

- **Root**: `ClientGroup`
- **Entities**: `ClientGroupMembership` (one-to-many, part of the aggregate's consistency boundary), `ClientBillingPreferences` (one-to-one).
- **Associated Roots (Strongly Consistent Dependencies but Separate Aggregates)**: `Invoice`, `Statement`, `Superbill` are typically associated with a `ClientGroup` but are often Aggregates themselves due to their own complex lifecycle and rules. The `ClientGroup` would hold references (IDs) to these.
- **Value Objects**: `ClientGroupFile` could be considered as managed by `ClientGroup`, though its `ClientFiles` junction introduces per-client state.
- **Invariants**:
  - `available_credit` cannot be negative. Manual adjustments to `available_credit` must be audited (video context "Video 2", schema_notes.md 4.3.A).
  - Only one `ClientGroupMembership` can have `is_responsible_for_billing = true`. This likely identifies the "primary client for billing" (video context [00:21]).
  - A `ClientGroup` of type 'individual' should typically have only one active, non-contact-only `ClientGroupMembership`.
- **Domain Events**: `ClientGroupCreated`, `MemberAddedToGroup`, `BillingResponsibleMemberChanged`, `CreditAppliedToGroup`, `AvailableCreditManuallyAdjusted`.

### 6.3 Appointment Aggregate

- **Root**: `Appointment`
- **Entities**: `AppointmentNotes` (one-to-many, life cycle tied to appointment), `AppointmentTag` (many-to-many relationship, tags themselves are separate entities).
- **Invariants**:
  - `start_date` must be before `end_date`.
  - If `is_recurring` is true, `recurring_rule` must be present.
  - `status` transitions must follow a defined lifecycle.
  - For `Appointment.type = 'APPOINTMENT'` (client appointments), creation/rescheduling must respect `AppointmentLimit` of the `clinician_id`.
  - For `Appointment.type = 'EVENT'` of subtype 'UNAVAILABILITY_BLOCK', it must prevent conflicting client appointments.
- **Domain Events**: `AppointmentScheduled`, `AppointmentRescheduled`, `AppointmentCancelled`, `AppointmentCompleted`, `AppointmentNoShow`, `RecurringAppointmentSeriesModified`, `InternalEventScheduled`.

### 6.4 Clinician Aggregate

- **Root**: `Clinician`
- **Entities**: `License` (one-to-many), `BillingAddress` (one-to-many, unique by type), `BillingSettings` (one-to-one, clinician-specific overrides), `AppointmentLimit` (one-to-many), `Availability` (one-to-many).
- **Value Objects**: `ClinicianServices` (defines services offered by clinician, could be entity if has own lifecycle), `ClinicianLocation` (links to locations).
- **Invariants**:
  - `user_id` must link to an existing `User`.
  - An active `Clinician` must have at least one valid, non-expired `License` for the states they practice in (application-level check).
- **Domain Events**: `ClinicianRegistered`, `ClinicianLicenseAdded`, `ClinicianAvailabilityUpdated`, `ClinicianUnavailabilityBlockSet` (based on sections 4.2.A and 7.2.2 from "Video 3"/"Video 2" context).

## 7. Model-Specific Explanations & Clarifying Questions (Domain Deep Dive)

### 7.1 Client Management & Groupings

1.  **Client vs. ClientGroup for Appointments:**
    - **Answer:** Confirmed. All `Appointment`s are linked to a `ClientGroup.id`. For individual clients, a system-managed single-member `ClientGroup` of `type: 'individual'` is used. This `ClientGroup` can be created automatically during the conversion of an `AppointmentRequest` from a new individual client or when a new individual client is created directly. The video showing "Primary Client" for billing details [00:21] reinforces the concept of a primary individual within a group context for certain aspects, though appointments remain group-based. The video context showing client-specific billing settings, insurance details, and default services further emphasizes that while `ClientGroup` is the technical association for appointments, many user-facing configurations and data points are managed at the individual `Client` level.
2.  **New Client Onboarding (Video `/0` Context & "Video 3" Insights):**
    - **New Insight/Refinement:** The workflow should emphasize that all new `AppointmentRequests` (whether from portal or staff-entered for a prospect) first go into a 'PENDING_STAFF_REVIEW' status. During this review, staff handle duplicate checks. If new, a `Client` and `ClientGroup` are created. Automated assignment of intake `SurveyTemplate`(s) can occur after the `AppointmentRequest` is accepted and linked to a service; for example, an 'INTAKE_QUESTIONNAIRE' `SurveyTemplate` is assigned if `AppointmentRequest.service_id` indicates an initial consultation. The client is then typically prompted to complete these via the portal before the first appointment is finalized for scheduling. Portal invitation is a distinct step initiated by staff [01:59], usually after the initial request review and client creation. (See also refined workflow in Section 4.1).
    - **Portal Invitation & Activation:** After initial review and Client creation, staff initiate a client portal invitation to the client's primary verified email. This involves generating a unique link/token (tracked potentially in a `ClientPortalInvitation` model) or a PIN. The client uses this to activate their portal account (creating credentials in a `ClientPortalAccount` model), verify contacts, and set initial communication/feature preferences (e.g., for online payments [01:04], secure messaging, document access). Client portal permissions on the `Client` model (or `ClientPortalAccount`) are updated upon successful activation.
    - **Remaining Question / UI/UX for duplicates (Refined):** While resolution options (Merge, Link, Create New with Override) are clearer, the specific UI design and the information presented to staff to make these decisions effectively needs careful consideration. What level of detail from potentially matching `Client` records is shown? How are merge conflicts handled at a granular field level?
3.  **`ClientGroupMembership.role`:**
    - **Refined List:** Common roles include 'Primary Patient' (the individual whose clinical record is the focus for that group's services), 'Spouse/Partner', 'Child', 'Parent/Guardian', 'Emergency Contact', 'Other Family Member'. The specific set should be configurable or a well-defined list. The "Contacts" tab in the video [01:42] directly supports the need to define these roles. The video's 'Contacts Tab' allowing management of family members, their relationships, and contact details directly supports these roles.
4.  **`ClientGroupMembership.is_contact_only`:**
    - **Clarification:** This flag is for individuals associated with the group for communication or logistical reasons but who are not the direct recipients of the clinical service being provided to the group (e.g., a parent arranging services for a minor child who is the 'Primary Patient', or an emergency contact who doesn't attend sessions). They would not typically have clinical notes or `SurveyAnswers` directly tied to them within the context of _that group's specific services_. Their portal access and notifications would be tailored to their 'contact-only' role (e.g., viewing bills if also `is_responsible_for_billing`, receiving group announcements if applicable). This is crucial for managing individuals shown in the "Contacts" tab [01:42].
    - **Observation:** The video showed functionality to set "Client Default Services," implying a need to store service/rate overrides or defaults at an individual client level, potentially overriding `PracticeService`, `ClinicianServices`, or `ClientGroupServices` rates.
    - **Confirmation:** The video explicitly demonstrates setting 'Client Default Services', confirming the requirement to store service/rate overrides or defaults at an individual client level. The "Consideration" to evaluate `ClientGroupServices` vs. a `ClientServicePreference` model remains valid.
5.  **`Client.referred_by`:**
    - **Updated Decision Point & Further Justification:** The new context from 'Video 2' unequivocally confirms the practice's need for structured referral source tracking to analyze marketing effectiveness and understand client acquisition channels. The current free-text `referred_by` field is inadequate for reporting.
    - **Strengthened Proposed Action:** Strongly recommend prioritizing the creation of a `ReferralSource` entity (e.g., `ReferralSource { id, name, type ('Clinician', 'Practice', 'Website', 'Existing Client'), contact_details }`). This is no longer just a 'potential change' but a clear business requirement. This allows for reporting on referral channels. If an existing client referred them, this could link to another `Client.id` or `ClientGroup.id` via a separate optional field like `referred_by_client_id`.
6.  **Aggregate Boundaries:**
    - **Clarification:** `ClientGroup` is the AR for `ClientGroupMembership` and `ClientBillingPreferences`. `Invoice`, `Statement`, `Superbill` are separate ARs but are strongly associated with a `ClientGroup` (often holding `client_group_id`). This allows them to have independent lifecycles and complexities while maintaining a clear link. For example, an `Invoice` can be voided independently of the `ClientGroup` status.
7.  **`Client.is_waitlist` and Waitlist Functionality:**
    - **Answer/Refinement from "Video 3" & "Video 2":** Yes, `Client.is_waitlist = true` flags them. Staff can add internal notes about specific preferences (e.g., desired clinician, service, general availability like "prefers mornings"). The system does not automatically match or fill slots. Staff manually review the waitlist (which can be filtered by basic criteria if available, like primary assigned clinician if any) and proactively contact clients when an opening occurs. (Further questions on capturing detailed waitlist preferences are in Section 14).
8.  **Client-Specific Default Services/Rates (New from Video Context [00:42]):**
    - **Observation:** The video showed functionality to set "Client Default Services," implying a need to store service/rate overrides or defaults at an individual client level, potentially overriding `PracticeService`, `ClinicianServices`, or `ClientGroupServices` rates.
    - **Consideration:** Evaluate if `ClientGroupServices` (if the client is in a group of one) is sufficient, or if a more granular `ClientServicePreference` model (linking `Client.id`, `PracticeService.id`, and an optional `custom_rate`) is needed. This will be further discussed in Section 10.1.

### 7.2 Appointments & Scheduling

1.  **Appointment Lifecycle (Video `/0` Context for Requests):**
    - **Refinement:** When an `AppointmentRequest` status is moved by staff to a state like 'CONFIRMED_PENDING_SCHEDULE' (after client intake forms are done, if required), the system facilitates creating an `Appointment`. Key data like `clinician_id`, `service_id`, proposed `start_date`/`end_date` (which might be adjusted based on actual availability), and the `AppointmentRequest.client_id` (which would have been populated during request review for new clients) are used to populate the new `Appointment`. The `AppointmentRequest` is then marked 'SCHEDULED' or 'CONVERTED_TO_APPOINTMENT', and it might be linked to the `Appointment.id` for history (e.g., `Appointment.source_request_id`). (Note: The example status flow for `AppointmentRequest` in Prisma schema comments was refined to reflect that new requests typically start with a staff review, e.g., 'PENDING_STAFF_REVIEW' -> ... -> 'SCHEDULED'.)
2.  **`Appointment.recurring_rule`:**
    - **Clarification & "Video 3" / "Video 2" Insights:** The iCalendar RRULE is stored. Application logic parses this rule to:
      - Generate and display future projected instances on the calendar.
      - Create actual `Appointment` records for upcoming instances (e.g., for the next X weeks/months, or just before they occur). This avoids creating infinite records.
      - When editing a recurring series (e.g., changing time or rule), the application must handle updates to existing uncompleted child instances and regeneration of future ones. `cancel_appointments` flag on parent `Appointment` during update indicates if existing child instances should be cancelled or rescheduled.
      - **For Client Appointments:** Modification of a recurring series should trigger a re-evaluation of `AppointmentLimit` for the clinician on affected future dates.
      - **For `Appointment.type = 'EVENT'` (e.g., staff meetings, unavailability):** These also use `recurring_rule`. Clinicians define their "Unavailability" using an `Appointment` of `type = 'EVENT'`, often with a `recurring_rule`. The system must prevent scheduling of client `Appointment`s that conflict with these unavailability blocks. If a clinician adds or modifies an unavailability block that conflicts with existing client appointments, the system should flag these conflicts for staff to manually resolve (e.g., contact client to reschedule).
3.  **`Appointment.title`:**
    - **Use Case:** This is used for `Appointment.type = 'EVENT'` (e.g., "Staff Weekly Sync", "Team Training on HIPAA", "Clinician Unavailability") or for client appointments where the `PracticeService.name` is too generic and a more specific, user-facing title is needed for that single occurrence (e.g., service is "Family Therapy" but title is "Smith Family - Special Review Session"). (Note: The Prisma schema comment for `Appointment.title` was refined to include more explicit examples for 'EVENT' types like "Staff Meeting", "Clinician Unavailability" based on recent reviews.)
    - **Review point for `Appointment.title` length:** While `String? @db.VarChar(255)` is currently used in `schema.prisma` and likely sufficient, it's worth keeping in mind that highly descriptive event titles, e.g., "Clinician Unavailability - Dr. Smith - Recurring Q2 2025", could potentially approach this limit. This was considered, and the current length is deemed adequate for now.
4.  **`Appointment.type`:**
    - **Confirmed Values from "Video 2":** 'APPOINTMENT' (for client-facing, billable/clinical services) and 'EVENT' (for internal, non-billable activities like clinician unavailability blocks, meetings, trainings that need to be on the calendar).
5.  **`AppointmentNotes.type`:**
    - **Refined List & Relation to Surveys (with "Video 2" insight on automated assignment):** Types could include: 'PROGRESS_NOTE', 'SOAP_NOTE', 'PRIVATE_CLINICIAN_NOTE', 'CONTACT_LOG' (for phone calls/messages related to the appointment), 'SUPERVISION_NOTE'.
    - If a note is generated from a `SurveyAnswers` (e.g., an intake survey becomes the basis of the first session note), `AppointmentNotes.survey_answer_id` links them. The `AppointmentNotes.type` might be 'INTAKE_REVIEW' or similar, and its content would incorporate or reference the survey data. For new clients, relevant `SurveyTemplate`(s) (e.g., 'INTAKE_QUESTIONNAIRE') can be automatically assigned based on the `PracticeService.id` of their accepted `AppointmentRequest`. The completed `SurveyAnswers` can then be linked to the first `AppointmentNotes`.
6.  **`Availability` Defaults:** Remains an open discussion point (see 5.5).
7.  **`PracticeService.code`:**
    - **Clarification:** These can be a mix. For insurance-billable services, they would be standard CPT codes. For non-billable or cash-based services, they can be internal codes. The system should allow flagging whether a code is a standard (e.g., CPT) or internal one.
8.  **`AppointmentNotes` User Relations:**
    - **Action:** `created_by` should be a non-nullable foreign key to `User.id` (the clinician writing the note). `unlocked_by` should be an optional foreign key to `User.id`. This improves auditability.

### 7.3 Billing & Finance

1.  **Invoice Generation (Video `/2` Context & Video 3 [02:50]):**
    - **Clarification for Null `appointment_id`/`client_group_id`:**
      - `Invoice.appointment_id` would be `null` if the invoice is for:
        - Multiple appointments (if not using `InvoiceItem`s per appointment).
        - Sale of `Product`(s) only.
        - A manual charge not tied to a specific session (e.g., a missed appointment fee if not modeled as an appointment type).
      - `Invoice.client_group_id` might be `null` in very rare B2B scenarios (e.g., invoicing another organization for a bulk service, not typical for this system). Generally, it will be present.
    - **Workflow with `InvoiceItem` (if adopted):**
      1.  `Appointment.appointment_fee`, `Appointment.adjustable_amount`, `Appointment.write_off` determine the net charge for _that specific appointment service_.
      2.  An `InvoiceItem` is created for this net charge, linking to the `Appointment.id` and `PracticeService.id`.
      3.  If `Product`s are sold, additional `InvoiceItem`s are created, linking to `Product.id`.
      4.  The `Invoice.amount` becomes the sum of all its `InvoiceItem.amount_due`.
    - **`Invoice.status = 'CREDIT'` ("Video 3" Insight):** This status is specifically for `Invoice.type = 'CREDIT_MEMO'`. Such invoices represent an amount credited to the client group, either to be applied against other outstanding invoices or to increase `ClientGroup.available_credit` if not directly applied.
    - **New Insight on Credit Adjustments ("Video 2"):** Manual adjustments to `ClientGroup.available_credit` (not from a direct payment or standard credit memo application) should be rare. When necessary, they are processed by creating an `Invoice` of `type = 'ADJUSTMENT_INVOICE'`. This invoice can have a positive or negative amount. A negative amount on an 'ADJUSTMENT_INVOICE' effectively increases `ClientGroup.available_credit`. These adjustments must have detailed notes and are logged in the `Audit` trail.
    - **Invoice Delivery & Export (Video [02:50]):** The video's "Billing Documents" section showing statuses like "Not Sent," "Emailed," and "Exported" clarifies that `Invoice.is_exported` can represent if the invoice was sent to an external accounting system. A separate field like `Invoice.delivery_method` (e.g., 'EMAIL', 'PORTAL', 'PRINTED', 'NOT_SENT') or a more granular `Invoice.delivery_status` (e.g., 'PENDING_DELIVERY', 'EMAILED_TO_CLIENT', 'VIEWED_ON_PORTAL') is beneficial for tracking client-facing delivery. The `Invoice.delivery_method` field added to `schema.prisma` addresses this. (See also Billing Document Delivery Workflow in Section 4.3.B).
    - **Stripe Integration (Video [00:21]):** The mention of Stripe confirms the need to securely handle payment processor tokens (e.g., `CreditCard.token`).
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
8.  **`Payment.response` ("Video 3" Insight):**
    - **Answer/Refinement ("Video 2" & "Video 3"):** The `Payment.response` field is essential. It stores raw data/details from the payment processor. Staff use this during the daily financial reconciliation process to investigate any discrepancies between processor reports and system `Payment` records. `Payment.transaction_id` is the primary key for matching.
    - **Further consideration for `Payment.transaction_id`:** While its comment in `schema.prisma` was updated to reflect its importance, a review point is whether to add an `@unique` constraint. This would enforce data integrity if the ID is always unique from the processor. However, if `transaction_id` can be `null` (e.g., for manual payments not via a processor), a unique constraint on a nullable field needs careful consideration regarding database behavior. The current `String?` type allows for nulls, and the decision was to maintain this flexibility for now, prioritizing the comment update.

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
      - `EmailTemplate.type`: 'APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_CANCELLATION', 'INVOICE_NOTIFICATION', 'STATEMENT_NOTIFICATION', 'SUPERBILL_NOTIFICATION', 'SURVEY_ASSIGNMENT', 'SECURE_MESSAGE_NOTIFICATION', 'ACCOUNT_WELCOME', 'PORTAL_INVITATION'. (Video context on billing document emails [00:21] confirms `INVOICE_NOTIFICATION`, `STATEMENT_NOTIFICATION`).
      - `EmailTemplate.email_type` (Target Audience): 'CLIENT_PRIMARY' (the main client), 'CLIENT_GROUP_MEMBERS' (all relevant members of a group), 'RESPONSIBLE_BILLING_CONTACT', 'EMERGENCY_CONTACT'.
      - `ReminderTextTemplates.type`: 'APPOINTMENT_REMINDER_SMS', 'APPOINTMENT_CONFIRMATION_SMS', 'TELEHEALTH_LINK_SMS', 'PORTAL_ACTIVATION_CODE_SMS'.
3.  **`PracticeSettings` vs. `ClientReminderPreference` & Portal Activation ("Video 3" Insight):**
    - **Interaction Logic (Refined with "Video 2" insights & Video 3 [01:04, 01:59]):**
      1.  A notification type/channel (e.g., Appointment Reminder via SMS) must be globally enabled in `PracticeSettings` (e.g., a key like `notifications.appointmentReminder.sms.enabled = true`).
      2.  **Portal Activation & Contact Verification:** Clients typically set/manage their `ClientReminderPreference`s via the client portal after they have completed an initial staff-initiated portal invitation and account activation process. During activation, clients verify their primary contact methods (e.g., email, SMS-capable phone number) and can set initial communication preferences, including granular SMS opt-ins.
      3.  If globally enabled and client portal is active with verified contacts, the system then checks `ClientReminderPreference` for the specific client and notification type/channel.
      4.  If a `ClientReminderPreference` exists and `is_enabled = true` (and any specific opt-ins like for SMS are met), the notification is sent. If `is_enabled = false` or required opt-ins are missing, it's not sent.
      5.  **SMS Opt-In:** Due to compliance (e.g., TCPA), sending SMS messages for certain `reminder_type`s (especially non-transactional or billing-related) requires an explicit client opt-in. For SMS, explicit opt-in for different categories of messages (e.g., appointment reminders vs. billing alerts) is managed by the client in the portal [01:04]. This could mean multiple `ClientReminderPreference` entries for the SMS channel with different `reminder_type`s, or a more complex preference object.
      6.  If no `ClientReminderPreference` exists for that specific client/type/channel (even with an active portal account), a practice-defined default behavior applies. This default (e.g., "opt-in by default for appointment reminders via email" or "opt-out by default for SMS billing alerts") should itself be a `PracticeSetting`.

### 7.5 Client Portal Lifecycle Management (New Sub-section)

1.  **Invitation**:
    - Portal access is initiated by staff sending an invitation to the client's primary verified email address (`ClientContact.value` where `is_primary=true`).
    - This invitation could contain a unique, time-sensitive link or involve a PIN system for initial access, sent to the client's primary verified email address. The invitation mechanism (e.g., unique link or PIN as per video context from Q14.26) is tracked via the `ClientPortalInvitation` model (see 10.1.8).
2.  **Activation**:
    - Client uses the invitation link to access the portal.
    - They set up their account, which typically involves creating/confirming a password (managed via a `ClientPortalAccount` entity linked one-to-one with `Client`), verify contact methods, and set initial communication/feature preferences, including granular SMS opt-ins (e.g., for online payments [01:04], secure messaging, document access, as per video context).
3.  **Access Granted**:
    - Upon successful activation, a flag like `Client.allow_portal_access` (or equivalent status like `ClientPortalAccount.status = 'ACTIVE'`) is set.
    - `ClientPortalAccount.last_login_at` (on the new `ClientPortalAccount` model) can be updated.
    - Upon successful activation, client portal feature permissions (e.g., allowing online appointment requests, secure messaging, accessing billing documents, paying outstanding balances) are enabled based on practice settings and client-specific configurations.
4.  **Ongoing Access & Preferences**:
    - Clients can manage their `ClientContact` details and `ClientReminderPreference`s through the portal, subject to verification workflows for changes to critical contact info.
5.  **Deactivation/Archival**:
    - If a `Client` becomes inactive (`Client.is_active = false`), their portal access (`ClientPortalAccount.status`) should be automatically suspended or revoked.
    - Re-activation processes for returning clients need to be defined.

### 7.6 Waitlist Management Workflow (New Sub-section)

1.  **Adding to Waitlist**:
    - A `Client` is marked with `Client.is_waitlist = true`.
    - Additional details about their waitlist preferences (e.g., desired clinician(s), service(s), availability, urgency) should be captured. (Consider if this requires new fields on `Client` or a dedicated `WaitlistEntry` model).
2.  **Identifying Open Slots**:
    - When an `Appointment` is cancelled or a clinician adds new `Availability`, this creates potential openings.
3.  **Staff Review & Outreach**:
    - Staff can view a filtered list of clients on the waitlist based on criteria like:
      - Requested `clinician_id`.
      - Requested `service_id`.
      - Client-stated preferred days/times (if captured).
    - The system does _not_ automatically fill slots.
4.  **Scheduling from Waitlist**:
    - Staff contact the client from the waitlist to offer the slot.
    - If accepted, a new `Appointment` is scheduled, and `Client.is_waitlist` may be set to `false` or updated.
5.  **Managing Waitlist Entries**:
    - Regular review of the waitlist to remove clients no longer seeking services or update their preferences.

## 8. Data Type Clarifications & Standards

_(This section is mostly up-to-date from the previous review. Monetary values and Date/Time handling are key.)_

### 8.1 Monetary Values

- Confirmed: All use `Decimal @db.Decimal(10,2)`, storing dollars.

### 8.2 Date/Time Handling

- Confirmed: Timestamps in UTC; Date-only fields use `@db.Date`.

### 8.3 Status Enumerations

- **Action:** Continue to refine this list and strongly consider migrating to Prisma enums for type safety and explicit definitions within the schema itself.
- **`Invoice.status` Refinement:**
  - `'CREDIT'`: Used exclusively for an `Invoice` of `type = 'CREDIT_MEMO'`. Such invoices represent an amount credited to the client group, which can be applied to other invoices or increase `ClientGroup.available_credit`.

## 9. Key Design Decisions

_(This section is mostly up-to-date.)_

### 9.2 UUID Primary Keys

- **Action:** Ensure `@default(dbgenerated("newid()"))` (or DB equivalent) is consistently applied to all UUID PKs.

## 10. Migration & Evolution Considerations

### 10.1 Potential Schema Improvements

_(Adding new items or refining existing ones based on "new context")_

1.  **`InvoiceItem` Model (Reiteration - High Priority):** Essential for flexible billing of multiple services, products, or appointments on a single invoice.
    - `InvoiceItem` fields: `id`, `invoice_id` (FK to `Invoice`), `item_type` ('SERVICE', 'PRODUCT', 'MANUAL_CHARGE'), `practice_service_id` (optional FK), `product_id` (optional FK), `description` (String), `quantity` (Decimal/Int), `unit_price` (Decimal(10,2)), `total_price` (Decimal(10,2)), `appointment_id` (optional FK).
2.  **`ReferralSource` Entity:** As discussed in 7.1.6, create a `ReferralSource` entity to structure referral tracking. Further justified by reporting needs highlighted in "Video 3" and "Video 2". Essential due to confirmed business need (schema_notes.md 7.1.5).
3.  **`ClientPortalAccount` Entity:** If clients authenticate with passwords, a separate entity linked to `Client` might be needed for `hashed_password`, `last_login_portal`, `failed_login_attempts_portal`, `portal_activation_token`, `portal_activation_expires_at`, etc. This supports the invitation-based activation flow (confirmed by video context in 7.5.1 and Q14.1).
4.  **Structured Address Object:** Consider a reusable embedded/JSON type or a separate linked `Address` table for all address fields (`ClientAdress`, `Location`, `BillingAddress`) to ensure consistency and potentially integrate with address validation services.
5.  **Tagging System Expansion**: Evaluate if the current `Tag` model (linked only to `Appointment`) should be polymorphic or if other entities (e.g., `Client`, `Note`) need their own tagging mechanisms/tables.
6.  **Supervision Module**: For practices with supervisees, consider entities like `SupervisionLog`, linking clinician (supervisor), clinician (supervisee), appointment (supervised session), and supervision notes. (This is a larger new feature area).
7.  **`WaitlistEntry` Model (New Consideration):** If detailed preferences for waitlisted clients (specific days/times, urgency, notes) need to be tracked beyond `Client.is_waitlist`, a dedicated `WaitlistEntry` model might be beneficial. It would link to `Client.id`, `Clinician.id` (preferred, optional), `PracticeService.id` (preferred, optional), and store preference details.
8.  **`ClientPortalInvitation` Model (New Consideration):** To manage the client portal invitation lifecycle (token/PIN, sent date, expiry date, status: 'SENT', 'CLICKED', 'ACTIVATED', 'EXPIRED'). Essential for the portal activation flow (confirmed by video context in 7.5.1, 4.5.1, Q14.26).
9.  **`ClientInsurancePolicy` and `InsuranceAuthorization` Models (New Consideration):** Strongly indicated by video context [00:21] regarding tracking insurance details, CMS fields, and authorizations (see Q14.18, Q14.21, Q14.25).
10. **`StripeCustomer` / `PaymentGatewayCustomer` Entity (New Consideration):** To store payment processor specific customer IDs (e.g., `stripe_customer_id`) for managing subscriptions or recurring payments, linked to `Client` or `ClientGroup` (based on Stripe integration mentioned in video [00:21], Q14.20).

## 11. Integration Points

_(This section is mostly up-to-date.)_

## 12. General Documentation & Best Practices to Consider

_(This section is mostly up-to-date.)_

## 13. Glossary

_(New/Refined terms based on "new context" from "Video 3")_

- **Primary Patient (within a ClientGroup)**: The individual client member whose clinical care and documentation are the primary focus for services delivered to that client group.
- **Event (Appointment Type)**: A calendar entry for non-client, non-billable activities such as staff meetings, clinician unavailability, or training.
- **Merge Tag**: A placeholder (e.g., `{{Client.preferred_name}}`) in an `EmailTemplate` or `ReminderTextTemplate` that is dynamically replaced with actual data by the application before sending.
- **Portal Activation (Refined)**: The process by which a client, upon receiving a staff-initiated invitation (video context [01:59]), completes account setup for the client portal, typically involving password creation, verification of primary contact methods, and setting initial communication preferences including SMS opt-ins.
- **Unavailability Block (Refined)**: An `Appointment` of `type = 'EVENT'` created by a clinician, often recurring, to mark periods they are not available for client sessions (video context "Video 3"/"Video 2"). The system scheduling logic must prevent booking client appointments that conflict with these blocks. Conflicts with pre-existing client appointments require manual staff resolution.
- **Financial Reconciliation (Refined)**: A regular (typically daily) operational process where practice staff compare payment records from the payment processor with `Payment` entries in the system, using `Payment.transaction_id` for matching and `Payment.response` for investigating discrepancies, to ensure financial accuracy (video context "Video 2"/"Video 3", schema_notes.md 7.3.8).
- **CMS Fields (from video)**: Specific data fields required for insurance claims processing, potentially related to Centers for Medicare & Medicaid Services (CMS) standards, captured as part of client insurance information (video context Q14.21).
- **Client Default Services (from video)**: Predefined service codes and associated rates that are automatically applied when creating new appointments or billable items for a specific client, potentially overriding other established rates (video context Q14.19).

## 14. Open Questions & Future Considerations

_(Adding new questions based on "new context from Video 3" and refinements)_

1.  **Client Portal Authentication Deep Dive**: Answered in 7.5.1 based on "Video 2" & Video 3 [01:59] - Passwords used (implied by "setup"), via invitation. The need for `ClientPortalAccount` model is high. The follow-up questions about specific security requirements (password complexity, MFA, lockout policies for `ClientPortalAccount`) are excellent and should remain highlighted as key decisions needed.
2.  **Duplicate Client Management Workflow**: Partially answered in 7.1.2 - All new requests are reviewed by staff. The questions 'What specific fields are used for matching, and what is the threshold for flagging a potential duplicate? What are the detailed steps and UI considerations for staff to review and resolve potential duplicate client records?' remain critical and should be emphasized for UI/UX design and further business rule definition.
3.  **Default Behavior for Client Preferences**: Partially answered in 7.4.3 - Defaults apply if no preference set after activation. SMS requires explicit opt-in. The question 'If a `ClientReminderPreference` is not explicitly set for a client/type/channel (after portal activation), what is the practice default (opt-in or opt-out) for _each_ notification type/channel combination? How is this granular default configured in `PracticeSettings`?' is key and should drive configuration options.
4.  **Immutable Signed Documents**: How is the immutability of signed documents (notes, surveys) technologically enforced? Versioning? Or simply locked fields with strict permission controls for unlocking?
5.  **Referral Source Linking**: Answered in 7.1.6 - Practice wants `ReferralSource` entity. If a `ReferralSource` entity is added, how will existing `Client.referred_by` free-text data be migrated or handled?
6.  **`Availability` Overlap/Conflict Resolution**: How should the system handle clinician attempts to create overlapping `Availability` blocks? Should it prevent, warn, or allow?
7.  **`InvoiceItem` and Tax/Discount Logic**: If `InvoiceItem` is added, how will taxes (if applicable) or invoice-level discounts (as opposed to item-level) be modeled and applied?
8.  **Telehealth Platform Integration Details**: Answered in 7.3.8. Used for daily reconciliation. (This seems to be a statement, not a question based on the source. Original Q: "Telehealth Platform Integration Details")
9.  **Data Retention and Archival Policies**: What are the business and legal requirements for data retention, especially for inactive clients, financial records, and audit logs? How will archival be handled technically and procedurally?
10. **Complex Recurring Appointment Edits**: What is the desired behavior for complex edits to recurring appointment series (e.g., changing only selected future instances, exceptions to the rule, handling past instances that were modified)?
11. **Waitlist Preference Granularity (Partially answered in 7.1.8 - basic notes for now):** If `Client.is_waitlist = true`, what specific criteria beyond clinician/service are stored regarding their preferences for being contacted (e.g., preferred days/times, urgency level, maximum wait time before being removed)? Does this necessitate a `WaitlistEntry` model instead of just flags/fields on `Client`?
12. **Client Portal Invitation Management (Answered in 7.5.1 & Video [01:59] - staff initiated, email link-based, supports `ClientPortalInvitation` model):** How are portal invitations tracked (e.g., unique token, sent date, expiry date, status like 'SENT', 'CLICKED', 'ACTIVATED', 'EXPIRED')? Is a new model such as `ClientPortalInvitation` required? (Yes, highly likely).
13. **Complex Recurring Event Attendees (Answered - not formally tracked for now):** For internal `Appointment.type = 'EVENT'` like recurring trainings, if tracking specific `User` attendance is needed beyond just the hosting `clinician_id`, what is the preferred method? A simple text field for participant names, or a more structured many-to-many link to `User`?
14. **Auditing Manual Credit Adjustments (Answered in 7.3.1 - via 'ADJUSTMENT_INVOICE', audited):** What is the formal process and audit trail for manual adjustments to `ClientGroup.available_credit` that do not originate from a payment or a credit memo application? Does an `Invoice` of `type = 'ADJUSTMENT'` suffice, or is a more specific `CreditLog` entry needed?
15. **SMS Opt-In Granularity (Answered in 7.4.3 - granular, client-managed in portal):** If explicit SMS opt-in is required for compliance, is this a single global opt-in per client for all SMS, or should it be granular per `reminder_type` (e.g., opt-in for appointment SMS, separate opt-in for billing SMS)? How is this managed in the UI and data model (as seen in video [01:04])?
16. **Impact of Clinician Unavailability on Existing Client Appointments (Answered in 7.2.2 - flagged for manual staff resolution):** If a clinician adds a new recurring 'UNAVAILABILITY*BLOCK' (video context "Video 3"/"Video 2") that conflicts with previously scheduled \_client* `Appointment`(s), what is the precise system-driven or staff-driven workflow? Are clients automatically notified? Does the system flag these conflicts for staff to manually reschedule?
17. **Automated Survey Assignment Logic Details (Answered in 7.2.5 - based on `PracticeService.id` of the request, "Video 3" insight):** For automated assignment of intake `SurveyTemplate`(s), what are the specific rules? Is it based purely on `AppointmentRequest.service_id`, client age derived from `RequestContactItems.date_of_birth`, client-stated issues, or a more complex, configurable rules engine in `PracticeSettings`?
18. **Insurance Authorization Details (Video [00:21]):** The video confirms 'tracking authorization' is a feature. Based on the confirmation from video, expand on the potential fields for `InsuranceAuthorization` in section 10.1 (Potential Schema Improvements) or the new proposed 'Insurance Management Workflow' section. Your list 'auth number, service codes covered, date ranges, number of sessions approved/used, status, link to specific `ClientInsurancePolicy`' is a great start. Add 'How are statuses like 'Pending', 'Approved', 'Denied', 'Expired', 'Exhausted' managed?'
19. **Client-Specific Default Services/Rates (Video [00:42]):** The video explicitly shows functionality to 'set default service codes and rates for a client'. This confirms the business need. This is a significant point from video. In section 7.1.8, where this is first noted, and section 10.1 where `ClientServicePreference` is considered, emphasize the need to define the hierarchy: e.g., does `ClientServicePreference` override `ClientGroupServices`, which overrides `ClinicianServices`, which overrides `PracticeService.rate`? This interaction logic needs to be fully specified.
20. **Stripe Payment Setup Details (Video [00:21]):** The video shows the capability to 'add credit/debit card information', which is a prerequisite for payment processing (e.g., via Stripe). This reinforces the need for the `CreditCard` model to store tokenized information. For a full integration with Stripe (confirmed by video), consider if a `StripeCustomer` (or generic `PaymentGatewayCustomer`) entity linked to `Client` or `ClientGroup` is needed to store `stripe_customer_id`, etc., for managing subscriptions or recurring payments, beyond just `CreditCard.token`. Add this to Section 10.1.
21. **CMS Fields for Claims (Video [00:21]):** The video confirms that adding 'insurance claim/CMS fields' is part of managing client insurance information. Emphasize this as an action item. A new sub-section under 'Insurance Management' could list common CMS-1500 form fields if they are generally applicable, or note that this requires consultation with billing experts. Examples: Place of Service, Diagnosis Pointers, etc.
22. **Tracking "Exported" vs. "Sent to Client" for Billing Docs (Video [02:50]):** The video demonstrates actions like 'export billing documents as PDFs' (supporting `Invoice.is_exported`) and mentions 'email billing notifications' (supporting `Invoice.delivery_method` or client-facing statuses like 'Emailed'). The schema should formally differentiate these. `is_exported` can refer to system-level exports (e.g., to accounting software), while `delivery_method` (or a more granular `delivery_status`) tracks the client-facing provision of the document (e.g., 'NOT_SENT', 'EMAILED_TO_CLIENT', 'VIEWED_ON_PORTAL'). The video's UI showing 'Not Sent' or 'Emailed' for billing documents supports this distinction.
23. **"Primary client details" for billing (Video context [00:21]):** The video mentions 'primary client details' in the context of billing. It's likely that the `ClientGroupMembership.is_responsible_for_billing = true` flag on a specific `Client` record (who is a member of the group) identifies this "primary client for billing." The UI would then pull details from that `Client` record. Clarify this relationship in section 4.1 (Billing Responsibility) and 6.2 (`ClientGroup` Aggregate Invariants).
24. **"CMS fields" (Video context [00:21]):** For 'CMS fields', are these standardized fields, and if so, where can a definitive list be found? How do these map to specific requirements for different insurance payers?
25. **"Tracking authorization" (Video context [00:21]):** What are the common statuses for an insurance authorization (e.g., 'Pending', 'Approved', 'Denied', 'Expired', 'Exhausted')? What information needs to be captured for each authorization (e.g., auth number, approved services/CPT codes, number of sessions, start/end dates, units used)?
26. **Client portal access - PIN generation (Video context [01:59]):** The client portal allows 'email and generating a PIN'. Reconcile this with the 'PIN' mention. If PINs are an alternative or supplementary method to the unique link for activation (video), the workflow needs to be detailed. Is it a one-time activation PIN? How is it securely delivered? Your `ClientPortalInvitation` model (10.1.8) should accommodate tracking either token or PIN.
27. **Client portal permissions customization:** The client portal allows customizing various permissions. Are these permissions globally set by the practice, or can they be customized per client by staff after the initial setup?
28. **Referring Professional Interaction with `ReferralSource`**: If a `ClientGroupMembership.role` is 'Referring Professional' or similar, or if `Client.referred_by_client_id` (if such a field is added to `Client` to link to another client) links to another client who is a professional, how does this interact with the proposed `ReferralSource` entity? Should there be a specific type in `ReferralSource` for 'Existing Client (Professional)' vs 'Existing Client (Non-Professional)' (related to video context on referral tracking from "Video 2")?

## 15. Next Steps

_(Standard next steps remain relevant)_

1.  **Team Review:** Discuss this updated `SCHEMA_NOTES.md`.
2.  **Answer Clarifying Questions:** Focus on remaining questions in Section 7 and new/clarified ones in Section 14.
3.  **Make Design Decisions:** Prioritize decisions on `InvoiceItem`, `ReferralSource`, Client Portal Auth strategy (including `ClientPortalAccount` and `ClientPortalInvitation` models), `WaitlistEntry` model, and Enum strategy.
4.  **Update `schema.prisma`:** Reflect decisions.
5.  **Evolve This Document:** Continue iterative updates.

---

**Potential New Sub-Section Consideration for "4. Key Business Rules & Workflows":**

- **Client Portal Access & Communication Preferences Management**: To centralize the refined invitation, activation, and preference setting (especially SMS opt-in) workflows.
- **4.X Insurance Management Workflow**:
  - "Practices must be able to define a client's billing type as 'self-pay' or 'insurance'."
  - "The system must allow input and storage of detailed client insurance information, including potentially carrier details, member IDs, group numbers, and specific CMS fields relevant for claims."
  - "A mechanism for tracking insurance authorizations, including details like number of approved sessions or date ranges, is required."

---

**Note**: This document should be reviewed and updated whenever significant schema changes are made or new business requirements are identified.
