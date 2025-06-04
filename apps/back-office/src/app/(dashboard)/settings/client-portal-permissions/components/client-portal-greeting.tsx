"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@mcw/ui";
import ClientPortalGreetingModal from "./clientPortalGreetingModal";

export default function ClientPortalGreetingCard() {
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [greeting, setGreeting] = useState(
    `Hi Karen,\n\nThis Client Portal will help us get started by making it easy for you to review our practice policies and provide some basic information before our first session.\nIf you leave the portal before completing everything, you can use the link we emailed to come back and start over. It should take between 5–20 minutes to finish.`,
  );

  return (
    <>
      <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
        <CardHeader className="pb-0">
          <div className="text-xl font-semibold text-[#1F2937] mb-1">
            Client Portal Greeting
          </div>
          <div className="text-sm text-[#6B7280] mb-2">
            Customize the welcome greeting for clients when they first sign into
            the Client Portal to complete intake documents.{" "}
            <a href="#" className="text-[#2563EB] hover:underline">
              Learn more
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className=" border border-[#E5E7EB] rounded-md p-0">
            <div className="flex items-center justify-between border-b bg-[#F9FAFB] border-[#E5E7EB] px-4 py-2">
              <span className="text-sm font-medium text-[#374151]">
                Welcome Message
              </span>
              <button
                className="text-[#2563EB] text-sm font-medium hover:underline"
                onClick={() => setIsEditingGreeting(true)}
              >
                Edit
              </button>
            </div>
            <div className="px-4 py-3 text-[#374151] text-sm whitespace-pre-line">
              {greeting}
            </div>
          </div>
        </CardContent>
      </Card>
      <ClientPortalGreetingModal
        open={isEditingGreeting}
        onClose={() => setIsEditingGreeting(false)}
        greeting={greeting}
        onSave={setGreeting}
      />
    </>
  );
}
