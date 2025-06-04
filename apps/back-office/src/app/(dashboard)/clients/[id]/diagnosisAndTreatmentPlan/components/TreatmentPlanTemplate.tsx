"use client";
import React, { useState } from "react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import { Pencil } from "lucide-react";

import SignAndLockModal from "./SignAndLockModal";

const TreatmentPlanTemplate: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("Shawaiz");
  const [credentials, setCredentials] = useState("LMFT");

  return (
    <div className="mt-6 w-full max-w-[50%]">
      {/* Header and Actions */}
      <div className="flex flex-row md:flex-col md:justify-between md:items-start mb-6">
        <h1 className="text-lg font-bold text-gray-900 leading-snug">
          Diagnosis and treatment plan
        </h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            variant="ghost"
            className="flex items-center bg-gray-100 gap-1 text-sm font-medium"
          >
            <Pencil className="h-2 w-2" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="bg-gray-100 flex items-center gap-1 text-sm font-medium"
              >
                More
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    d="M12 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Print</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
            onClick={() => setModalOpen(true)}
          >
            Sign
          </Button>
        </div>
      </div>

      {/* Diagnosis Card */}
      <div className="bg-white border rounded-lg px-6 py-3 mb-6">
        <div className="flex items-center">
          <div className="text-[16px] font-semibold text-gray-900">
            Diagnosis
          </div>
          <div className="text-[16px] text-gray-500 ml-[8rem]">
            None Selected
          </div>
        </div>
      </div>

      {/* Treatment Plan Template Section */}
      <div className="text-[16px] font-semibold text-gray-900 mb-2">
        Select a treatment plan template
      </div>
      <div className="w-full">
        <Select>
          <SelectTrigger className="w-full border border-gray-300 rounded-md h-[42px] px-3 text-sm">
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="template1">Template 1</SelectItem>
            <SelectItem value="template2">Template 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SignAndLockModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        name={name}
        setName={setName}
        credentials={credentials}
        setCredentials={setCredentials}
        onSign={() => {
          // handle sign and lock logic here
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default TreatmentPlanTemplate;
