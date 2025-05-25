# Prisma Schema Review & Documentation Guide

**Date:** May 25, 2025

**Purpose:** This document summarizes observations from the recent review of the `schema.prisma` file, including suggested modifications made during the commenting phase, areas requiring further consideration and discussion, and questions aimed at deepening understanding to produce comprehensive developer documentation.

---

## 1. Summary of Suggested Schema Modifications (During Commenting Phase)

The following changes were provisionally made to the `schema.prisma` file while adding comments. **Please review these carefully to ensure they align with your data and business logic.**

### 1.1. Data Type Adjustments Made

- **`GoodFaithEstimate.client_zip_code`**: Changed from `Int?` to `String? @db.VarChar(20)` (to accommodate non-numeric or extended ZIP codes like '12345-6789').
- **`GoodFaithEstimate.total_cost`**: Changed from `Int` to `Decimal @db.Decimal(10,2)`.
- **`GoodFaithServices.fee`**: Changed from `Int` to `Decimal @db.Decimal(10,2)`.
- **`StatementItem.charges`**: Changed from `Int` to `Decimal @db.Decimal(10,2)`.
- **`StatementItem.payments`**: Changed from `Int` to `Decimal @db.Decimal(10,2)`.
- **`StatementItem.balance`**: Changed from `Int` to `Decimal @db.Decimal(10,2)`.
- **`ClientAdress.address_line2`**: Made optional (`String?`) as it's commonly not required.
- **Question for you:** Were there specific reasons for using `Int` for the financial fields above (e.g., storing values in cents)? If so, please revert and add a comment clarifying the unit.

### 1.2. Uniqueness Constraints Added (`@unique`)

The following fields/combinations were marked with `@unique` as this seemed implied by their common usage. Please verify:

- `Tag.name`
- `EmailTemplate.name`
- `Invoice.invoice_number`
- `PracticeService.code`
- `ReminderTextTemplates.type`
- `PracticeSettings.key`
- `ClinicalInfo.user_id` (if one `ClinicalInfo` per `User`)
- `CreditCard.token` (if payment gateway tokens are unique identifiers)
- `Diagnosis.code`
- `ClientFiles.[client_group_file_id, client_id]`
- `ClientGroupServices.[client_group_id, service_id]`
- `ClientBillingPreferences.client_group_id` (if only one set of preferences per group)
- `GoodFaithEstimate.[client_id, provided_date]` (Example constraint, adjust based on actual rules)

---

## 2. Key Areas for Design Review & Consideration

These are broader design aspects to discuss and solidify:

### 2.1. Referential Integrity (`onDelete`/`onUpdate` behaviors)

- Many relations currently use `onDelete: NoAction` and `onUpdate: NoAction`.
- **Question:** What is the desired cascading behavior when critical entities are deleted (e.g., if a `ClientGroup`, `Clinician`, or `User` is deleted, what should happen to their related `Appointments`, `Invoices`, etc.)?
- **Consider:** Explicitly define `onDelete` rules (e.g., `Cascade`, `SetNull`, `Restrict`) for key relationships to ensure data integrity and prevent orphaned records or application errors. Document the chosen strategy.

### 2.2. Use of Enums for Constrained String Fields

- Numerous fields represent a status, type, or category (e.g., `Appointment.status`, `Appointment.type`, `Invoice.status`, `EmailTemplate.type`).
- **Consider:** Defining Prisma `enum` types for these fields. This provides better type safety, auto-completion in the client, and makes allowed values explicit in the schema.
- **Action:** If enums are not adopted immediately, ensure the allowed values for these string fields are clearly documented in your Markdown.

### 2.3. Potential Redundancy and Overlap

- **`ClinicalInfo` vs. `Clinician`:** Fields like `speciality`, `NPI_number`, `taxonomy_code` appear in both `Clinician` (linked to `User`) and `ClinicalInfo` (also linked to `User`).
  - **Question:** What is the distinct purpose of `ClinicalInfo`? Is there a reason for this duplication? Could these be consolidated into the `Clinician` model?
  - **Note:** `NPI_number` is `Float` in `ClinicalInfo` but `String?` in `Clinician`. NPIs are typically strings (alphanumeric, can have leading zeros if treated as purely numeric). `Float` is generally unsuitable for identifiers.
- **`ClientContact.type` vs. `ClientContact.contact_type`:**
  - **Question:** What is the intended difference between these two fields? They both seem to categorize the contact method. Can they be consolidated or clarified?

### 2.4. Review of Optional Fields (`?`)

