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

**Questions**:

1. Should the activity logs include IP address and location tracking? If yes:

   - Should we track IP addresses for all user actions or just login events?
   - Do we need to use a geolocation service to convert IPs to locations?
   - Are there any HIPAA considerations for storing IP addresses?

2. For the HIPAA Audit Log tab:

   - Which specific events should be classified as HIPAA-relevant?
   - Should HIPAA events include: patient record access, modifications, exports, sharing?
   - Do we need additional fields like "reason for access" for HIPAA compliance?

3. For filtering and search:
   - Should the search function search across all fields or specific ones (event text, user email, client name)?
   - For the time range filter, what should be the maximum allowed date range?
   - Should we implement pagination or infinite scroll for large result sets?

### 2. Analytics - Income Report (/api/analytics/income)

**Context**: The income report needs to show daily/weekly/monthly income with client payments, gross income, and net income.

**Questions**:

1. Income calculation:

   - How should gross income be calculated? (Sum of all invoiced amounts? Only paid amounts?)
   - How is net income calculated? (Gross income minus what expenses?)
   - Should income include pending/unpaid invoices or only completed payments?

2. Data aggregation:

   - Should the report show data per clinician or practice-wide?
   - Do we need to track income by service type or payment method?
   - Should refunds/adjustments be tracked separately?

3. Export functionality:
   - What specific fields should be included in CSV/PDF exports?
   - Should exports include patient names or use anonymized IDs for HIPAA compliance?

### 3. Analytics - Outstanding Balances (/api/analytics/outstanding-balances)

**Context**: Report showing client balances with services provided, uninvoiced amounts, invoiced amounts, and payments.

**Questions**:

1. Balance calculations:

   - How do we determine "services provided" - all completed appointments?
   - What constitutes "uninvoiced" - appointments without associated invoices?
   - Should we track partial payments and payment plans?

2. Filtering options:

   - Should we allow filtering by balance threshold (e.g., show only balances > $100)?
   - Filter by age of debt (30, 60, 90+ days)?
   - Filter by insurance vs self-pay clients?

3. Data presentation:
   - Should client names be sortable while maintaining HIPAA compliance?
   - Do we need to show last payment date or payment history?

### 4. Analytics - Appointment Status (/api/analytics/appointment-status)

**Context**: Report with 3 tabs showing appointment details, documentation status, and client responsibility.

**Questions**:

1. Appointment data:

   - How are billing codes determined for each appointment?
   - How do we calculate rate per unit and units?
   - What defines the different progress note statuses (no note, unlocked, supervision, locked)?

2. Documentation tab:

   - What specific documentation is tracked?
   - What are the compliance requirements for documentation?
   - How long after an appointment can documentation be modified?

3. Client responsibility:
   - How is client responsibility calculated vs insurance coverage?
   - Should we track copays, deductibles, and coinsurance separately?

### 5. Billing Integration

**Context**: Billing pages have existing APIs but aren't fully integrated with the UI.

**Questions**:

1. Payment processing:

   - Do you use a specific payment processor (Stripe, Square, etc.)?
   - Should we store payment method details for recurring billing?
   - What payment methods need to be supported (credit card, ACH, check)?

2. Invoice generation:

   - Should invoices be automatically generated after appointments?
   - What numbering scheme should be used for invoices?
   - Do we need to support batch invoicing?

3. Export functionality:
   - What format should payment exports use for accounting software compatibility?
   - Should exports include patient PHI or use anonymized data?

### 6. Appointment Requests System (New API)

**Context**: No API exists. Need to build complete request management system.

**Questions**:

1. Request workflow:

   - Where do appointment requests originate from? (Client portal, website widget, phone?)
   - What information is required for a request?
   - Should requests auto-expire after a certain time?

2. Approval process:

   - Who can approve/deny requests (specific clinicians, any admin)?
   - Should approved requests automatically create appointments?
   - Do we need to track reason for denial?

3. Client matching:

   - How do we match requests to existing clients vs new clients?
   - What validation is needed for new client requests?
   - Should we check for duplicate requests?

