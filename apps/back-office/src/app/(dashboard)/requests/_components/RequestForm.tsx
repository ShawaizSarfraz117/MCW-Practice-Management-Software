"use client";

import {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@mcw/ui";
import { Users, X } from "lucide-react";

interface RequestFormProps {
  setIsFormOpen: (isOpen: boolean) => void;
}

export default function RequestForm({ setIsFormOpen }: RequestFormProps) {
  return (
    <Card className="border p-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 h-8 w-8"
        onClick={() => setIsFormOpen(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-semibold">Create New Request</h2>
          <p className="text-sm text-gray-500 mt-1">
            Send a new request to a client or for a client
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="client" className="text-sm font-medium">
                Client
              </label>
              <div className="relative">
                <Select>
                  <SelectTrigger id="client" className="w-full pl-9">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-smith">John Smith</SelectItem>
                    <SelectItem value="emma-johnson">Emma Johnson</SelectItem>
                    <SelectItem value="michael-brown">Michael Brown</SelectItem>
                    <SelectItem value="sarah-davis">Sarah Davis</SelectItem>
                    <SelectItem value="david-wilson">David Wilson</SelectItem>
                  </SelectContent>
                </Select>
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="request-type" className="text-sm font-medium">
                Request Type
              </label>
              <Select>
                <SelectTrigger id="request-type">
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="information">Information</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="due-date" className="text-sm font-medium">
                Due Date
              </label>
              <Input type="date" id="due-date" />
            </div>

            <div className="space-y-2">
              <label htmlFor="request-message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="request-message"
                placeholder="Enter request details..."
                className="min-h-[120px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => setIsFormOpen(false)}>
            Cancel
          </Button>
          <Button>Submit Request</Button>
        </div>
      </div>
    </Card>
  );
}
