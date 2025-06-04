# Back-Office API Integration Analysis

This document provides a comprehensive analysis of all React pages/routes in the back-office application, their interactive elements, and API integration status.

## Legend

- ✅ = API exists and is integrated
- ⚠️ = API exists but not fully integrated
- ❌ = API missing or not integrated

## Pages and API Integration Status

| Page/Route                             | Interactive Element        | Purpose                              | API Endpoint                       | Status |
| -------------------------------------- | -------------------------- | ------------------------------------ | ---------------------------------- | ------ |
| **Authentication**                     |
| `/login`                               | Email input                | User authentication                  | `/api/auth/[...nextauth]`          | ✅     |
| `/login`                               | Password input             | User authentication                  | `/api/auth/[...nextauth]`          | ✅     |
| `/login`                               | Sign in button             | Submit login                         | `/api/auth/[...nextauth]`          | ✅     |
| `/login`                               | Forgot password link       | Password recovery                    | N/A                                | ❌     |
| **Activity**                           |
| `/activity`                            | Tab navigation             | Switch between History/Sign In/HIPAA | Mock data                          | ❌     |
| `/activity`                            | Search input               | Filter activity logs                 | `/api/activity` (exists)           | ⚠️     |
| `/activity`                            | Client dropdown            | Filter by client                     | `/api/activity` (exists)           | ⚠️     |
| `/activity`                            | Time range filter          | Filter by date                       | `/api/activity` (exists)           | ⚠️     |
| `/activity`                            | Activity data table        | Display activity logs                | `/api/activity` (exists)           | ⚠️     |
| **Analytics**                          |
| `/analytics`                           | Time range filters         | Filter analytics data                | `/api/analytics`                   | ⚠️     |
| `/analytics`                           | Income chart               | Display income data                  | Mock data                          | ❌     |
| `/analytics`                           | Outstanding balances chart | Display balance data                 | Mock data                          | ❌     |
| `/analytics`                           | Appointments chart         | Display appointment stats            | `/api/analytics/appointmentStatus` | ⚠️     |
| `/analytics/appointment-status`        | Status report grid         | Appointment status details           | `/api/analytics/appointmentStatus` | ⚠️     |
| `/analytics/income`                    | Income report grid         | Detailed income report               | Mock data                          | ❌     |
| `/analytics/outstanding-balances`      | Balances grid              | Outstanding balance details          | Mock data                          | ❌     |
| **Billing**                            |
| `/billing`                             | Date range selector        | Filter billing data                  | Mock data                          | ❌     |
| `/billing`                             | Export Payments button     | Export payment data                  | `/api/invoice/payment`             | ⚠️     |
| `/billing`                             | Invoice links              | View individual invoices             | `/api/invoice`                     | ⚠️     |
| `/billing`                             | Payment modal              | Process payments                     | `/api/invoice/payment`             | ⚠️     |
| `/billing/documents`                   | Documents table            | List billing documents               | `/api/billing-documents`           | ⚠️     |
| `/billing/documents`                   | Download actions           | Download documents                   | `/api/billing-documents`           | ⚠️     |
| **Clients**                            |
| `/clients`                             | Add New Client button      | Create new client                    | `/api/client`                      | ✅     |
| `/clients`                             | Search input               | Search clients                       | `/api/client`                      | ✅     |
| `/clients`                             | Status filter dropdown     | Filter by status                     | `/api/client`                      | ✅     |
| `/clients`                             | Sort dropdown              | Sort client list                     | `/api/client`                      | ✅     |
| `/clients`                             | Transfer data button       | Transfer client data                 | `/api/client`                      | ✅     |
| `/clients`                             | Client data table          | Display client list                  | `/api/client`                      | ✅     |
| `/clients/[id]`                        | Edit button                | Edit client details                  | `/api/client`                      | ✅     |
| `/clients/[id]`                        | Add payment button         | Add client payment                   | `/api/invoice/payment`             | ✅     |
| `/clients/[id]`                        | Invoice button             | Create invoice                       | `/api/invoice`                     | ✅     |
| `/clients/[id]`                        | Superbill button           | Create superbill                     | `/api/superbill`                   | ✅     |
| `/clients/[id]`                        | Admin note drawer          | Add administrative notes             | `/api/client`                      | ✅     |
| `/clients/[id]/edit`                   | Save button                | Save client changes                  | `/api/client`                      | ✅     |
| `/clients/[id]/edit`                   | Client form                | Edit all client fields               | `/api/client`                      | ✅     |
| **Calendar**                           |
| `/calendar`                            | Calendar grid              | View/create appointments             | `/api/appointment`                 | ✅     |
| `/calendar`                            | Clinician filter           | Filter by clinician                  | `/api/clinician`                   | ✅     |
| `/calendar`                            | Location filter            | Filter by location                   | `/api/location`                    | ✅     |
| `/calendar`                            | Create appointment         | New appointment dialog               | `/api/appointment`                 | ✅     |
| `/calendar`                            | Edit appointment           | Edit appointment dialog              | `/api/appointment`                 | ✅     |
| `/calendar`                            | Recurring controls         | Set recurring appointments           | `/api/appointment`                 | ✅     |
| `/calendar`                            | Availability sidebar       | View clinician availability          | `/api/availability`                | ✅     |
| **Scheduled**                          |
| `/scheduled`                           | Appointment list           | View scheduled appointments          | `/api/appointment`                 | ✅     |
| `/scheduled`                           | Filter controls            | Filter appointments                  | `/api/appointment`                 | ✅     |
| `/scheduled`                           | Action buttons             | Manage appointments                  | `/api/appointment`                 | ✅     |
| **Requests**                           |
| `/requests`                            | Tab navigation             | Pending/Archived tabs                | Mock data                          | ❌     |
| `/requests`                            | Request list               | Display appointment requests         | N/A                                | ❌     |
| `/requests`                            | Approve button             | Approve request                      | N/A                                | ❌     |
| `/requests`                            | Deny button                | Deny request                         | N/A                                | ❌     |
| `/requests`                            | Archive button             | Archive request                      | N/A                                | ❌     |
| **Settings - Team Members**            |
| `/settings/team-members`               | Add Team Member button     | Add new team member                  | `/api/team-members`                | ✅     |
| `/settings/team-members`               | Search input               | Search team members                  | `/api/team-members`                | ✅     |
| `/settings/team-members`               | Role filter                | Filter by role                       | `/api/team-members`                | ✅     |
| `/settings/team-members`               | Manage List Order          | Reorder team members                 | `/api/team-members`                | ✅     |
| `/settings/team-members`               | Team members table         | Display team list                    | `/api/team-members`                | ✅     |
| `/settings/team-members`               | Edit sidebar               | Edit member details                  | `/api/team-members`                | ✅     |
| `/settings/team-members`               | Delete action              | Remove team member                   | `/api/team-members`                | ✅     |
| **Settings - Services**                |
| `/settings/service`                    | Add Services button        | Add new service                      | `/api/service`                     | ✅     |
| `/settings/service`                    | Service list               | Display services                     | `/api/service`                     | ✅     |
| `/settings/service`                    | Edit forms                 | Edit service details                 | `/api/service`                     | ✅     |
| `/settings/service`                    | Save button                | Save service changes                 | `/api/service`                     | ✅     |
| **Settings - Clinical Info**           |
| `/settings/clinical-info`              | Edit clinician button      | Edit clinician info                  | `/api/clinicalInfo`                | ✅     |
| `/settings/clinical-info`              | Add license button         | Add new license                      | `/api/license`                     | ✅     |
| `/settings/clinical-info`              | License list               | Display licenses                     | `/api/license`                     | ✅     |
| `/settings/clinical-info`              | Delete license             | Remove license                       | `/api/license`                     | ✅     |
| **Settings - Practice Info**           |
| `/settings/practice-info`              | Practice form              | Edit practice details                | `/api/practiceInformation`         | ✅     |
| `/settings/practice-info`              | Logo upload                | Upload practice logo                 | `/api/upload`                      | ✅     |
| `/settings/practice-info`              | Phone management           | Manage phone numbers                 | `/api/practiceInformation`         | ✅     |
| `/settings/practice-info`              | Billing addresses          | Manage addresses                     | `/api/billingAddress`              | ✅     |
| `/settings/practice-info`              | Telehealth settings        | Configure telehealth                 | `/api/teleHealth`                  | ✅     |
| **Settings - Email**                   |
| `/settings/email`                      | Template list              | Display email templates              | `/api/email-templates`             | ✅     |
| `/settings/email`                      | Edit sidebar               | Edit template content                | `/api/email-templates`             | ✅     |
| `/settings/email`                      | Save button                | Save template changes                | `/api/email-templates`             | ✅     |
| `/settings/email`                      | Preview function           | Preview email template               | `/api/email-templates`             | ✅     |
| **Settings - Billing**                 |
| `/settings/billing`                    | Auto invoice toggle        | Configure auto invoicing             | `/api/billingSettings`             | ✅     |
| `/settings/billing`                    | Superbill config           | Configure superbills                 | `/api/billingSettings`             | ✅     |
| `/settings/billing`                    | Save button                | Save billing settings                | `/api/billingSettings`             | ✅     |
| **Settings - Profile**                 |
| `/settings/profile-security`           | Photo upload               | Upload profile photo                 | `/api/upload`                      | ✅     |
| `/settings/profile-security`           | Profile form               | Edit profile info                    | `/api/profile`                     | ✅     |
| `/settings/profile-security`           | Password form              | Change password                      | `/api/profile`                     | ✅     |
| `/settings/profile-security`           | Save button                | Save profile changes                 | `/api/profile`                     | ✅     |
| **Settings - Client Portal**           |
| `/settings/client-portal-permissions`  | Permission toggles         | Set portal permissions               | `/api/client/portal-permission`    | ✅     |
| `/settings/client-portal-permissions`  | Availability modal         | Manage availability                  | `/api/availability`                | ✅     |
| `/settings/client-portal-permissions`  | Save button                | Save permission settings             | `/api/client/portal-permission`    | ✅     |
| **Settings - Products**                |
| `/settings/product`                    | Add product button         | Add new product                      | `/api/product`                     | ✅     |
| `/settings/product`                    | Product list               | Display products                     | `/api/product`                     | ✅     |
| `/settings/product`                    | Edit actions               | Edit product details                 | `/api/product`                     | ✅     |
| `/settings/product`                    | Delete actions             | Remove products                      | `/api/product`                     | ✅     |
| **Settings - Template Library**        |
| `/settings/template-library`           | Template list              | Display templates                    | `/api/templates`                   | ✅     |
| `/settings/template-library`           | Add button                 | Create new template                  | `/api/templates`                   | ✅     |
| `/settings/template-library`           | Edit button                | Edit template                        | `/api/templates`                   | ✅     |
| `/settings/template-library`           | Delete button              | Remove template                      | `/api/templates`                   | ✅     |
| **Settings - Other Pages**             |
| `/settings/appointment-request-widget` | Widget configuration       | Configure widget                     | N/A                                | ❌     |
| `/settings/contact-form`               | Form settings              | Configure contact form               | N/A                                | ❌     |
| `/settings/shareable-documents`        | Document management        | Manage documents                     | N/A                                | ❌     |
| `/settings/payroll`                    | Payroll settings           | Configure payroll                    | N/A                                | ❌     |
| `/settings/payment`                    | Payment settings           | Configure payments                   | N/A                                | ❌     |
| `/settings/text`                       | Text messaging             | Configure SMS                        | N/A                                | ❌     |

