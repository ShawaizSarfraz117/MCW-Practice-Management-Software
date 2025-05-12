"use client";

import { useState } from "react";
import { Checkbox } from "@mcw/ui";
import { CheckedState } from "@radix-ui/react-checkbox";

interface AutomaticInvoiceSectionProps {
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export default function AutomaticInvoiceSection({
  defaultValue = "daily",
  onChange,
}: AutomaticInvoiceSectionProps) {
  const [autoInvoice, setAutoInvoice] = useState(defaultValue);

  const handleChange = (value: string) => {
    setAutoInvoice(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div>
      <h3 className="font-medium text-base text-[#111827] mb-1.5">
        Automatic invoice creation
      </h3>
      <p className="text-sm text-[#4B5563] mb-4">
        Invoices can be created manually anytime. You can set them to be created
        automatically on a daily or monthly basis.
      </p>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={autoInvoice === "daily"}
            className="mt-0.5 data-[state=checked]:bg-[#2D8467] data-[state=checked]:border-[#2D8467]"
            id="invoice-daily"
            onCheckedChange={(checked: CheckedState) => {
              if (checked) handleChange("daily");
            }}
          />
          <label className="cursor-pointer" htmlFor="invoice-daily">
            <span className="font-normal text-gray-900 block">
              Daily: Automatically create invoices at the end of each day.
            </span>
            <span className="text-sm text-gray-500">(Recommended)</span>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            checked={autoInvoice === "monthly"}
            className="mt-0.5 data-[state=checked]:bg-[#2D8467] data-[state=checked]:border-[#2D8467]"
            id="invoice-monthly"
            onCheckedChange={(checked: CheckedState) => {
              if (checked) handleChange("monthly");
            }}
          />
          <label className="cursor-pointer" htmlFor="invoice-monthly">
            <span className="font-normal text-gray-900">
              Monthly: Automatically create invoices on the first day of each
              month.
            </span>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            checked={autoInvoice === "manual"}
            className="mt-0.5 data-[state=checked]:bg-[#2D8467] data-[state=checked]:border-[#2D8467]"
            id="invoice-manual"
            onCheckedChange={(checked: CheckedState) => {
              if (checked) handleChange("manual");
            }}
          />
          <label className="cursor-pointer" htmlFor="invoice-manual">
            <span className="font-normal text-gray-900">
              Manually: Do not automate invoices.
            </span>
            <span className="text-sm text-gray-500 block">
              (Only recommended for practices with complex billing workflows)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
