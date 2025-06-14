# EditRecurringAvailabilityModal Usage Example

This document shows how to integrate the `EditRecurringAvailabilityModal` component into the `AvailabilitySidebar`.

## Import and State Setup

```typescript
// Add this import at the top of AvailabilitySidebar.tsx
import { EditRecurringAvailabilityModal } from "./EditRecurringAvailabilityModal";

// Add these state variables to the component
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editOption, setEditOption] = useState<"single" | "future" | "all">(
  "single",
);
```

## Modified Save Handler

```typescript
// Modify the handleSave function to show the modal for recurring availabilities
const handleSave = async () => {
  try {
    // Check if this is a recurring availability being edited
    if (isEditMode && availabilityData?.is_recurring && isRecurring) {
      // Show the edit modal instead of saving directly
      setIsEditModalOpen(true);
      return;
    }

    // Rest of the existing save logic...
    // ... existing implementation
  } catch (error) {
    setGeneralError(
      error instanceof Error ? error.message : "Failed to save availability",
    );
  }
};
```

## Modal Confirm Handler

```typescript
// Add this new handler for the modal confirmation
const handleEditConfirm = async () => {
  try {
    // Close the modal first
    setIsEditModalOpen(false);

    // Construct the payload
    const payload = {
      title: title || "Availability",
      start_date: getDateTimeUTC(
        availabilityFormValues.startDate,
        availabilityFormValues.startTime,
      ),
      end_date: getDateTimeUTC(
        availabilityFormValues.endDate,
        availabilityFormValues.endTime,
      ),
      location_id: selectedLocation,
      clinician_id: availabilityFormValues.clinician,
      allow_online_requests: allowOnlineRequests,
      is_recurring: isRecurring,
      recurring_rule: isRecurring ? createRecurringRule() : null,
      selectedServices: localSelectedServices,
      editOption: editOption, // Include the edit option
    };

    // Call the API with the edit option
    const response = await fetch(
      `/api/availability?id=${availabilityData.id}&editOption=${editOption}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || "Failed to save availability");
    }

    // ... rest of the cache invalidation logic from original handleSave

    // Close sidebar after refresh
    onOpenChange(false);
  } catch (error) {
    setGeneralError(
      error instanceof Error ? error.message : "Failed to save availability",
    );
  }
};
```

## Modal Component Integration

```typescript
// Add this modal component at the end of the JSX, after the DeleteAvailabilityModal
<EditRecurringAvailabilityModal
  open={isEditModalOpen}
  selectedOption={editOption}
  onConfirm={handleEditConfirm}
  onOpenChange={setIsEditModalOpen}
  onOptionChange={setEditOption}
/>
```

## Complete Integration Points

1. **Import the component** at the top of AvailabilitySidebar.tsx
2. **Add state variables** for modal visibility and selected option
3. **Modify handleSave** to show modal for recurring availability edits
4. **Add handleEditConfirm** to process the actual save with edit option
5. **Add the modal component** to the JSX alongside DeleteAvailabilityModal

The modal will automatically:

- Show when editing a recurring availability
- Provide three radio button options for edit scope
- Call the confirm handler with the selected option
- Follow the same styling and UX patterns as DeleteAvailabilityModal