## Summary

### Fully Integrated (✅)

- Client management system
- Calendar and appointment system
- Team member management
- Most settings pages (clinical info, practice info, email templates, etc.)
- Authentication system

### Partially Integrated (⚠️)

- Activity page (API exists but UI uses mock data)
- Analytics pages (APIs exist but charts use mock data)
- Billing pages (APIs exist but not fully integrated)

### Missing Integration (❌)

- Appointment requests system (no API route)
- Several settings pages (widget, contact form, documents, payroll, payment, text)
- Analytics reporting (using mock data)
- Forgot password functionality

### Unused API Routes

The following API routes exist but appear to have limited or no UI integration:

- `/api/statement` - Statement generation
- `/api/address-lookup` - Address validation
- `/api/appointment-limit` - Appointment limits
- `/api/blobToSaas` - File handling
- `/api/client/share-file` - File sharing

## Recommendations

1. **Priority 1**: Integrate existing APIs that have UI using mock data (Activity, Analytics, Billing)
2. **Priority 2**: Create missing APIs for Appointment Requests functionality
3. **Priority 3**: Implement missing settings pages APIs (payroll, text messaging, etc.)
4. **Priority 4**: Utilize unused API routes or remove them if not needed

## Implementation Questions

### 1. Activity Page Integration (/api/activity)

