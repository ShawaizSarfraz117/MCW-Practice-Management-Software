"use client";

import { ShieldAlert, ImageIcon, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function Profile() {
  return (
    <div>
      {/* Profile and Security Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Profile and Security
        </h1>
        <p className="text-gray-600 mt-1">
          Personal info and security preferences
        </p>

        <div className="mt-4 flex items-center text-blue-600">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <PlayCircle className="h-3 w-3 text-blue-600" />
          </div>
          <span className="text-sm">
            Watch a quick video about Profile and security
          </span>
        </div>
      </div>

      {/* SimplePractice Profile */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">
            SimplePractice profile
          </h2>
          <Link className="text-blue-600 text-sm" href="#">
            Edit
          </Link>
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-800">Alam Naqvi</h3>
          <p className="text-gray-600 mt-1">Date of birth: mm/dd/yyyy</p>
        </div>
      </div>

      {/* SimplePractice Security */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">
            SimplePractice security
          </h2>
          <Link className="text-blue-600 text-sm" href="#">
            Manage
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-600">Email:</p>
            </div>
            <div>
              <p>alam@mcnultycw.com</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
              <ShieldAlert className="h-3 w-3 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">
              2-step verification off
            </span>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="text-gray-600">Phone:</p>
            </div>
            <div>
              <p>(727) 510-1326</p>
            </div>
          </div>

          <div>
            <p className="text-gray-600">
              Password last changed on February 6, 2025
            </p>
          </div>
        </div>
      </div>

      {/* Profile Photo */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-2">
          Profile photo
        </h2>
        <p className="text-gray-600 mb-4">
          Add your professional profile image to personalize your SimplePractice
          account.
        </p>

        <div className="border border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center">
          <div className="mb-4">
            <ImageIcon className="h-16 w-16 text-gray-300" />
          </div>
          <button className="text-blue-600 text-sm font-medium mb-1">
            Choose image or drag and drop image
          </button>
          <p className="text-xs text-gray-500 text-center">
            Upload .jpg or .png image
            <br />
            Max upload size: 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
