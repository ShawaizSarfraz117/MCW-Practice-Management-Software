# Billing and Analytics API Implementation

Implementing API routes for outstanding client balances and financial analytics.

## Completed Tasks

- [x] Initial project setup (directory structure, empty route/test files)

## In Progress Tasks

### `/api/billing/outstanding-balance` (GET)

- [x] Implement basic GET handler structure in `route.ts`
- [ ] **Integration Tests:**
  - [x] `getOutstandingBalances_SingleClient_NoGroup_VariousAppointments`
  - [x] `getOutstandingBalances_ClientInGroup_SingleResponsibleBillingContact`
  - [x] `getOutstandingBalances_ClientInGroup_MultipleResponsibleBillingContacts`
  - [x] `getOutstandingBalances_ClientInGroup_NoResponsibleBillingContacts`
  - [ ] `getOutstandingBalances_ClientIsResponsibleForOwnAndGroupBilling`
  - [ ] `getOutstandingBalances_Pagination_WorksAsExpected`
  - [ ] `getOutstandingBalances_DateFiltering_StrictlyAdhered`
  - [ ] `getOutstandingBalances_NoAppointmentsInDateRange_ReturnsEmpty`
  - [ ] `getOutstandingBalances_AppointmentsWithNullFinancialFields_TreatedAsZero`
  - [ ] `getOutstandingBalances_MultipleGroups_CorrectAggregationPerResponsibleClient`
- [ ] **Unit Tests:**
  - [ ] `validateInputParameters_Billing_InvalidDateFormatsAndRange`
  - [ ] `validateInputParameters_Billing_InvalidPaginationParameters`

### `/api/analytics/home` (GET)

- [ ] Implement basic GET handler structure in `route.ts`
- [ ] **Integration Tests:**
  - [ ] `getAnalyticsHome_ValidDateRange_CorrectMetricsCalculation`
  - [ ] `getAnalyticsHome_NoAppointmentsInDateRange_ReturnsZeroMetrics`
  - [ ] `getAnalyticsHome_AppointmentsWithNullFinancialFields_AggregatedAsZero`
  - [ ] `getAnalyticsHome_SpansMultipleClientsAndGroups_AggregatesAll`
- [ ] **Unit Tests:**
  - [ ] `validateInputParameters_Analytics_InvalidDateFormatsAndRange`

## Future Tasks

- [ ] Refine Net Income calculation in `/api/analytics/home` if detailed expense logic is provided.
- [ ] Consider performance optimization for very large datasets if needed.

## Implementation Plan

### `/api/billing/outstanding-balance`

- **Method**: GET
- **Core Logic**: Raw SQL query against `Appointment`, `Client`, `ClientGroup`, `ClientGroupMembership` tables.
  - Calculates `totalServiceAmount`, `totalPaidAmount`, `totalOutstandingBalance` per responsible client/billing entity based on simplified logic (`appointment_fee`, `write_off`, `adjustable_amount`).
  - Handles client group billing by identifying a single responsible member using `OUTER APPLY` (or subquery with `ROW_NUMBER()`) and `is_responsible_for_billing` flag, with tie-breaking.
  - Filters appointments by `start_date`.
  - Implements pagination.
- **Input**: `startDate`, `endDate`, `page` (optional), `rowsPerPage` (optional).
- **Output**: JSON array of client objects with their aggregated balances.

### `/api/analytics/home`

- **Method**: GET
- **Core Logic**: Prisma aggregate queries (or raw SQL) on `Appointment` table.
  - Calculates `totalClientPayments` (sum of `appointment_fee - write_off - adjustable_amount`).
  - Calculates `grossIncome` (sum of `appointment_fee`).
  - Sets `netIncome = grossIncome`.
  - Filters appointments by `start_date`.
- **Input**: `startDate`, `endDate`.
- **Output**: JSON object with `totalClientPayments`, `grossIncome`, `netIncome`.

### Relevant Files

- `apps/back-office/src/app/api/billing/outstanding-balance/route.ts`
- `apps/back-office/src/__tests__/api/billing/outstanding-balance/route.integration.test.ts`
- `apps/back-office/src/__tests__/api/billing/outstanding-balance/route.unit.test.ts`
- `apps/back-office/src/app/api/analytics/home/route.ts`
- `apps/back-office/src/__tests__/api/analytics/home/route.integration.test.ts`
- `apps/back-office/src/__tests__/api/analytics/home/route.unit.test.ts`
- `.cursor/rules/learned-memories.mdc`
- `BILLING_ANALYTICS_API_TASKS.md`