**Context**: The Activity page has an existing API that fetches audit logs but the UI is using mock data. The page has 3 tabs: History, Sign In Events, and HIPAA Audit Log.

#### Q1.1: Should the activity logs include IP address and location tracking?

**Answer**: Yes, we need IP tracking for all events.

**Sub-questions and answers:**

- **Q: Should we track IP addresses for all user actions or just login events?**
  - **A**: We need IP addresses for all events
- **Q: Do we need to use a geolocation service to convert IPs to locations?**
  - **A**: Yes, we can use https://geolocation-db.com/json/ API for IP geolocation
- **Q: Are there any HIPAA considerations for storing IP addresses?**
  - **A**: Not sure about specific HIPAA requirements for IP storage

**Additional requirement**: Replace client dropdown with team member dropdown and only show team members in the activity filter.

#### Q1.2: For the HIPAA Audit Log tab

**Answer**: Skip this tab implementation for now.

#### Q1.3: For filtering and search

**Q: Should the search function search across all fields or specific ones?**

- **A**: Search only for client names

**Q: What should be the maximum allowed date range for the time filter?**

- **A**: No maximum limit needed, this is already well defined

**Q: Should we implement pagination or infinite scroll for large result sets?**

- **A**: Infinite scroll would work best

### 2. Analytics - Income Report (/api/analytics/income)

