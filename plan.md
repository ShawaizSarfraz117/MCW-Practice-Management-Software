# Implementation Plan: Appointment Request Management & Acceptance (Backend Focus)

This document outlines the plan for implementing the backend API routes and related database interactions for appointment request management and the process for accepting appointments and sharing documents.

## Feature 1: Appointment Request Management Backend

### 1.1. Directory Structure & New Files (Backend)

- **API Routes:**
  - `apps/back-office/src/app/api/appointment-requests/route.ts` (for `GET` list)
  - `apps/back-office/src/app/api/appointment-requests/[requestId]/status/route.ts` (for `PUT` status)

### 1.2. API Endpoint Implementation Details

#### 1.2.1. `GET /api/appointment-requests`

- **File:** `apps/back-office/src/app/api/appointment-requests/route.ts`
- **Purpose:** Fetch a list of appointment requests with filtering and pagination.
- **Request:**
  - Method: `GET`
  - Query Parameters: `locationId?: string`, `clientStatus?: string` (enum: e.g., `active`, `pending`, `incomplete_documents`, `completed_documents`), `requestSource?: string`, `expiringSoon?: boolean` (define logic, e.g., request date within X days), `page?: number` (default 1), `limit?: number` (default 10), `sortBy?: string` (e.g., `createdAt`, `clientName`), `sortOrder?: 'asc' | 'desc'` (default `desc`), `searchTerm?: string` (for client name/email).
- **Logic:**
  1.  Define a Zod schema for query parameter validation.
  2.  Parse and validate query parameters using the schema.
  3.  Construct Prisma query:
      - `where` clause: Dynamically build based on provided filters.
        - `locationId`: Filter by `locationId`.
        - `clientStatus`: Filter by `status` field on `AppointmentRequest`.
        - `requestSource`: Filter by `source` field.
        - `expiringSoon`: Add date-based condition if true.
        - `searchTerm`: Search in `RequestContactItems` (e.g., `firstName`, `lastName`, `email`) or linked `Client` details.
      - `include`: `RequestContactItems`, `PracticeService`, `Location`, `AssignedClinician` (join `User` table as `Clinician`).
      - `skip`: `(page - 1) * limit`.
      - `take`: `limit`.
      - `orderBy`: Based on `sortBy` and `sortOrder`.
  4.  Execute `prisma.appointmentRequest.findMany()` and `prisma.appointmentRequest.count()` (with the same `where` clause) in parallel for data and total count.
  5.  Log the request details (e.g., filters applied) using `@mcw/logger`.
- **Response:**
  - Success (200): `{ data: AppointmentRequest[], total: number, page: number, limit: number, totalPages: number }`
  - Error (400 - Bad Request): If validation fails. `{ message: "Invalid query parameters", errors: ZodErrorDetails }`
  - Error (500 - Internal Server Error): For unexpected server errors. `{ message: "Failed to fetch appointment requests" }`
- **Error Handling:** Use `try...catch` for Prisma queries and other operations. Return standardized JSON error responses.

#### 1.2.2. `PUT /api/appointment-requests/{requestId}/status`

- **File:** `apps/back-office/src/app/api/appointment-requests/[requestId]/status/route.ts`
- **Purpose:** Update the status of an appointment request.
- **Request:**
  - Method: `PUT`
  - Path Parameter: `requestId` (string, UUID).
  - Body: Zod schema for `{ "status": AppointmentRequestStatusEnum, "rejectionReason"?: string }`. `AppointmentRequestStatusEnum` should include `accepted`, `rejected`, etc. `rejectionReason` is required if status is `rejected`.
- **Logic:**
  1.  Validate `requestId` from path parameters.
  2.  Parse and validate the request body using the Zod schema.
  3.  Verify the `AppointmentRequest` exists using `prisma.appointmentRequest.findUnique()`. If not found, return 404.
  4.  Update `AppointmentRequest` using `prisma.appointmentRequest.update()`:
      - Set `status` to the new value.
      - Set `rejectionReason` if provided and status is `rejected`.
  5.  Log the status change (e.g., create an audit log entry) using `@mcw/logger`.
- **Response:**
  - Success (200): `{ data: UpdatedAppointmentRequest }`
  - Error (400 - Bad Request): If validation fails. `{ message: "Invalid request body", errors: ZodErrorDetails }`
  - Error (404 - Not Found): If `requestId` does not exist. `{ message: "Appointment request not found" }`
  - Error (500 - Internal Server Error): `{ message: "Failed to update appointment request status" }`

### 1.3. Prisma Schema Considerations (Verification/Updates) - Feature 1

