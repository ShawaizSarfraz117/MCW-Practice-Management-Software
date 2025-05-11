"use client"; // Or remove if no client-side interactivity is needed for this simple page

import Link from "next/link";
import { Button } from "@mcw/ui"; // Assuming you might want a button to go back

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.8-8.464c.07.09.127.198.18.313m0 0c-.053.115-.108.222-.18.313m0 0l-6.478 3.488m6.478-3.488l-6.478-3.488m6.478 3.488L21 12m-12.75 0l6.478 3.488m-6.478-3.488L2.25 12M12 14.25v5.25m0 0l-3.75-2.25M12 19.5l3.75-2.25"
            />
          </svg>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Check your email
          </h1>
          <p className="mt-4 text-base text-gray-600">
            A sign-in link has been sent to your email address.
          </p>
          <p className="mt-2 text-base text-gray-600">
            Please click the link in your email to complete the sign-in process.
          </p>
        </div>
        <div className="rounded-md bg-blue-50 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                If you don&apos;t see the email in your inbox within a few
                minutes, please check your spam or junk folder.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