**Context**: The income report needs to show daily/weekly/monthly income with client payments, gross income, and net income.

#### Q2.1: Income calculation

**Q: How should gross income be calculated?**

- **A**: Sum of all invoiced amounts

**Q: How is net income calculated?**

- **A**: All invoiced amounts minus average of clinician percentages

**Q: Should income include pending/unpaid invoices or only completed payments?**

- **A**: Include both pending/unpaid invoices

#### Q2.2: Data aggregation

**Q: Should the report show data per clinician or practice-wide?**

- **A**: Practice-wide

**Q: Do we need to track income by service type or payment method?**

- **A**: Track by appointment total - sum of all appointments

**Q: Should refunds/adjustments be tracked separately?**

- **A**: No, we don't need this in this report

#### Q2.3: Export functionality

**Q: What specific fields should be included in CSV/PDF exports?**

- **A**: CSV and Excel formats needed

**Q: Should exports include patient names or use anonymized IDs for HIPAA compliance?**

- **A**: We are only exporting: date, client payments, gross income, and net income

### 3. Analytics - Outstanding Balances (/api/analytics/outstanding-balances)

**Context**: Report showing client balances with services provided, uninvoiced amounts, invoiced amounts, and payments.

#### Q3.1: Balance calculations

**Q: How do we determine "services provided" - all completed appointments?**

- **A**: Yes, all completed appointments

**Q: What constitutes "uninvoiced" - appointments without associated invoices?**

- **A**: Yes, appointments without associated invoices

**Q: Should we track partial payments and payment plans?**

