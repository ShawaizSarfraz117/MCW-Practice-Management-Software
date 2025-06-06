import type React from "react";
import { useState } from "react";
import { Button } from "@mcw/ui";
import { Textarea } from "@mcw/ui";
import { ProgressSteps } from "./ProgressSteps";
import { Avatar, AvatarFallback } from "@mcw/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ComposeEmailProps {
  clientName: string;
  selectedDocuments: Record<
    string,
    {
      id: string;
      checked: boolean;
      frequency?: string;
    }
  >;
  onBack: () => void;
  onContinue: (content?: string) => void;
  defaultContent?: string;
  emailContent?: string;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({
  clientName,
  selectedDocuments: _selectedDocuments,
  onBack,
  onContinue,
  defaultContent,
  emailContent: initialEmailContent,
}) => {
  const steps = [
    { number: 1, label: clientName },
    { number: 2, label: "Compose Email", isActive: true },
    { number: 3, label: "Review & Send" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const defaultEmailContent =
    defaultContent ||
    `Hi ${clientName},

Welcome to McNulty Counseling and Wellness. Please use the link below to access our secure Client Portal and complete your intake paperwork. Paperwork must be completed at least 24 hours prior to your appointment. If you are unable to complete your paperwork online, please contact our office at 727-344-9867.

[practice_client_portal_login_link]

The address for your appointment is .

Please see below for important information about parking and access at each of our locations:`;

  const [emailContent, setEmailContent] = useState(
    initialEmailContent || defaultEmailContent,
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-semibold mb-6">
        Send documents to {clientName}
      </h2>

      <ProgressSteps steps={steps} />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-gray-100">
            <AvatarFallback>{getInitials(clientName)}</AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-medium">{clientName}'s email</h3>
        </div>

        <div className="border rounded-lg p-4">
          <Textarea
            className="min-h-[300px] border-0 focus-visible:ring-0 p-0 resize-none"
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
          />
        </div>

        <div className="flex justify-between">
          <Button
            className="flex items-center gap-2"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {clientName}
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            onClick={() => onContinue(emailContent)}
          >
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
