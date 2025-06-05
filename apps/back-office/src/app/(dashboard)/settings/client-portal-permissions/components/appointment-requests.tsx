"use client";
import { Switch, Card, CardContent, CardHeader, CardTitle } from "@mcw/ui";
import { useClientPortalSettings } from "../hooks/useClientPortalSettings";
import ManageAvailabilityModal from "./ManageAvailabilityModal";
import { useState } from "react";

type ClientPortalSettings = NonNullable<
  ReturnType<typeof useClientPortalSettings>["settings"]
>;

function AvailabilityWarning({ onManageClick }: { onManageClick: () => void }) {
  return (
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
        onClick={onManageClick}
      >
        Manage availability
      </a>
    </div>
  );
}

function NewClientRequestSettings({
  settings,
  onAllowNewClientsChange,
  onNewClientTypeChange,
}: {
  settings: ClientPortalSettings | null;
  onAllowNewClientsChange: (allow: boolean) => void;
  onNewClientTypeChange: (type: string, checked: boolean) => void;
}) {
  return (
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
            checked={settings?.allow_new_clients_request ?? false}
            className="accent-[#188153]"
            id="allowYes"
            name="allowNewClients"
            type="radio"
            onChange={() => onAllowNewClientsChange(true)}
          />
          <label className="text-sm text-[#374151]" htmlFor="allowYes">
            Yes
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            checked={!(settings?.allow_new_clients_request ?? false)}
            className="accent-[#188153]"
            id="allowNo"
            name="allowNewClients"
            type="radio"
            onChange={() => onAllowNewClientsChange(false)}
          />
          <label className="text-sm text-[#374151]" htmlFor="allowNo">
            No
          </label>
        </div>
      </div>
      {settings?.allow_new_clients_request && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={settings?.requests_from_new_individuals ?? false}
              className="accent-[#188153]"
              type="checkbox"
              onChange={(e) =>
                onNewClientTypeChange("individuals", e.target.checked)
              }
            />
            New individual clients
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={settings?.requests_from_new_couples ?? false}
              className="accent-[#188153]"
              type="checkbox"
              onChange={(e) =>
                onNewClientTypeChange("couples", e.target.checked)
              }
            />
            New couple clients
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={settings?.requests_from_new_contacts ?? false}
              className="accent-[#188153]"
              type="checkbox"
              onChange={(e) =>
                onNewClientTypeChange("contacts", e.target.checked)
              }
            />
            New contacts (on behalf of someone else)
          </label>
        </div>
      )}
    </div>
  );
}

