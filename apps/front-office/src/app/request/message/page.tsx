"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequest } from "../context";
import { Button, Checkbox, Textarea } from "@mcw/ui";

export default function MessagePage() {
  const router = useRouter();
  const { setCurrentStep } = useRequest();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");

  const reasons = [
    "Anxiety",
    "Behavioral issues",
    "Grief",
    "Substance use",
    "Other",
    "Attentional difficulties",
    "Depression",
    "Relationship issues",
    "Trauma",
  ];

  const historyOptions = [
    "In therapy now",
    "In therapy in the past",
    "Taking psychiatric medication now",
    "Taken psychiatric medication in the past",
    "Hospitalized for mental health reasons now or recently",
    "Hospitalized for mental health reasons in the past",
    "Known neurologic or genetic disorder",
    "Attempted suicide in the past",
    "None of these apply",
  ];

  const handleReasonChange = (reason: string) => {
    setSelectedReasons((prev) => {
      if (prev.includes(reason)) {
        return prev.filter((r) => r !== reason);
      }
      if (prev.length < 3) {
        return [...prev, reason];
      }
      return prev;
    });
  };

  const handleHistoryChange = (option: string) => {
    setHistory((prev) => {
      if (prev.includes(option)) {
        return prev.filter((o) => o !== option);
      }
      return [...prev, option];
    });
  };

  // const handleSubmit = () => {
  //   onUpdate({
  //     reasons: selectedReasons,
  //     history: history,
  //     additionalInfo: additionalInfo
  //   });
  //   setCurrentStep(3);
  //   router.push('/request/information');
  // };

  const handleSkip = () => {
    setCurrentStep(3);
    router.push("/request/information");
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Why are you seeking care? */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-gray-900">
          Why are you seeking care?
        </h2>
        <p className="text-sm text-gray-600">
          Select up to 3 of the following options
        </p>
        <div className="grid grid-cols-2 gap-4">
          {reasons.map((reason) => (
            <div key={reason} className="flex items-start space-x-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedReasons.includes(reason)}
                  id={`reason-${reason}`}
                  onCheckedChange={() => handleReasonChange(reason)}
                />
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor={`reason-${reason}`}
                >
                  {reason}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What is your history with mental health? */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-gray-900">
          What is your history with mental health?
        </h2>
        <p className="text-sm text-gray-600">Select all that apply</p>
        <div className="space-y-3">
          {historyOptions.map((option) => (
            <div key={option} className="flex items-start space-x-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={history.includes(option)}
                  id={`history-${option}`}
                  onCheckedChange={() => handleHistoryChange(option)}
                />
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor={`history-${option}`}
                >
                  {option}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-gray-900">
          Is there anything else you would like the practitioner to know?
        </h2>
        <p className="text-sm text-gray-600">
          For example: what you'd like to focus on, insurance or payment
          questions, etc.
        </p>
        <Textarea
          maxLength={600}
          placeholder="Enter any additional information..."
          rows={4}
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
        />
        <p className="text-sm text-gray-500">Limited to 600 characters</p>
      </div>

      {/* Warning Notice */}
      <div className="text-xs text-gray-500">
        By sending message, you agree that you may be providing personal health
        information (“PHI”). Monarch (website provider) cannot guarantee that
        such information will remain private, as this is the responsibility of
        recipient. You release Monarch from any liability associated with
        disclosure of PHI by recipient.
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end space-x-4">
        <Button className="rounded-none" variant="default" onClick={handleSkip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
