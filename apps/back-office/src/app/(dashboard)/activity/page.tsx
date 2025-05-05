"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@mcw/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@mcw/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import ActivityTable from "./components/ActivityTable";

export default function AccountActivitySection() {
  const [showDetails, setShowDetails] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("All Time");
  const [searchQuery, setSearchQuery] = useState("");

  const timeRanges = [
    "All Time",
    "Last 24 Hours",
    "Last 7 Days",
    "Last 30 Days",
    "Last 90 Days",
  ];

  return (
    <div className="flex-1 overflow-auto">
      <main className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-[#1f2937]">
            Account Activity
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Tabs className="w-full" defaultValue="history">
            <TabsList className="border-b w-full justify-start rounded-none p-0 h-auto bg-transparent">
              <TabsTrigger
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2d8467] data-[state=active]:text-[#2d8467] px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                value="history"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2d8467] data-[state=active]:text-[#2d8467] px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                value="signin"
              >
                Sign In Events
              </TabsTrigger>
              <TabsTrigger
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2d8467] data-[state=active]:text-[#2d8467] px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                value="hipaa"
              >
                HIPAA Audit Log
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              {/* Search and Filter */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-[230px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="px-9 h-10 bg-white border-[#e5e7eb]"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 px-4 h-10 bg-white border border-[#e5e7eb] rounded-md text-gray-700">
                      <span>{selectedTimeRange}</span>
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {timeRanges.map((range) => (
                        <DropdownMenuItem
                          key={range}
                          onClick={() => setSelectedTimeRange(range)}
                        >
                          {range}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <button
                  className="text-[#2d8467] text-sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide details" : "Show details"}
                </button>
              </div>

              <ActivityTable
                searchQuery={searchQuery}
                showDetails={showDetails}
                timeRange={selectedTimeRange}
              />
            </div>

            <TabsContent value="signin">
              <div className="flex items-center justify-center h-40 text-gray-500">
                Sign In Events content
              </div>
            </TabsContent>

            <TabsContent value="hipaa">
              <div className="flex items-center justify-center h-40 text-gray-500">
                HIPAA Audit Log content
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
