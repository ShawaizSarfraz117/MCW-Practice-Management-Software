"use client";

import { useRouter, usePathname } from "next/navigation";
import { AppointmentStep } from "../components/AppointmentStep";
import { useRequest } from "../context";

export default function LocationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { appointmentData, onComplete, onUpdate } = useRequest();

  return (
    <AppointmentStep
      currentPath={pathname}
      initialData={appointmentData}
      router={router}
      onComplete={onComplete}
      onUpdate={onUpdate}
    />
  );
}
