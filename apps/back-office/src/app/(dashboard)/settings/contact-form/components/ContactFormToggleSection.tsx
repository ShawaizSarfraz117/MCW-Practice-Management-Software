"use client";

import { Switch } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { useState } from "react";
import ContactFormModal from "./ContactFormModal";
import Image from "next/image";
import ProfileLogo from "@/assets/images/profile-logo.svg";
import MonarchWarning from "@/assets/images/MonarchWarning.svg";
import { useContactFormSettings } from "../hooks/useContactFormSettings";
import { useToast } from "@mcw/ui";

export default function ContactFormToggleSection() {
  const [monarchEnabled, setMonarchEnabled] = useState(false);
  const { settings } = useContactFormSettings();
  const { toast } = useToast();
  const contactFormLink = settings?.general?.link || "";

  return (
    <section className="rounded-lg p-0 mt-0">
      <div className="pb-2">
        <p className="text-gray-600 mb-4">
          Contact form inquiries are added to SimplePractice as prospective
          clients. The form can display on your Client Portal and Professional
          Website (depending on your practice's settings).
        </p>
        <label className="block text-gray-900 font-medium mb-2">
          Share your practice's contact form
        </label>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            readOnly
            className="w-[40%] px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm font-mono"
            type="text"
            value={contactFormLink}
          />
          <Button
            className="w-[20] sm:w-auto"
            onClick={() => {
              if (contactFormLink) {
                navigator.clipboard.writeText(contactFormLink);
                toast({
                  title: "Copied!",
                  description: "Contact form link copied to clipboard",
                });
              }
            }}
          >
            Copy
          </Button>
        </div>
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <Image alt="Monarch" height={16} src={ProfileLogo} width={14} />
          <span className="uppercase text-xs font-semibold text-gray-500 tracking-wider">
            Individual Settings
          </span>
        </div>
        <div className="flex items-start bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
          <Image
            alt="Monarch"
            className="mt-1 mr-2"
            height={16}
            src={MonarchWarning}
            width={14}
          />
          <div>
            <div className="font-semibold text-gray-900 mb-1">
              Monarch Directory is off
            </div>
            <div className="text-gray-700 text-sm">
              To receive contact forms through Monarch, this feature must be
              turned on.{" "}
              <a className="text-blue-600 underline" href="#">
                Go to Monarch settings
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pb-2">
          <Switch
            checked={monarchEnabled}
            onCheckedChange={setMonarchEnabled}
            disabled
          />
          <div>
            <div className="font-medium text-gray-400">
              Monarch contact form
            </div>
            <div className="text-gray-400 text-sm">
              Get contact form inquiries from the Monarch Directory
            </div>
          </div>
        </div>
      </div>
      <ContactFormModal
        open={monarchEnabled}
        onClose={() => setMonarchEnabled(false)}
      />
    </section>
  );
}
