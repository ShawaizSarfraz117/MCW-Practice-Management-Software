"use client";

import { Button } from "@mcw/ui";
import { useState } from "react";

const WIDGET_CODE = `<!-- Start SimplePractice Contact Form Widget Embed Code --> <style>.spwidget-button-wrapper{text-align: center;}.spwidget-button{display: inline-block;padding: 6px 24px 7px 24px;margin: 0 auto;background: #4f46e5;color: #fff;border-radius: 6px;font-size: 16px;font-weight: 600;cursor: pointer;transition: background 0.2s;}.spwidget-button:hover{background: #3730a3;}</style><div class="spwidget-button-wrapper"><a class="spwidget-button" href="https://alam-naqvi.clientsecure.me/contact-widget" target="_blank">Contact</a></div><!-- End SimplePractice Contact Form Widget Embed Code -->`;

export default function ContactFormWidgetSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(WIDGET_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="border border-gray-200 rounded-lg p-6 mb-10">
      <h4 className="text-gray-900 font-medium mb-2">Contact form widget</h4>
      <p className="text-gray-600 text-sm mb-4">
        Add the contact form to your website
      </p>
      <div className="mb-4">
        <textarea
          className="w-full font-mono text-xs bg-gray-100 border border-gray-300 rounded-md p-3 resize-none"
          rows={3}
          value={WIDGET_CODE}
          readOnly
        />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleCopy} className="w-full md:w-auto">
          {copied ? "Copied!" : "Copy Code"}
        </Button>
        <Button variant="outline" className="w-full md:w-auto">
          Preview Widget
        </Button>
      </div>
    </section>
  );
}
