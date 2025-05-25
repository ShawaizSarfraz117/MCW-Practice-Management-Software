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

- **Monetary Values Note:** The standard for all monetary values is `Decimal @db.Decimal(10,2)` storing dollars, not cents. This is documented in section 8.1.

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
      e. **Automated Intake Assignment:** Based on practice configuration (e.g., linked to the `PracticeService.id` of the requested service or client type), relevant 'INTAKE_QUESTIONNAIRE' `SurveyTemplate`(s) are automatically assigned to the new `Client`. This may involve creating a `ClientGroupFile` representing the "Intake Packet" and a `ClientFiles` record for the `Client` with `status = 'ACTION_PENDING'`, linking to the `SurveyAnswers` to be completed.
      f. **Portal Invitation:** Staff should then initiate a client portal invitation, typically via the client's primary email address. (See Section 4.5 Client Portal Lifecycle Management).
  5.  If the request is for an existing client, it's linked to their `Client.id` and primary `ClientGroup.id`.
  6.  Client activates portal, verifies contact methods, and completes assigned intake surveys.
  7.  Staff reviews completed intake forms (`SurveyAnswers` via `ClientFiles`) before the first `Appointment`.
  8.  The request status moves: 'PENDING_REVIEW' → ('DUPLICATE_NEEDS_REVIEW') → 'ACCEPTED'/'DECLINED' → 'CONVERTED_TO_APPOINTMENT'.
- **Client Roles**: Within a group, common roles are 'Primary Patient', 'Spouse/Partner', 'Child', 'Guardian', 'Emergency Contact'. The 'Primary Patient' is the main subject of care within that group context for clinical documentation.
- **Contact-Only Members**: These members (e.g., a non-attending parent who needs billing access for a minor, or an emergency contact) have specific, limited portal access if any, and primarily receive communications relevant to their role (e.g., billing, emergency). They do not have their own clinical record within that group's context.
- **Billing Responsibility**: One `ClientGroupMembership` record within a `ClientGroup` can be flagged as `is_responsible_for_billing`. Application logic must enforce that only one member can have this flag set to true at any given time within the same group.

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

- **Internal Events**: `Appointment.type = 'EVENT'` is used for internal activities like staff meetings, training, or clinician unavailability. These also utilize `Appointment.recurring_rule` for series.
- **Unavailability Blocks**:
  - A specific type of recurring 'EVENT' (e.g., `Appointment.title = 'Clinician Unavailability'`) used by clinicians to block out time.
  - The system must prevent scheduling of client `Appointment`s that conflict with these blocks.
  - Modifications to a clinician's recurring unavailability event (e.g., changing time, cancelling an instance) must trigger checks against existing scheduled client appointments to flag and manage potential conflicts, possibly requiring staff intervention.
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

- **Daily/Periodic Reconciliation**: A regular process (manual or semi-automated) where staff review payments recorded in the system (`Payment` model) against reports from the payment processor.
- **Matching**: `Payment.transaction_id` is the primary key for matching system records with processor statements.
- **Investigation**: `Payment.response` (raw data from processor) is crucial for investigating discrepancies or failed transactions.
- **Status Updates**: Verified payments confirm updates to `Invoice.status` (e.g., to 'PAID' or 'PARTIAL').
- **Auditing**: This process also ensures that changes to `ClientGroup.available_credit` (both debits from payments and credits from refunds/credit memos) are correctly reflected and audited. Manual adjustments to `available_credit` outside of these flows must also be strictly audited (consider a dedicated `CreditLog` or using 'ADJUSTMENT' type invoices).

### 4.4 Notification System

