"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useClinicianData() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.isAdmin || false;
  const isClinician = session?.user?.isClinician || false;
  const userId = session?.user?.id;

  const [userClinicianId, setUserClinicianId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinicianId = async () => {
      if (!isClinician || !userId || sessionStatus !== "authenticated") {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get the clinician record associated with this user ID
        const response = await fetch(`/api/clinician?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.id) {
            setUserClinicianId(data.id);
          } else {
            setError("Clinician record found but missing ID");
          }
        } else {
          setError("Failed to fetch clinician data");
        }
      } catch (error) {
        console.error("Error fetching clinician ID:", error);
        setError("An error occurred while fetching clinician data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicianId();
  }, [userId, isClinician, sessionStatus]);

  // Only proceed with API calls once session is loaded and clinician ID is resolved if needed
  const shouldFetchData =
    sessionStatus === "authenticated" &&
    (!isClinician || (isClinician && userClinicianId !== null));

  return {
    clinicianId: userClinicianId,
    isAdmin,
    isClinician,
    userId,
    isLoading: isLoading || sessionStatus === "loading",
    error,
    sessionStatus,
    shouldFetchData,
  };
}
