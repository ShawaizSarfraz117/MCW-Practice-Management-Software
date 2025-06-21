"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@mcw/ui";
import { useDocumentFormatSettings } from "../hooks/useDocumentFormatSettings";

export function DocumentFormatSection() {
  const { settings, updateSettings, isLoading, isUpdating } =
    useDocumentFormatSettings();

  const [localSettings, setLocalSettings] = useState({
    includePracticeLogo: false,
    footerInformation: "",
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        includePracticeLogo: settings.general.includePracticeLogo,
        footerInformation: settings.general.footerInformation || "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      general: localSettings,
    });
  };
  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Standard client document format
      </h2>

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <input
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            id="include-logo"
            type="checkbox"
            checked={localSettings.includePracticeLogo}
            disabled={isLoading}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                includePracticeLogo: e.target.checked,
              })
            }
          />
          <label className="text-sm text-gray-900" htmlFor="include-logo">
            Include practice logo
          </label>
        </div>

        <div className="space-y-2.5">
          <label className="block text-sm text-gray-900" htmlFor="footer-info">
            Footer information
          </label>
          <textarea
            className="block w-[600px] rounded-md border border-gray-200 text-sm p-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500 resize-none"
            id="footer-info"
            placeholder="Information that will show in the footer of your billing documents goes here. The character limit is 120 characters."
            rows={7}
            value={localSettings.footerInformation}
            disabled={isLoading}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                footerInformation: e.target.value,
              })
            }
            maxLength={120}
          />
          <p className="text-xs text-gray-500">
            {localSettings.footerInformation.length}/120 characters
          </p>
        </div>

        <div className="pt-2">
          <Button
            className="bg-green-700 hover:bg-green-800"
            variant="default"
            onClick={handleSave}
            disabled={isLoading || isUpdating}
          >
            {isUpdating ? "Saving..." : "Save format"}
          </Button>
        </div>
      </div>
    </div>
  );
}