- **Merge Tag Resolution**: A dedicated service/module will be responsible for resolving merge tags (e.g., `{{client_full_name}}`, `{{appointment_date_time_local}}`) using data from relevant entities (`Client`, `Appointment`, `Invoice`, etc.) before sending notifications. A standard list of available tags per template `type` will be maintained for developers.
- **Preference Hierarchy & Activation:**
  1.  Global `PracticeSettings` (e.g., `reminders.appointment.sms.enabled:false`) can disable a channel practice-wide.
  2.  If globally enabled, `ClientReminderPreference.is_enabled` (for a client who has completed portal activation and verified contact methods) determines if they receive that type/channel of notification.
  3.  **Portal Activation Prerequisite:** `ClientReminderPreference` settings for a client generally only take effect _after_ the client has successfully completed a portal activation/invitation process and verified their contact methods.
  4.  **SMS Opt-In:** For certain notification channels like SMS, an explicit opt-in within `ClientReminderPreference` (or during portal setup) is required for specific `reminder_type`s (e.g., billing notifications, non-urgent updates) due to compliance. This opt-in should be granular (e.g., a specific flag like `sms_opt_in_billing_alerts` on `ClientReminderPreference`). Essential transactional notifications directly requested or confirmed by the client (e.g., appointment confirmations) may follow different rules.
  5.  **Default Behavior:** If no `ClientReminderPreference` exists for a client _who has activated their portal access_, the default should generally be "opt-out" for non-essential communications. Practice-defined defaults for essential communications (e.g., appointment reminders for scheduled appointments if `ClientReminderPreference` is not set) should be configurable in `PracticeSettings` (e.g., `notifications.defaultBehavior.appointmentReminder.sms = 'opt_in_if_primary_verified_and_portal_active'`). This logic needs to be fully specified.

### 4.5 Client Portal Lifecycle Management (New Sub-section)

1.  **Invitation**:
    - Portal access is typically initiated by staff sending an invitation to the client's primary email address (`ClientContact.value` where `is_primary=true`).
    - This invitation could contain a unique, time-sensitive link.
    - (Consider `ClientPortalInvitation` model to track invitation status, sent date, expiry).
2.  **Activation**:
    - Client uses the invitation link to access the portal.
    - They set up their account (e.g., create/confirm password if using `ClientPortalAccount` entity, or complete a passwordless setup step).
    - During activation, they may be required to verify primary contact methods (email, phone for SMS) and set initial `ClientReminderPreference`s, including explicit opt-ins for channels like SMS.
3.  **Access Granted**:
    - Upon successful activation, a flag like `Client.allow_portal_access` (consider adding this field) is set to `true`.
    - `Client.last_login_portal` (on `ClientPortalAccount` or `Client`) can be updated.
4.  **Ongoing Access & Preferences**:
    - Clients can manage their `ClientContact` details and `ClientReminderPreference`s through the portal, subject to verification workflows for changes to critical contact info.
5.  **Deactivation/Archival**:
    - If a `Client` becomes inactive (`Client.is_active = false`), their portal access should be automatically suspended or revoked.
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
- **Entities**: `ClientProfile`, `ClientAdress` (one-to-many), `ClientContact` (one-to-many), `ClientReminderPreference` (one-to-many). (Potentially `ClientPortalAccount` if added).
- **Value Objects**: Potentially an `Address` value object could be used within `ClientAdress` if addresses are treated as immutable snapshots.
- **Invariants**:
  - A `Client` must have at least one `ClientContact` marked as `is_primary` for essential communication, and this contact must be verified if used for portal activation/reminders.
  - `Client.date_of_birth` if present, must be a valid date in the past.
  - `ClientReminderPreference` settings are only effective if the associated `ClientContact` is verified and (for some channels/types) explicit opt-in is recorded, especially after portal activation.
- **Domain Events**: `ClientCreated`, `ClientProfileUpdated`, `ClientContactAdded`, `ClientArchived` (`is_active` set to false), `ClientPortalInvitationSent`, `ClientPortalAccountActivated`, `ClientReminderPreferenceUpdated`.

### 6.2 ClientGroup Aggregate

