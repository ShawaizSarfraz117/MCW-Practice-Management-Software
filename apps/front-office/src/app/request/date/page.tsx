"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AppointmentStep } from "../components/AppointmentStep";
import { useRequest } from "../context";

export default function DatePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { appointmentData, onComplete, onUpdate } = useRequest();
  const searchParamsObject = Object.fromEntries(searchParams.entries());
  return (
    <AppointmentStep
      currentPath={pathname}
      initialData={appointmentData}
      router={router}
      searchParams={searchParamsObject}
      onComplete={onComplete}
      onUpdate={onUpdate}
    />
  );
}
