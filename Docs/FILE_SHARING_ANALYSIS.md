# File Sharing System Analysis

## Overview

This document outlines the implementation plan for a comprehensive file sharing system that integrates with Azure Blob Storage and supports document sharing between clinicians and clients.

## Current Database Schema Analysis

### Relevant Tables

1. **ClientFiles** (Line 788-797)

   - Links clients to files in their group
   - Fields: id, client_group_file_id, client_id, status, survey_answers_id
   - Status field can track sharing status

2. **ClientGroupFile** (Line 662-678)

   - Documents associated with client groups
   - Fields: id, survey_template_id, title, type, url, client_group_id, uploaded_by_id, created_at, updated_at
   - Type field indicates document type (default: "PRACTICE_UPLOAD")
   - URL field will store Azure Blob Storage URLs

3. **SurveyTemplate** (Line 500-517)

   - Templates for forms and questionnaires
   - Has frequency_options field for scored measures
   - is_shareable field indicates if template can be shared

4. **SurveyAnswers** (Line 472-497)
   - Client responses to surveys
   - Has frequency field for tracking recurring assessments

## Proposed Architecture

### Azure Blob Storage Structure

```
container: client-files/
├── {client_id}/
│   ├── uploads/
│   │   ├── {timestamp}_{filename}
│   │   └── ...
│   ├── shared/
│   │   ├── {shared_file_id}_{filename}
│   │   └── ...
│   └── completed/
│       ├── {survey_answer_id}_{filename}
│       └── ...
```

### Database Schema Updates

#### 1. Add Frequency Tracking to ClientFiles

```sql
ALTER TABLE ClientFiles
ADD frequency VARCHAR(50) NULL,
ADD next_due_date DATETIME NULL,
ADD shared_at DATETIME NULL,
ADD completed_at DATETIME NULL;
```

#### 2. Create File Sharing History Table

```sql
CREATE TABLE ClientFileHistory (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  client_file_id UNIQUEIDENTIFIER NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'SHARED', 'COMPLETED', 'VIEWED', 'EXPIRED'
  action_date DATETIME NOT NULL DEFAULT GETDATE(),
  performed_by UNIQUEIDENTIFIER NULL,
  notes TEXT NULL,
  FOREIGN KEY (client_file_id) REFERENCES ClientFiles(id)
);
```

#### 3. Update ClientGroupFile for Better Tracking

```sql
ALTER TABLE ClientGroupFile
ADD is_template BOOLEAN DEFAULT FALSE,
ADD original_template_id UNIQUEIDENTIFIER NULL,
ADD sharing_enabled BOOLEAN DEFAULT TRUE,
ADD expiry_date DATETIME NULL;
```

## Implementation Plan

### Phase 1: File Upload Infrastructure

1. **Azure Blob Storage Integration**

   - Create Azure storage utility functions
   - Implement secure file upload with SAS tokens
   - Set up container structure

2. **File Upload API** (`/api/client/files/upload`)
   - Accept file uploads
   - Validate file types and sizes
   - Store in Azure Blob Storage
   - Create ClientGroupFile record
   - Return secure URL

### Phase 2: File Sharing Functionality

1. **Share Documents Component Updates**

   - Track already shared files (disable re-sharing)
   - Support frequency selection for scored measures
   - Integrate with file upload for non-template files

2. **File Sharing API** (`/api/client/share-file` - existing)
   - Enhance to support both templates and uploaded files
   - Create ClientFiles records for each shared item
   - Set frequency and next_due_date for recurring items
   - Track sharing history

### Phase 3: Frequency Management

1. **Frequency Options**

   - Store in ClientFiles.frequency field
   - Calculate next_due_date based on frequency
   - Options: 'once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'

2. **Automated Reminders**
   - Background job to check due dates
   - Auto-create new ClientFiles entries for recurring items
   - Send notifications

### Phase 4: UI Enhancements

1. **Files Tab Improvements**

   - Show upload status
   - Display shared files with status
   - Indicate if file has been shared (disable re-share)
   - Show frequency for recurring items

2. **Share Documents Modal**
   - Two sections: Templates and Uploaded Files
   - Show sharing status for each item
   - Frequency selector for applicable items

## API Endpoints

### Existing (to enhance)

- `POST /api/client/share-file` - Enhance to handle both templates and files

### New Endpoints

