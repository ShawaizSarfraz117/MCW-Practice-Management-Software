"use client";

import { Button } from "@mcw/ui";
import { useState, useEffect } from "react";

export default function ContactFormWidgetSection() {
  const [copied, setCopied] = useState(false);
  const [widgetCode, setWidgetCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWidgetCode();
  }, []);

  const fetchWidgetCode = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/client-care-settings?category=contactForm",
      );

      if (response.ok) {
        const data = await response.json();
        // The widget code is stored in the general.widgetCode field
        setWidgetCode(data.data?.general?.widgetCode || "");
      }
    } catch (error) {
      console.error("Error fetching widget code:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (widgetCode) {
      navigator.clipboard.writeText(widgetCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <section className="border border-gray-200 rounded-lg p-6 mb-10">
      <h4 className="text-gray-900 font-medium mb-2">Contact form widget</h4>
      <p className="text-gray-600 text-sm mb-4">
        Add the contact form to your website
      </p>
      <div className="mb-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        ) : (
          <textarea
            readOnly
            className="w-full font-mono text-xs bg-gray-100 border border-gray-300 rounded-md p-3 resize-none"
            rows={3}
            value={
              widgetCode ||
              "No widget code configured. Please run database seed to initialize widget codes."
            }
          />
        )}
      </div>
      <div className="flex gap-3">
        <Button
          className="w-full md:w-auto"
          disabled={!widgetCode || loading}
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy Code"}
        </Button>
        <Button
          className="w-full md:w-auto"
          disabled={loading}
          variant="outline"
        >
          Preview Widget
        </Button>
      </div>
    </section>
  );
}
