"use client";
import { Button, Card, useToast } from "@mcw/ui";
import WidgetPreview from "@/assets/images/widget-preview.png";
import Image from "next/image";
import CopyIcon from "@/assets/images/copy-icon.svg";
import { useWidgetSettings } from "./hooks/useWidgetSettings";

export default function AppointmentRequestWidgetPage() {
  const { settings, loading } = useWidgetSettings();
  const { toast } = useToast();

  // Use widget code from settings
  const displayWidgetCode = settings?.general?.widgetCode || "";

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-[#1f2937]">
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1F2937] mb-1">
            Appointment Request Widget
          </h1>
          <p className="text-[#6B7280] text-base">
            Add appointment request to your website.
          </p>
        </div>
        <div className="bg-[#eaf3fd] rounded-xl p-6 flex flex-row md:flex-col items-center gap-6 mb-8">
          <div className="flex-1 min-w-[220px]">
            <h2 className="text-xl font-semibold text-[#1F2937] mb-2">
              Get new clients from your website.
            </h2>
            <p className="text-[#374151] text-base mb-4">
              Simply add the code to your website and we'll take it from there.
              <br />
              Our booking flow works seamlessly and is optimized for conversion.
            </p>
            <Button className="bg-[#de6a26] hover:bg-[#f15913] text-white font-semibold text-base px-6 py-2 mb-3">
              Preview Widget
            </Button>
            <div className="flex items-center gap-2 text-[#374151] text-sm mt-1">
              <svg
                className="h-5 w-5 text-[#de6a26]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>
                Try me! This button shows you how the appointment request widget
                will work on your website.
              </span>
            </div>
          </div>
          <div className="flex-1 flex justify-end items-center min-w-[220px]">
            <Image
              alt="Widget Preview"
              className="max-w-full h-auto rounded-lg shadow-lg"
              height={200}
              src={WidgetPreview}
              style={{ maxWidth: 260 }}
              width={260}
            />
          </div>
        </div>
        <div className="mb-2">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-1">
              Code for your appointment request widget:
            </h2>
            <p className="text-[#374151] text-sm">
              Add this code into your website where you want your appointment
              request widget to be.{" "}
              <a className="text-[#2563EB] hover:underline" href="#">
                How to add it
              </a>
            </p>
          </div>
          {/* Widget code is fetched from database using the ClientCareSettingsService dictionary pattern */}
          <Card className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-4" />
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            ) : (
              <>
                <pre className="overflow-x-auto text-xs text-[#374151] bg-transparent p-0 whitespace-pre-wrap break-all mb-4">
                  {displayWidgetCode ||
                    "Widget code will be displayed here when available."}
                </pre>
                <div className="flex justify-between items-center">
                  <Button
                    className="bg-[#188153] hover:bg-[#146945] text-white font-medium px-4 py-1"
                    disabled={!displayWidgetCode}
                    size="sm"
                    onClick={() => {
                      if (displayWidgetCode) {
                        navigator.clipboard.writeText(displayWidgetCode);
                        toast({
                          title: "Copied!",
                          description: "Widget code copied to clipboard",
                        });
                      }
                    }}
                  >
                    <span className="mr-2">
                      <Image alt="Copy" height={14} src={CopyIcon} width={14} />
                    </span>
                    Copy code
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
