"use client";
import { Switch, Card, CardContent, CardHeader, CardTitle } from "@mcw/ui";
import { useState } from "react";
import ManageAvailabilityModal from "./ManageAvailabilityModal";

export default function AppointmentRequestsCard() {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  return (
    <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-[#1F2937] mb-1">
              Online appointment requests
            </CardTitle>
            <div className="text-sm text-[#6B7280] mb-2">
              Let clients request appointments online to simplify calendar
              management.{" "}
              <a href="#" className="text-[#2563EB] hover:underline">
                Learn about appointment requests
              </a>
            </div>
          </div>
          <Switch
            checked={expanded}
            onCheckedChange={setExpanded}
            className="mt-1 scale-125 data-[state=checked]:bg-[#188153]"
          />
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="flex items-center bg-[#FFF8E1] border border-[#FFE58F] rounded-md px-4 py-3 mt-4 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#946200] mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
              />
            </svg>
            <span className="text-[#946200] text-sm font-medium flex-1">
              No availability set up
            </span>
            <a
              href="#"
              className="text-[#2563EB] hover:underline"
              onClick={() => setShowModal(true)}
            >
              Manage availability
            </a>
          </div>
          <ManageAvailabilityModal
            open={showModal}
            onClose={() => setShowModal(false)}
          />
          <div className="mb-6">
            <div className="font-medium text-[#374151] mb-2">
              New Client Appointment Requests
            </div>
            <div className="text-sm text-[#6B7280] mb-2">
              Allow requests from new clients
            </div>
            <div className="text-xs text-[#6B7280] mb-2">
              To set which services are available for new clients,{" "}
              <a href="#" className="text-[#2563EB] hover:underline">
                go to billing and services
              </a>
            </div>
            <div className="flex gap-6 mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="allowNewClients"
                  className="accent-[#188153]"
                  id="allowYes"
                />
                <label htmlFor="allowYes" className="text-sm text-[#374151]">
                  Yes
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="allowNewClients"
                  className="accent-[#188153]"
                  id="allowNo"
                />
                <label htmlFor="allowNo" className="text-sm text-[#374151]">
                  No
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-[#188153]" /> New
                individual clients
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-[#188153]" /> New
                couple clients
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-[#188153]" /> New
                contacts (on behalf of someone else)
              </label>
            </div>
          </div>
          <div className="mb-6">
            <div className="font-medium text-[#374151] mb-2">
              Information collected from new clients
            </div>
            <div className="mb-4">
              <div className="flex items-start flex-col gap-2 mb-1">
                <span className="text-sm text-[#374151]">
                  Show new client prescreener
                </span>
                <span className="text-xs text-[#6B7280]">
                  Ask for background information when new clients request an
                  appointment.{" "}
                  <a href="#" className="text-[#2563EB] hover:underline">
                    Learn more about the prescreener
                  </a>
                </span>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="prescreener"
                    className="accent-[#188153]"
                    id="prescreenerYes"
                  />
                  <label
                    htmlFor="prescreenerYes"
                    className="text-sm text-[#374151]"
                  >
                    Yes
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="prescreener"
                    className="accent-[#188153]"
                    id="prescreenerNo"
                  />
                  <label
                    htmlFor="prescreenerNo"
                    className="text-sm text-[#374151]"
                  >
                    No
                  </label>
                </div>
              </div>
            </div>
            <hr className="my-4 w-[40%]" />
            <div className="mb-4">
              <div className="flex items-start flex-col gap-2 mb-1">
                <span className="text-sm text-[#374151]">
                  Ask for preferred payment method
                </span>
                <span className="text-xs text-[#6B7280]">
                  New clients can indicate if they plan to use insurance or
                  self-pay.{" "}
                  <a href="#" className="text-[#2563EB] hover:underline">
                    Learn more about the payment method question
                  </a>
                </span>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="accent-[#188153]"
                    id="paymentYes"
                  />
                  <label
                    htmlFor="paymentYes"
                    className="text-sm text-[#374151]"
                  >
                    Yes
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="accent-[#188153]"
                    id="paymentNo"
                  />
                  <label htmlFor="paymentNo" className="text-sm text-[#374151]">
                    No
                  </label>
                </div>
              </div>
            </div>
            <hr className="my-4 w-[40%]" />
            <div>
              <div className="flex items-start flex-col gap-2 mb-1">
                <span className="text-sm text-[#374151]">
                  Require credit card to request appointment
                </span>
                <span className="text-xs text-[#6B7280]">
                  Credit cards are not charged when an appointment is requested.
                  To accept credit cards,{" "}
                  <a href="#" className="text-[#2563EB] hover:underline">
                    set up online payments
                  </a>
                </span>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="requireCard"
                    className="accent-[#188153]"
                    id="cardYes"
                  />
                  <label htmlFor="cardYes" className="text-sm text-[#374151]">
                    Yes
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="requireCard"
                    className="accent-[#188153]"
                    id="cardNo"
                  />
                  <label htmlFor="cardNo" className="text-sm text-[#374151]">
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