- Many fields, including foreign keys (e.g., `Appointment.clinician_id`, `service_id`, `client_group_id`), are optional.
- **Action:** For each optional field, document the specific business scenarios where it would legitimately be `null`. This helps ensure the schema accurately reflects data requirements.

### 2.5. Default Values

- **`Availability` model:** Fields like `end_time`, `start_time`, `end_date`, `start_date` have `@default(now())`.
  - **Question:** Is this intentional? Availability slots are typically set for future dates/times. Defaulting to `now()` might lead to incorrect data unless explicitly overridden every time.

---

## 3. Model-Specific Explanations & Clarifying Questions

This section dives into specific models and domains, posing questions to help build comprehensive explanations for developers.

### 3.1. User, Client, Clinician & Access Management

- **User Model:** Serves as the base for authentication.
- **Clinician Model:** Linked one-to-one with `User`. Stores clinician-specific professional details.
- **Client Model:** Represents individuals receiving services.
  - **Question (Client Portal):** How does a `Client` authenticate if they don't have a direct link to the `User` model? Is portal access managed via `ClientContact` email and a separate invitation/password reset flow not involving the main `User` table, or are `Client` users also created in the `User` table with a specific role?
  - **Question (New Client Workflow):** `AppointmentRequests.client_id` is optional for new clients.
    - How is a "new client" (details in `RequestContactItems`) converted into a full `Client` record?
    - What's the data flow and matching logic if a `RequestContactItem` corresponds to an existing `Client`?
- **Roles & Permissions (`Role`, `Permission`, `UserRole`):**
  - The RBAC structure seems standard.
  - **Question:** Can you list the primary roles (e.g., 'Admin', 'Clinician', 'Client Portal User', 'Billing Staff') and a high-level summary of permissions for each? This will help verify if the `Permission` model covers all necessary granular controls.

### 3.2. Client Groups (`ClientGroup`, `ClientGroupMembership`)

- **Purpose:** `ClientGroup` seems to allow grouping multiple `Client` entities (e.g., for families, couples). An `Appointment` is linked to a `ClientGroup`.
  - **Question:** What are the main types of `ClientGroup.type`? (e.g., 'Family', 'Couple', 'Individual').
  - **Question:** For an individual client, are they always placed within a `ClientGroup` (e.g., a group of one)? Or can an `Appointment` sometimes be linked directly to a `Client` if there's no group concept involved? (Currently, `Appointment` only has `client_group_id`).
  - **Question:** What is the role of `ClientGroupMembership.is_contact_only`?
  - **Question:** Who is typically responsible for managing `ClientGroup.available_credit`?

### 3.3. Appointments (`Appointment`, `AppointmentRequests`, `AppointmentTag`, `AppointmentNotes`, `AppointmentLimit`)

- **Lifecycle:**
  - **Question:** Detail the workflow from `AppointmentRequests` to `Appointment`. What are the key `AppointmentRequests.status` values that drive this? Is data copied, or is a link maintained?
- **Recurrence:** `is_recurring`, `recurring_rule`, `recurring_appointment_id` (self-relation).
  - **Question:** What is the exact format/standard used for `recurring_rule` (e.g., iCalendar RRULE string)?
  - **Question:** How are instances of a recurring series managed? Does the `recurring_appointment_id` link child instances to a parent "template" appointment, or is there another mechanism?
- **Optional Fields in `Appointment`:**
  - **Question:** When would `Appointment.title` be used, distinct from the `PracticeService` name/description?
  - **Question:** When would `clinician_id`, `service_id`, or `client_group_id` be `null` in a confirmed `Appointment`?
- **`AppointmentNotes`:**
  - **Question:** What are the typical `type` values for notes (e.g., 'Progress Note', 'SOAP Note', 'Private Note')? Are these linked to specific `SurveyTemplate.type` values?

### 3.4. Billing & Finance (`Invoice`, `Payment`, `Statement`, `Superbill`, `CreditCard`, `BillingSettings`, `ClientBillingPreferences`, `GoodFaithEstimate`)

- **Invoice Generation:**
  - **Question:** `Invoice.client_group_id` and `Invoice.appointment_id` are optional. What are scenarios for invoices not linked to either? (e.g., manual product sales?)
  - **Question:** How do `Appointment.appointment_fee`, `adjustable_amount`, and `write_off` propagate or influence `Invoice.amount`?
- **`StatementItem` Data Types:**
  - As noted, `charges`, `payments`, `balance` are `Decimal` now. Confirm this is correct.
- **Credit Management:**
  - **Question:** How is `ClientGroup.available_credit` applied? Is it used in `Payment.credit_applied`? Describe the workflow.
