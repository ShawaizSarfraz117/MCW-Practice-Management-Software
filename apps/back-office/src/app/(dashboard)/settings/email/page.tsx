"use client";

import ClientNotificationEmails from "./ClientNotificationEmails";

export default function Email() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Email</h1>
      <p className="text-gray-600 mb-6">
        Automate confirmation and reminder emails.
      </p>
      <ClientNotificationEmails />
    </div>
  );
}
