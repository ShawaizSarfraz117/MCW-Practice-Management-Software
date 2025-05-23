**Project:** Analytics API Routes Implementation

**1. Introduction:**
This document outlines the requirements for implementing two new analytics API routes within the `apps/back-office` application: `/api/analytics/income` and `/api/analytics/outstanding-balances`. These routes will provide crucial financial insights.

**2. Goals:**

- To provide daily income breakdown (client payments, gross, net).
- To provide a paginated list of clients with outstanding balances.
- To ensure performant data retrieval using raw SQL queries.
- To adhere to existing API implementation and testing guidelines.

**3. Target Users:**

- Back-office administrators or staff requiring financial analytics.

**4. Features:**

**4.1. Income Analytics API Route (`/api/analytics/income`)** - **Description:** Provides daily aggregated income metrics (client payments, gross income, net income) for a specified date range. - **Endpoint:** `GET /api/analytics/income` - **Request Parameters:** - `startDate` (YYYY-MM-DD, required) - `endDate` (YYYY-MM-DD, required) - **Response:** - Array of objects, each representing a day within the range:
`{ date: "YYYY-MM-DD", clientPayments: number, grossIncome: number, netIncome: number }` - All days in the range must be present, even if metrics are zero. - **Input Validation:** - Both dates must be valid. - `endDate` must be on or after `startDate`. - Return HTTP 400 for validation errors. - **Core Logic:** - Aggregate gross income from `Appointment.service_fee` for appointments within the date range (excluding non-billable statuses). - Aggregate net income (service_fee - discount_amount) similarly. - Aggregate client payments received on each day within the date range from the `Payment` table (for completed payments). - The SQL query should generate a continuous series of dates within the range. - **Error Handling:** Return HTTP 500 for server-side errors, log detailed errors. - **Testing:** Unit and Integration tests covering successful scenarios, edge cases (no data, single day), and invalid inputs.

**4.2. Outstanding Balances API Route (`/api/analytics/outstanding-balances`)** - **Description:** Provides a paginated list of client groups with their outstanding financial balances (total services, invoiced, paid, unpaid) for appointments within a specified date range. - **Endpoint:** `GET /api/analytics/outstanding-balances` - **Request Parameters:** - `startDate` (YYYY-MM-DD, required) - `endDate` (YYYY-MM-DD, required) - `page` (integer, optional, default: 1, min: 1) - `pageSize` (integer, optional, default: 10, min: 1) - **Response:** - Object containing: - `data`: Array of client balance objects:
`{ client_group_id: string, client_group_name: string, responsible_client_first_name: string | null, responsible_client_last_name: string | null, total_services_provided: number, total_amount_invoiced: number, total_amount_paid: number, total_amount_unpaid: number }` - `pagination`: `{ totalItems: number, currentPage: number, pageSize: number, totalPages: number }` - **Input Validation:** - Dates valid, `endDate` >= `startDate`. - `page`, `pageSize` positive integers. - Return HTTP 400 for validation errors. - **Core Logic:** - For each `ClientGroup`, calculate: - `total_services_provided`: Sum of `Appointment.service_fee` for billable appointments in the date range. - `total_amount_invoiced`: Sum of `Invoice.amount` (for non-void invoices) linked to appointments in the date range. - `total_amount_paid`: Sum of `Payment.amount` (for completed payments) linked to invoices for appointments in the date range. - `total_amount_unpaid`: `total_amount_invoiced - total_amount_paid`. - Identify responsible client (first/last name) for each group (e.g., based on `is_responsible_for_billing` flag). - Implement SQL-based pagination. - Optionally filter to show only groups with actual outstanding balances. - **Error Handling:** Return HTTP 500 for server-side errors, log detailed errors. - **Testing:** Unit and Integration tests covering pagination, data accuracy for various client group scenarios (e.g., multiple billers, no billers), edge cases, and invalid inputs.

**5. Technical Requirements:**

- Implement using Next.js Route Handlers in `apps/back-office/src/app/api/analytics/`.
- Utilize `prisma.$queryRaw` for data aggregation.
- Adhere to `api-implementation-guidelines.mdc` and `rules-for-writing-tests.mdc`.
- Use `@mcw/logger` for logging.