- **`AppointmentRequest` table:**
  - Ensure `status` field exists (e.g., `ENUM` or `String` with predefined values like `PENDING_REVIEW`, `ACTIVE`, `INCOMPLETE_DOCUMENTS`, `COMPLETED_DOCUMENTS`, `ACCEPTED`, `REJECTED`, `CANCELLED_BY_CLIENT`, `NO_SHOW`).
  - `rejectionReason: String?`
  - `source: String?` (e.g., 'Client Portal', 'Manual Entry', 'Widget')
  - `requestedDateTime: DateTime`
  - `locationId: String?` (link to `Location` table)
  - `assignedClinicianId: String?` (link to `User` table)
  - `practiceServiceId: String` (link to `PracticeService` table)
  - `clientId: String?` (link to `Client` table, nullable if new client)
- **`RequestContactItems` table:** (For requests not yet linked to an existing client)
  - `appointmentRequestId: String` (link to `AppointmentRequest`)
  - `firstName: String`, `lastName: String`, `email: String`, `phone: String`
- Ensure relations are correctly defined (`Client`, `User` (as Clinician), `PracticeService`, `Location`).

### 1.4. Testing Strategy - Feature 1 (Backend)

#### 1.4.1. API Route Tests (`apps/back-office/__tests__/api/appointment-requests/`)

- Use Vitest with Prisma client mocking or a test database.
- **`GET /api/appointment-requests` (`route.test.ts`):**
  - Test successful retrieval with no filters (default pagination).
  - Test each filter individually (`locationId`, `clientStatus`, `requestSource`, `searchTerm`).
  - Test combination of filters.
  - Test pagination (`page`, `limit`).
  - Test sorting (`sortBy`, `sortOrder`).
  - Test `expiringSoon` logic.
  - Test invalid query parameters (should return 400 or handle gracefully).
  - Test empty result set.
- **`PUT /api/appointment-requests/{requestId}/status` (`[requestId]/status/route.test.ts`):**
  - Test successful status update (e.g., to `accepted`, `rejected` with reason).
  - Test with non-existent `requestId` (404).
  - Test with invalid request body (400).
  - Test `rejectionReason` requirement when status is `rejected`.
  - Verify database record is updated correctly.

## Feature 2: Accept Appointment & Share Documents Backend

### 2.1. Directory Structure & New Files (Backend)

- **API Routes:**
  - `apps/back-office/src/app/api/survey-templates/route.ts` (for `GET` list of shareable documents)
  - `apps/back-office/src/app/api/appointment-requests/[requestId]/accept-and-share/route.ts` (for `POST` action)

### 2.2. API Endpoint Implementation Details

#### 2.2.1. `GET /api/survey-templates`

- **File:** `apps/back-office/src/app/api/survey-templates/route.ts`
- **Purpose:** Fetch a list of survey templates (e.g., consent forms, intake forms) that can be shared.
- **Request:**
  - Method: `GET`
  - Query Parameters: `type?: string` (e.g., 'consent', 'intake'), `context?: string` (e.g., 'telehealth', 'new_client', 'specific_service_type').
- **Logic:**
  1.  Zod schema for query parameter validation.
  2.  Parse and validate.
  3.  Construct Prisma query for `SurveyTemplate` table based on filters.
      - `where` clause for `type` and `context`.
      - Select relevant fields (id, name, description).
  4.  Execute `prisma.surveyTemplate.findMany()`.
- **Response:**
  - Success (200): `{ data: SurveyTemplate[] }`
  - Error (400/500): Standard error responses.

#### 2.2.2. `POST /api/appointment-requests/{requestId}/accept-and-share`

- **File:** `apps/back-office/src/app/api/appointment-requests/[requestId]/accept-and-share/route.ts`
- **Purpose:** Finalizes appointment acceptance, records shared documents, and triggers notifications.
- **Request:**
  - Method: `POST`
  - Path Parameter: `requestId` (string, UUID).
  - Body: Zod schema for `{ "sharedTemplateIds": string[], "comment"?: string, "clientId"?: string }`.
    - `sharedTemplateIds`: Array of `SurveyTemplate` IDs to be shared.
    - `comment`: Optional email comment.
    - `clientId`: ID of the client. If the request was for a new client, this might involve client creation/linking logic if not already handled.
