"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AppointmentStep } from "../components/AppointmentStep";
import { useRequest } from "../context";

export default function LocationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { appointmentData, onComplete, onUpdate } = useRequest();

  return (
    <AppointmentStep
      onComplete={onComplete}
      initialData={appointmentData}
      onUpdate={onUpdate}
      currentPath={pathname}
      router={router}
      searchParams={searchParams}
    />
  );
}
