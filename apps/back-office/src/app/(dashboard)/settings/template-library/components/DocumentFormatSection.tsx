"use client";

import React from "react";
import { Button } from "@mcw/ui";

export function DocumentFormatSection() {
  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Standard client document format
      </h2>

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include-logo"
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="include-logo" className="text-sm text-gray-900">
            Include practice logo
          </label>
        </div>

        <div className="space-y-2.5">
          <label htmlFor="footer-info" className="block text-sm text-gray-900">
            Footer information
          </label>
          <textarea
            id="footer-info"
            rows={7}
            className="block w-[600px] rounded-md border border-gray-200 text-sm p-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500 resize-none"
            placeholder="Information that will show in the footer of your billing documents goes here. The character limit is 120 characters."
          />
        </div>

        <div className="pt-2">
          <Button variant="default" className="bg-green-700 hover:bg-green-800">
            Save format
          </Button>
        </div>
      </div>
    </div>
  );
}
