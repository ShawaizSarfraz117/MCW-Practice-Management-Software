"use client";
import { useState } from "react";
import ContactFormHeader from "./components/ContactFormHeader";
import ContactFormBenefits from "./components/ContactFormBenefits";
import ContactFormToggleSection from "./components/ContactFormToggleSection";
import ContactFormWidgetSection from "./components/ContactFormWidgetSection";

export default function ContactFormSettingsPage() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
      <div className="space-y-6">
        <ContactFormHeader enabled={enabled} setEnabled={setEnabled} />
        {enabled ? (
          <>
            <ContactFormToggleSection />
            <ContactFormWidgetSection />
          </>
        ) : (
          <ContactFormBenefits />
        )}
      </div>
    </div>
  );
}
