import type React from "react";
import { Checkbox } from "@mcw/ui";
import { Label } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { FILE_FREQUENCY_OPTIONS, FILE_FREQUENCY_LABELS } from "@mcw/types";

interface DocumentItem {
  id: string;
  label: string;
  checked?: boolean;
  frequency?: boolean;
  sharedOn?: Date | string;
  status?: string;
}

interface DocumentSectionProps {
  title: string;
  items: DocumentItem[];
  selectedDocuments?: Record<string, { checked: boolean; frequency?: string }>;
  onToggle?: (id: string) => void;
  onFrequencyChange?: (id: string, frequency: string) => void;
  context?: "appointment" | "client-share";
  emptyMessage?: string;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  title,
  items,
  selectedDocuments,
  onToggle,
  onFrequencyChange,
  context = "appointment",
  emptyMessage,
}) => {
  // Always render the section with empty state if no items
  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm text-gray-600">{title}</h3>
        <div className="text-gray-400 text-sm">
          {emptyMessage || `No ${title.toLowerCase()} available`}
        </div>
      </div>
    );
  }

  const showStatusColumns = context === "client-share";

  return (
    <div className="space-y-3">
      <h3 className="text-sm text-gray-600">{title}</h3>

      {/* Show column headers for client context */}
      {showStatusColumns && (
        <div className="grid grid-cols-12 gap-4 text-xs text-gray-500 font-medium pb-2 border-b">
          <div className="col-span-6"></div>
          <div className="col-span-2">Frequency</div>
          <div className="col-span-2">Last shared</div>
          <div className="col-span-2">Status</div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const isChecked =
            selectedDocuments?.[item.id]?.checked ?? item.checked;
          const showFrequency = item.frequency && isChecked;

          if (showStatusColumns) {
            // Client context layout with columns
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-6 flex items-center gap-2">
                  <Checkbox
                    checked={isChecked}
                    id={item.id}
                    onCheckedChange={() => onToggle?.(item.id)}
                  />
                  <Label
                    htmlFor={item.id}
                    className="cursor-pointer"
                    onClick={() => onToggle?.(item.id)}
                  >
                    {item.label}
                  </Label>
                </div>
                <div className="col-span-2">
                  {showFrequency ? (
                    <Select
                      value={
                        selectedDocuments?.[item.id]?.frequency ??
                        FILE_FREQUENCY_OPTIONS.ONCE
                      }
                      onValueChange={(value) =>
                        onFrequencyChange?.(item.id, value)
                      }
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FILE_FREQUENCY_OPTIONS).map(
                          ([_key, value]) => (
                            <SelectItem key={value} value={value}>
                              {FILE_FREQUENCY_LABELS[value]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </div>
                <div className="col-span-2 text-xs">
                  {item.sharedOn
                    ? new Date(item.sharedOn).toLocaleDateString()
                    : "Not sent"}
                </div>
                <div className="col-span-2 text-xs">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Sent"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status || "Not sent"}
                  </span>
                </div>
              </div>
            );
          } else {
            // Appointment context layout
            return (
              <div key={item.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isChecked}
                    id={item.id}
                    onCheckedChange={() => onToggle?.(item.id)}
                  />
                  <Label
                    htmlFor={item.id}
                    className="cursor-pointer"
                    onClick={() => onToggle?.(item.id)}
                  >
                    {item.label}
                  </Label>
                </div>
                {showFrequency && (
                  <div className="ml-6">
                    <Select
                      value={
                        selectedDocuments?.[item.id]?.frequency ??
                        FILE_FREQUENCY_OPTIONS.ONCE
                      }
                      onValueChange={(value) =>
                        onFrequencyChange?.(item.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FILE_FREQUENCY_OPTIONS).map(
                          ([_key, value]) => (
                            <SelectItem key={value} value={value}>
                              {FILE_FREQUENCY_LABELS[value]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};
