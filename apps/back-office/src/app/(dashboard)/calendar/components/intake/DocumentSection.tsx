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

interface DocumentItem {
  id: string;
  label: string;
  checked?: boolean;
  frequency?: boolean;
}

interface DocumentSectionProps {
  title: string;
  items: DocumentItem[];
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  title,
  items,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm text-gray-600">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <Checkbox checked={item.checked} id={item.id} />
            <div className="grid gap-1.5">
              <Label htmlFor={item.id}>{item.label}</Label>
              {item.frequency && (
                <Select defaultValue="once">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