- **`BillingSettings` Scope:**
  - `clinician_id` is optional and unique.
  - **Question:** If `clinician_id` is `null`, does it represent global practice settings? If present, are they clinician-specific overrides?
- **`GoodFaithEstimate`:**
  - **Question:** What is the typical workflow for generating a GFE and linking it to services and diagnoses?

### 3.5. Services, Availability & Locations (`PracticeService`, `Availability`, `Location`, `ClinicianServices`, `AvailabilityServices`)

- This domain appears relatively clear.
- **Question (`PracticeService.code`):** Are these standard codes (e.g., CPT) or internal identifiers?
- **Question (`Availability` defaults):** As mentioned, the `default(now())` for date/time fields needs clarification.

### 3.6. Notifications (`EmailTemplate`, `ReminderTextTemplates`, `ClientReminderPreference`)

- **Dynamic Data/Merge Tags:** Video 6 mentioned merge tags.
  - **Question:** How are placeholders in `EmailTemplate.content` and `ReminderTextTemplates.content` populated with dynamic data? Is this purely an application-level concern, or are placeholder formats/lists documented somewhere?
- **`ClientReminderPreference.channel` & `contact_id`:**
  - This allows specifying reminder channel and target contact (email/phone).
  - **Question:** How does the system ensure the `contact_id` (from `ClientContact`) is valid for the chosen `channel`?

### 3.7. Surveys, Documents & Files (`SurveyTemplate`, `SurveyAnswers`, `ClientFiles`, `ClientGroupFile`)

- **File Management Workflow:**
  - `ClientGroupFile` seems to be a file associated with a `ClientGroup`.
  - `ClientFiles` then links a `Client` (presumably from that group) to a `ClientGroupFile` and adds a `status`.
  - **Question:** Can you describe a use case? Why is a file instance tracked per-client if it's already a "group file"? Is it for individual completion status of a shared document?
  - **Question:** How does `SurveyAnswers` relate to `ClientFiles`? `ClientFiles` has an optional `survey_answers_id`.
- **`SurveyTemplate.type` & `SurveyAnswers.status`:**
  - **Question:** What are the typical values for these?

---

## 4. General Documentation & Best Practices to Consider

### 4.1. Naming Conventions

- The schema uses `PascalCase` for models and mostly `snake_case` for fields, with `PascalCase` for relation fields.
- **Action:** Document this as the established convention if it is intentional. Consistency is key.

### 4.2. Documenting Business Rules

- Many critical business rules might not be enforceable purely by schema constraints (e.g., "a client can only have X active appointments").
- **Action:** Create a section in your main Markdown documentation for "Key Business Rules" and list them by domain.

### 4.3. Data Flow & Workflow Documentation

- Beyond individual model explanations, understanding how data flows through the system during key operations is crucial.
- **Examples:**
  - Client Intake & Onboarding
  - Appointment Booking (from request to completion)
  - Billing Cycle (Appointment -> Invoice -> Payment -> Statement)
  - Notification Triggers
- **Action:** Document these high-level workflows, indicating which models are touched at each step.

### 4.4. Visual Aids (ERDs, Flowcharts)

- For complex relationships or workflows, visual diagrams can be very helpful.
- **Suggestion:** Use Mermaid.js (which can be embedded in Markdown) to create:
  - A high-level Entity Relationship Diagram (ERD) showing major entities and their connections.
  - Simplified ERDs for specific domains (e.g., just the billing-related tables).
  - Flowcharts for the workflows mentioned above.

### 4.5. Keeping Documentation "Live"

- **Ownership:** Assign responsibility for keeping the database documentation up-to-date as the schema evolves.
- **Process:** Integrate documentation updates into your development workflow (e.g., as part of the definition of "done" for a feature that changes the schema).
- **Review:** Periodically review the documentation for accuracy and completeness.

---

## 5. Next Steps

1.  **Review this Document:** Discuss these points with your development team.
2.  **Answer Questions:** Gather answers to the clarifying questions listed above.
3.  **Make Design Decisions:** Solidify decisions on points like `onDelete` rules, enums, resolving redundancies, etc.
4.  **Update `schema.prisma`:**
    - Incorporate any structural changes decided upon.
    - Refine/add to the `///` comments based on the discussions and decisions.
5.  **Create/Populate Main Database Documentation `.md` File(s):** Use the answers and decisions from above to build out the comprehensive Markdown documentation, covering the aspects outlined in section 4 and the model explanations from section 3.

---

This structured approach should help you create a robust and clear understanding of your database, both within the code and in your supporting documentation.
