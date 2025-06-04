"use client";

import { Button, Card } from "@mcw/ui";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PaymentSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-semibold text-2xl text-gray-900">
          Online Payments
        </h1>
        <p className="mt-1 text-gray-500">Setup and manage online payments</p>
      </div>

      {/* Hero Card */}
      <Card className="bg-blue-50 border-0 overflow-hidden rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row p-6 md:p-8 relative">
          <div className="md:w-3/5">
            <h2 className="font-semibold mb-2 text-gray-900 text-xl">
              Receive payments from clients today
            </h2>
            <p className="mb-6 text-gray-500">
              Add your bank details; that's it. No card readers or terminals,
              and no setup. Get paid faster.
            </p>

            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="bg-black flex h-5 items-center justify-center rounded-full w-5">
                    <Check className="h-3 text-white w-3" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    All major credit & debit cards accepted
                  </h3>
                  <p className="text-gray-500">
                    This also includes FSA and HSA cards
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="bg-black flex h-5 items-center justify-center rounded-full w-5">
                    <Check className="h-3 text-white w-3" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Transparent processing fees
                  </h3>
                  <p className="text-gray-500">
                    For each successful charge: 3.15% + 30¢ and no fees for
                    refunds
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar section that matches the new reference image */}
          <div className="flex items-center justify-end md:absolute md:right-8 md:top-1/2 md:transform md:-translate-y-1/2">
            <div className="h-40 relative w-64">
              {/* Left column */}
              <div className="absolute left-4 top-0">
                <div className="bg-gray-400 h-14 overflow-hidden rounded-full w-14" />
                <span className="absolute -bottom-1 bg-white left-1/2 px-1.5 py-0.5 rounded-full shadow-sm text-blue-600 text-xs -translate-x-1/2 font-medium">
                  +$90
                </span>
              </div>

              <div className="absolute bottom-0 left-4">
                <div className="bg-gray-900 h-14 overflow-hidden rounded-full w-14" />
                <span className="absolute -bottom-1 bg-white left-1/2 px-1.5 py-0.5 rounded-full shadow-sm text-blue-600 text-xs -translate-x-1/2 font-medium">
                  +$90
                </span>
              </div>

              {/* Middle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-purple-400 h-14 overflow-hidden rounded-full w-14" />
                <span className="absolute -bottom-1 bg-white left-1/2 px-1.5 py-0.5 rounded-full shadow-sm text-blue-600 text-xs -translate-x-1/2 font-medium">
                  +$90
                </span>
              </div>

              {/* Right column */}
              <div className="absolute right-4 top-0">
                <div className="bg-blue-300 h-14 overflow-hidden rounded-full w-14" />
                <span className="absolute -bottom-1 bg-white left-1/2 px-1.5 py-0.5 rounded-full shadow-sm text-blue-600 text-xs -translate-x-1/2 font-medium">
                  +$90
                </span>
              </div>

              <div className="absolute bottom-0 right-4">
                <div className="bg-blue-200 h-14 overflow-hidden rounded-full w-14" />
                <span className="absolute -bottom-1 bg-white left-1/2 px-1.5 py-0.5 rounded-full shadow-sm text-blue-600 text-xs -translate-x-1/2 font-medium">
                  +$90
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sign up section */}
      <section className="max-w-full space-y-4">
        <h2 className="font-semibold text-gray-900 text-xl">
          Sign up for Online Payments
        </h2>
        <p className="leading-relaxed max-w-full text-gray-600 text-sm">
          In order to sign up for your Online Payments account, we need to
          verify your <br />
          SimplePractice email address and that you have a valid phone number.
          After you verify <br />
          your email address, choose one of the options below to request a
          security code be sent
          <br /> to your phone number{" "}
          <span className="font-medium">
            <strong>(727) 510-1326</strong>
          </span>
          .
        </p>
        <p className="text-gray-600 text-sm">
          If this is not your mobile phone number, please update your{" "}
          <Link
            className="hover:underline text-emerald-600"
            href="/settings/profile-security"
          >
            Profile and security
          </Link>
          .
        </p>

        <div className="mt-6 space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">
              1. Verify account email address
            </h3>
            <div className="flex gap-2 items-center">
              <Check className="h-4 text-emerald-600 w-4" />
              <p className="text-emerald-600 text-sm">
                Email verification complete
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">
              2. How would you like to receive your security code?
            </h3>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button className="bg-emerald-700 hover:bg-emerald-800 px-6 text-white">
                Call Me
              </Button>
              <Button className="bg-emerald-700 hover:bg-emerald-800 px-6 text-white">
                Text Me
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