- **Root**: `ClientGroup`
- **Entities**: `ClientGroupMembership` (one-to-many, part of the aggregate's consistency boundary), `ClientBillingPreferences` (one-to-one).
- **Associated Roots (Strongly Consistent Dependencies but Separate Aggregates)**: `Invoice`, `Statement`, `Superbill` are typically associated with a `ClientGroup` but are often Aggregates themselves due to their own complex lifecycle and rules. The `ClientGroup` would hold references (IDs) to these.
- **Value Objects**: `ClientGroupFile` could be considered as managed by `ClientGroup`, though its `ClientFiles` junction introduces per-client state.
- **Invariants**:
  - `available_credit` cannot be negative. Manual adjustments to `available_credit` must be audited.
  - Only one `ClientGroupMembership` can have `is_responsible_for_billing = true`.
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
- **Domain Events**: `ClinicianRegistered`, `ClinicianLicenseAdded`, `ClinicianAvailabilityUpdated`, `ClinicianUnavailabilityBlockSet`.

## 7. Model-Specific Explanations & Clarifying Questions (Domain Deep Dive)

### 7.1 Client Management & Groupings

1.  **Client vs. ClientGroup for Appointments:**
    - **Answer:** Confirmed. All `Appointment`s are linked to a `ClientGroup.id`. For individual clients, a system-managed single-member `ClientGroup` of `type: 'individual'` is used. This `ClientGroup` can be created automatically during the conversion of an `AppointmentRequest` from a new individual client or when a new individual client is created directly.
2.  **New Client Onboarding (Video `/0` Context & "Video 3" Insights):**
    - **Answer/Refinement:** The workflow is detailed in Section 4.1.
    - **Remaining Question / UI/UX for duplicates (Refined):** While resolution options (Merge, Link, Create New with Override) are clearer, the specific UI design and the information presented to staff to make these decisions effectively needs careful consideration. What level of detail from potentially matching `Client` records is shown? How are merge conflicts handled at a granular field level?
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
    - **Decision Point & Further Justification:** The "new context" (e.g., video showing referral tracking importance and potential for reporting on referral source effectiveness) strongly reinforces the need for more structured referral tracking.
    - **Proposed Action:** Change `referred_by` to `referral_source_id: String?` linking to a new `ReferralSource` entity (e.g., `ReferralSource { id, name, type ('Clinician', 'Practice', 'Website', 'Existing Client'), contact_details }`). This allows for reporting on referral channels. If an existing client referred them, this could link to another `Client.id` or `ClientGroup.id` via a separate optional field like `referred_by_client_id`.
7.  **Aggregate Boundaries:**
    - **Clarification:** `ClientGroup` is the AR for `ClientGroupMembership` and `ClientBillingPreferences`. `Invoice`, `Statement`, `Superbill` are separate ARs but are strongly associated with a `ClientGroup` (often holding `client_group_id`). This allows them to have independent lifecycles and complexities while maintaining a clear link. For example, an `Invoice` can be voided independently of the `ClientGroup` status.
8.  **`Client.is_waitlist` and Waitlist Functionality:**
    - **Clarification from "Video 3":** The `Client.is_waitlist` flag indicates the client is open to being contacted for earlier appointments if slots become available. Staff use a dedicated interface to view waitlisted clients, filterable by criteria like clinician or service preference. When a slot opens (e.g., due to cancellation within a clinician's `Availability`), staff manually review the waitlist and initiate contact. It is not an automated slot-filling mechanism. (Further questions on capturing detailed waitlist preferences are in Section 14).

### 7.2 Appointments & Scheduling

1.  **Appointment Lifecycle (Video `/0` Context for Requests):**
    - **Refinement:** When an `AppointmentRequest` status becomes 'ACCEPTED', the system (or staff action via UI) triggers the creation of an `Appointment` record.
      - Key data like `clinician_id`, `service_id`, proposed `start_date`/`end_date` (which might be adjusted based on actual availability), and `client_group_id` (derived from `AppointmentRequest.client_id`) are used to populate the new `Appointment`.
      - The `AppointmentRequest` status is then updated to 'CONVERTED_TO_APPOINTMENT', and it might be linked to the `Appointment.id` for history (e.g., `Appointment.source_request_id`).
2.  **`Appointment.recurring_rule`:**
    - **Clarification & "Video 3" Insights:** The iCalendar RRULE is stored. Application logic parses this rule to:
      - Generate and display future projected instances on the calendar.
      - Create actual `Appointment` records for upcoming instances (e.g., for the next X weeks/months, or just before they occur). This avoids creating infinite records.
      - When editing a recurring series (e.g., changing time or rule), the application must handle updates to existing uncompleted child instances and regeneration of future ones. `cancel_appointments` flag on parent `Appointment` during update indicates if existing child instances should be cancelled or rescheduled.
      - **For Client Appointments:** Modification of a recurring series should trigger a re-evaluation of `AppointmentLimit` for the clinician on affected future dates.
      - **For `Appointment.type = 'EVENT'` (e.g., staff meetings, unavailability):** These also use `recurring_rule`. Recurring unavailability blocks for a clinician automatically prevent conflicting client appointment scheduling.
3.  **`Appointment.title`:**
    - **Use Case:** This is used for `Appointment.type = 'EVENT'` (e.g., "Staff Weekly Sync", "Team Training on HIPAA", "Clinician Unavailability") or for client appointments where the `PracticeService.name` is too generic and a more specific, user-facing title is needed for that single occurrence (e.g., service is "Family Therapy" but title is "Smith Family - Special Review Session").
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
      1.  `Appointment.appointment_fee`, `Appointment.adjustable_amount`, `Appointment.write_off` determine the net charge for _that specific appointment service_.
      2.  An `InvoiceItem` is created for this net charge, linking to the `Appointment.id` and `PracticeService.id`.
      3.  If `Product`s are sold, additional `InvoiceItem`s are created, linking to `Product.id`.
      4.  The `Invoice.amount` becomes the sum of all its `InvoiceItem.amount_due`.
    - **`Invoice.status = 'CREDIT'` ("Video 3" Insight):** This status is specifically for `Invoice.type = 'CREDIT_MEMO'`. Such invoices represent an amount credited to the client group, either to be applied against other outstanding invoices or to increase `ClientGroup.available_credit`.
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
8.  **`Payment.response` ("Video 3" Insight):** This field is crucial for the daily financial reconciliation process, allowing staff to match system payments with payment processor reports and investigate discrepancies.

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
      - `EmailTemplate.type`: 'APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_CANCELLATION', 'INVOICE_NOTIFICATION', 'STATEMENT_NOTIFICATION', 'SUPERBILL_NOTIFICATION', 'SURVEY_ASSIGNMENT', 'SECURE_MESSAGE_NOTIFICATION', 'ACCOUNT_WELCOME', 'PORTAL_INVITATION'.
      - `EmailTemplate.email_type` (Target Audience): 'CLIENT_PRIMARY' (the main client), 'CLIENT_GROUP_MEMBERS' (all relevant members of a group), 'RESPONSIBLE_BILLING_CONTACT', 'EMERGENCY_CONTACT'.
      - `ReminderTextTemplates.type`: 'APPOINTMENT_REMINDER_SMS', 'APPOINTMENT_CONFIRMATION_SMS', 'TELEHEALTH_LINK_SMS', 'PORTAL_ACTIVATION_CODE_SMS'.
3.  **`PracticeSettings` vs. `ClientReminderPreference` & Portal Activation ("Video 3" Insight):**
    - **Interaction Logic (Refined):**
      1.  A notification type/channel (e.g., Appointment Reminder via SMS) must be globally enabled in `PracticeSettings` (e.g., a key like `notifications.appointmentReminder.sms.enabled = true`).
      2.  **Portal Activation & Contact Verification:** `ClientReminderPreference` settings are generally only honored after a client has activated their portal account (see Section 4.5) and verified the specific contact methods (`ClientContact` records) to be used for reminders.
      3.  If globally enabled and client portal is active with verified contacts, the system then checks `ClientReminderPreference` for the specific client and notification type/channel.
      4.  If a `ClientReminderPreference` exists and `is_enabled = true` (and any specific opt-ins like for SMS are met), the notification is sent. If `is_enabled = false` or required opt-ins are missing, it's not sent.
      5.  **SMS Opt-In:** Due to compliance (e.g., TCPA), sending SMS messages for certain `reminder_type`s (especially non-transactional or billing-related) requires an explicit client opt-in. This should be captured, potentially in `ClientReminderPreference` or linked to the verified `ClientContact` used for SMS.
      6.  If no `ClientReminderPreference` exists for that specific client/type/channel (even with an active portal account), a practice-defined default behavior applies. This default (e.g., "opt-in by default for appointment reminders via email" or "opt-out by default for SMS billing alerts") should itself be a `PracticeSetting`.

### 7.5 User Management & Permissions

1.  **Client Portal Authentication (Refined by "Video 3" Insight):**
    - **Decision & Workflow:** Clients are **not** standard `User` records. Client portal access is granted via an invitation-driven process and flags/linked entities associated with `Client`.
      1.  **Invitation:** Staff initiate a portal invitation (e.g., via email to `ClientContact.value`). This could generate a unique, time-sensitive token/link.
      2.  **Activation:** Client uses the link to set up their portal account. This might involve setting a password (if a `ClientPortalAccount` entity is used to store hashed passwords, last login, etc., linked one-to-one with `Client`) or confirming access through a passwordless method. During this process, they should verify contact methods and set initial `ClientReminderPreference`s, including any necessary opt-ins (e.g., for SMS).
      3.  **Access Flag:** Upon successful activation, a flag like `Client.allow_portal_access` (consider adding) is set to `true`.
    - This refined flow supports the need for `ClientPortalAccount` (see 10.1.3) and potentially a `ClientPortalInvitation` model.
2.  **`ClinicalInfo` Purpose (Reiteration):** Marked for deprecation. All relevant fields (`speciality`, `NPI_number`, `taxonomy_code`) are preferred on the `Clinician` model.
3.  **Default Roles & Permissions:**
    - **Core Roles:** 'SystemAdmin', 'PracticeManager', 'Clinician', 'BillingStaff', 'FrontDeskStaff'.
    - **Core Permissions (Slugs - examples):**
      - `clients.view`, `clients.create`, `clients.edit`, `clients.delete.soft`, `clients.access.phi`, `clients.send.portal_invite`
      - `appointments.view.own`, `appointments.view.all`, `appointments.schedule`, `appointments.edit`, `appointments.cancel`
      - `billing.view.all`, `billing.generate.invoice`, `billing.record.payment`, `billing.manage.settings`, `billing.reconcile.payments`
      - `users.manage`, `roles.manage`, `practice.settings.edit`
      - `reports.view.financial`, `reports.view.clinical`, `reports.view.referral_sources`
      - `clinicalnotes.view.own`, `clinicalnotes.edit.own`, `clinicalnotes.sign.own`, `clinicalnotes.view.all` (for supervisors/auditors)
      - `waitlist.view`, `waitlist.manage`

### 7.6 Documents, Surveys & Files

1.  **Workflow for `ClientGroupFile` -> `ClientFiles`:**
    - **Use Case Confirmed & Refined by "Video 3" Intake Workflow:** This structure is for tracking individual client interactions (view, completion, signature) with a document shared at the group level.
    - **Intake Example:**
      1.  For a new client, after `AppointmentRequest` acceptance, the system might auto-assign an 'INTAKE_QUESTIONNAIRE' `SurveyTemplate`.
      2.  A `ClientGroupFile` could represent this "Intake Packet Template."
      3.  A `ClientFiles` record links the specific `Client` to this `ClientGroupFile`, initially with `status = 'ACTION_PENDING'`.
      4.  When the client completes the survey, their `SurveyAnswers` record is created and `ClientFiles.survey_answers_id` is populated. The `ClientFiles.status` changes to 'COMPLETED' or 'PENDING_REVIEW_STAFF'.
          This `ClientFiles` record then acts as evidence of the "completed intake packet" for that client.
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
- **`Invoice.status` Refinement:**
  - `'CREDIT'`: Used exclusively for an `Invoice` of `type = 'CREDIT_MEMO'`, representing an amount credited back to the client group, which can be applied to other invoices or increase `ClientGroup.available_credit`.

## 9. Key Design Decisions

_(This section is mostly up-to-date.)_

### 9.2 UUID Primary Keys

- **Action:** Ensure `@default(dbgenerated("newid()"))` (or DB equivalent) is consistently applied to all UUID PKs.

## 10. Migration & Evolution Considerations

### 10.1 Potential Schema Improvements

_(Adding new items or refining existing ones based on "new context")_

1.  **`InvoiceItem` Model (Reiteration - High Priority):** Essential for flexible billing of multiple services, products, or appointments on a single invoice.
    - `InvoiceItem` fields: `id`, `invoice_id` (FK to `Invoice`), `item_type` ('SERVICE', 'PRODUCT', 'MANUAL_CHARGE'), `practice_service_id` (optional FK), `product_id` (optional FK), `description` (String), `quantity` (Decimal/Int), `unit_price` (Decimal(10,2)), `total_price` (Decimal(10,2)), `appointment_id` (optional FK).
2.  **`ReferralSource` Entity:** As discussed in 7.1.6, create a `ReferralSource` entity to structure referral tracking. Further justified by reporting needs highlighted in "Video 3".
3.  **`ClientPortalAccount` Entity:** If clients authenticate with passwords, a separate entity linked to `Client` might be needed for `hashed_password`, `last_login_portal`, `failed_login_attempts_portal`, `portal_activation_token`, `portal_activation_expires_at`, etc. This supports the invitation-based activation flow.
4.  **Structured Address Object:** Consider a reusable embedded/JSON type or a separate linked `Address` table for all address fields (`ClientAdress`, `Location`, `BillingAddress`) to ensure consistency and potentially integrate with address validation services.
5.  **Tagging System Expansion**: Evaluate if the current `Tag` model (linked only to `Appointment`) should be polymorphic or if other entities (e.g., `Client`, `Note`) need their own tagging mechanisms/tables.
6.  **Supervision Module**: For practices with supervisees, consider entities like `SupervisionLog`, linking clinician (supervisor), clinician (supervisee), appointment (supervised session), and supervision notes. (This is a larger new feature area).
7.  **`WaitlistEntry` Model (New Consideration):** If detailed preferences for waitlisted clients (specific days/times, urgency, notes) need to be tracked beyond `Client.is_waitlist`, a dedicated `WaitlistEntry` model might be beneficial. It would link to `Client.id`, `Clinician.id` (preferred, optional), `PracticeService.id` (preferred, optional), and store preference details.
8.  **`ClientPortalInvitation` Model (New Consideration):** To manage the client portal invitation lifecycle (token, sent date, expiry date, status: 'SENT', 'ACTIVATED', 'EXPIRED').

## 11. Integration Points

_(This section is mostly up-to-date.)_

## 12. General Documentation & Best Practices to Consider

_(This section is mostly up-to-date.)_

## 13. Glossary

_(New/Refined terms based on "new context" from "Video 3")_

- **Primary Patient (within a ClientGroup)**: The individual client member whose clinical care and documentation are the primary focus for services delivered to that client group.
- **Event (Appointment Type)**: A calendar entry for non-client, non-billable activities such as staff meetings, clinician unavailability, or training.
- **Merge Tag**: A placeholder (e.g., `{{Client.preferred_name}}`) in an `EmailTemplate` or `ReminderTextTemplate` that is dynamically replaced with actual data by the application before sending.
- **Portal Activation**: The process by which a client, upon receiving an invitation, sets up their access to the client portal, typically involving password creation/confirmation and verification of primary contact methods.
- **Unavailability Block**: An `Appointment` of `type = 'EVENT'` created by a clinician to mark periods they are not available for client sessions. These blocks can be recurring and are respected by the scheduling system to prevent conflicts.
- **Financial Reconciliation**: The process of matching and verifying financial transactions recorded in the system (e.g., `Payment`s) against external reports (e.g., from a payment processor) to ensure accuracy and resolve discrepancies.

## 14. Open Questions & Future Considerations

_(Adding new questions based on "new context from Video 3" and refinements)_

1.  **Client Portal Authentication Deep Dive**: What specific authentication methods will be supported for clients (password, magic link, SSO)? What are the security requirements (password complexity, MFA)? (Related to 7.5.1 and 10.1.3)
2.  **Duplicate Client Management Workflow**: What are the detailed steps and UI considerations for staff to review and resolve potential duplicate client records flagged by the system during intake? What specific fields are used for matching, and what is the threshold for flagging a potential duplicate?
3.  **Default Behavior for Client Preferences**: If a `ClientReminderPreference` is not explicitly set for a client/type/channel (after portal activation), what is the practice default (opt-in or opt-out) for _each_ notification type/channel combination? How is this granular default configured in `PracticeSettings`?
4.  **Immutable Signed Documents**: How is the immutability of signed documents (notes, surveys) technologically enforced? Versioning? Or simply locked fields with strict permission controls for unlocking?
5.  **Referral Source Linking**: If a `ReferralSource` entity is added, how will existing `Client.referred_by` free-text data be migrated or handled?
6.  **`Availability` Overlap/Conflict Resolution**: How should the system handle clinician attempts to create overlapping `Availability` blocks? Should it prevent, warn, or allow?
7.  **`InvoiceItem` and Tax/Discount Logic**: If `InvoiceItem` is added, how will taxes (if applicable) or invoice-level discounts (as opposed to item-level) be modeled and applied?
8.  **Telehealth Platform Integration Details**: Beyond generic flags, what specific fields or entities are needed to integrate with a chosen telehealth platform (e.g., storing meeting URLs, session passcodes, integration tokens)?
9.  **Data Retention and Archival Policies**: What are the business and legal requirements for data retention, especially for inactive clients, financial records, and audit logs? How will archival be handled technically and procedurally?
10. **Complex Recurring Appointment Edits**: What is the desired behavior for complex edits to recurring appointment series (e.g., changing only selected future instances, exceptions to the rule, handling past instances that were modified)?
11. **Waitlist Preference Granularity (New from "Video 3" context):** If `Client.is_waitlist = true`, what specific criteria beyond clinician/service are stored regarding their preferences for being contacted (e.g., preferred days/times, urgency level, maximum wait time before being removed)? Does this necessitate a `WaitlistEntry` model instead of just flags/fields on `Client`?
12. **Client Portal Invitation Management (New from "Video 3" context):** How are portal invitations tracked (e.g., unique token, sent date, expiry date, status like 'SENT', 'CLICKED', 'ACTIVATED', 'EXPIRED')? Is a new model such as `ClientPortalInvitation` required?
13. **Complex Recurring Event Attendees (New from "Video 3" context):** For internal `Appointment.type = 'EVENT'` like recurring trainings, if tracking specific `User` attendance is needed beyond just the hosting `clinician_id`, what is the preferred method? A simple text field for participant names, or a more structured many-to-many link to `User`?
14. **Auditing Manual Credit Adjustments (New from "Video 3" context):** What is the formal process and audit trail for manual adjustments to `ClientGroup.available_credit` that do not originate from a payment or a credit memo application? Does an `Invoice` of `type = 'ADJUSTMENT'` suffice, or is a more specific `CreditLog` entry needed?
15. **SMS Opt-In Granularity (New from "Video 3" context):** If explicit SMS opt-in is required for compliance, is this a single global opt-in per client for all SMS, or should it be granular per `reminder_type` (e.g., opt-in for appointment SMS, separate opt-in for billing SMS)? How is this managed in the UI and data model?
16. **Impact of Clinician Unavailability on Existing Client Appointments (New from "Video 3" context):** If a clinician adds a new recurring 'UNAVAILABILITY_BLOCK' that conflicts with previously scheduled _client_ `Appointment`(s), what is the precise system-driven or staff-driven workflow? Are clients automatically notified? Does the system flag these conflicts for staff to manually reschedule?
17. **Automated Survey Assignment Logic Details (New from "Video 3" context):** For automated assignment of intake `SurveyTemplate`(s), what are the specific rules? Is it based purely on `AppointmentRequest.service_id`, client age derived from `RequestContactItems.date_of_birth`, client-stated issues, or a more complex, configurable rules engine in `PracticeSettings`?

## 15. Next Steps

_(Standard next steps remain relevant)_

1.  **Team Review:** Discuss this updated `SCHEMA_NOTES.md`.
2.  **Answer Clarifying Questions:** Focus on remaining questions in Section 7 and new ones in Section 14.
3.  **Make Design Decisions:** Prioritize decisions on `InvoiceItem`, `ReferralSource`, Client Portal Auth strategy (including `ClientPortalAccount` and `ClientPortalInvitation` models), `WaitlistEntry` model, and Enum strategy.
4.  **Update `schema.prisma`:** Reflect decisions.
5.  **Evolve This Document:** Continue iterative updates.

---

**Note**: This document should be reviewed and updated whenever significant schema changes are made or new business requirements are identified.
