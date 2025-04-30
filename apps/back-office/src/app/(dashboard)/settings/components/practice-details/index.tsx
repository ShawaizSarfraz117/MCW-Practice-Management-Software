"use client";

import { Button, toast } from "@mcw/ui";
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
import TeleHealth from "./TeleHealth";

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
      <TeleHealth
        practiceInfoState={practiceInfoState}
        setPracticeInfoState={setPracticeInfoState}
      />
      <Button
        className="mt-5 border-red-300 text-red-700"
        variant="outline"
        //  onClick={addPhoneNumber}
      >
        Turn Off
      </Button>
    </div>
  );
}
