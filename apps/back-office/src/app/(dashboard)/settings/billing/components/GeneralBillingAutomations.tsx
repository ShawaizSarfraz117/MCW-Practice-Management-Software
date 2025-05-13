"use client";

import { Checkbox } from "@mcw/ui";
import { CheckedState } from "@radix-ui/react-checkbox";

type Automations = {
  allowOnlinePayments: boolean;
  emailReminderPastDue: boolean;
  sendInvoiceEmail: boolean;
};

interface GeneralBillingAutomationsProps {
  automations: Automations;
  onAutomationChange: (
    key: keyof Automations,
  ) => (checked: CheckedState) => void;
}

export default function GeneralBillingAutomations({
  automations,
  onAutomationChange,
}: GeneralBillingAutomationsProps) {
  return (
    <div className="space-y-6" style={{ overflow: "visible" }}>
      <div>
        <h3 className="font-medium text-base text-[#111827] mb-1.5">
          Email automation
        </h3>
        <p className="text-sm text-[#4B5563] mb-4">
          Configure how you want to handle invoice emails
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={automations.sendInvoiceEmail}
              className="data-[state=checked]:bg-[#2D8467] data-[state=checked]:border-[#2D8467]"
              id="sendInvoiceEmail"
              onCheckedChange={onAutomationChange("sendInvoiceEmail")}
            />
            <label
              className="text-[#111827] cursor-pointer"
              htmlFor="sendInvoiceEmail"
            >
              Automatically send invoice emails when invoices are created
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={automations.emailReminderPastDue}
              className="data-[state=checked]:bg-[#2D8467] data-[state=checked]:border-[#2D8467]"
              id="emailReminderPastDue"
              onCheckedChange={onAutomationChange("emailReminderPastDue")}
            />
            <label
              className="text-[#111827] cursor-pointer"
              htmlFor="emailReminderPastDue"
            >
              Email reminders for past due invoices
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-base text-[#111827] mb-1.5">
          Online payments
        </h3>
        <p className="text-sm text-[#4B5563] mb-4">
          Configure payment options for your clients
        </p>
        <div className="flex items-center gap-3">
          <Checkbox
            checked={automations.allowOnlinePayments}
            className="data-[state=checked]:bg-[#2D8467] data-[state=checked]:border-[#2D8467]"
            id="allowOnlinePayments"
            onCheckedChange={onAutomationChange("allowOnlinePayments")}
          />
          <label
            className="text-[#111827] cursor-pointer"
            htmlFor="allowOnlinePayments"
          >
            Allow clients to pay invoices online
          </label>
        </div>
      </div>
    </div>
  );
}
