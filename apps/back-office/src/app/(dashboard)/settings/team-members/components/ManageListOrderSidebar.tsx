"use client";

import { Button, RadioGroup, RadioGroupItem, Label } from "@mcw/ui";
import { useState } from "react";

interface ManageListOrderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageListOrderSidebar({
  isOpen,
  onClose,
}: ManageListOrderSidebarProps) {
  const [sortOrder, setSortOrder] = useState<string>("dateAdded");

  const handleSave = () => {
    // Save the sorting preference
    // (In a real app, you would likely call an API here)
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium">Manage list order</h2>
            <Button
              className="p-2 hover:bg-gray-100 rounded-full"
              variant="ghost"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
              >
                <path
                  d="M4 12L12 4M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              <p className="text-sm text-gray-700">
                Select how your team member list is ordered across
                SimplePractice
              </p>

              <RadioGroup
                value={sortOrder}
                onValueChange={setSortOrder}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dateAdded" id="dateAdded" />
                  <Label
                    htmlFor="dateAdded"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Date team member was added
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="lastNameAlphabetically"
                    id="lastNameAlphabetically"
                  />
                  <Label
                    htmlFor="lastNameAlphabetically"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Last name alphabetically
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="firstNameAlphabetically"
                    id="firstNameAlphabetically"
                  />
                  <Label
                    htmlFor="firstNameAlphabetically"
                    className="text-sm font-normal cursor-pointer"
                  >
                    First name alphabetically
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t p-4">
            <div className="flex gap-2 justify-end">
              <Button
                className="text-[#4B5563]"
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2D8467] text-white hover:bg-[#256b53]"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
