import React from "react";
import { Button } from "@mcw/ui";
import { ExternalLink } from "lucide-react";

interface AppointmentData {
  billing_preference?: string;
  appointment_fee?: number | string;
  PracticeService?: {
    fee?: number | string;
  } | null;
  Service?: {
    fee?: number | string;
  } | null;
  Invoice?: Array<unknown>;
}

interface BillingSectionProps {
  appointment: AppointmentData | undefined;
}

export function BillingSection({ appointment }: BillingSectionProps) {
  const totalFee =
    appointment?.appointment_fee ||
    appointment?.PracticeService?.fee ||
    appointment?.Service?.fee ||
    "0";

  const isInvoiced = appointment?.Invoice && appointment.Invoice.length > 0;

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Billing</h3>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">
          {appointment?.billing_preference || "Self-pay"}
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium">Appointment total</span>
          <span className="text-sm font-medium">${totalFee}</span>
        </div>
        <div className="text-right">
          <span
            className={`text-xs px-2 py-1 rounded ${
              isInvoiced
                ? "text-green-600 bg-green-50"
                : "text-red-600 bg-red-50"
            }`}
          >
            {isInvoiced ? "Invoiced" : "Uninvoiced"}
          </span>
        </div>
      </div>
      <Button
        className="text-blue-600 p-0 h-auto text-sm mt-3 flex items-center"
        variant="link"
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Open billing
      </Button>
    </div>
  );
}
