// import { Checkbox } from "@mcw/ui";
// import { CheckedState } from "@radix-ui/react-checkbox";
import type { BillingSettingsFormData } from "./BillingSettingsForm";

interface BillingInvoicesSectionProps {
  formData: BillingSettingsFormData;
  setFormData: React.Dispatch<React.SetStateAction<BillingSettingsFormData>>;
}

export default function BillingInvoicesSection({
  formData,
  setFormData,
}: BillingInvoicesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-base text-[#111827] mb-1.5">
          Automatic invoice creation
        </h3>
        <p className="text-sm text-[#4B5563] mb-4">
          Invoices can be created manually anytime. You can set them to be
          created automatically on a daily or monthly basis.
        </p>
        <div className="space-y-4">
          {["daily", "weekly", "monthly"].map((option) => (
            <div key={option} className="flex items-start gap-3">
              <input
                checked={formData.autoInvoiceCreation === option}
                className="mt-0.5 accent-[#2D8467]"
                id={`invoice-${option}`}
                name="autoInvoiceCreation"
                type="radio"
                value={option}
                onChange={() =>
                  setFormData({
                    ...formData,
                    autoInvoiceCreation:
                      option as BillingSettingsFormData["autoInvoiceCreation"],
                  })
                }
              />
              <label className="cursor-pointer" htmlFor={`invoice-${option}`}>
                <span className="font-normal text-gray-900 capitalize">
                  {option}: Automatically create invoices{" "}
                  {option === "daily"
                    ? "at the end of each day"
                    : option === "weekly"
                      ? "at the end of each week"
                      : "on the first day of each month"}
                  .
                </span>
                {option === "daily" && (
                  <span className="text-sm text-gray-500 block">
                    (Recommended)
                  </span>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-base text-[#111827] mb-1.5">
          Past Due Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Mark invoices as past due after
            </span>
            <input
              className="border border-gray-300 rounded-md px-2 py-1 text-sm w-20"
              min={0}
              type="number"
              value={formData.pastDueDays}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = parseInt(value, 10);
                if (!isNaN(parsed) && parsed >= 0 && Number.isInteger(parsed)) {
                  setFormData({
                    ...formData,
                    pastDueDays: parsed,
                  });
                }
              }}
            />
            <span className="text-sm text-gray-700">days</span>
          </div>

          <label className="flex items-center gap-2">
            <input
              checked={formData.emailClientPastDue}
              className="checked:bg-[#2D8467] checked:border-[#2D8467]"
              type="checkbox"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emailClientPastDue: e.target.checked,
                })
              }
            />
            <span className="text-[#111827]">
              Email clients about past due invoices
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
