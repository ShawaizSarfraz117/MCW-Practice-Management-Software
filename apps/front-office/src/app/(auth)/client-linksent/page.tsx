"use client";

import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Toaster } from "@mcw/ui";
import { Input } from "@mcw/ui";
import Image from "next/image";
import emailIcon from "../../assets/images/mailIcon.svg";
import googleIcon from "../../assets/images/googleIcon.svg";
import { Footer } from "../../Components/footer";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.statusCode === 201) {
          toast.success(data.message);
        } else if (data.statusCode === 200) {
          toast.success(data.message);
        }
        router.push(`/link-sent?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      {/* Toaster component */}
      <Toaster />

      <div className="flex flex-col items-center justify-center px-4 pb-12 h-screen custom-bg-heder">
        <h1 className="text-2xl font-bold text-gray-900 mb-7">
          McNulty Counseling and Wellness
        </h1>
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white border rounded-lg p-8 space-y-6">
            {/* Top icon */}
            <div className="flex justify-center">
              <Image
                src={emailIcon}
                alt="Email Icon"
                width={48}
                height={48}
                className="mb-2"
              />
            </div>

            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="mt-2 text-sm text-gray-400">
                Enter your email address and we&apos;ll send you <br /> a
                password-free link to sign in
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                className="w-full p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full text-white p-2 rounded-lg bg-green-700 hover:bg-green-800"
                disabled={isLoading} // Disable button while loading
              >
                {isLoading ? "SENDING..." : "SEND LINK"}{" "}
                {/* Button text changes */}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border border-gray-400 bg-slate-50 p-2"
              >
                <span className="flex justify-start items-center text-gray-400 gap-4">
                  <Image src={googleIcon} alt="Google" className="w-5 h-5" />
                  <span className="text-center">CONTINUE WITH GOOGLE</span>
                </span>
              </Button>
            </form>
          </div>

          {/* New Client Link */}
          <div className="text-center text-sm mt-12">
            <span className="text-gray-400">New client?</span>{" "}
            <Link
              href="#"
              className="font-medium text-green-700 hover:text-green-500"
            >
              Request appointment
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
