"use client";
import { useState } from "react";
import { Button } from "@mcw/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import { Info } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function ClientPortalGreetingModal({
  open,
  onClose,
  greeting,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  greeting: string;
  onSave: (newGreeting: string) => void;
}) {
  const [macros, setMacros] = useState({
    clinician: "Clinician",
    practice: "Practice",
    client: "Client",
    recipient: "Recipient",
  });
  const [value, setValue] = useState(greeting);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              aria-label="Close"
              className="top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl"
              onClick={onClose}
            >
              ×
            </button>
            <div className="text-xl font-bold">Edit Welcome Message</div>
          </div>
          <Button
            className="bg-[#2D8467] hover:bg-[#236c53] text-white px-6 py-2 rounded"
            onClick={() => {
              onSave(value);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
        <div className="mb-2 font-semibold text-lg">Client Portal Welcome</div>
        {/* Macros */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">Macros</span>
            <span className="relative group">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="absolute left-6 top-0 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
                Use macros to insert dynamic info
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {["Clinician", "Practice", "Client", "Recipient"].map((type) => (
              <DropdownMenu key={type}>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="min-w-[140px] justify-between"
                    variant="outline"
                  >
                    {macros[type.toLowerCase() as keyof typeof macros]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() =>
                      setMacros((m) => ({ ...m, [type.toLowerCase()]: type }))
                    }
                  >
                    {type}
                  </DropdownMenuItem>
                  {/* Add more options as needed */}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>
        </div>
        {/* Message */}
        <div className="mb-2 font-medium">Message</div>
        <div className="border rounded">
          <ReactQuill
            className="min-h-[120px]"
            formats={[
              "header",
              "bold",
              "italic",
              "underline",
              "strike",
              "list",
              "bullet",
              "link",
              "clean",
            ]}
            modules={{
              toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link"],
                ["undo", "redo"],
                ["clean"],
              ],
              history: { delay: 500, maxStack: 100, userOnly: true },
            }}
            theme="snow"
            value={value}
            onChange={setValue}
          />
        </div>
      </div>
    </div>
  );
}
