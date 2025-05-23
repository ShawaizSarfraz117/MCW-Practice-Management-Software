# API Implementation Plan: Analytics Routes

This document outlines the plan for implementing two API routes in the `apps/back-office` application:

1.  `/api/analytics/income`
2.  `/api/analytics/outstanding-balances`

Both routes will utilize raw SQL queries for data aggregation and retrieval to optimize performance, especially with potentially large datasets. All implementations will adhere to the project\'s `api-implementation-guidelines` and `rules-for-writing-tests`.

## General Setup

- **Location**: API routes will be located within `apps/back-office/src/app/api/`.
- **Prisma Raw SQL**: Use `prisma.$queryRaw<ExpectedType[]>\`...\` or `prisma.$queryRawUnsafe(...)` for executing raw SQL queries. Ensure proper SQL injection prevention if using `.$queryRawUnsafe` by carefully constructing queries or preferring `.$queryRaw` with `${Prisma.sql\`...\`}` for parameters when possible.
- **Date Handling**: Dates from query parameters (YYYY-MM-DD) will be converted to JavaScript `Date` objects for use in SQL queries. Timezones will be handled assuming UTC for database storage and date comparisons unless specified otherwise. SQL date functions will be used to ensure comparisons are date-based.

---

## Route 1: `/api/analytics/income`

- **File Path**: `apps/back-office/src/app/api/analytics/income/route.ts`
- **Route Description**: Handles analytics for income, providing daily breakdowns of client payments, gross income, and net income within a specified date range.
- **HTTP Method**: `GET`
- **Endpoint**: `/api/analytics/income?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

### 1. Functionality Details

- **Purpose**: Retrieve and calculate daily income metrics (client payments, gross income, net income) for a specified date range.
- **Business Logic**: Calculations are performed on a per-day basis. Requires start and end dates for the query range.

### 2. Input Validation

- `startDate` (string, YYYY-MM-DD format): Required.
- `endDate` (string, YYYY-MM-DD format): Required.
- Validation:
  - Both dates must be valid.
  - `endDate` must be on or after `startDate`.
- Return HTTP 400 for validation errors.

### 3. Raw SQL Query (Conceptual)

The query will aggregate data from `Appointment`, `Invoice`, and `Payment` tables.

```typescript
// Placeholder for the actual raw SQL query
// GET /api/analytics/income?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

// Expected result structure from raw SQL for each day
interface DailyIncomeMetricRaw {
  metric_date: string; // YYYY-MM-DD
  total_gross_income: number | string; // string if from SQL SUM on Decimal
  total_net_income: number | string;
  total_client_payments: number | string;
}

// Example SQL (Illustrative - specific syntax depends on SQL dialect, e.g., SQL Server)
`
SELECT
    CAST(a.start_date AS DATE) AS metric_date,
    SUM(COALESCE(a.service_fee, 0)) AS total_gross_income,
    SUM(COALESCE(a.service_fee, 0) - COALESCE(a.discount_amount, 0)) AS total_net_income,
    (
        SELECT SUM(COALESCE(p.amount, 0))
        FROM "Payment" p
        JOIN "Invoice" i ON p.invoice_id = i.id
        WHERE i.appointment_id = a.id AND i.status != \'VOID\' -- Consider invoice status
    ) AS total_client_payments_from_appointment_invoices -- This is per appointment
FROM
    "Appointment" a
WHERE
    CAST(a.start_date AS DATE) >= $1 -- startDate
    AND CAST(a.start_date AS DATE) <= $2 -- endDate
    AND a.status NOT IN (\'Cancelled\', \'Rescheduled\') -- Or other non-billable statuses
GROUP BY
    CAST(a.start_date AS DATE)
ORDER BY
    metric_date ASC;
`// Note: The above sum for total_client_payments is tricky if an invoice covers multiple appointments
// or a payment covers multiple invoices. A more robust approach for client_payments:

`
WITH DailyAppointmentFinancials AS (
    SELECT
        CAST(a.start_date AS DATE) AS appointment_day,
        a.id AS appointment_id,
        COALESCE(a.service_fee, 0) AS gross_fee,
        COALESCE(a.service_fee, 0) - COALESCE(a.discount_amount, 0) AS net_fee
    FROM "Appointment" a
    WHERE CAST(a.start_date AS DATE) >= $1 AND CAST(a.start_date AS DATE) <= $2
      AND a.status NOT IN (\'Cancelled\', \'Rescheduled\') -- Define billable statuses
),
DailyPayments AS (
    -- Sum payments associated with invoices for appointments on a given day.
    -- This assumes payments are linked to invoices, and invoices to appointments.
    -- The payment date itself might be different from the appointment date.
    -- Clarification: "Client payments" are for services *rendered* on that day or payments *received* on that day?
    -- Assuming "client payments" are monies attributed to appointments of that day.
    SELECT
        CAST(a.start_date AS DATE) AS payment_application_day,
        SUM(COALESCE(p.amount, 0)) AS total_paid
    FROM "Payment" p
    JOIN "Invoice" inv ON p.invoice_id = inv.id
    JOIN "Appointment" a ON inv.appointment_id = a.id -- Assuming direct link or via InvoiceAppointmentItem
    WHERE CAST(a.start_date AS DATE) >= $1 AND CAST(a.start_date AS DATE) <= $2
      AND inv.status != \'VOID\' -- and p.status = 'Completed' etc.
    GROUP BY CAST(a.start_date AS DATE)
)
SELECT
    days.metric_date,
    COALESCE(SUM(daf.gross_fee), 0) AS total_gross_income,
    COALESCE(SUM(daf.net_fee), 0) AS total_net_income,
    COALESCE(dp.total_paid, 0) AS total_client_payments
FROM
    (SELECT DISTINCT appointment_day AS metric_date FROM DailyAppointmentFinancials
     UNION
     SELECT DISTINCT payment_application_day AS metric_date FROM DailyPayments) days
LEFT JOIN DailyAppointmentFinancials daf ON days.metric_date = daf.appointment_day
LEFT JOIN DailyPayments dp ON days.metric_date = dp.payment_application_day
WHERE days.metric_date IS NOT NULL
GROUP BY days.metric_date, dp.total_paid -- dp.total_paid needs to be in group by if not aggregated here
ORDER BY days.metric_date ASC;
`// The definition of "clientPayments" for a given day is critical.
// If it means sum of payments *received* on that day, irrespective of appointment date:
`
SELECT
    d.metric_date,
    COALESCE(daf.total_gross_income, 0) as total_gross_income,
    COALESCE(daf.total_net_income, 0) as total_net_income,
    COALESCE(pr.total_payments_received, 0) as total_client_payments
FROM
    (
        -- Generate all dates in the range
        SELECT generate_series($1::date, $2::date, \'1 day\')::date as metric_date
    ) d
LEFT JOIN
    (
        -- Aggregate gross and net income from appointments on their respective dates
        SELECT
            CAST(a.start_date AS DATE) AS appointment_date,
            SUM(COALESCE(a.service_fee, 0)) AS total_gross_income,
            SUM(COALESCE(a.service_fee, 0) - COALESCE(a.discount_amount, 0)) AS total_net_income
        FROM "Appointment" a
        WHERE CAST(a.start_date AS DATE) >= $1 AND CAST(a.start_date AS DATE) <= $2
          AND a.status NOT IN (\'Cancelled\', \'Rescheduled\') -- Define billable statuses
        GROUP BY CAST(a.start_date AS DATE)
    ) daf ON d.metric_date = daf.appointment_date
LEFT JOIN
    (
        -- Aggregate payments received on their respective payment dates
        SELECT
            CAST(p.payment_date AS DATE) AS payment_receipt_date, -- Assuming Payment table has a payment_date
            SUM(COALESCE(p.amount, 0)) AS total_payments_received
        FROM "Payment" p
        -- JOIN "Invoice" inv ON p.invoice_id = inv.id -- Optional: if need to filter by invoice status linked to payment
        WHERE CAST(p.payment_date AS DATE) >= $1 AND CAST(p.payment_date AS DATE) <= $2
          AND p.status = \'Completed\' -- Define completed payment statuses
        GROUP BY CAST(p.payment_date AS DATE)
    ) pr ON d.metric_date = pr.payment_receipt_date
ORDER BY
    d.metric_date ASC;
`;
// This last version seems more aligned with typical "daily income reports" where client payments are money *received*.
// Using this last version for the plan.

// Parameters for Prisma: [startDate, endDate]
// Output type from Prisma:
// interface IncomeData {
//   metric_date: Date; // Will be a Date object from Prisma
//   total_gross_income: string; // Prisma Decimal becomes string
//   total_net_income: string;
//   total_client_payments: string;
// }
```

### 4. Data Processing (in `route.ts`)

- Execute the raw SQL query using `prisma.$queryRaw`.
- Map the results:
  - Convert string representations of decimals from SQL SUM (if applicable) to numbers.
  - Format dates to 'YYYY-MM-DD' string if not already.
- The SQL query should handle filling in days with no activity within the range to ensure a continuous series.

### 5. Output Format (as per requirements)

```typescript
// return NextResponse.json(dailyMetricsArray);
// where dailyMetricsArray is:
// [
//   { date: "YYYY-MM-DD", clientPayments: number, grossIncome: number, netIncome: number },
//   ...
// ]
```

### 6. Error Handling

- Catch errors from Prisma/database.
- Return HTTP 500 with a generic error message.
- Log detailed errors using `@mcw/logger`.

### 7. Logging

- Request parameters (`startDate`, `endDate`).
- Any errors encountered.
- Optionally, query execution time for performance monitoring.

### 8. Testing (`income.integration.test.ts` and `income.unit.test.ts`)

**Unit Tests:**

- Mock `prisma.$queryRaw` to return various scenarios:
  - Successful data retrieval.
  - Empty dataset (no appointments/payments in range).
  - Database error.
- Test input validation logic for `startDate` and `endDate`.
- Verify data transformation (e.g., Decimal to number, date formatting).

**Integration Tests:**

- **Setup**: Seed database with `Appointment`, `Invoice`, `Payment` records spanning several days.
  - Appointments with varying `service_fee`, `discount_amount`.
  - Payments made on different dates, some linked to appointments in the range, some not.
  - Invoices in various states.
- **Test Cases**:
  1.  **Basic Range**: Query with a valid `startDate` and `endDate`.
      - Verify HTTP 200.
      - Verify the structure of the response (array of daily objects).
      - Verify correct calculation of `grossIncome`, `netIncome`, `clientPayments` for each day by manually summing seeded data.
      - Ensure all days in the range are present, even if metrics are zero.
  2.  **No Data**: Date range with no appointments or payments.
      - Expect HTTP 200 with an array where metrics are zero for each day in the range.
  3.  **Single Day Range**: `startDate` equals `endDate`.
      - Verify metrics for that single day.
  4.  **Data Edge Cases**:
      - Appointments with zero `service_fee`.
      - Appointments where `discount_amount` equals `service_fee`.
      - Payments with zero amount (if possible).
  5.  **Invalid Inputs**:
      - `startDate` after `endDate` (expect HTTP 400).
      - Invalid date formats (expect HTTP 400).
      - Missing `startDate` or `endDate` (expect HTTP 400).
- **Cleanup**: Ensure test data is cleaned up after each test.

---

## Route 2: `/api/analytics/outstanding-balances`

- **File Path**: `apps/back-office/src/app/api/analytics/outstanding-balances/route.ts`
- **Route Description**: Handles analytics for client outstanding balances, providing a paginated list of clients with their service totals, amounts invoiced, paid, and unpaid.
- **HTTP Method**: `GET`
- **Endpoint**: `/api/analytics/outstanding-balances?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=1&pageSize=10`

### 1. Functionality Details

- **Purpose**: Retrieve a paginated list of clients (ClientGroups) and their outstanding balance details.
- **Business Logic**: Aggregates financial data per `ClientGroup` for appointments within the date range. Supports pagination. Fetches primary responsible client first/last name.

### 2. Input Validation

- `startDate` (string, YYYY-MM-DD format): Required.
- `endDate` (string, YYYY-MM-DD format): Required.
- `page` (string, parsable to int): Optional, defaults to 1. Must be >= 1.
- `pageSize` (string, parsable to int): Optional, defaults to 10. Must be >= 1.
- Validation:
  - Dates must be valid; `endDate` >= `startDate`.
  - `page`, `pageSize` must be positive integers.
- Return HTTP 400 for validation errors.

### 3. Raw SQL Query (Conceptual)

The query will aggregate data per `ClientGroup` and use `OUTER APPLY` or a subquery to get the responsible client. Pagination will be handled in SQL.

```typescript
// Placeholder for the actual raw SQL query
// GET /api/analytics/outstanding-balances?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=1&pageSize=10

// Expected result structure from raw SQL for each client group
interface ClientBalanceRaw {
  client_group_id: string;
  client_group_name: string;
  responsible_client_first_name: string | null;
  responsible_client_last_name: string | null;
  total_services_provided: number | string; // string if from SQL SUM on Decimal
  total_amount_invoiced: number | string;
  total_amount_paid: number | string;
  total_amount_unpaid: number | string; // Calculated: invoiced - paid
}

// Expected structure for total count
interface TotalCountRaw {
  total_records: number | string; // bigint from SQL COUNT becomes string or number
}

// Example SQL (Illustrative - SQL Server syntax for OUTER APPLY and pagination)
// Two queries: one for data, one for total count.
const offset = (page - 1) * pageSize;

// Data Query:
`
WITH GroupAppointmentFinancials AS (
    SELECT
        a.client_group_id,
        COALESCE(SUM(a.service_fee), 0) AS sum_service_fee,
        COALESCE(SUM(inv.total_invoice_amount), 0) AS sum_invoice_amount,
        COALESCE(SUM(pay.total_payment_amount), 0) AS sum_payment_amount
    FROM "Appointment" a
    LEFT JOIN (
        SELECT appointment_id, SUM(COALESCE(amount, 0)) as total_invoice_amount
        FROM "Invoice"
        WHERE status != \'VOID\' -- Consider billable statuses
        GROUP BY appointment_id
    ) inv ON a.id = inv.appointment_id
    LEFT JOIN (
        SELECT i.appointment_id, SUM(COALESCE(p.amount, 0)) as total_payment_amount
        FROM "Payment" p
        JOIN "Invoice" i ON p.invoice_id = i.id
        WHERE i.status != \'VOID\' AND p.status = \'Completed\' -- Consider payment and invoice statuses
        GROUP BY i.appointment_id
    ) pay ON a.id = pay.appointment_id
    WHERE CAST(a.start_date AS DATE) >= $1 -- startDate
      AND CAST(a.start_date AS DATE) <= $2 -- endDate
      AND a.client_group_id IS NOT NULL
      AND a.status NOT IN (\'Cancelled\', \'Rescheduled\') -- Consider billable statuses
    GROUP BY a.client_group_id
)
SELECT
    cg.id AS client_group_id,
    cg.name AS client_group_name,
    rc.first_name AS responsible_client_first_name,
    rc.last_name AS responsible_client_last_name,
    gaf.sum_service_fee AS total_services_provided,
    gaf.sum_invoice_amount AS total_amount_invoiced,
    gaf.sum_payment_amount AS total_amount_paid,
    (gaf.sum_invoice_amount - gaf.sum_payment_amount) AS total_amount_unpaid
FROM "ClientGroup" cg
JOIN GroupAppointmentFinancials gaf ON cg.id = gaf.client_group_id
OUTER APPLY (
    SELECT TOP 1 c.first_name, c.last_name
    FROM "ClientGroupMembership" cgm
    JOIN "Client" c ON cgm.client_id = c.id
    WHERE cgm.client_group_id = cg.id
    ORDER BY
        CASE WHEN cgm.is_responsible_for_billing = TRUE THEN 1 ELSE 2 END ASC,
        cgm.created_at ASC -- Tie-breaker if multiple responsible or no one responsible
) rc
WHERE (gaf.sum_invoice_amount - gaf.sum_payment_amount) > 0 -- Optional: Only show groups with outstanding balances
ORDER BY cg.name ASC -- Or some other relevant order
OFFSET $3 -- offset (page - 1) * pageSize
LIMIT $4; -- pageSize
`// Parameters for Prisma: [startDate, endDate, offset, pageSize]

// Total Count Query:
`
WITH GroupAppointmentFinancials AS (
    -- Same CTE as above
    SELECT
        a.client_group_id,
        COALESCE(SUM(inv.total_invoice_amount), 0) AS sum_invoice_amount,
        COALESCE(SUM(pay.total_payment_amount), 0) AS sum_payment_amount
    FROM "Appointment" a
    LEFT JOIN (
        SELECT appointment_id, SUM(COALESCE(amount, 0)) as total_invoice_amount
        FROM "Invoice"
        WHERE status != \'VOID\'
        GROUP BY appointment_id
    ) inv ON a.id = inv.appointment_id
    LEFT JOIN (
        SELECT i.appointment_id, SUM(COALESCE(p.amount, 0)) as total_payment_amount
        FROM "Payment" p
        JOIN "Invoice" i ON p.invoice_id = i.id
        WHERE i.status != \'VOID\' AND p.status = \'Completed\'
        GROUP BY i.appointment_id
    ) pay ON a.id = pay.appointment_id
    WHERE CAST(a.start_date AS DATE) >= $1 -- startDate
      AND CAST(a.start_date AS DATE) <= $2 -- endDate
      AND a.client_group_id IS NOT NULL
      AND a.status NOT IN (\'Cancelled\', \'Rescheduled\')
    GROUP BY a.client_group_id
)
SELECT COUNT(*) AS total_records
FROM "ClientGroup" cg
JOIN GroupAppointmentFinancials gaf ON cg.id = gaf.client_group_id
WHERE (gaf.sum_invoice_amount - gaf.sum_payment_amount) > 0; -- Match filtering if applied in data query
`;
// Parameters for Prisma: [startDate, endDate]
// Output type from Prisma for data query: ClientBalanceRaw[]
// Output type for count query: TotalCountRaw[] (expected to have one record)
```

### 4. Data Processing (in `route.ts`)

- Execute two raw SQL queries: one for the paginated data, one for the total count of records matching the criteria.
- Map data results:
  - Convert string decimals to numbers.
- Calculate `totalPages`.

### 5. Output Format (as per requirements)

```typescript
// return NextResponse.json({
//   data: clientBalancesArray, // Mapped from ClientBalanceRaw[]
//   pagination: {
//     totalItems: number,
//     currentPage: number,
//     pageSize: number,
//     totalPages: number
//   }
// });
```

### 6. Error Handling

- Catch errors from Prisma/database.
- Return HTTP 500.
- Log errors.

### 7. Logging

- Request parameters.
- Errors.
- Query execution times.

### 8. Testing (`outstanding-balances.integration.test.ts` and `outstanding-balances.unit.test.ts`)

**Unit Tests:**

- Mock `prisma.$queryRaw` (or `prisma.$transaction` if used for the two queries).
  - Simulate data returns, empty sets, errors.
- Test input validation (`startDate`, `endDate`, `page`, `pageSize`).
- Test pagination calculation logic (`totalPages`).
- Verify data transformation.

**Integration Tests:**

- **Setup**: Seed `Client`, `ClientGroup`, `ClientGroupMembership`, `Appointment`, `Invoice`, `Payment` records.
  - Multiple client groups.
  - Client groups with:
    - One responsible biller.
    - Multiple responsible billers (ensure no duplication of group financials).
    - Zero responsible billers.
    - No members.
  - Appointments with various fees, linked to different client groups.
  - Invoices (some paid, some partially paid, some unpaid).
  - Payments.
- **Test Cases**:
  1.  **Basic Pagination**: Request first page with a default `pageSize`.
      - Verify HTTP 200.
      - Verify `data` array structure and content for a few sample client groups.
      - Verify `pagination` object fields are correct (`totalItems`, `currentPage`, `pageSize`, `totalPages`).
      - Verify `responsible_client_first_name` and `responsible_client_last_name` are correctly populated based on `is_responsible_for_billing` and tie-breakers.
  2.  **Navigate Pages**: Request different pages (e.g., page 2, last page). Verify data and pagination info.
  3.  **Page Size Change**: Request with a different `pageSize`.
  4.  **No Data**: Date range or criteria yielding no outstanding balances.
      - Expect HTTP 200, `data` is empty array, `totalItems` is 0.
  5.  **Critical Edge Case: Multiple Responsible Billers**:
      - Client group has multiple `ClientGroupMembership` records with `is_responsible_for_billing = true`.
      - Ensure financial totals for the group are aggregated correctly once, not multiplied.
      - Ensure one primary contact is chosen consistently (e.g., by `created_at` tie-breaker).
  6.  **Critical Edge Case: Zero Responsible Billers**:
      - Client group has members, but none have `is_responsible_for_billing = true`.
      - Ensure group financials are still calculated.
      - `responsible_client_first_name/last_name` might be from the "oldest" member or null, depending on `OUTER APPLY` logic.
  7.  **Client Group with No Appointments in Range**: Ensure it\'t appear or appears with zero financials if the query structure allows.
  8.  **Invalid Inputs**:
      - `startDate` after `endDate` (HTTP 400).
      - Invalid date formats (HTTP 400).
      - Non-integer/negative `page`/`pageSize` (HTTP 400).
      - Missing date params (HTTP 400).
- **Cleanup**: Clean seeded data.

---

This plan provides a detailed roadmap. Specific SQL queries will need to be fine-tuned for the exact schema and SQL dialect (MS SQL Server as per project guidelines).