- **A**: No, we don't need that for this report

#### Q3.2: Filtering options

**Q: Should we allow filtering by balance threshold (e.g., show only balances > $100)?**

- **A**: Show all clients who have any balance

**Q: Filter by age of debt (30, 60, 90+ days)?**

- **A**: No filter like this exists

**Q: Filter by insurance vs self-pay clients?**

- **A**: No need for this filter

#### Q3.3: Data presentation

**Q: Should client names be sortable while maintaining HIPAA compliance?**

- **A**: Yes

**Q: Do we need to show last payment date or payment history?**

- **A**: No, we don't need that

### 4. Analytics - Appointment Status (/api/analytics/appointment-status)

**Context**: Report with 3 tabs showing appointment details, documentation status, and client responsibility.

#### Q4.1: Appointment data

**Q: How are billing codes determined for each appointment?**

- **A**: Each appointment has invoice and each invoice has code - get the code from there

**Q: How do we calculate rate per unit and units?**

- **A**: Each practice service is considered as a unit. Get the rate from the practice services table

**Q: What defines the different progress note statuses (no note, unlocked, supervision, locked)?**

- **A**: Use the AppointmentNotes table - for each appointment we can add a note and lock/unlock it

#### Q4.2: Documentation tab

**Q: What specific documentation is tracked?**

- **A**: When include documentation is enabled, look into AppointmentNotes table and check the status. If no note exists, show "no note", otherwise show "locked/unlocked" depending on the table value

**Q: What are the compliance requirements for documentation?**

- **A**: Ignore this

**Q: How long after an appointment can documentation be modified?**

- **A**: Ignore this

#### Q4.3: Client responsibility

**Q: How is client responsibility calculated vs insurance coverage?**

- **A**: We don't need to look into insurance coverage. For client responsibility, find the amount for appointment, what client paid, if it's uninvoiced, etc.

**Q: Should we track copays, deductibles, and coinsurance separately?**

- **A**: No

### 5. Billing Integration

**Context**: Billing pages have existing APIs but aren't fully integrated with the UI.

#### Q5.1: Payment processing

**Answer**: Ignore payment processing questions for now.

#### Q5.2: Invoice generation

**Q: Should invoices be automatically generated after appointments?**

- **A**: Right now we need to create invoice from clients page or we can do this by editing the appointment

**Q: What numbering scheme should be used for invoices?**

- **A**: INV #127 (format)

**Q: Do we need to support batch invoicing?**

- **A**: No

#### Q5.3: Export functionality

**Q: What format should payment exports use for accounting software compatibility?**

- **A**: Excel/CSV

**Q: Should exports include patient PHI or use anonymized data?**

- **A**: We can ignore this for now

### 6. Appointment Requests System (New API)

**Context**: No API exists. Need to build complete request management system.

#### Q6.1: Request workflow

**Q: Where do appointment requests originate from?**

- **A**: Client portal and we have an AppointmentRequest table where we can see them

**Q: What information is required for a request?**

- **A**: Look into AppointmentRequest table for required fields

**Q: Should requests auto-expire after a certain time?**

- **A**: No, we can skip this for now

#### Q6.2: Approval process

**Q: Who can approve/deny requests (specific clinicians, any admin)?**

- **A**: Both clinicians and admins

**Q: Should approved requests automatically create appointments?**

- **A**: Yes, we need to move data from AppointmentRequest to Appointment table

**Q: Do we need to track reason for denial?**

- **A**: Yes, this is a good suggestion

#### Q6.3: Client matching

**Q: How do we match requests to existing clients vs new clients?**

- **A**: Based on client_id which is nullable in AppointmentRequest

**Q: What validation is needed for new client requests?**

- **A**: Look into AppointmentRequest table for validation requirements

**Q: Should we check for duplicate requests?**

- **A**: No

#### Q6.4: Notifications

**Q: Should email/SMS notifications be sent for new requests?**

- **A**: No

**Q: Who should receive notifications?**

- **A**: No notifications needed