4. Notifications:
   - Should email/SMS notifications be sent for new requests?
   - Who should receive notifications (assigned clinician, all admins)?
   - What happens after approval/denial - notify the requester?

### 7. Forgot Password Flow

**Context**: No forgot password functionality exists.

**Questions**:

1. Security requirements:

   - How long should password reset tokens be valid?
   - Should we implement rate limiting for reset requests?
   - Do we need to notify users of password reset attempts?

2. Verification:
   - Should we use email-only verification or additional factors?
   - Do we need security questions as backup?
   - Should we force password change on next login after reset?

### 8. Settings - Appointment Request Widget (/api/appointment-request-widget)

**Questions**:

1. Widget customization:

   - What visual customization options are needed (colors, logo, text)?
   - Should the widget be embeddable on external websites?
   - Do we need multiple widget configurations for different use cases?

2. Widget behavior:
   - Should widgets be tied to specific clinicians or services?
   - How do we handle after-hours requests?
   - Do we need CAPTCHA or spam protection?

### 9. Settings - Contact Form (/api/contact-form)

**Questions**:

1. Form configuration:

   - What fields should be configurable (required vs optional)?
   - Should forms support custom fields?
   - Do we need different forms for different purposes?

2. Form handling:
   - Where should form submissions be routed (email, database, both)?
   - Do we need auto-response functionality?
   - Should submissions create leads in the system?

### 10. Settings - Shareable Documents (/api/shareable-documents)

**Questions**:

1. Document types:

   - What types of documents need to be shareable (consent forms, intake forms, educational materials)?
   - Should documents be version-controlled?
   - Do we need to track who accessed shared documents?

2. Sharing mechanism:
   - How should documents be shared (secure links, client portal, email)?
   - Should shared links expire?
   - Do we need to track document completion/signature?

### 11. Settings - Payroll (/api/payroll)

**Questions**:

1. Payroll configuration:

   - What payroll periods need to be supported (weekly, bi-weekly, semi-monthly, monthly)?
   - Should payroll be calculated based on appointments, hours, or salary?
   - Do we need to track different pay rates for different services?

2. Integration:
   - Do you use a specific payroll service that needs integration?
   - Should the system generate payroll reports or just track configuration?
   - Do we need to track PTO, sick leave, or other time-off?

### 12. Settings - Payment (/api/payment-settings)

**Questions**:

1. Payment processing:

   - Which payment processor(s) need to be supported?
   - Should we store encrypted payment credentials?
   - Do we need separate configurations for different locations?

2. Payment policies:
   - Should we support payment plans or recurring payments?
   - What fee structures need to be configurable?
   - Do we need to handle refund policies?

### 13. Settings - Text Messaging (/api/text-messaging)

**Questions**:

1. SMS provider:

   - Which SMS service should we integrate with (Twilio, AWS SNS, other)?
   - Do we need two-way messaging or just outbound?
   - Should we support MMS for document sharing?

2. Message templates:

   - What types of automated messages are needed (appointment reminders, confirmations, follow-ups)?
   - How far in advance should reminders be sent?
   - Should messages be customizable per clinician or practice-wide?

3. Compliance:
   - How do we handle opt-in/opt-out for TCPA compliance?
   - Should we log all messages for audit purposes?
   - Do we need to support quiet hours?

### 14. General Architecture Questions

1. **Data Retention**:

   - How long should different types of data be retained?
   - Do we need soft delete for all entities or hard delete for some?
   - What are the HIPAA requirements for data retention?

2. **Multi-tenancy**:

   - How is practice-level data isolation currently handled?
   - Do practices share any data or completely isolated?
   - How are user permissions structured across practices?

3. **Audit Trail**:

   - Should all API endpoints log to the audit trail?
   - What level of detail is needed in audit logs?
   - How long should audit logs be retained?

4. **Performance**:

   - What are acceptable response times for reports with large datasets?
   - Should we implement caching for analytics data?
   - Do we need real-time updates or can some data be eventually consistent?

5. **Security**:
   - Are there specific encryption requirements for data at rest?
   - Should we implement API rate limiting?
   - Do we need additional authentication for sensitive operations?

Please provide answers to these questions so I can implement the missing functionality with the correct business logic and requirements.
