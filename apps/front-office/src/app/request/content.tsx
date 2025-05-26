"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Stepper, type Step } from "../components/Stepper";
import { useRequest } from "./context";

export default function RequestContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appointmentData, currentStep, onUpdate } = useRequest();

  const steps: Step[] = [
    {
      id: 1,
      label: "Appointment info",
      summary: appointmentData.service
        ? {
            service: appointmentData.service,
            office: appointmentData.office,
            dateTime: appointmentData.dateTime,
            appointmentFor:
              appointmentData.appointmentFor === "me"
                ? "Me"
                : appointmentData.appointmentFor === "partner-and-me"
                  ? "My partner and me"
                  : appointmentData.appointmentFor === "someone-else"
                    ? "Someone else"
                    : undefined,
          }
        : undefined,
      isCompleted: Boolean(
        appointmentData.service &&
          appointmentData.office &&
          appointmentData.dateTime &&
          appointmentData.appointmentFor,
      ),
    },
    {
      id: 2,
      label: "Reason for visit",
      summary: appointmentData.reasons
        ? {
            reasons: appointmentData.reasons,
            history: appointmentData.history,
            additionalInfo: appointmentData.additionalInfo,
          }
        : undefined,
      isCompleted: currentStep > 2,
    },
    {
      id: 3,
      label: "Your info",
      summary: appointmentData.contactInfo
        ? {
            name: `${appointmentData.contactInfo.legalFirstName} ${appointmentData.contactInfo.legalLastName}`,
            email: appointmentData.contactInfo.email,
            phone: appointmentData.contactInfo.phone,
            ...(appointmentData.appointmentFor === "partner-and-me" &&
              appointmentData.contactInfo.partnerInfo && {
                partner: `${appointmentData.contactInfo.partnerInfo.legalFirstName} ${appointmentData.contactInfo.partnerInfo.legalLastName}`,
              }),
            ...(appointmentData.appointmentFor === "someone-else" &&
              appointmentData.contactInfo.clientInfo && {
                client: `${appointmentData.contactInfo.clientInfo.legalFirstName} ${appointmentData.contactInfo.clientInfo.legalLastName}`,
                isMinor: appointmentData.contactInfo.clientInfo.isMinor,
              }),
          }
        : undefined,
      isCompleted: Boolean(appointmentData.contactInfo),
    },
  ];

  const handleStepClick = (
    stepId: number,
    section?: "service" | "office" | "datetime",
  ) => {
    if (stepId === 1) {
      if (section === "service") {
        router.push("/request/service");
        onUpdate?.({
          service: undefined,
          office: undefined,
          dateTime: undefined,
        });
      } else if (section === "office") {
        router.push("/request/location");
        onUpdate?.({ office: undefined, dateTime: undefined });
      } else if (section === "datetime") {
        const currentDate = searchParams.get("currentDate");
        const currentTimeZone = searchParams.get("currentTimeZone");
        const query =
          currentDate && currentTimeZone
            ? `?currentDate=${currentDate}&currentTimeZone=${currentTimeZone}`
            : "";
        router.push(`/request/date${query}`);
        onUpdate?.({ dateTime: undefined });
      }
    } else if (stepId === 2) {
      router.push("/request/message");
    } else if (stepId === 3) {
      router.push("/request/information");
    }
  };

  return (
    <div className="flex gap-12">
      {/* Left Side - Stepper */}
      <Stepper
        currentStep={currentStep}
        steps={steps}
        onStepClick={handleStepClick}
      />

      {/* Right Side - Form Content */}
      <div className="flex-1">
        {/* Sign In Notice */}
        <div className="bg-gray-100 p-4 rounded mb-8">
          <p className="text-gray-700">
            Already a client? To request an appointment,{" "}
            <Link className="text-green-700 hover:underline" href="/login">
              Sign In
            </Link>
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
