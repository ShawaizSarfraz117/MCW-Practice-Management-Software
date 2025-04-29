"use client";

import { toast } from "@mcw/ui";
import PracticeInformationForm from "./PracticeInformation";
import PracticeLogoForm from "./PracticeLogoForm";
import PracticePhoneForm from "./PracticePhoneForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  updatePracticeInfo,
  usePracticeInformation,
} from "./hooks/usePracticeInformation";
import { PracticeInformation } from "@/types/profile";

export default function PracticeDetailsForm() {
  const queryClient = useQueryClient();
  const { practiceInformation } = usePracticeInformation();

  const [practiceInfoState, setPracticeInfoState] =
    useState<PracticeInformation>({
      practice_name: practiceInformation?.practice_name,
      practice_email: practiceInformation?.practice_email,
      time_zone: practiceInformation?.time_zone,
      practice_logo: practiceInformation?.practice_logo,
      phone_numbers: practiceInformation?.phone_numbers,
      telehealth_enabled: practiceInformation?.telehealth_enabled,
      telehealth: practiceInformation?.telehealth,
    });

  const { mutate } = useMutation({
    mutationFn: updatePracticeInfo,
    onSuccess: () => {
      console.log("Practice information updated successfully");
      toast({
        title: "Practice information updated successfully",
        description: "Practice information has been updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["practiceInformation"] });
    },
    onError: (error) => {
      // Optionally handle error (e.g., show an error message)
      console.error("Error updating practice information:", error);
    },
  });

  const handleSave = () => {
    mutate(practiceInfoState); // Call the mutation function on save button click
  };

  return (
    <div>
      <PracticeInformationForm
        handleSave={handleSave}
        practiceInfoState={practiceInfoState}
        setPracticeInfoState={setPracticeInfoState}
      />
      <PracticeLogoForm
        practiceInfoState={practiceInfoState}
        setPracticeInfoState={setPracticeInfoState}
      />
      <PracticePhoneForm setPracticeInfoState={setPracticeInfoState} />
      {/* <TeleHeaalthForm
      // practiceInfoState={practiceInfoState}
      // setPracticeInfoState={setPracticeInfoState}
      /> */}
      {/* <Button
        className="mt-5 border-red-300 text-red-700"
        variant="outline"
        // onClick={addPhoneNumber}
      >
        Turn Off
      </Button>
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
                  <TableHead className="w-20"></TableHead>
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
                      variant="link"
                      className="text-emerald-600 p-0 h-auto"
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
                      variant="link"
                      className="text-emerald-600 p-0 h-auto"
                    >
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div> */}
    </div>
  );
}
