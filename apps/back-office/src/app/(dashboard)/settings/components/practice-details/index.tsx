"use client";

import { Button, Label } from "@mcw/ui";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mcw/ui";
import { Info } from "lucide-react";
import PracticeInformationForm from "./PracticeInformation";
import PracticeLogoForm from "./PracticeLogoForm";
import PracticePhoneForm from "./PracticePhoneForm";
import { useState } from "react";

export default function PracticeDetailsForm() {
  const [phoneNumbers, setPhoneNumbers] = useState([
    { number: "Phone number", type: "Mobile" },
  ]);

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { number: "", type: "Mobile" }]);
  };

  const removePhoneNumber = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Practice Details
          </h1>
          <p className="text-gray-600 mt-1">Practice name and location info</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          Save Changes
        </Button>
      </div>

      <PracticeInformationForm />
      <PracticeLogoForm />
      <PracticePhoneForm
        addPhoneNumber={addPhoneNumber}
        phoneNumbers={phoneNumbers}
        removePhoneNumber={removePhoneNumber}
      />

      <div className="mt-4">
        <Label className="text-base font-medium">Telehealth</Label>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your video appointments are conducted through the Telehealth
            feature. You and your clients will get a unique link to access these
            appointments.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Place Of Service</TableHead>
                  <TableHead>Public view</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Video Office</TableCell>
                  <TableCell className="text-gray-500">
                    No address added
                  </TableCell>
                  <TableCell>
                    <div className="w-4 h-4 rounded-full bg-blue-400" />
                  </TableCell>
                  <TableCell className="text-sm">
                    02-Telehealth Provided Other than in Patient's Home
                  </TableCell>
                  <TableCell className="flex items-center space-x-1">
                    <span className="text-gray-500">Hidden</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">
                            This location is hidden from public view
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      className="text-blue-500 p-0 h-auto ml-4"
                      variant="link"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <Button
            className="mt-5 border-red-300 text-red-700"
            variant="outline"
            onClick={addPhoneNumber}
          >
            Turn Off
          </Button>
        </div>
      </div>

      <div className="mt-4 mb-8">
        <div className="pb-2">
          <Label className="text-base font-medium">Billing addresses</Label>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your business billing address will be displayed on your
            SimplePractice subscription invoices. The client billing address
            will be displayed on your insurance claims and client-facing billing
            documents such as invoices, statements, and superbills.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address / Office</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Business Billing</TableCell>
                  <TableCell className="text-gray-500">
                    No address added
                  </TableCell>
                  <TableCell>
                    <Button
                      className="text-emerald-600 p-0 h-auto"
                      variant="link"
                    >
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Client Billing</TableCell>
                  <TableCell className="text-gray-500">
                    No address added
                  </TableCell>
                  <TableCell>
                    <Button
                      className="text-emerald-600 p-0 h-auto"
                      variant="link"
                    >
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