**Q: What happens after approval/denial - notify the requester?**

- **A**: Not sure, we don't have email template for that

### 7. Forgot Password Flow

**Context**: No forgot password functionality exists.

#### Q7.1: Security requirements

**Q: How long should password reset tokens be valid?**

- **A**: 1 hour

**Q: Should we implement rate limiting for reset requests?**

- **A**: Yes please

**Q: Do we need to notify users of password reset attempts?**

- **A**: Yes

#### Q7.2: Verification

**Q: Should we use email-only verification or additional factors?**

- **A**: Email-only verification would be fine

**Q: Do we need security questions as backup?**

- **A**: No

**Q: Should we force password change on next login after reset?**

- **A**: No

### 8. Settings - Appointment Request Widget (/api/appointment-request-widget)

#### Q8.1: Widget customization

**Answer**: For this we just need to store the widget HTML in practice settings table, nothing else.

**Q: What visual customization options are needed?**

- **A**: Covered by storing HTML in practice settings

**Q: Should the widget be embeddable on external websites?**

- **A**: Covered by storing HTML in practice settings

**Q: Do we need multiple widget configurations for different use cases?**

- **A**: Covered by storing HTML in practice settings

#### Q8.2: Widget behavior

**Note**: All questions below are covered by the simple HTML storage approach.

### 9. Settings - Contact Form (/api/contact-form)

**Note**: Need to save this in Practice Settings table.

#### Q9.1: Form configuration

**Q: What fields should be configurable (required vs optional)?**

- **A**: To be determined based on practice settings requirements

**Q: Should forms support custom fields?**

- **A**: To be determined based on practice settings requirements

**Q: Do we need different forms for different purposes?**

- **A**: To be determined based on practice settings requirements

#### Q9.2: Form handling

**Q: Where should form submissions be routed?**

- **A**: To be determined based on practice settings requirements

**Q: Do we need auto-response functionality?**

- **A**: To be determined based on practice settings requirements

**Q: Should submissions create leads in the system?**

- **A**: To be determined based on practice settings requirements

### 10. Settings - Shareable Documents (/api/shareable-documents)

**Answer**: Ignore this entire section.

### 11. Settings - Payroll (/api/payroll)

**Answer**: We don't have this option in our simple practice - skip this section.

### 12. Settings - Payment (/api/payment-settings)

**Note**: These questions need to be answered to implement payment settings.

#### Q12.1: Payment processing

**Q: Which payment processor(s) need to be supported?**

- **A**: To be determined

**Q: Should we store encrypted payment credentials?**

- **A**: To be determined

**Q: Do we need separate configurations for different locations?**

- **A**: To be determined

#### Q12.2: Payment policies

**Q: Should we support payment plans or recurring payments?**

- **A**: To be determined

**Q: What fee structures need to be configurable?**

- **A**: To be determined

**Q: Do we need to handle refund policies?**

- **A**: To be determined

### 13. Settings - Text Messaging (/api/text-messaging)

**Note**: These questions need to be answered to implement text messaging.

#### Q13.1: SMS provider

**Q: Which SMS service should we integrate with?**

- **A**: To be determined (Twilio, AWS SNS, other)

**Q: Do we need two-way messaging or just outbound?**

- **A**: To be determined

**Q: Should we support MMS for document sharing?**

- **A**: To be determined

#### Q13.2: Message templates

**Q: What types of automated messages are needed?**

- **A**: To be determined (appointment reminders, confirmations, follow-ups)

**Q: How far in advance should reminders be sent?**

- **A**: To be determined

**Q: Should messages be customizable per clinician or practice-wide?**

- **A**: To be determined

#### Q13.3: Compliance

**Q: How do we handle opt-in/opt-out for TCPA compliance?**

- **A**: To be determined

**Q: Should we log all messages for audit purposes?**

- **A**: To be determined

**Q: Do we need to support quiet hours?**

- **A**: To be determined

## Pages with UI but No API Routes (Using Static/Mock Data)

