"use client";
import {
  Switch,
  Input,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mcw/ui";
import { useState } from "react";
import { Lock } from "lucide-react";

export default function ClientPortalCard() {
  const [editing, setEditing] = useState(false);
  const [subdomain, setSubdomain] = useState("alam-naqvi");

  return (
    <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-[#1F2937] mb-1">
              Client Portal
            </CardTitle>
            <div className="text-sm text-[#6B7280] font-medium mb-1">
              Default domain
            </div>
            <div className="text-sm text-[#6B7280] mb-2">
              This is the default domain of your Website and Client Portal.{" "}
              <a href="#" className="text-[#2563EB] hover:underline">
                Learn more
              </a>
            </div>
          </div>
          <Switch
            defaultChecked
            className="mt-1 scale-125 data-[state=checked]:bg-[#188153]"
          />
        </div>
        <div className="w-full max-w-xl h-10 flex items-center gap-2 mt-2">
          {editing ? (
            <>
              <span className="text-[#BDBDBD] text-base font-medium bg-[#F5F5F5] border border-[#E5E7EB] rounded-l-md px-3 h-10 flex items-center select-none">
                https://
              </span>
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="w-full h-10 text-base font-medium border-t border-b border-[#E5E7EB] rounded-none focus-visible:ring-0 bg-white min-w-0"
                style={{ borderLeft: "none", borderRight: "none" }}
                autoFocus
              />
              <span className="text-[#BDBDBD] text-base font-medium bg-[#F5F5F5] border border-[#E5E7EB] rounded-r-md px-3 h-10 flex items-center select-none">
                .clientsecure.me
              </span>
              <Button
                size="sm"
                className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-5 ml-2"
                onClick={() => setEditing(false)}
              >
                Save
              </Button>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] ml-1">
                <Lock className="h-5 w-5 text-[#9CA3AF]" />
              </span>
            </>
          ) : (
            <>
              <Input
                value={`https://${subdomain}.clientsecure.me`}
                className="w-full h-10 text-base font-medium bg-white border border-[#E5E7EB] focus-visible:ring-0 focus-visible:border-[#2D8467] rounded-md"
                readOnly
              />
              <Button
                size="sm"
                className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-5"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] ml-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-[#9CA3AF]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect
                    x="9"
                    y="9"
                    width="13"
                    height="13"
                    rx="2"
                    strokeWidth="2"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="13"
                    height="13"
                    rx="2"
                    strokeWidth="2"
                  />
                </svg>
              </span>
            </>
          )}
        </div>
        {editing && (
          <div className="flex items-center gap-2 mt-2 ml-1">
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              This URL is available
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-[#F1F7FE] border border-[#D1E7FB] rounded-lg p-4 flex items-start gap-3 mt-4 relative">
          <div>
            <div className="font-semibold text-[#1F2937] mb-1">
              Your Client Portal is enabled
            </div>
            <div className="text-[#4B5563] text-sm leading-relaxed">
              Your Client Portal is a place where people can find you online and
              for you to communicate securely with clients. Play around with the
              Client Portal and customize it to make it your own.
              <a href="#" className="text-[#2563EB] ml-1 hover:underline">
                Learn more
              </a>
            </div>
          </div>
          <button className="absolute top-3 right-3 text-[#6B7280] hover:text-[#111827]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
