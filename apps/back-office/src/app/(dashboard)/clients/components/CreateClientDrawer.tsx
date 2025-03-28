"use client";
import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { Label } from "@mcw/ui";
import { ClientTabs } from "./ClientTabs";
import { ClientForm, ClientFormRef } from "./ClientForm";

interface CreateClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAppointmentDate?: string;
}

export function CreateClientDrawer({
  open,
  onOpenChange,
  defaultAppointmentDate = "Tuesday, Oct 22, 2025 @ 12:00 PM",
}: CreateClientDrawerProps) {
  const [clientType, setClientType] = useState("minor");
  const formRef = useRef<ClientFormRef>(null);

  const handleSubmit = (values: object) => {
    console.log("Form submitted:", values);
    // Handle form submission here
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-[500px] p-0 gap-0 overflow-auto [&>button]:hidden"
        side="right"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-xl font-semibold">Create client</h2>
            <p className="text-sm text-gray-500">
              Appointment: {defaultAppointmentDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
            <Button
              className="bg-[#2d8467] hover:bg-[#236c53]"
              onClick={() => formRef.current?.submit()}
            >
              Continue
            </Button>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto h-[calc(100vh-72px)]">
          {/* Client Type */}
          <div className="px-6 pt-6">
            <RadioGroup
              defaultValue="minor"
              className="flex gap-4"
              value={clientType}
              onValueChange={setClientType}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adult" id="adult" />
                <Label htmlFor="adult">Adult</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor">Minor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="couple" id="couple" />
                <Label htmlFor="couple">Couple</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="family" id="family" />
                <Label htmlFor="family">Family</Label>
              </div>
            </RadioGroup>
          </div>
          {clientType !== "adult" ? (
            <ClientTabs
              ref={formRef}
              clientType={clientType}
              onSubmit={handleSubmit}
            />
          ) : (
            <ClientForm
              ref={formRef}
              clientType={clientType}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
