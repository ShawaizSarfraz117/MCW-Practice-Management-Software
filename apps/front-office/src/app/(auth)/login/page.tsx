"use client";

import type React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@mcw/ui";
import { Input } from "@mcw/ui";
import { useToast } from "@mcw/ui";
import Image from "next/image";
import emailIcon from "@/assets/images/mailIcon.svg";
import googleIcon from "@/assets/images/googleIcon.svg";
import { Footer } from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || email.trim() === "") {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    try {
      const res = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (res?.error) {
        if (res.error === "EmailSent") {
          toast({
            title: "Check Your Email",
            description:
              "A sign-in link has been sent to your email address. Please check your inbox.",
            variant: "success",
          });
          router.push("/verify-request");
          return;
        }
        console.log(res.error);
        throw new Error(res.error);
      }

      if (res?.ok) {
        toast({
          title: "Check Your Email",
          description: "A sign-in link has been sent to your email address.",
          variant: "success",
        });
        router.push("/verify-request");
      } else {
        throw new Error("Could not initiate sign-in. Please try again.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      toast({
        title: "Sign-In Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Sign-in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center px-4 pb-12 h-screen custom-bg-header">
        <h1 className="text-2xl font-bold text-gray-900 mb-7">
          McNulty Counseling and Wellness
        </h1>
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white border rounded-lg p-8 space-y-6">
            <div className="flex justify-center">
              <Image
                alt="Email Icon"
                className="mb-2"
                height={48}
                src={emailIcon}
                width={48}
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="mt-2 text-sm text-gray-400">
                Enter your email address and we&apos;ll send you <br /> a
                password-free link to sign in
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                required
                className="w-full p-2"
                disabled={isLoading}
                id="email"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="w-full text-white p-2 rounded-lg bg-green-700 hover:bg-green-800"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "SENDING..." : "SEND LINK"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
              </div>
              <Button
                disabled
                className="w-full border border-gray-400 bg-slate-50 p-2"
                type="button"
                variant="outline"
              >
                <span className="flex justify-start items-center text-gray-400 gap-4">
                  <Image alt="Google" className="w-5 h-5" src={googleIcon} />
                  <span className="text-center">CONTINUE WITH GOOGLE</span>
                </span>
              </Button>
            </form>
          </div>
          <div className="text-center text-sm mt-12">
            <span className="text-gray-400">New client?</span>{" "}
            <Link
              className="font-medium text-green-700 hover:text-green-500"
              href="#"
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
