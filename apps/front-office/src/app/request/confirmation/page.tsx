"use client";

import { Button } from "@mcw/ui";
import {
  CalendarDays,
  MapPin,
  User,
  Users,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import { useRequest } from "@/request/context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import newMeeting from "@/assets/images/newMeeting.png";

export default function ConfirmationPage() {
  const { appointmentData, reset } = useRequest();
  const router = useRouter();
  const [cancelled, setCancelled] = useState(false);

  // Redirect to first step if data is not complete
  useEffect(() => {
    if (
      !appointmentData.contactInfo ||
      !appointmentData.service ||
      !appointmentData.office ||
      !appointmentData.dateTime
    ) {
      router.push("/request/service");
    }
  }, [appointmentData, router]);

  const calendarButtons = [
    {
      label: "GOOGLE",
      onClick: () => {
        // Implement Google Calendar integration
      },
    },
    {
      label: "APPLE",
      onClick: () => {
        // Implement Apple Calendar integration
      },
    },
    {
      label: "OUTLOOK",
      onClick: () => {
        // Implement Outlook Calendar integration
      },
    },
  ];

  const getPatientName = () => {
    if (!appointmentData.contactInfo) return "";

    if (appointmentData.appointmentFor === "me") {
      return `${appointmentData.contactInfo.legalFirstName} ${appointmentData.contactInfo.legalLastName}`;
    } else if (appointmentData.appointmentFor === "partner-and-me") {
      return `${appointmentData.contactInfo.legalFirstName} ${appointmentData.contactInfo.legalLastName} and ${appointmentData.contactInfo.partnerInfo?.legalFirstName} ${appointmentData.contactInfo.partnerInfo?.legalLastName}`;
    } else if (
      appointmentData.appointmentFor === "someone-else" &&
      appointmentData.contactInfo.clientInfo
    ) {
      return `${appointmentData.contactInfo.clientInfo.legalFirstName} ${appointmentData.contactInfo.clientInfo.legalLastName}`;
    }
    return "";
  };

  const formatDateTime = () => {
    if (!appointmentData.dateTime) return { date: "", time: "" };
    try {
      const dateObj = new Date(appointmentData.dateTime);
      return {
        date: format(dateObj, "MMMM d, yyyy"),
        time: format(dateObj, "h:mm a"),
      };
    } catch {
      return { date: appointmentData.dateTime, time: "" };
    }
  };

  const { date, time } = formatDateTime();

  if (cancelled) {
    return (
      <div className="flex flex-col items-center justify-center bg-white min-h-[40vh] py-4">
        <div className="flex flex-col items-center">
          <div className="bg-green-600 rounded-full p-2 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="text-lg font-medium mb-4 text-center">
            Your appointment has been cancelled.
          </div>
          <Button
            className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-none font-semibold text-sm"
            onClick={() => {
              reset();
              router.push("/request");
            }}
          >
            BOOK A NEW APPOINTMENT
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white  py-8 px-2">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold">
            Your appointment has been requested!
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            You'll get an email with the details of your requested appointment.
            Your appointment is not confirmed until you get another email saying
            that your request has been accepted.
          </p>
        </div>
        <div className="flex gap-4 w-full max-w-md mx-auto mt-10">
          <Button
            variant="outline"
            className="flex-1 rounded-none"
            onClick={() => setCancelled(true)}
          >
            CANCEL APPOINTMENT
          </Button>
          <Button
            className="flex-1 bg-green-700 rounded-none hover:bg-green-800"
            onClick={() => {
              reset();
              router.push("/login");
            }}
          >
            Done
          </Button>
        </div>
        <div className="flex flex-row gap-3 md:flex-row md:gap-4 w-full mt-8">
          {/* Left Column */}
          <div className="flex-1 space-y-8">
            {/* Who */}
            <div className="flex items-start gap-4">
              <User className="w-7 h-7 text-green-700 mt-1" />
              <div>
                <div className="font-semibold text-lg">Who</div>
                <div className="text-gray-800 text-base">
                  {getPatientName()}
                </div>
              </div>
            </div>
            {/* When */}
            <div className="flex items-start gap-4">
              <CheckSquare className="w-7 h-7 text-green-700 mt-1" />
              <div>
                <div className="font-semibold text-lg">When</div>
                <div className="text-gray-800 text-base">
                  {date && <div>{date}</div>}
                  {time && <div>{time} PKT</div>}
                </div>
              </div>
            </div>
            {/* With */}
            <div className="flex items-start gap-4">
              <Users className="w-7 h-7 text-green-700 mt-1" />
              <div>
                <div className="font-semibold text-lg">With</div>
                <div className="text-gray-800 text-base">
                  {appointmentData.service?.title}
                </div>
              </div>
            </div>
            {/* What */}
            <div className="flex items-start gap-4">
              <MessageSquare className="w-7 h-7 text-green-700 mt-1" />
              <div>
                <div className="font-semibold text-lg">What</div>
                <div className="text-gray-800 text-base">
                  {appointmentData.service?.title ||
                    "Psychiatric Diagnostic Evaluation"}
                </div>
              </div>
            </div>
          </div>
          {/* Center Column */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Where */}
            <div className="flex items-start gap-4 mb-4">
              <MapPin className="w-7 h-7  text-green-700 mt-1" />
              <div>
                <div className="font-semibold text-lg">Where</div>
                <div className="text-gray-800 text-base">
                  {appointmentData.office?.name}
                  <br />
                  {appointmentData.office?.type === "video" && (
                    <span>
                      Video link will be emailed to you 10 minutes before
                      <br />
                    </span>
                  )}
                  {appointmentData.office?.phone}
                </div>
              </div>
            </div>
            <Image
              src={newMeeting}
              alt="Meeting Illustration"
              width={280}
              height={220}
              className="object-contain rounded-lg bg-gray-50"
              priority
            />
          </div>
          {/* Right Column */}
          <div className="flex-1 space-y-8">
            {/* Add to Calendar */}
            <div className="flex flex-col items-center gap-2">
              <CalendarDays className="w-7 h-7 text-green-700" />
              <span className="font-semibold">Add to Calendar</span>
              <div className="flex gap-2 mt-2">
                {calendarButtons.map((button) => (
                  <Button
                    key={button.label}
                    variant="outline"
                    size="sm"
                    onClick={button.onClick}
                    className="bg-gray-100 hover:bg-gray-200 min-w-[90px]"
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
      </div>
    </div>
  );
}