- `POST /api/client/files/upload` - Upload files to Azure
- `GET /api/client/files` - List files for a client/group
- `DELETE /api/client/files/:id` - Delete uploaded file
- `GET /api/client/files/history/:clientId` - Get sharing history
- `PUT /api/client/files/:id/frequency` - Update frequency settings

## Security Considerations

1. **File Access Control**

   - Generate SAS tokens with limited lifetime
   - Validate user permissions before file access
   - Audit all file operations

2. **HIPAA Compliance**

   - Encrypt files at rest in Azure
   - Enable Azure Storage logging
   - Track all access in Audit table

3. **File Validation**
   - Limit file types (PDF, DOC, DOCX, JPG, PNG)
   - Maximum file size: 10MB
   - Virus scanning (Azure Defender)

## Implementation Steps

### Step 1: Azure Storage Setup

1. Configure Azure Storage connection in environment variables
2. Create storage utility functions
3. Set up container structure

### Step 2: Update Database Schema

1. Add new columns to existing tables
2. Create ClientFileHistory table
3. Update Prisma schema

### Step 3: File Upload Feature

1. Create upload API endpoint
2. Add upload UI in Files tab
3. Test file upload flow

### Step 4: Enhance Share Documents

1. Add uploaded files section
2. Implement sharing status tracking
3. Add frequency selection for scored measures
4. Prevent re-sharing of already shared files

### Step 5: Client Portal Integration

1. Allow clients to view shared files
2. Enable file upload from client portal
3. Track completion status

## Technical Details

### Azure Storage Configuration

```typescript
// utils/azureStorage.ts
const containerClient = blobServiceClient.getContainerClient("client-files");

export async function uploadFile(
  clientId: string,
  file: Buffer,
  filename: string,
  metadata?: Record<string, string>,
): Promise<string> {
  const blobName = `${clientId}/uploads/${Date.now()}_${filename}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(file, file.length, {
    metadata,
    blobHTTPHeaders: {
      blobContentType: getMimeType(filename),
    },
  });

  return blockBlobClient.url;
}
```

### Frequency Calculation

```typescript
export function calculateNextDueDate(
  frequency: string,
  fromDate: Date = new Date(),
): Date | null {
  switch (frequency) {
    case "once":
      return null;
    case "weekly":
      return addWeeks(fromDate, 1);
    case "biweekly":
      return addWeeks(fromDate, 2);
    case "monthly":
      return addMonths(fromDate, 1);
    case "quarterly":
      return addMonths(fromDate, 3);
    case "annually":
      return addYears(fromDate, 1);
    default:
      return null;
  }
}
```

## UI Components Structure

### ShareDocuments Component Enhancement

```typescript
interface ShareDocumentsProps {
  // ... existing props
  uploadedFiles?: UploadedFile[];
  onFileSelect?: (fileIds: string[]) => void;
}

interface UploadedFile {
  id: string;
  title: string;
  url: string;
  uploadedAt: Date;
  isShared: boolean;
  sharedAt?: Date;
}
```

### Files Tab Enhancement

```typescript
interface FileItem {
  id: string;
  title: string;
  type: "template" | "upload" | "completed";
  status: "pending" | "shared" | "completed" | "expired";
  sharedAt?: Date;
  completedAt?: Date;
  frequency?: string;
  nextDueDate?: Date;
}
```

## Testing Strategy

1. **Unit Tests**

   - Azure storage utilities
   - Frequency calculation logic
   - Permission checks

2. **Integration Tests**

   - File upload flow
   - Sharing workflow
   - Database updates

3. **E2E Tests**
   - Complete file sharing journey
   - Client portal access
   - Recurring document flow

## Migration Plan

1. **Database Migration**

   - Run schema updates
   - Migrate existing shared documents
   - Set default values

2. **Data Migration**
   - Map existing shared templates to ClientFiles
   - Set initial status values
   - Calculate due dates for recurring items

## Monitoring and Maintenance

1. **Metrics to Track**

   - File upload success rate
   - Average file size
   - Sharing completion rate
   - Storage usage

2. **Maintenance Tasks**
   - Clean up expired files
   - Archive completed documents
   - Monitor storage costs

## Future Enhancements

1. **Version Control**

   - Track document versions
   - Show revision history
   - Compare changes

2. **Bulk Operations**
   - Share multiple files at once
   - Bulk download
   - Batch status updates
