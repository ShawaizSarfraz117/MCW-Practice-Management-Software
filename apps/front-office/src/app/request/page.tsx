"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequestPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/request/service");
  }, [router]);

  return null;
}
