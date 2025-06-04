"use client";

import { PracticeInformation } from "@/types/profile";
import TelehealthDialogWrapper from "./components/TelehealthDialogWrapper";

interface TelehealthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  practiceInfoState: PracticeInformation;
  setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
}

export default function EditTeleHealth(props: TelehealthDialogProps) {
  return <TelehealthDialogWrapper {...props} />;
}
