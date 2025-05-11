"use client";

import { Button } from "@mcw/ui";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface EditTeamMemberSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave: () => void;
}

export default function EditTeamMemberSidebar({
  isOpen,
  onClose,
  title,
  children,
  onSave,
}: EditTeamMemberSidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button
            className="p-2 hover:bg-gray-100 rounded-full"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">{children}</div>
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
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
