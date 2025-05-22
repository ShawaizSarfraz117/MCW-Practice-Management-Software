"use client";

import React from "react";
import { Button } from "@mcw/ui";
import Image from "next/image";
import appointmentMap from "@/assets/images/appointment-map.svg";

export default function ClientDashboard() {
  return (
    <div className="flex flex-col bg-gray-50">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-2 py-8 w-full">
        <div className="w-full max-w-4xl">
          {/* New appointment prompt */}
          <div className="mb-8 p-0">
            <div className="flex items-center justify-around px-8 py-8  rounded-t-lg">
              <span className="text-lg text-gray-400">New appointment?</span>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-2 rounded"
                size="lg"
              >
                REQUEST NOW
              </Button>
            </div>
            {/* Tabs */}
            <div className="pt-4 mb-3 order-gray-200">
              <div className="flex gap-8">
                <button className="pb-1 uppercase tracking-wide text-green-700 font-semibold border-b-2 border-green-600 text-xs">
                  Upcoming
                </button>
                <button className="pb-1 uppercase tracking-wide text-gray-400 hover:text-green-700 font-medium text-xs">
                  Requested
                </button>
              </div>
            </div>
            {/* Appointment Card */}
            <div className="flex flex-row items-center gap-6 border border-gray-200 rounded-lg">
              {/* Left: Appointment Info */}
              <div className="flex-1 min-w-[220px]  p-8 flex flex-col justify-between">
                <div>
                  <div className="uppercase text-xs text-gray-400 mb-1">
                    apr 09, 2025
                  </div>
                  <div className="text-xl font-semibold text-gray-800 mb-2">
                    8:00PM—9:30PM<span className="ml-1 text-xs">PKT</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Travis McNulty
                  </div>
                  <div className="flex items-start gap-2 text-gray-700 mb-2">
                    <svg
                      className="w-6 h-6 text-green-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      111 2nd Ave NE, Suite 1101
                      <br />
                      Saint Petersburg, FL 33701-3443
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-2 text-sm text-green-700 mt-2">
                  <a href="#" className="underline">
                    Add to Calendar
                  </a>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">
                    Call to cancel (727) 344-9867
                  </span>
                </div>
              </div>
              {/* Right: Map Preview */}
              <div className="flex flex-col items-center justify-center">
                {/* Figma map image */}
                <Image
                  src={appointmentMap}
                  alt="Map"
                  width={400}
                  height={400}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
