"use client";

import { Button, toast } from "@mcw/ui";
import PracticeInformationForm from "./components/PracticeInformation";
import PracticeLogoForm from "./components/PracticeLogoForm";
import PracticePhoneForm from "./components/PracticePhoneForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  updatePracticeInfo,
  usePracticeInformation,
} from "./components/hooks/usePracticeInformation";
import { PracticeInformation } from "@/types/profile";
import TeleHealth from "./components/TeleHealth";
import BillingAddresses from "./components/BillingAddresses";

export default function PracticeDetailsForm() {
  const queryClient = useQueryClient();
  const { practiceInformation } = usePracticeInformation();

  const [practiceInfoState, setPracticeInfoState] =
    useState<PracticeInformation>({
      practice_name: "",
      practice_email: "",
      time_zone: "",
      practice_logo: "",
      phone_numbers: [],
      tele_health: false,
    });

  useEffect(() => {
    if (practiceInformation) {
      setPracticeInfoState({
        practice_name: practiceInformation.practice_name ?? "",
        practice_email: practiceInformation.practice_email ?? "",
        time_zone: practiceInformation.time_zone ?? "",
        practice_logo: practiceInformation.practice_logo ?? "",
        phone_numbers: practiceInformation.phone_numbers ?? [],
        tele_health: practiceInformation.tele_health ?? false,
      });
    }
  }, [practiceInformation]);

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
      console.error("Error updating practice information:", error);
    },
  });

  const handleSave = () => {
    if (
      !practiceInfoState.practice_name.trim() ||
      !practiceInfoState.practice_email.trim() ||
      !practiceInfoState.time_zone.trim() ||
      !practiceInfoState.practice_logo.trim() ||
      practiceInfoState.phone_numbers.length === 0
    ) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before saving.",
        variant: "destructive",
      });
      return;
    }
    mutate(practiceInfoState);
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

      {practiceInfoState.tele_health && (
        <Button
          className="mt-5 border-red-300 text-red-700"
          variant="outline"
          onClick={() => {
            setPracticeInfoState({
              ...practiceInfoState,
              tele_health: false,
            });
          }}
        >
          Turn Off
        </Button>
      )}
      {!practiceInfoState.tele_health && (
        <Button
          className="mt-5 border-green-300 text-green-700"
          variant="outline"
          onClick={() => {
            setPracticeInfoState({
              ...practiceInfoState,
              tele_health: true,
            });
          }}
        >
          Turn On
        </Button>
      )}
      <BillingAddresses />
    </div>
  );
}
