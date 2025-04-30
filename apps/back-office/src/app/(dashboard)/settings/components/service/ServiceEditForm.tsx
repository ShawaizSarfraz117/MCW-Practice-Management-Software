"use client";

import React from "react";
import { Button } from "@mcw/ui";
import { Info } from "lucide-react";
import { Service, ServiceEdit } from "./types";

interface ServiceEditFormProps {
  service: Service;
  editValues: ServiceEdit;
  onEditChange: <K extends keyof ServiceEdit>(
    field: K,
    value: ServiceEdit[K],
  ) => void;
  onCancel: () => void;
  onSave: (serviceId: string) => void;
}

const ServiceEditForm: React.FC<ServiceEditFormProps> = ({
  service,
  editValues,
  onEditChange,
  onCancel,
  onSave,
}) => {
  return (
    <div className="mt-3">
      <p className="text-[#374151] text-[14px]">Description</p>
      <input
        type="text"
        value={editValues.description || ""}
        onChange={(e) => onEditChange("description", e.target.value)}
        className="text-[#374151] bg-white text-[14px] w-[500px] border rounded-[5px] outline-none p-2"
      />
      <div className="flex items-center gap-4 mt-3">
        <span>
          <p className="text-[#374151] text-[14px]">Rate</p>
          <input
            type="number"
            value={editValues.rate}
            onChange={(e) => onEditChange("rate", Number(e.target.value))}
            className="text-[#374151] text-[14px] w-[200px] border rounded-[5px] outline-none p-2"
          />
        </span>
        <span>
          <p className="text-[#374151] text-[14px]">Default Duration</p>
          <input
            type="number"
            value={editValues.duration}
            min={0}
            onChange={(e) => onEditChange("duration", Number(e.target.value))}
            className="text-[#374151] bg-white text-[14px] w-[80px] border rounded-[5px] outline-none p-2"
          />
          <span className="text-[#1F2937] ml-2 text-[14px]">min</span>
        </span>
        <span className="ml-auto">
          <input
            id={`active-${service.id}`}
            type="checkbox"
            checked={true}
            readOnly
            className="h-[15px] accent-[#afafaf] bg-white w-[15px]"
          />
          <label
            className="text-[#1F2937] ml-1 text-[15px]"
            htmlFor={`active-${service.id}`}
          >
            Active
          </label>
        </span>
      </div>
      <div className="flex gap-2 items-center mt-2">
        <input
          id={`bill-units-${service.id}`}
          type="checkbox"
          checked={editValues.bill_in_units}
          onChange={(e) => onEditChange("bill_in_units", e.target.checked)}
          className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
        />
        <p className="text-[#1F2937] text-[14px]">Bill this code in units</p>
        <Info className="h-4 w-4" />
      </div>
      <div className="mt-2">
        <p className="text-[#1F2937] my-4 text-[16px]">Booking Options</p>
        <div className="flex gap-2 items-center">
          <input
            id={`online-${service.id}`}
            type="checkbox"
            checked={editValues.available_online}
            onChange={(e) => onEditChange("available_online", e.target.checked)}
            className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
          />
          <p className="text-[#1F2937] text-[14px]">
            Available for online appointment requests
          </p>
        </div>
      </div>
      <div className="text-[#1F2937] text-[14px] flex items-center gap-1 mt-3">
        <p>Block off</p>
        <input
          type="number"
          min={0}
          value={editValues.block_before}
          onChange={(e) => onEditChange("block_before", Number(e.target.value))}
          className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
        />
        <p>minutes before and</p>
        <input
          type="number"
          min={0}
          value={editValues.block_after}
          onChange={(e) => onEditChange("block_after", Number(e.target.value))}
          className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
        />
        <p>minutes after the appointment</p>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Button
          onClick={onCancel}
          className="bg-transparent text-black hover:bg-gray-50 border border-[lightgray]"
        >
          Cancel
        </Button>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53]"
          onClick={() => onSave(service.id)}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default ServiceEditForm;
