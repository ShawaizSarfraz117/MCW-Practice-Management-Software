"use client";

import { PracticeInformation } from "@/types/profile";
import TeleHealthForm from "./TelehealthForm";

interface TelehealthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  practiceInfoState: PracticeInformation;
  setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
}

export default function TelehealthDialogWrapper({
  isOpen,
  onClose,
  practiceInfoState,
  setPracticeInfoState,
}: TelehealthDialogProps) {
  if (!isOpen) return null;

  return (
    <TeleHealthForm
      practiceInfoState={practiceInfoState}
      setPracticeInfoState={setPracticeInfoState}
      onClose={onClose}
    />
  );
}
