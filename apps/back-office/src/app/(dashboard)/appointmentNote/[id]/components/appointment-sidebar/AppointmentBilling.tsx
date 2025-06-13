import React from "react";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@mcw/ui";
import type { AppointmentDetails } from "../../types";

interface AppointmentBillingProps {
  appointment: AppointmentDetails | null;
}

export function AppointmentBilling({ appointment }: AppointmentBillingProps) {
  if (!appointment?.invoice?.length) {
    return null;
  }

  const invoice = appointment.invoice[0];
  const isPaid = invoice.status === "paid";

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Billing</h3>

      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              Invoice #{invoice.invoice_number}
            </span>
          </div>
          <Badge
            variant={isPaid ? "default" : "secondary"}
            className={
              isPaid
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
            }
          >
            {isPaid ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Paid
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Unpaid
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium text-gray-900">
              ${invoice.amount_due}
            </span>
          </div>
          {invoice.amount_paid > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid:</span>
              <span className="font-medium text-green-600">
                ${invoice.amount_paid}
              </span>
            </div>
          )}
          {!isPaid && invoice.amount_due - invoice.amount_paid > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Balance:</span>
              <span className="font-medium text-gray-900">
                ${(invoice.amount_due - invoice.amount_paid).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
