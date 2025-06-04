"use client";

import React, { useState } from "react";
import { Button } from "@mcw/ui";
import { FileText, Upload } from "lucide-react";

interface Document {
  id: string;
  name: string;
  date: string;
  status: "pending" | "completed";
  isNew?: boolean;
}

export default function ClientDocuments() {
  const [showWelcome, setShowWelcome] = useState(true);

  const needsToBeCompleted: Document[] = [
    {
      id: "1",
      name: "Notice of Privacy Practices",
      date: "Dec 16, 2024",
      status: "pending",
    },
    {
      id: "2",
      name: "Substance Abuse - Intake Form",
      date: "Dec 16, 2024",
      status: "pending",
      isNew: true,
    },
    {
      id: "3",
      name: "Credit Card Information",
      date: "Dec 16, 2024",
      status: "pending",
    },
  ];

  const completed: Document[] = [
    {
      id: "4",
      name: "Group Therapy Consent",
      date: "Apr 05, 2025",
      status: "completed",
    },
    {
      id: "5",
      name: "Minor Informed Consent for Psychiatric Services",
      date: "Apr 05, 2025",
      status: "completed",
    },
  ];

  if (showWelcome) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-3xl font-medium text-gray-700 mb-8">
            Welcome to your Client Portal
          </h1>
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <p className="text-gray-700">Hi Shawaiz,</p>
            <p className="text-gray-600 leading-relaxed">
              This secure client portal will help us get started by making it
              easy for you to review our practice policies and provide some
              basic information before our first session.
            </p>
            <p className="text-gray-600 leading-relaxed">
              If you leave the secure portal before completing everything, you
              can use the link we emailed to come back and start over. It should
              take between 5-20 minutes to finish.
            </p>
          </div>
          <div className="mt-12 flex justify-end">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white px-8"
              size="lg"
              onClick={() => setShowWelcome(false)}
            >
              GET STARTED
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Needs to be completed section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Needs to be completed
            </h2>
            <span className="text-sm text-gray-500">DATE RECEIVED</span>
          </div>
          <div className="space-y-2">
            {needsToBeCompleted.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{doc.name}</span>
                  {doc.isNew && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      NEW
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">{doc.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completed section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Completed</h2>
            <span className="text-sm text-gray-500">DATE COMPLETED</span>
          </div>
          <div className="space-y-2">
            {completed.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{doc.name}</span>
                </div>
                <span className="text-sm text-gray-500">{doc.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Uploads section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Uploads</h2>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Upload files of any type here.
                <br />
                JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX (up to 25 MB)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
