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
              <a className="text-[#2563EB] hover:underline" href="#">
                Learn about appointment requests
              </a>
            </div>
          </div>
          <Switch
            checked={expanded}
            className="mt-1 scale-125 data-[state=checked]:bg-[#188153]"
            onCheckedChange={setExpanded}
          />
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="flex items-center bg-[#FFF8E1] border border-[#FFE58F] rounded-md px-4 py-3 mt-4 mb-6">
            <svg
              className="h-5 w-5 text-[#946200] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span className="text-[#946200] text-sm font-medium flex-1">
              No availability set up
            </span>
            <a
              className="text-[#2563EB] hover:underline"
              href="#"
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
              <a className="text-[#2563EB] hover:underline" href="#">
                go to billing and services
              </a>
            </div>
            <div className="flex gap-6 mb-2">
              <div className="flex items-center gap-2">
                <input
                  className="accent-[#188153]"
                  id="allowYes"
                  name="allowNewClients"
                  type="radio"
                />
                <label className="text-sm text-[#374151]" htmlFor="allowYes">
                  Yes
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="accent-[#188153]"
                  id="allowNo"
                  name="allowNewClients"
                  type="radio"
                />
                <label className="text-sm text-[#374151]" htmlFor="allowNo">
                  No
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input className="accent-[#188153]" type="checkbox" /> New
                individual clients
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input className="accent-[#188153]" type="checkbox" /> New
                couple clients
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input className="accent-[#188153]" type="checkbox" /> New
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
                  <a className="text-[#2563EB] hover:underline" href="#">
                    Learn more about the prescreener
                  </a>
                </span>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    className="accent-[#188153]"
                    id="prescreenerYes"
                    name="prescreener"
                    type="radio"
                  />
                  <label
                    className="text-sm text-[#374151]"
                    htmlFor="prescreenerYes"
                  >
                    Yes
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="accent-[#188153]"
                    id="prescreenerNo"
                    name="prescreener"
                    type="radio"
                  />
                  <label
                    className="text-sm text-[#374151]"
                    htmlFor="prescreenerNo"
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
                  <a className="text-[#2563EB] hover:underline" href="#">
                    Learn more about the payment method question
                  </a>
                </span>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    className="accent-[#188153]"
                    id="paymentYes"
                    name="paymentMethod"
                    type="radio"
                  />
                  <label
                    className="text-sm text-[#374151]"
                    htmlFor="paymentYes"
                  >
                    Yes
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="accent-[#188153]"
                    id="paymentNo"
                    name="paymentMethod"
                    type="radio"
                  />
                  <label className="text-sm text-[#374151]" htmlFor="paymentNo">
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
                  <a className="text-[#2563EB] hover:underline" href="#">
                    set up online payments
                  </a>
                </span>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    className="accent-[#188153]"
                    id="cardYes"
                    name="requireCard"
                    type="radio"
                  />
                  <label className="text-sm text-[#374151]" htmlFor="cardYes">
                    Yes
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="accent-[#188153]"
                    id="cardNo"
                    name="requireCard"
                    type="radio"
                  />
                  <label className="text-sm text-[#374151]" htmlFor="cardNo">
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
