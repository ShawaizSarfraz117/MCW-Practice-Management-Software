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
        className="absolute right-4 top-4 h-8 w-8"
        size="icon"
        variant="ghost"
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
              <label className="text-sm font-medium" htmlFor="client">
                Client
              </label>
              <div className="relative">
                <Select>
                  <SelectTrigger className="w-full pl-9" id="client">
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
              <label className="text-sm font-medium" htmlFor="request-type">
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
              <label className="text-sm font-medium" htmlFor="priority">
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
              <label className="text-sm font-medium" htmlFor="due-date">
                Due Date
              </label>
              <Input id="due-date" type="date" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="request-message">
                Message
              </label>
              <Textarea
                className="min-h-[120px]"
                id="request-message"
                placeholder="Enter request details..."
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
