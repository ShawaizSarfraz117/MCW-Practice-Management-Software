import { Button } from "@mcw/ui";
import { ChevronDown, Pencil } from "lucide-react";
import { EmailTemplate, ClientGroupData, ClinicianData } from "../types";
import { renderTemplateWithButton } from "../utils/templateRenderer";

interface BillingEmailsProps {
  templates: EmailTemplate[];
  clientData: ClientGroupData | null;
  clinicianData: ClinicianData | null;
  onEdit: (template: EmailTemplate) => void;
  isBillingSectionOpen: boolean;
  setIsBillingSectionOpen: (open: boolean) => void;
  openBillingIndexes: Set<string>;
  setOpenBillingIndexes: (fn: (prev: Set<string>) => Set<string>) => void;
}

export function BillingEmails({
  templates,
  clientData,
  clinicianData,
  onEdit,
  isBillingSectionOpen,
  setIsBillingSectionOpen,
  openBillingIndexes,
  setOpenBillingIndexes,
}: BillingEmailsProps) {
  const billingTemplates = templates.filter(
    (template) => template.type === "billing",
  );

  const toggleBillingOpen = (templateId: string) => {
    setOpenBillingIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  return (
    <section className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-2">
        <button
          aria-label={
            isBillingSectionOpen ? "Collapse section" : "Expand section"
          }
          className="transition-transform"
          type="button"
          onClick={() => setIsBillingSectionOpen(!isBillingSectionOpen)}
        >
          <ChevronDown
            className={`w-5 h-5 text-gray-900 transition-transform ${isBillingSectionOpen ? "" : "rotate-180"}`}
          />
        </button>
        <h2 className="font-semibold text-lg">Billing document emails</h2>
      </div>
      {isBillingSectionOpen && (
        <>
          <p className="text-gray-600 text-sm mb-4">
            Customize the content for your billing document emails
          </p>
          <div className="divide-y divide-gray-200">
            {billingTemplates.map((template) => (
              <div key={template.id}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-800">{template.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label={
                        openBillingIndexes.has(template.id)
                          ? "Collapse"
                          : "Expand"
                      }
                      className="transition-transform"
                      type="button"
                      onClick={() => toggleBillingOpen(template.id)}
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-gray-900 transition-transform ${openBillingIndexes.has(template.id) ? "rotate-180" : ""}`}
                      />
                    </button>
                    <Button
                      className="p-1"
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(template)}
                    >
                      <Pencil className="w-5 h-5 text-gray-900" />
                    </Button>
                  </div>
                </div>
                {openBillingIndexes.has(template.id) && (
                  <div className="bg-white border rounded-lg p-6 mt-2 mb-4">
                    <div className="font-semibold text-lg mb-2">
                      {template.name}
                    </div>
                    <div className="mb-2 flex flex-col gap-1">
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-500 w-16">From</span>{" "}
                        <span>yourprovider@mcw.com</span>
                      </div>
                      <div className="flex gap-2 text-sm mt-3">
                        <span className="text-gray-500 w-16">Subject</span>{" "}
                        <span className="whitespace-pre-line flex items-center flex-wrap">
                          {renderTemplateWithButton(
                            template.subject || "",
                            clientData,
                            clinicianData,
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2 text-sm items-start mt-3">
                        <span className="text-gray-500 w-16">Message</span>
                        <span className="whitespace-pre-line flex items-center flex-wrap">
                          {renderTemplateWithButton(
                            template.content,
                            clientData,
                            clinicianData,
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Type: {template.type}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {template.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
