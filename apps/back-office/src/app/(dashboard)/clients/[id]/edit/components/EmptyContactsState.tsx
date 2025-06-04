import { Button } from "@mcw/ui";
import { EmptyContactsIllustration } from "./EmptyContactsIllustration";

interface EmptyContactsStateProps {
  clientName?: string;
  onAddContact: () => void;
}

export function EmptyContactsState({
  clientName,
  onAddContact,
}: EmptyContactsStateProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-12 text-center">
      <div className="max-w-md mx-auto">
        <EmptyContactsIllustration />

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {clientName} has no contacts
        </h3>

        <p className="text-gray-600 mb-6">
          Add contacts to manage relationships, emergency contacts, and
          communication preferences.
        </p>

        <Button onClick={onAddContact}>+ Add Contact</Button>
      </div>
    </div>
  );
}
