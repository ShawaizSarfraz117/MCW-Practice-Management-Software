"use client";

import React, { useState } from "react";
import { Button } from "@mcw/ui";
import { ChevronDown, CreditCard, HelpCircle, Calendar } from "lucide-react";

interface Invoice {
  id: string;
  date: string;
  number: string;
  charges: number;
  payments: string;
  balance: number;
  status: "paid" | "unpaid" | "past_due";
}

interface PaymentHistoryItem {
  date: string;
  type: string;
  charges: number;
  payments: string;
  balance: number;
  status?: {
    type: "new" | "past_due";
    label: string;
  };
}

export default function ClientBilling() {
  const [activeTab, setActiveTab] = useState("payment");

  const invoices: Invoice[] = [
    {
      id: "1",
      date: "Apr 09, 2025",
      number: "Invoice #T7563",
      charges: 437.5,
      payments: "--",
      balance: 437.5,
      status: "unpaid",
    },
    {
      id: "2",
      date: "Dec 23, 2024",
      number: "Invoice #T7575",
      charges: 437.5,
      payments: "--",
      balance: 437.5,
      status: "past_due",
    },
  ];

  const paymentHistory: PaymentHistoryItem[] = [
    {
      date: "Apr 09, 2025",
      type: "Invoice #77363",
      charges: 437.5,
      payments: "--",
      balance: 3625,
      status: {
        type: "new",
        label: "NEW",
      },
    },
    {
      date: "Dec 23, 2024",
      type: "Invoice #71275",
      charges: 437.5,
      payments: "--",
      balance: 437.5,
      status: {
        type: "past_due",
        label: "PAST DUE",
      },
    },
  ];

  const totalBalance = invoices.reduce(
    (sum, invoice) => sum + invoice.balance,
    0,
  );

  const renderContent = () => {
    switch (activeTab) {
      case "payment":
        return (
          <div className="space-y-6">
            {/* Cards on File Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-gray-700 text-lg">Cards on File (0)</h2>
                <Button
                  variant="ghost"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  + New Card
                </Button>
              </div>

              {/* Column Headers */}
              <div className="flex justify-between text-sm text-gray-500 mb-2 px-4">
                <span>DETAILS</span>
                <div className="flex items-center gap-2">
                  DEFAULT CARD
                  <HelpCircle className="w-4 h-4" />
                </div>
              </div>

              {/* No Cards Message */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <CreditCard className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600">There are no cards on file</p>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div>
            {/* Invoices Section */}
            <div className="mb-4">
              <h2 className="text-gray-900 font-medium">Invoices (15)</h2>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm text-gray-500 uppercase">
              <div>Date</div>
              <div>Detail</div>
              <div className="text-right">Charges</div>
              <div className="text-right">Payments</div>
              <div className="text-right">Balance</div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="grid grid-cols-5 gap-4 px-4 py-3 bg-white rounded-lg items-center"
                >
                  <div className="text-gray-600">{invoice.date}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{invoice.number}</span>
                    {invoice.status === "unpaid" && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        NEW
                      </span>
                    )}
                    {invoice.status === "past_due" && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        PAST DUE
                      </span>
                    )}
                  </div>
                  <div className="text-right text-gray-600">
                    ${invoice.charges}
                  </div>
                  <div className="text-right text-gray-600">
                    {invoice.payments}
                  </div>
                  <div className="text-right text-gray-900 font-medium">
                    ${invoice.balance}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Balance Row */}
            <div className="grid grid-cols-5 gap-4 px-4 py-3 border-t border-gray-200 mt-2">
              <div className="col-span-4 text-right font-medium">
                Total Balance
              </div>
              <div className="text-right font-semibold">${totalBalance}</div>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 w-fit">
                <span className="text-sm text-gray-600">
                  Date Range: All Time
                </span>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Payment History Table */}
            <div>
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs text-gray-500 uppercase">
                <div>DATE</div>
                <div>TYPE</div>
                <div className="text-right">CHARGES</div>
                <div className="text-right">PAYMENTS</div>
                <div className="text-right">BALANCE</div>
              </div>

              {/* Table Content */}
              <div className="space-y-2 mt-2">
                {paymentHistory.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 px-4 py-3 bg-white rounded-lg items-center"
                  >
                    <div className="text-gray-600 text-sm">{item.date}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-sm hover:underline cursor-pointer">
                        {item.type}
                      </span>
                      {item.status && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            item.status.type === "new"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.status.label}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-gray-600 text-sm">
                      ${item.charges.toFixed(2)}
                    </div>
                    <div className="text-right text-gray-600 text-sm">
                      {item.payments}
                    </div>
                    <div className="text-right text-gray-900 text-sm font-medium">
                      ${item.balance.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Balance Row */}
              <div className="grid grid-cols-5 gap-4 px-4 py-3 border-t border-gray-200 mt-2">
                <div className="col-span-4 text-right font-medium text-sm">
                  Total Balance
                </div>
                <div className="text-right font-semibold text-sm">
                  ${totalBalance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Total Balance Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Balance</span>
          <div className="flex items-center gap-4">
            <span className="text-gray-900 font-semibold">
              ${totalBalance.toFixed(2)}
            </span>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              PAY NOW
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          <button
            className={`pb-2 text-sm font-medium border-b-2 ${
              activeTab === "billing"
                ? "text-green-600 border-green-600"
                : "text-gray-500 border-transparent"
            }`}
            onClick={() => setActiveTab("billing")}
          >
            BILLING DOCUMENTS
          </button>
          <button
            className={`pb-2 text-sm font-medium border-b-2 ${
              activeTab === "payment"
                ? "text-green-600 border-green-600"
                : "text-gray-500 border-transparent"
            }`}
            onClick={() => setActiveTab("payment")}
          >
            PAYMENT METHODS
          </button>
          <button
            className={`pb-2 text-sm font-medium border-b-2 ${
              activeTab === "history"
                ? "text-green-600 border-green-600"
                : "text-gray-500 border-transparent"
            }`}
            onClick={() => setActiveTab("history")}
          >
            PAYMENT HISTORY
          </button>
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Expandable Sections */}
      <div className="space-y-2 mt-8">
        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg text-gray-700">
          <span>Statements (0)</span>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>
        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg text-gray-700">
          <span>Insurance Reimbursement Statements (0)</span>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
