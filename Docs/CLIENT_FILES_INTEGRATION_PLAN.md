# Client Files Tab Integration Plan

## Overview

This document outlines the implementation plan for integrating the Files tab in the client flow. The integration will connect the existing FilesTab component with the backend APIs using ClientGroupFile and ClientFiles tables.

## Current State Analysis

### Database Schema

1. **ClientGroupFile** - Stores files associated with client groups
   - Fields: id, survey_template_id, title, type, url, client_group_id, uploaded_by_id, created_at, updated_at, is_template, original_template_id, sharing_enabled, expiry_date
2. **ClientFiles** - Junction table linking individual clients to files
   - Fields: id, client_group_file_id, client_id, status, survey_answers_id, frequency, next_due_date, shared_at, completed_at

### Existing API Routes

1. **GET /api/client/share-file** - Fetches files for a specific client
2. **POST /api/client/share-file** - Shares files/survey templates with clients
3. **GET /api/client/files/upload** - Fetches uploaded files for a client group
4. **POST /api/client/files/upload** - Uploads files to Azure Storage
5. **GET /api/client/group/file** - Fetches files for a client group (needs verification)
6. **POST /api/client/group/file** - Creates ClientGroupFile records

### Current UI Component

- **FilesTab.tsx** - Currently using mock data
- Features: Table view, sorting, search, file actions (download, share, rename, delete)
- Has file upload input but not connected to backend

## Implementation Plan

### Phase 1: Core API Integration

#### 1.1 Fetch Client Files

- **Endpoint**: GET `/api/client/share-file?client_id={id}`
- **Response Type**:

```typescript
interface ClientFileResponse {
  id: string;
  client_group_file_id: string;
  client_id: string;
  status: "Pending" | "Completed" | "Locked" | "Scheduled";
  frequency?: FileFrequency | null;
  next_due_date?: Date | null;
  shared_at?: Date | null;
  completed_at?: Date | null;
  ClientGroupFile: {
    id: string;
    title: string;
    type: string;
    url: string | null;
    created_at: Date;
    updated_at: Date;
    uploaded_by_id: string | null;
  };
  SurveyAnswers?: {
    id: string;
    // survey answer details
  } | null;
}
```

#### 1.2 Transform Data for UI

- Map backend response to UI format:
  - `name` = ClientGroupFile.title
  - `type` = ClientGroupFile.type (map to UI-friendly names)
  - `status` = ClientFiles.status
  - `updated` = ClientGroupFile.updated_at or shared_at
  - Add color coding based on status

### Phase 2: File Upload Integration

#### 2.1 Update File Upload Handler

- Use POST `/api/client/files/upload`
- Required data:
  - file (File object)
  - client_group_id (from client's group)
  - title (optional, defaults to filename)

#### 2.2 After Upload

- Optionally share the file with the client using POST `/api/client/share-file`
- Refresh the files list

### Phase 3: File Actions Implementation

#### 3.1 Download

- For files with URLs: Direct download from Azure Storage URL
- For survey templates: Generate PDF or redirect to survey completion

#### 3.2 Delete

- **New API Route Needed**: DELETE `/api/client/files/{id}`
- Soft delete the ClientFiles record
- Update status to 'Deleted' or remove from list

#### 3.3 Rename

- **New API Route Needed**: PATCH `/api/client/group/file/{id}`
- Update the title in ClientGroupFile table

#### 3.4 Share with Client

- Use existing ShareDocumentsModal component
- Already integrated with POST `/api/client/share-file`

### Phase 4: Search and Filter

#### 4.1 Client-side Search

- Filter by file name (title)
- Case-insensitive search

#### 4.2 Status Filter

- Filter options:
  - All files
  - Pending
  - Completed
  - Scheduled
  - Locked

### Phase 5: Additional Features

#### 5.1 Type System Updates

Create new types in `@mcw/types`:

```typescript
export interface ClientFile {
  id: string;
  name: string;
  type: FileType;
  status: FileStatus;
  statusColor: string;
  updated: string;
  nameColor: string;
  url?: string | null;
  clientGroupFileId: string;
  frequency?: FileFrequency | null;
  nextDueDate?: Date | null;
}

export type FileType =
  | "Measure"
  | "Assessment"
  | "Document"
  | "Consent"
  | "Practice Upload";
export type FileStatus =
  | "Pending"
  | "Completed"
  | "Locked"
  | "Scheduled"
  | "Uploaded";
```

#### 5.2 Error Handling

- Toast notifications for all operations
- Proper error messages from API
- Loading states during operations

#### 5.3 Real-time Updates

- Refresh file list after upload/delete/rename
- Optimistic updates for better UX

## API Routes Summary

### Existing Routes (To Use)

1. GET `/api/client/share-file?client_id={id}` - Fetch client files
2. POST `/api/client/files/upload` - Upload new file
3. POST `/api/client/share-file` - Share files with client

### New Routes (To Create)

1. DELETE `/api/client/files/{id}` - Delete a file
2. PATCH `/api/client/group/file/{id}` - Rename a file
3. GET `/api/client/files/download/{id}` - Generate download URL (optional, if direct URL access needs authorization)

## Testing Requirements

### Unit Tests

- Test data transformation functions
- Test sorting and filtering logic
- Test file type detection

### Integration Tests

- Test all API endpoints with real database
- Test file upload with mock Azure Storage
- Test error scenarios

### UI Tests

- Test file table rendering
- Test user interactions (click, sort, search)
- Test file upload flow

## Security Considerations

1. **Authorization**: Verify user has access to client's files
2. **File Validation**:
   - Allowed types: PDF, DOC, DOCX, JPG, PNG
   - Max size: 10MB
3. **URL Security**: Azure Storage URLs should have SAS tokens with expiry
4. **HIPAA Compliance**: Ensure all file operations are logged

## Performance Considerations

1. **Pagination**: Add pagination for large file lists (future enhancement)
2. **Lazy Loading**: Load file details on demand
3. **Caching**: Cache file list with appropriate invalidation
4. **Optimistic Updates**: Update UI before API confirmation

## Migration from Mock Data

1. Replace `initialFilesData` with API call
2. Update file type mappings
3. Connect all action handlers to API calls
4. Add loading and error states

## Success Criteria

1. All files associated with a client are displayed
2. Users can upload new files
3. Users can perform all file actions (download, share, rename, delete)
4. Search and filter functionality works correctly
5. All operations show appropriate feedback (loading, success, error)
6. Component passes all tests
7. No regression in existing functionality
