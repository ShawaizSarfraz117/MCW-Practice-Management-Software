"use client";

import Link from "next/link";
import { Button } from "@mcw/ui";
import { MoveLeft } from "lucide-react";
import successImage from "@/assets/images/mailSent.svg";
import Image from "next/image";
import { Footer } from "@/components/Footer";

export default function VerifyRequestPage() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center px-4 pb-12 h-[80vh] custom-bg-header">
        <h1 className="text-2xl font-bold text-gray-900 mb-7">
          McNulty Counseling and Wellness
        </h1>
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white border rounded-lg sm:p-8 p-[5rem] space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <Image alt="Success" height={60} src={successImage} width={100} />
            </div>
            <div className="text-center">
              <h2 className="text-xl text-gray-900">Your link is on the way</h2>
              <div className="mt-4 space-y-2 text-gray-400">
                <p className="text-sm">A link has been sent to on your email</p>
                <p className="text-sm">
                  It expires in 24 hours and can only be used once
                </p>
              </div>
            </div>

            <div className="space-y-10 text-center">
              <div className="flex flex-wrap items-center justify-center">
                <p className="text-sm text-gray-400">
                  Didn&apos;t get the link?
                </p>
                <p className="mx-2 text-sm text-green-600">Try these tips</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 text-green-600">
          <Link href="/login">
            <Button className="inline-flex items-center" variant="link">
              <MoveLeft className="mr-1 h-4 w-4" />
              Back to Sign in
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
