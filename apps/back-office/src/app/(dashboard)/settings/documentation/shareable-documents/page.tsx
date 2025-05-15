"use client";

import { ConsentForms } from "./components/ConsentForms";
import { IntakeForm } from "./components/IntakeForm";

const MOCK_DATA = {
  consentForms: [
    { name: "Consent for Telehealth Consultation", default: true },
    { name: "Credit Card Authorization", default: true },
    { name: "Notice of Privacy Practices", default: true },
    { name: "Informed Consent for Psychotherapy", default: true },
    { name: "Practice Policies", default: true },
  ],
};

export default function ShareableDocumentsPage() {
  return (
    <div className="space-y-8 h-[calc(100vh-4rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Shareable Documents
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage default intake documents and consent forms.
        </p>
      </div>

      {/* Consent Forms */}
      <ConsentForms forms={MOCK_DATA.consentForms} />

      {/* Intake Forms */}
      <IntakeForm />
    </div>
  );
}
