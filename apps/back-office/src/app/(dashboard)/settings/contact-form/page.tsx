"use client";
import { Button } from "@mcw/ui";
import ContactFormHeader from "./components/ContactFormHeader";
import ContactFormBenefits from "./components/ContactFormBenefits";
import ContactFormToggleSection from "./components/ContactFormToggleSection";
import ContactFormWidgetSection from "./components/ContactFormWidgetSection";
import { useContactFormSettings } from "./hooks/useContactFormSettings";

export default function ContactFormSettingsPage() {
  const { settings, loading, saving, hasChanges, saveChanges, toggleForm } =
    useContactFormSettings();

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const enabled = settings?.general?.isEnabled || false;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <ContactFormHeader enabled={enabled} setEnabled={toggleForm} />
          <Button
            disabled={!hasChanges || saving}
            variant="default"
            onClick={saveChanges}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
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
