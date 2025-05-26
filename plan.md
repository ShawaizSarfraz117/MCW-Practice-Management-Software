# Notification Settings Implementation Plan

## Overview

This document outlines the implementation plan for three key notification features:

1. **Email Notification Settings** - Management of email templates for automated notifications, reminders, and billing documents
2. **Text Message Notification Settings** - Management of text message templates for various reminder types
3. **Client Reminder Preferences** - Client-specific preferences for receiving different types of reminders

## 1. Email Notification Settings

### Feature Description

Allows users to manage and preview email templates for automated, reminder, and billing document notifications. Users can edit the subject and content of these templates, and toggle the preview functionality for reminder emails.

### Implementation Details

#### Route Structure

- **Path:** `/settings/notifications/email`
- **Layout:** Settings layout with tabs or nested routes for different notification types
- **Components:**
  - `page.tsx` - Main page component
  - `EmailTemplateList.tsx` - Component to display and manage list of email templates
  - `EmailTemplateEditor.tsx` - Component to edit email template subject and content

#### API Endpoints

1. **Fetch All Email Templates**

   - **Path:** `/api/email-templates`
   - **Method:** GET
   - **Query Parameters:** Optional `type` (e.g., 'automated', 'reminder', 'billing_document')
   - **Response:** Array of EmailTemplate objects with id, name, subject, content, and type

2. **Fetch Specific Email Template**

   - **Path:** `/api/email-templates/:id`
   - **Method:** GET
   - **Response:** Single EmailTemplate object

3. **Update Email Template**

   - **Path:** `/api/email-templates/:id`
   - **Method:** PUT
   - **Request Body:** `{ "subject": "string", "content": "string" }`
   - **Response:** Updated EmailTemplate object

4. **Fetch Practice Settings**

   - **Path:** `/api/practice-settings`
   - **Method:** GET
   - **Response:** Object containing practice settings, including reminder email preview setting

5. **Update Practice Settings**
   - **Path:** `/api/practice-settings`
   - **Method:** PUT
   - **Request Body:** `{ "key": "string", "value": "string" }`
   - **Response:** Updated PracticeSettings object

#### Database Interactions

- **Tables:** EmailTemplate, PracticeSettings
- **Queries:**
  - Find many EmailTemplate records based on type
  - Find unique EmailTemplate record by ID
  - Update EmailTemplate record by ID
  - Find unique PracticeSettings record by key
  - Update PracticeSettings record by key

#### UI Components

- **Suggested Components:** Table, Button, Dialog, Form, Input, Textarea, Switch, Card, Label
- **Key Interactions:**
  - Click to open email template for editing
  - Edit subject and content fields
  - Toggle reminder email preview setting on/off
  - Save changes

#### Implementation Tasks

1. Create page component and route structure
2. Implement EmailTemplateList component with filtering capabilities
3. Implement EmailTemplateEditor component with form validation
4. Connect components to API endpoints using data fetching hooks
5. Implement preview toggle functionality with PracticeSettings API
6. Add confirmation dialogs for saving changes
7. Implement error handling and success notifications

## 2. Text Message Notification Settings

### Feature Description

Manages text message templates for various reminder types (appointment, telehealth, document, cancellation). Users can add predefined macros and links to the message content and toggle the enablement of text reminders in practice settings.

### Implementation Details

#### Route Structure

- **Path:** `/settings/notifications/text-messages`
- **Layout:** Settings layout with tabs or nested routes for different notification types
- **Components:**
  - `page.tsx` - Main page component
  - `ReminderTextTemplateList.tsx` - Component to display and manage list of text templates
  - `ReminderTextTemplateEditor.tsx` - Component to edit text template content with macro support

#### API Endpoints

1. **Fetch All Reminder Text Templates**

   - **Path:** `/api/reminder-text-templates`
   - **Method:** GET
   - **Query Parameters:** Optional `type` (e.g., 'appointment', 'telehealth', 'document', 'cancellation')
   - **Response:** Array of ReminderTextTemplates objects with id, type, and content

2. **Fetch Specific Reminder Text Template**

   - **Path:** `/api/reminder-text-templates/:id`
   - **Method:** GET
   - **Response:** Single ReminderTextTemplates object

3. **Update Reminder Text Template**

   - **Path:** `/api/reminder-text-templates/:id`
   - **Method:** PUT
   - **Request Body:** `{ "content": "string" }`
   - **Response:** Updated ReminderTextTemplates object

4. **Fetch Practice Settings**

   - **Path:** `/api/practice-settings`
   - **Method:** GET
   - **Response:** Object containing practice settings, including text reminder enablement settings

