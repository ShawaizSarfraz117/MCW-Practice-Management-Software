/* eslint-disable max-lines-per-function */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Printer, Download, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { Separator } from "@mcw/ui";
import { fetchSingleStatement } from "@/(dashboard)/clients/services/documents.service";
import { Loading } from "@/components";

interface StatementModalProps {
  clientName?: string;
}

interface StatementDetail {
  date: string;
  description: string;
  serviceDescription: string;
  charges: string;
  payments: string;
  balance: string;
}

interface StatementData {
  summary: {
    beginningBalance: number;
    beginningDate: string;
    invoicesTotal: number;
    paymentsTotal: number;
    endingBalance: number;
    endingDate: string;
  };
  details: StatementDetail[];
  statement: {
    id: string;
    statement_number: number;
    client_group_id: string;
    start_date: string;
    end_date: string;
    issued_date: string | null;
    beginning_balance: string;
    invoices_total: string;
    payments_total: string;
    ending_balance: string;
    provider_name: string | null;
    provider_email: string | null;
    provider_phone: string | null;
    client_group_name: string;
    client_name: string;
    client_email: string;
    created_at: string;
    created_by: string | null;
    is_exported: boolean;
  };
}

export function StatementModal({
  clientName: _clientName,
}: StatementModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statementId = searchParams.get("statementId");
  const isOpen = !!statementId;

  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState<StatementData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (statementId) {
      fetchStatementData(statementId);
    }
  }, [statementId]);

  const fetchStatementData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [response, error] = await fetchSingleStatement({
        searchParams: { id },
      });

      if (error) {
        setError("Failed to load statement");
        return;
      }

      setStatementData(response as StatementData);
    } catch (_err) {
      setError("Failed to load statement");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("statementId");
    params.delete("type");
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log("Download statement");
  };

  const handleEmail = () => {
    console.log("Email statement");
  };

  const handleDelete = () => {
    console.log("Delete statement");
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `$${num.toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full h-screen flex flex-col p-0 m-0 rounded-none border-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center">
            <button className="mr-4" onClick={handleClose}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <h1 className="text-xl font-medium">
              {statementData
                ? `Statement #${statementData.statement.statement_number} for ${statementData.statement.client_name}`
                : "Statement Details"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={handlePrint}>
              <Printer className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleDownload}>
              <Download className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleEmail}>
              <Mail className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleDelete}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Statement Content */}
        <div className="flex-1 bg-[#f9fafb] p-6 overflow-auto flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center w-full">
              <Loading message="Loading statement details..." />
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8 flex justify-center items-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : statementData ? (
            <div className="bg-white rounded-lg shadow-md h-max max-h-fit max-w-4xl w-full p-8 space-y-6">
              {/* Header Section */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-medium">
                    {statementData.statement.provider_name || "Provider Name"}
                  </p>
                </div>

                <div>
                  <h1 className="text-2xl font-bold">Statement</h1>
                  <p className="text-sm text-gray-500">
                    For{" "}
                    {format(
                      new Date(statementData.statement.start_date),
                      "MMMM d, yyyy",
                    )}{" "}
                    -{" "}
                    {format(
                      new Date(statementData.statement.end_date),
                      "MMMM d, yyyy",
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">To</p>
                    <p className="font-medium">
                      {statementData.statement.client_name}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">Client</p>

                    <p className="font-medium">
                      {statementData.statement.client_group_name}
                    </p>
                    <p className="text-sm">
                      {statementData.statement.client_email}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Statement</p>
                    <p className="font-medium">
                      #{statementData.statement.statement_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      Issued:{" "}
                      {statementData.statement.issued_date
                        ? format(
                            new Date(statementData.statement.issued_date),
                            "MM/dd/yyyy",
                          )
                        : format(new Date(), "MM/dd/yyyy")}
                    </p>

                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Provider</p>
                      <p className="font-medium">
                        {statementData.statement.provider_name ||
                          "Provider Name"}
                      </p>
                      <p className="text-sm">
                        {statementData.statement.provider_email ||
                          "email@example.com"}
                      </p>
                      <p className="text-sm">
                        {statementData.statement.provider_phone ||
                          "License: LMFT #1234"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Summary Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm">Beginning Balance</p>
                      <p className="text-xs text-gray-500">
                        As of{" "}
                        {format(
                          new Date(statementData.summary.beginningDate),
                          "MM/dd/yyyy",
                        )}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(statementData.summary.beginningBalance)}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-sm">Invoices</p>
                    <p className="font-medium">
                      {formatCurrency(statementData.summary.invoicesTotal)}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-sm">Payments</p>
                    <p className="font-medium">
                      -{formatCurrency(statementData.summary.paymentsTotal)}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">Ending Balance</p>
                      <p className="text-xs text-gray-500">
                        As of{" "}
                        {format(
                          new Date(statementData.summary.endingDate),
                          "MM/dd/yyyy",
                        )}
                      </p>
                    </div>
                    <p className="font-bold text-lg">
                      {formatCurrency(statementData.summary.endingBalance)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Details Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Details</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 text-sm font-medium">
                          Date
                        </th>
                        <th className="text-left py-2 px-4 text-sm font-medium">
                          Description
                        </th>
                        <th className="text-right py-2 px-4 text-sm font-medium">
                          Charges
                        </th>
                        <th className="text-right py-2 px-4 text-sm font-medium">
                          Payments
                        </th>
                        <th className="text-right py-2 px-4 text-sm font-medium">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementData.details.map((detail, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4 text-sm">
                            {format(new Date(detail.date), "MM/dd/yyyy")}
                          </td>
                          <td className="py-2 px-4 text-sm">
                            <p className="font-medium">{detail.description}</p>
                            <p className="text-xs text-gray-500">
                              {detail.serviceDescription}
                            </p>
                          </td>
                          <td className="py-2 px-4 text-sm text-right">
                            {detail.charges === "--"
                              ? "--"
                              : formatCurrency(detail.charges)}
                          </td>
                          <td className="py-2 px-4 text-sm text-right">
                            {detail.payments === "--"
                              ? "--"
                              : formatCurrency(detail.payments)}
                          </td>
                          <td className="py-2 px-4 text-sm text-right font-medium">
                            {formatCurrency(detail.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
