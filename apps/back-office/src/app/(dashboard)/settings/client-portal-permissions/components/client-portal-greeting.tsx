"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@mcw/ui";
import ClientPortalGreetingModal from "./clientPortalGreetingModal";

interface ClientPortalGreetingCardProps {
  settings: {
    general?: {
      welcomeMessage?: string | null;
    };
  } | null;
  loading: boolean;
  stageChanges: (updates: {
    general?: {
      welcomeMessage?: string;
    };
  }) => void;
}

export default function ClientPortalGreetingCard({
  settings,
  loading,
  stageChanges,
}: ClientPortalGreetingCardProps) {
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);

  const welcomeMessage =
    settings?.general?.welcomeMessage ||
    `Hi Karen,

This Client Portal will help us get started by making it easy for you to review our practice policies and provide some basic information before our first session.
If you leave the portal before completing everything, you can use the link we emailed to come back and start over. It should take between 5–20 minutes to finish.`;

  const handleSaveGreeting = (newGreeting: string) => {
    stageChanges({
      general: {
        welcomeMessage: newGreeting,
      },
    });
  };

  if (loading) {
    return (
      <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
        <CardHeader className="pb-0">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
          </div>
        </CardHeader>
      </Card>
    );
  }

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
            <a className="text-[#2563EB] hover:underline" href="#">
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
              {welcomeMessage}
            </div>
          </div>
        </CardContent>
      </Card>
      <ClientPortalGreetingModal
        greeting={welcomeMessage}
        open={isEditingGreeting}
        onClose={() => setIsEditingGreeting(false)}
        onSave={handleSaveGreeting}
      />
    </>
  );
}
