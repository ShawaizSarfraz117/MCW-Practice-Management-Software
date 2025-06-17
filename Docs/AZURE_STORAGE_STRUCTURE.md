# Azure Storage Structure for Client Files

## Overview

The client files are organized in Azure Blob Storage using a hierarchical folder structure that provides clear organization and easy navigation.

## Container Structure

```
client-groups/ (container)
├── {client-group-id}/
│   ├── practice-uploads/          # Shared files for the entire group
│   │   ├── file1.pdf
│   │   ├── file2.docx
│   │   └── ...
│   ├── {client-id-1}/            # Client-specific files
│   │   ├── client-upload1.pdf
│   │   ├── shared-file1.pdf      # Copied from practice-uploads
│   │   └── ...
│   └── {client-id-2}/            # Another client's files
│       ├── client-upload1.pdf
│       └── ...
```

## File Types and Locations

### 1. Practice Uploads

- **Location**: `client-groups/{client-group-id}/practice-uploads/`
- **Purpose**: Files uploaded by practice staff that can be shared with multiple clients
- **Type in DB**: `Practice Upload`
- **Example**: Forms, general documents, templates

### 2. Client Uploads

- **Location**: `client-groups/{client-group-id}/{client-id}/`
- **Purpose**: Files uploaded specifically for one client
- **Type in DB**: `Client Upload`
- **Example**: Client-specific documents, personalized forms

### 3. Shared Files (Optional Copy)

- **Location**: `client-groups/{client-group-id}/{client-id}/`
- **Purpose**: When sharing a practice upload with a client, optionally copy it to their folder
- **Type in DB**: Still shows as original type (e.g., `Practice Upload`)
- **Status in DB**: `Shared`

## API Endpoints

### Upload Practice File (Shared)

- **Endpoint**: `POST /api/client/files`
- **Uploads to**: `client-groups/{client-group-id}/practice-uploads/`
- **Creates**: Only `ClientGroupFile` record

### Upload Client-Specific File

- **Endpoint**: `POST /api/client/files/client-upload`
- **Uploads to**: `client-groups/{client-group-id}/{client-id}/`
- **Creates**: Both `ClientGroupFile` and `ClientFiles` records

### Share File with Clients

- **Endpoint**: `POST /api/client/files/share`
- **Options**:
  - Link only: Creates `ClientFiles` record pointing to original
  - Copy to client folder: Copies file to client's folder and creates `ClientFiles` record

## Benefits

1. **Organization**: Clear separation between shared and client-specific files
2. **Security**: Can set permissions at folder level
3. **Scalability**: Easy to navigate as number of files grows
4. **Flexibility**: Files can be shared by reference or copied
5. **Auditability**: Clear file ownership and access patterns

## Migration Notes

For existing files:

- Files in `client-files` container should be migrated to new structure
- Existing URLs in database need to be updated
- Consider batch migration script for production data
