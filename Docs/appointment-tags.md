# Appointment Tags System

## Overview

The appointment tags system allows categorizing and tracking appointments with various status indicators. Tags are automatically applied when appointments are created and can be updated based on various events.

## Default Tags

The system includes 5 default tags:

1. **Appointment Paid** (Green #10b981) - Applied when an appointment's invoice is fully paid
2. **Appointment Unpaid** (Red #ef4444) - Default tag for all new appointments
3. **New Client** (Blue #3b82f6) - Applied to the first appointment for a client group
4. **No Note** (Amber #f59e0b) - Default tag when no notes are attached
5. **Note Added** (Light Green #22c55e) - Applied when notes are added to an appointment

## Automatic Tag Assignment

### On Appointment Creation

When a new appointment is created, the following tags are automatically assigned:

- **Appointment Unpaid** - All appointments start as unpaid
- **No Note** - All appointments start without notes
- **New Client** - If this is the first appointment for the client group

### On Payment

When an invoice associated with an appointment is fully paid:

- **Appointment Unpaid** is removed
- **Appointment Paid** is added

### On Note Addition

When notes are added to an appointment:

- **No Note** is removed
- **Note Added** is added

## API Endpoints

### GET /api/appointment-tags

- Get all available tags: `GET /api/appointment-tags`
- Get tags for specific appointment: `GET /api/appointment-tags?appointmentId={id}`

### POST /api/appointment-tags

Add a tag to an appointment:

```json
{
  "appointmentId": "appointment-id",
  "tagId": "tag-id"
}
```

### PUT /api/appointment-tags

Replace all tags for an appointment:

```json
{
  "appointmentId": "appointment-id",
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

### DELETE /api/appointment-tags

Remove a specific tag:
`DELETE /api/appointment-tags?appointmentId={id}&tagId={tagId}`

## Database Schema

### Tag Table

```sql
Tag {
  id: UUID (Primary Key)
  name: String
  color: String (Hex color code)
}
```

### AppointmentTag Table (Junction)

```sql
AppointmentTag {
  id: UUID (Primary Key)
  appointment_id: UUID (Foreign Key to Appointment)
  tag_id: UUID (Foreign Key to Tag)

  Unique constraint on (appointment_id, tag_id)
}
```

## Implementation Details

### Helper Functions

The system provides two helper functions that can be called from other parts of the application:

1. **updatePaymentStatusTag(appointmentId, isPaid)**

   - Updates payment status tag based on payment state
   - Called automatically from invoice payment processing

2. **updateNoteStatusTag(appointmentId, hasNote)**
   - Updates note status tag based on note presence
   - Should be called when notes are added/removed from appointments

### Integration Points

1. **Appointment Creation** (`/api/appointment/route.ts`)

   - Calls `addDefaultAppointmentTags()` after creating appointment
   - Handles both single and recurring appointments

2. **Invoice Payment** (`/api/invoice/payment/route.ts`)

   - Calls `updatePaymentStatusTag()` when invoice is fully paid

3. **Calendar Display**
   - Appointment queries include `AppointmentTag` with nested `Tag` data
   - Tags can be displayed as badges on appointment cards

## Testing

The system includes comprehensive tests:

1. **Unit Tests** (`__tests__/api/appointment-tags/route.unit.test.ts`)

   - Tests all CRUD operations
   - Tests helper functions
   - Uses mocked Prisma client

2. **Integration Tests** (`__tests__/api/appointment-tags/route.integration.test.ts`)
   - Tests with real database
   - Tests automatic tag assignment
   - Tests tag updates through various workflows

## Seed Data

Tags are seeded with consistent IDs for easier testing:

- Appointment Paid: `11111111-1111-1111-1111-111111111111`
- Appointment Unpaid: `22222222-2222-2222-2222-222222222222`
- New Client: `33333333-3333-3333-3333-333333333333`
- No Note: `44444444-4444-4444-4444-444444444444`
- Note Added: `55555555-5555-5555-5555-555555555555`

## Future Enhancements

Potential areas for expansion:

1. Custom tags creation by users
2. Tag-based filtering in calendar view
3. Bulk tag operations
4. Tag-based reporting and analytics
5. Integration with appointment notes API when implemented
6. Automated tag rules based on custom criteria
