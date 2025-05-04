"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("client_token");
    if (!token) {
      router.push("/sign-in");
      return;
    }
    fetch("/api/auth/client-signin", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 200) {
          setIsVerified(true);
        } else {
          router.push("/sign-in");
        }
      })
      .catch(() => {
        router.push("/sign-in");
      });
  }, []);

  if (isVerified === null) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            MCW Login Loading...
          </h2>
          <p className="mt-4 text-gray-600">
            Please wait while we verify your token
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
