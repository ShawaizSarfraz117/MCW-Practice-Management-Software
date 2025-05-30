# Email & Text Templates - Product Requirements Document

## Overview

This document outlines the requirements for implementing email and text template management functionality within the MCW Practice Management Software. These features will allow healthcare practitioners to customize various communication templates sent to clients.

## Features

### 1. Email Templates Management

#### 1.1 Email Templates List

- **Path**: `/settings/email-templates`
- **Description**: A dashboard page that displays all available email templates with filtering and search capabilities.
- **User Stories**:
  - As a practice administrator, I want to view all email templates so I can manage client communications.
  - As a clinician, I want to preview email templates to understand what my clients receive.

#### 1.2 Email Template Editing

- **Description**: A modal dialog that allows editing of individual email templates.
- **User Stories**:
  - As a practice administrator, I want to customize email template content to match my practice's branding and communication style.
  - As a clinician, I want to edit email subjects and content to provide clear information to clients.

#### 1.3 Email Reminders Settings

- **Path**: `/settings/practice/email-reminders`
- **Description**: A settings page that allows toggling of global email reminder functionality.
- **User Stories**:
  - As a practice administrator, I want to enable/disable email reminders globally to control automated communications.

### 2. Text Message Templates Management

#### 2.1 Text Templates List

- **Path**: `/settings/text-templates`
- **Description**: A dashboard page that displays all available text message templates.
- **User Stories**:
  - As a practice administrator, I want to view all text templates to ensure consistent client communications.
  - As a clinician, I want to understand what text messages my clients receive for various notifications.

#### 2.2 Text Template Editing

- **Description**: A modal dialog that allows editing of individual text message templates.
- **User Stories**:
  - As a practice administrator, I want to customize text message content to be concise yet informative.
  - As a clinician, I want to include relevant macros in text templates to personalize client communications.

#### 2.3 Text Reminders Settings

- **Path**: `/settings/practice/text-reminders`
- **Description**: A settings page that allows toggling of global text reminder functionality.
- **User Stories**:
  - As a practice administrator, I want to enable/disable text reminders globally to control automated communications.

## Technical Implementation

### Database Schema

#### Email Templates

```
Table: EmailTemplate
- id: String (UniqueIdentifier, PK)
- name: String (VarChar(255))
- subject: String (VarChar(255))
- content: String (Text)
- type: String (VarChar(50))
- email_type: String (VarChar(250), nullable)
- created_at: DateTime
- updated_at: DateTime
- created_by: String (UniqueIdentifier)
```

#### Text Message Templates

```
Table: ReminderTextTemplates
- id: String (UniqueIdentifier, PK)
- type: String (VarChar(250))
- content: String (Text)
```

#### Practice Settings

```
Table: PracticeSettings
- id: String (UniqueIdentifier, PK)
- key: String (VarChar(250))
- value: String (NVarChar(Max))
```

### API Endpoints

#### Email Templates

1. **Get All Email Templates**

   - Path: `/api/email-templates`
   - Method: `GET`
   - Response: Array of EmailTemplate objects

2. **Update Email Template**

   - Path: `/api/email-templates/[id]`
   - Method: `PUT`
   - Request Body: `{ subject: string, content: string }`
   - Response: Updated EmailTemplate object

3. **Get Email Reminder Settings**

   - Path: `/api/practice-settings/email-reminders`
   - Method: `GET`
   - Response: `{ isReminderEmailsEnabled: boolean }`

4. **Update Email Reminder Settings**
   - Path: `/api/practice-settings/email-reminders`
   - Method: `PUT`
   - Request Body: `{ isReminderEmailsEnabled: boolean }`
   - Response: Updated settings object

#### Text Message Templates

1. **Get All Text Templates**

   - Path: `/api/text-templates`
   - Method: `GET`
   - Response: Array of ReminderTextTemplates objects

2. **Update Text Template**

   - Path: `/api/text-templates/[id]`
   - Method: `PUT`
   - Request Body: `{ content: string }`
   - Response: Updated ReminderTextTemplates object

3. **Get Text Reminder Settings**

   - Path: `/api/practice-settings/text-reminders`
   - Method: `GET`
   - Response: `{ isTextRemindersEnabled: boolean }`

4. **Update Text Reminder Settings**
   - Path: `/api/practice-settings/text-reminders`
   - Method: `PUT`
   - Request Body: `{ isTextRemindersEnabled: boolean }`
   - Response: Updated settings object

### Component Structure

#### Email Templates Management

1. **Email Templates List**

   - `app/settings/email-templates/page.tsx`: Main page component
   - `app/settings/email-templates/components/EmailTemplateList.tsx`: List container
   - `app/settings/email-templates/components/EmailTemplateRow.tsx`: Individual template row
   - `app/settings/email-templates/components/EmailTemplateEditForm.tsx`: Edit form component

2. **Email Reminder Settings**
   - `app/settings/practice/email-reminders/page.tsx`: Main page component
   - `app/settings/practice/email-reminders/components/EmailReminderSettings.tsx`: Settings container

#### Text Message Templates Management

1. **Text Templates List**

   - `app/settings/text-templates/page.tsx`: Main page component
   - `app/settings/text-templates/components/TextTemplateList.tsx`: List container
   - `app/settings/text-templates/components/TextTemplateRow.tsx`: Individual template row
   - `app/settings/text-templates/components/TextTemplateEditForm.tsx`: Edit form component

2. **Text Reminder Settings**
   - `app/settings/practice/text-reminders/page.tsx`: Main page component
   - `app/settings/practice/text-reminders/components/TextReminderSettings.tsx`: Settings container

### UI Components

1. **Shared UI Components**:
   - `Table`: For displaying template lists
   - `Dialog`: For edit modals
   - `Form`, `Input`, `Textarea`: For editing templates
   - `Button`: For actions
   - `Switch`: For toggling reminder settings
   - `Card`: For containing settings

### Data Flow

1. **Email Template Editing**:

   - User selects template from list
   - Edit dialog opens with template data
   - User edits subject/content and submits
   - API updates template in database
   - UI refreshes to show updated template

2. **Text Template Editing**:

   - Similar flow to email templates, with focus on text content

3. **Reminder Settings**:
   - User toggles switch for reminder type
   - API updates setting in database
   - Confirmation shown to user

## Accessibility & Security

- All forms must be keyboard navigable
- Template editors should provide clear feedback on save/cancel
- Email content should support basic HTML formatting
- All API endpoints should validate user permissions
- Template content should be sanitized to prevent XSS attacks

## Dependencies

- NextJS App Router for page routing
- React Query for API data fetching and caching
- Prisma ORM for database interactions
- UI components from shared package

## Future Considerations

- Support for more complex email templates with images/attachments
- Template versioning and history
- Template categories or tags for better organization
- Automated template testing/previewing
- Support for multi-language templates