function InformationCollectionSettings({
  settings,
  onPrescreenerChange,
  onPaymentMethodChange,
  onCreditCardRequirementChange,
}: {
  settings: ClientPortalSettings | null;
  onPrescreenerChange: (show: boolean) => void;
  onPaymentMethodChange: (ask: boolean) => void;
  onCreditCardRequirementChange: (require: boolean) => void;
}) {
  return (
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
              checked={settings?.is_prescreen_new_clinets ?? false}
              className="accent-[#188153]"
              id="prescreenerYes"
              name="prescreener"
              type="radio"
              onChange={() => onPrescreenerChange(true)}
            />
            <label className="text-sm text-[#374151]" htmlFor="prescreenerYes">
              Yes
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              checked={!(settings?.is_prescreen_new_clinets ?? false)}
              className="accent-[#188153]"
              id="prescreenerNo"
              name="prescreener"
              type="radio"
              onChange={() => onPrescreenerChange(false)}
            />
            <label className="text-sm text-[#374151]" htmlFor="prescreenerNo">
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
            New clients can indicate if they plan to use insurance or self-pay.{" "}
            <a className="text-[#2563EB] hover:underline" href="#">
              Learn more about the payment method question
            </a>
          </span>
        </div>
        <div className="flex gap-6 mt-1">
          <div className="flex items-center gap-2">
            <input
              checked={false}
              className="accent-[#188153]"
              id="paymentYes"
              name="paymentMethod"
              type="radio"
              onChange={() => onPaymentMethodChange(true)}
            />
            <label className="text-sm text-[#374151]" htmlFor="paymentYes">
              Yes
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              checked={true}
              className="accent-[#188153]"
              id="paymentNo"
              name="paymentMethod"
              type="radio"
              onChange={() => onPaymentMethodChange(false)}
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
            Credit cards are not charged when an appointment is requested. To
            accept credit cards,{" "}
            <a className="text-[#2563EB] hover:underline" href="#">
              set up online payments
            </a>
          </span>
        </div>
        <div className="flex gap-6 mt-1">
          <div className="flex items-center gap-2">
            <input
              checked={settings?.card_for_appointment_request ?? false}
              className="accent-[#188153]"
              id="cardYes"
              name="requireCard"
              type="radio"
              onChange={() => onCreditCardRequirementChange(true)}
            />
            <label className="text-sm text-[#374151]" htmlFor="cardYes">
              Yes
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              checked={!(settings?.card_for_appointment_request ?? false)}
              className="accent-[#188153]"
              id="cardNo"
              name="requireCard"
              type="radio"
              onChange={() => onCreditCardRequirementChange(false)}
            />
            <label className="text-sm text-[#374151]" htmlFor="cardNo">
              No
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentRequestsCard() {
  const { settings, loading, updateSettings } = useClientPortalSettings();
  const [showModal, setShowModal] = useState(false);

  const handleAppointmentRequestsToggle = async (checked: boolean) => {
    try {
      await updateSettings({ is_appointment_requests_enabled: checked });
    } catch (error) {
      console.error("Failed to update appointment requests setting:", error);
    }
  };

  const handleAllowNewClientsChange = async (allow: boolean) => {
    try {
      await updateSettings({ allow_new_clients_request: allow });
    } catch (error) {
      console.error("Failed to update allow new clients setting:", error);
    }
  };

  const handleNewClientTypeChange = async (type: string, checked: boolean) => {
    try {
      const updates: Record<string, boolean> = {};
      if (type === "individuals") {
        updates.requests_from_new_individuals = checked;
      } else if (type === "couples") {
        updates.requests_from_new_couples = checked;
      } else if (type === "contacts") {
        updates.requests_from_new_contacts = checked;
      }
      await updateSettings(updates);
    } catch (error) {
      console.error(`Failed to update ${type} setting:`, error);
    }
  };

  const handlePrescreenerChange = async (show: boolean) => {
    try {
      await updateSettings({ is_prescreen_new_clinets: show });
    } catch (error) {
      console.error("Failed to update prescreener setting:", error);
    }
  };

  const handlePaymentMethodChange = async (ask: boolean) => {
    try {
      console.log("Payment method setting would be updated to:", ask);
    } catch (error) {
      console.error("Failed to update payment method setting:", error);
    }
  };

  const handleCreditCardRequirementChange = async (require: boolean) => {
    try {
      await updateSettings({ card_for_appointment_request: require });
    } catch (error) {
      console.error("Failed to update credit card requirement:", error);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
        <CardHeader className="pb-0">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-64 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-96 mb-2" />
          </div>
        </CardHeader>
      </Card>
    );
  }

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
            checked={settings?.is_appointment_requests_enabled ?? false}
            className="mt-1 scale-125 data-[state=checked]:bg-[#188153]"
            onCheckedChange={handleAppointmentRequestsToggle}
          />
        </div>
      </CardHeader>
      {settings?.is_appointment_requests_enabled && (
        <CardContent className="pt-0">
          <AvailabilityWarning onManageClick={() => setShowModal(true)} />
          <ManageAvailabilityModal
            open={showModal}
            onClose={() => setShowModal(false)}
          />
          <NewClientRequestSettings
            settings={settings}
            onAllowNewClientsChange={handleAllowNewClientsChange}
            onNewClientTypeChange={handleNewClientTypeChange}
          />
          {settings?.allow_new_clients_request && (
            <InformationCollectionSettings
              settings={settings}
              onCreditCardRequirementChange={handleCreditCardRequirementChange}
              onPaymentMethodChange={handlePaymentMethodChange}
              onPrescreenerChange={handlePrescreenerChange}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