5. **Update Practice Settings**
   - **Path:** `/api/practice-settings`
   - **Method:** PUT
   - **Request Body:** `{ "key": "string", "value": "string" }`
   - **Response:** Updated PracticeSettings object

#### Database Interactions

- **Tables:** ReminderTextTemplates, PracticeSettings
- **Queries:**
  - Find many ReminderTextTemplates records based on type
  - Find unique ReminderTextTemplates record by ID
  - Update ReminderTextTemplates record by ID
  - Find unique PracticeSettings record by key
  - Update PracticeSettings record by key

#### UI Components

- **Suggested Components:** Table, Button, Dialog, Form, Input, Textarea, Switch, Card, Label
- **Key Interactions:**
  - Click to open text template for editing
  - Edit content field, adding macros/links
  - Toggle text reminder enablement settings
  - Save changes

#### Implementation Tasks

1. Create page component and route structure
2. Implement ReminderTextTemplateList component with filtering capabilities
3. Implement ReminderTextTemplateEditor component with macro insertion functionality
4. Create a macro selector component for adding predefined variables
5. Connect components to API endpoints using data fetching hooks
6. Implement text reminder enablement toggle with PracticeSettings API
7. Add character count display to ensure messages stay within SMS length limits
8. Add confirmation dialogs for saving changes
9. Implement error handling and success notifications

## 3. Client Reminder Preferences

### Feature Description

Manages individual client's preferences for receiving various types of reminders (e.g., appointment, billing) and through which channels (e.g., email, text).

### Implementation Details

#### Route Structure

- **Path:** `/clients/:clientId/reminder-preferences`
- **Layout:** Client profile layout with relevant sub-navigation
- **Components:**
  - `page.tsx` - Main page component
  - `ClientReminderPreferenceForm.tsx` - Form component for managing client reminder preferences

#### API Endpoints

1. **Fetch Client Reminder Preferences**

   - **Path:** `/api/clients/:clientId/reminder-preferences`
   - **Method:** GET
   - **Response:** Array of ClientReminderPreference objects

2. **Update Client Reminder Preference**
   - **Path:** `/api/clients/:clientId/reminder-preferences/:id`
   - **Method:** PUT
   - **Request Body:** `{ "is_enabled": "boolean", "channel": "string", "contact_id": "string" }`
   - **Response:** Updated ClientReminderPreference object

#### Database Interactions

- **Tables:** ClientReminderPreference, Client, ClientContact
- **Queries:**
  - Find many ClientReminderPreference records for a given client_id
  - Update ClientReminderPreference record by ID for a given client_id

#### UI Components

- **Suggested Components:** Form, Switch, Select, Button, Card, Label
- **Key Interactions:**
  - Toggle reminder types on/off for a client
  - Select preferred communication channels
  - Save preferences

#### Implementation Tasks

1. Create page component and route structure within client profile
2. Implement ClientReminderPreferenceForm component with form validation
3. Connect component to API endpoints using data fetching hooks
4. Add logic to display available communication channels based on client contact information
5. Implement preference toggle functionality per reminder type
6. Add confirmation dialog for saving changes
7. Implement error handling and success notifications

## Implementation Timeline

### Phase 1: Email Notification Settings (1-2 weeks)

- Week 1: Build route structure, core components, and API integration
- Week 2: Complete UI refinement, testing, and bug fixes

### Phase 2: Text Message Notification Settings (1-2 weeks)

- Week 1: Build route structure, core components, and API integration
- Week 2: Implement macro functionality, UI refinement, and testing

### Phase 3: Client Reminder Preferences (1 week)

- Build route structure, form components, and API integration
- Complete UI refinement, testing, and bug fixes

## Technical Considerations

### State Management

- Use React Query for API data fetching, caching, and state management
- Implement form state management with React Hook Form or TanStack Form

### API Implementation

- Follow RESTful principles for endpoint design
- Implement proper error handling and validation
- Use NextAuth.js middleware for route protection

### Security

- Ensure proper authentication and authorization
- Validate all user inputs both client-side and server-side
- Sanitize template content to prevent XSS attacks

### Testing

- Implement unit tests for API routes and utility functions
- Add integration tests for critical user flows
- Include UI component testing with appropriate test libraries

## Dependencies

### Core Dependencies

- Next.js (App Router)
- React Query for data fetching
- React Hook Form or TanStack Form for form management
- Prisma for database queries
- UI components from shared UI library

### Additional Tools

- Email template validator
- Text message character counter
- Macro insertion utility functions
