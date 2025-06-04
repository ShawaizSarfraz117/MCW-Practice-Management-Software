"use client";

import { useRouter, usePathname } from "next/navigation";
import { AppointmentStep } from "@/request/components/AppointmentStep";
import { useRequest } from "@/request/context";

export default function ClientTypePage() {
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
