"use client";

import React from "react";
import { ProtectedRoute } from "@/Components/ProtectedRoute";
import { Footer } from "@/Components/footer";

export default function ClientDashboard() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-col flex-wrap items-center custom-bg-heder justify-center px-4 pb-12 bg-gray-50 flex-grow">
          <h1 className="text-2xl font-bold text-gray-900 mb-7">
            McNulty Counseling and Wellness
          </h1>
          <div className="w-full max-w-md space-y-6 ">
            <div className="bg-white border rounded-lg sm:p-8 h-[30vh] flex items-center p-[5rem] space-y-6">
              <div className="text-center">
                <h2 className="text-xl text-gray-900">
                  Welcome to your dashboard
                </h2>
                <div className="mt-4 space-y-2 text-gray-400">
                  <p className="text-sm">
                    You are now successfully logged in to your MCW client
                    portal. Here you can:
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