- **Logic:**
  1.  Validate `requestId`.
  2.  Parse and validate request body (Zod).
  3.  **Database Transaction (`prisma.$transaction`):**
      a. Fetch `AppointmentRequest` and verify it exists and is in a state that can be accepted.
      b. Update `AppointmentRequest` status to `ACCEPTED`.
      c. If `clientId` is present, ensure the `AppointmentRequest` is linked to this client. If client creation from `RequestContactItems` is implied and not yet done, this might be the place, though ideally, client resolution happens before this step.
      d. For each `templateId` in `sharedTemplateIds`:
      i. Verify `SurveyTemplate` exists.
      ii. Create `SurveyAnswer` (or `ClientSharedDocument`) records. This record should link to `AppointmentRequest`, `Client`, and `SurveyTemplate`. Store `sharedAt` timestamp.
      e. Log the acceptance and document sharing in an audit log.
  4.  **Post-Transaction (Email Notification):**
      a. Retrieve appropriate `EmailTemplate` (e.g., 'APPOINTMENT_ACCEPTED_WITH_DOCUMENTS').
      b. Personalize email content: client name, appointment details, `comment` from request body, links to shared documents (if applicable, or instructions on how to access).
      c. Use an email service to send the notification to the client. Log email sending attempt/success/failure.
- **Response:**
  - Success (200): `{ message: "Appointment accepted and documents processed for sharing.", data: UpdatedAppointmentRequest }`
  - Error (400/404/500): Standard error responses. E.g., if `AppointmentRequest` not found, or a `SurveyTemplate` in `sharedTemplateIds` is invalid.

### 2.3. Prisma Schema Considerations (Verification/Creation) - Feature 2

- **`SurveyTemplate` table:**
  - `id: String @id @default(cuid())`
  - `name: String`
  - `description: String?`
  - `type: String?` (e.g., 'CONSENT', 'INTAKE_FORM', 'QUESTIONNAIRE')
  - `context: String?` (e.g., 'NEW_CLIENT', 'TELEHEALTH_SESSION', 'SERVICE_X_CONSENT')
  - `isActive: Boolean @default(true)`
  - `contentJson: Json?` (if storing form structure directly) or `filePath: String?` (if linking to file).
- **`SurveyAnswer` table (or `ClientSharedDocument`):**
  - `id: String @id @default(cuid())`
  - `appointmentRequestId: String` (link to `AppointmentRequest`)
  - `clientId: String` (link to `Client`)
  - `surveyTemplateId: String` (link to `SurveyTemplate`)
  - `sharedAt: DateTime @default(now())`
  - `completedAt: DateTime?`
  - `answersJson: Json?` (if it's a form to be filled out by client)
- **`EmailTemplate` table:**
  - `id: String @id @default(cuid())`
  - `name: String @unique` (e.g., `APPOINTMENT_ACCEPTED_WITH_DOCUMENTS`)
  - `subject: String`
  - `bodyHtml: String` (template with placeholders)
  - `type: String` (used to fetch the correct template)
- **Audit Log:** Ensure an audit mechanism is in place to log these actions (`AppointmentRequest` status changes, documents shared).

### 2.4. Testing Strategy - Feature 2 (Backend)

#### 2.4.1. API Route Tests (`apps/back-office/__tests__/api/`)

- **`GET /api/survey-templates` (`survey-templates/route.test.ts`):**
  - Test fetching all templates.
  - Test filtering by `type` and `context`.
  - Test empty result set.
- **`POST /api/appointment-requests/{requestId}/accept-and-share` (`appointment-requests/[requestId]/accept-and-share/route.test.ts`):**
  - Test successful scenario:
    - `AppointmentRequest` status updated to `ACCEPTED`.
    - `SurveyAnswer` records created for each ID in `sharedTemplateIds`.
    - Client linkage verified.
    - Email sending logic triggered (mock the actual email service).
    - Audit log created.
  - Test with non-existent `requestId` (404).
  - Test with invalid `sharedTemplateIds` (e.g., non-existent template ID - should it fail transaction or skip?).
  - Test request body validation (missing fields, incorrect types - 400).
  - Test database transaction rollback on partial failure.

## 3. General Backend Considerations & Next Steps

- **Prisma Migrations:**
  - Review existing schema and create migrations for any new tables (`SurveyTemplate`, `SurveyAnswer`/`ClientSharedDocument`, `EmailTemplate` if not existing) or modifications to existing tables (e.g., `AppointmentRequest` status enum/fields).
  - Run `npx prisma migrate dev --name <descriptive_name>` after schema changes.
- **Seed Data:** Add seed data for `SurveyTemplate`s and `EmailTemplate`s to facilitate development and testing.
- **Permissions & Authorization:**
  - Ensure all API routes are protected by `next-auth` middleware.
  - Implement role-based access control if necessary (e.g., only users with specific roles can accept/reject requests or manage templates).
- **Error Handling & Logging:**
  - Consistent error responses from APIs.
  - Comprehensive logging using `@mcw/logger` for actions, errors, and important events.
- **Environment Variables:** Manage any new service configurations (e.g., email service API keys) through environment variables.
- **Code Review:** Conduct thorough code reviews for all new backend implementations.

This plan provides a detailed roadmap for the backend. Implementation should occur iteratively, with continuous testing and refinement.
