"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@mcw/ui";
import { MoveLeft } from "lucide-react";
import { Footer } from "@/Components/footer";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const verifyToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      // If token is missing, handle the error state
      if (!token) {
        setStatus("error");
        toast.error("Invalid verification link - token missing");
        return;
      }

      try {
        const response = await fetch("/api/auth/client-signin", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Verification failed");
        }
        const data = await response.json();
        if (data.statusCode === 200) {
          sessionStorage.setItem("client_token", token);
          setStatus("success");
          toast.success("Verification successful! Redirecting...");
          router.push("/dashboard");
        } else {
          throw new Error("No email found in response");
        }
      } catch (err) {
        setStatus("error");
        toast.error(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      }
    };

    verifyToken();
  }, [router]);

  // Error state - show error message and the link expired message
  if (status === "error") {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-col flex-wrap items-center custom-bg-heder justify-center px-4 pb-12 bg-gray-50 flex-grow">
          <h1 className="text-2xl font-bold text-gray-900 mb-7">
            McNulty Counseling and Wellness
          </h1>
          <div className="w-full max-w-md space-y-6">
            <div className="bg-white border rounded-lg h-[30vh] flex justify-center flex-col sm:p-8 p-[5rem] space-y-6">
              <div className="text-center">
                <h2 className="text-xl text-gray-900">Verification Failed</h2>
                <div className="mt-4 space-y-2 text-gray-400">
                  <p className="text-sm">
                    The link has expired, you need a new link to login.
                  </p>
                </div>
              </div>

              <div className="text-center mt-16 text-green-600">
                <Button
                  variant="link"
                  className="inline-flex items-center"
                  onClick={() => window.location.reload()}
                >
                  <MoveLeft className="mr-1 h-4 w-4" />
                  Request New Link
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return null;
}