The following pages have functional UI components but are currently using static or mock data instead of API integration:

### Activity Page

- **Status**: UI exists with mock data, API exists but not integrated
- **Location**: `/activity`
- **Mock Data**: Tab navigation, activity logs, filters all use hardcoded data
- **Existing API**: `/api/activity` endpoint exists but UI doesn't use it

### Analytics Pages

- **Main Dashboard** (`/analytics`)
  - Income chart uses mock data
  - Outstanding balances chart uses mock data
  - Time range filters partially functional
- **Income Report** (`/analytics/income`)
  - Complete UI with mock financial data
  - No API endpoint exists
- **Outstanding Balances** (`/analytics/outstanding-balances`)
  - Grid displays static balance data
  - No API endpoint exists

### Billing Pages

- **Main Billing** (`/billing`)
  - Date range selector uses mock data
  - Invoice list partially integrated
  - Export functionality exists but incomplete
- **Documents** (`/billing/documents`)
  - Table structure exists
  - API exists but integration incomplete

### Requests Page

- **Status**: Complete UI with no backend
- **Location**: `/requests`
- **Features**: Tab navigation (Pending/Archived), approve/deny/archive buttons
- **Mock Data**: All request data is hardcoded
- **Missing**: No API routes for appointment request management

### Settings Pages with No API

The following settings pages have complete UI but no corresponding API endpoints:

1. **Appointment Request Widget** (`/settings/appointment-request-widget`)

   - Widget configuration UI exists
   - No persistence layer

2. **Contact Form** (`/settings/contact-form`)

   - Form settings interface complete
   - No API for saving configuration

3. **Shareable Documents** (`/settings/shareable-documents`)

   - Document management UI exists
   - No backend storage

4. **Payroll** (`/settings/payroll`)

   - Payroll settings interface present
   - No API implementation

5. **Payment Settings** (`/settings/payment`)

   - Payment configuration UI complete
   - No persistence endpoints

6. **Text Messaging** (`/settings/text`)
   - SMS configuration interface exists
   - No API for SMS provider integration

### Implementation Notes

- These pages demonstrate the UI-first development approach
- Mock data allows for UI/UX testing before backend implementation
- Each page requires corresponding API endpoints for production use
- Priority should be given to pages that block critical workflows (e.g., Requests, Analytics)

### 14. General Architecture Questions

**Note**: These architectural questions need to be answered for proper system design.

#### Q14.1: Data Retention

**Q: How long should different types of data be retained?**

- **A**: To be determined based on HIPAA requirements

**Q: Do we need soft delete for all entities or hard delete for some?**

- **A**: To be determined based on data type and compliance

**Q: What are the HIPAA requirements for data retention?**

- **A**: To be determined - need to consult HIPAA guidelines

#### Q14.2: Multi-tenancy

**Q: How is practice-level data isolation currently handled?**

- **A**: To be determined based on current architecture

**Q: Do practices share any data or are they completely isolated?**

- **A**: To be determined

**Q: How are user permissions structured across practices?**

- **A**: To be determined

#### Q14.3: Audit Trail

**Q: Should all API endpoints log to the audit trail?**

- **A**: To be determined based on HIPAA requirements

**Q: What level of detail is needed in audit logs?**

- **A**: To be determined

**Q: How long should audit logs be retained?**

- **A**: To be determined based on compliance requirements

#### Q14.4: Performance

**Q: What are acceptable response times for reports with large datasets?**

- **A**: To be determined based on user expectations

**Q: Should we implement caching for analytics data?**

- **A**: To be determined based on data freshness requirements

**Q: Do we need real-time updates or can some data be eventually consistent?**

- **A**: To be determined based on use cases

#### Q14.5: Security

**Q: Are there specific encryption requirements for data at rest?**

- **A**: To be determined based on HIPAA requirements

**Q: Should we implement API rate limiting?**

- **A**: To be determined based on security best practices

**Q: Do we need additional authentication for sensitive operations?**

- **A**: To be determined based on security requirements
