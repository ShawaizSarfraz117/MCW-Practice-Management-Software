import type React from "react";
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { X } from "lucide-react";

interface IntakeFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  onClose,
  onSubmit,
}) => {
  return (
    <>
      <div
        className="fixed inset-0 bg-black opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-[500px] bg-background shadow-lg border-l animate-in slide-in-from-right z-50">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">Client Intake Form</h2>
              <p className="text-sm text-muted-foreground">
                Please fill out the following information
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter last name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter email address"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="Enter phone number" type="tel" />
              </div>
            </div>

            {/* Preferred Contact Method */}
            <div className="space-y-4">
              <Label>Preferred Contact Method</Label>
              <RadioGroup defaultValue="email">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="email-contact" value="email" />
                  <Label htmlFor="email-contact">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="phone-contact" value="phone" />
                  <Label htmlFor="phone-contact">Phone</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Insurance Information */}
            <div className="space-y-4">
              <Label>Insurance Provider</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aetna">Aetna</SelectItem>
                  <SelectItem value="bluecross">Blue Cross</SelectItem>
                  <SelectItem value="cigna">Cigna</SelectItem>
                  <SelectItem value="united">United Healthcare</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t p-6 flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={onSubmit}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
