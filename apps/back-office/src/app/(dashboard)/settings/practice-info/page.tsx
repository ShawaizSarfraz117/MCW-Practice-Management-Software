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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@mcw/ui";
import { X } from "lucide-react";

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

  const [showTelehealthModal, setShowTelehealthModal] = useState(false);

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
    console.log("practiceInfoState", practiceInfoState);
    if (
      !practiceInfoState.practice_name ||
      !practiceInfoState.practice_email ||
      !practiceInfoState.time_zone ||
      !practiceInfoState.practice_logo ||
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
      <PracticePhoneForm
        practiceInfoState={practiceInfoState}
        setPracticeInfoState={setPracticeInfoState}
      />

      <TeleHealth
        practiceInfoState={practiceInfoState}
        setPracticeInfoState={setPracticeInfoState}
      />

      {practiceInfoState.tele_health && (
        <>
          <AlertDialog
            open={showTelehealthModal}
            onOpenChange={setShowTelehealthModal}
          >
            <AlertDialogTrigger asChild>
              <Button
                className="mt-5 border-red-300 text-red-700"
                variant="outline"
                onClick={() => setShowTelehealthModal(true)}
              >
                Turn Off
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[400px] w-full p-6 rounded-xl">
              <button
                aria-label="Close"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                type="button"
                onClick={() => setShowTelehealthModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-semibold text-gray-900 text-left">
                  Are you sure you want to turn off Telehealth?
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 text-left mt-3">
                    <li>
                      You'll be unable to conduct video appointments through
                      SimplePractice
                    </li>
                    <li>
                      Scheduled video appointments will be changed to an
                      "Unassigned" location
                    </li>
                    <li>
                      Pending requests for video appointments will be deleted
                    </li>
                    <li>
                      You can re-enable Telehealth as long as you're on the
                      Essential or Plus plan
                    </li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 flex-row justify-end gap-2">
                <AlertDialogCancel className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700"
                  onClick={() => {
                    setPracticeInfoState({
                      ...practiceInfoState,
                      tele_health: false,
                    });
                    setShowTelehealthModal(false);
                  }}
                >
                  Turn off Telehealth
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
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
