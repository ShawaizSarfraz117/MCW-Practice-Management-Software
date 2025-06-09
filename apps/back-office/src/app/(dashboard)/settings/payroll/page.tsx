"use client";

import React from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import Link from "next/link";

export default function PayrollPage() {
  return (
    <div className="">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Set up pay periods</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="text-xs text-blue-600 hover:underline whitespace-nowrap flex items-center gap-1"
            href="#"
          >
            <span>Watch a quick video about Payroll</span>
          </Link>
          <Button className="h-9 px-6 text-sm font-medium">Save changes</Button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-md px-4 py-3 mb-8">
        <div className="text-sm text-gray-700">
          <span className="font-medium">
            Your next Pay Period will be closed automatically overnight on
            Saturday, 03/15/2025.
          </span>
        </div>
      </div>

      {/* Pay Periods Section */}
      <section>
        <h2 className="text-base font-medium text-gray-900 mb-2">
          Pay Periods
        </h2>
        <p className="text-sm text-gray-500 mb-4 w-full">
          Before calculating payroll for your practice, you'll need to close the
          associated{" "}
          <span className="font-medium text-gray-700">Pay Period</span> of the{" "}
          <Link className="text-blue-600 hover:underline" href="#">
            Income allocation
          </Link>{" "}
          report. To automate this process, select the{" "}
          <span className="font-medium text-gray-700">Close Pay Period</span>{" "}
          option from the dropdown below that aligns with your payroll schedule.{" "}
          <Link className="text-blue-600 hover:underline" href="#">
            Learn More
          </Link>
        </p>
        <div className="my-4">
          <Select defaultValue="semi-monthly">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semi-monthly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="semi-monthly">Semi-monthly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <span className="text-sm text-gray-700">
            Pay periods will be closed automatically on the
          </span>
          <Select defaultValue="15">
            <SelectTrigger className="w-20">
              <SelectValue placeholder="15" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">
            day of the month and the
          </span>
          <Select defaultValue="last">
            <SelectTrigger className="w-24">
              <SelectValue placeholder="last" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last">last</SelectItem>
              {Array.from({ length: 28 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">day of the month.</span>
        </div>
        <p className="text-sm text-gray-500">
          Pay periods will be closed on the [{" "}
          <span className="font-medium text-gray-700">31</span> ] day of the
          month or on the last day for months with fewer days.
        </p>
      </section>
    </div>
  );
}
