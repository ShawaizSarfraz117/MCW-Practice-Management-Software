"use client"

import { useState } from "react"
import { Search, Plus, Share, MessageSquare, ChevronDown, Filter } from "lucide-react"
import { Button, Input, Card } from "@mcw/ui"
import ClientTable from "./ClientTable"

export default function Clients() {
  const [sortBy, setSortBy] = useState("last name")

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Back Office Portal</h1>
      </header>

      <main className="p-6">
        {/* Transfer Client Data Card */}
        <Card className="mb-8 p-6 relative">
          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

          <div className="flex">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-semibold mb-2">Transfer your client data</h2>
              <p className="text-gray-600 mb-4">
                Follow our step-by-step guide and work with our SimplePractice team to transfer demographic data for
                your existing clients
              </p>
              <Button className="bg-[#2d8467] hover:bg-[#236c53]">Transfer client data</Button>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/images/transfer.svg"
                alt="Transfer illustration"
                className="h-[120px] w-[120px]"
              />
            </div>
          </div>
        </Card>

        {/* Clients and Contacts Section */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Clients and contacts</h2>
            <p className="text-sm text-gray-500">Total Clients: 3</p>
          </div>
          <Button className="bg-[#2d8467] hover:bg-[#236c53]">Add New Client</Button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="relative w-[230px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search" className="pl-9 h-10 bg-white border-[#e5e7eb]" />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="border-[#e5e7eb] bg-white h-10">
              <Filter className="mr-2 h-4 w-4 text-blue-500" />
              Client status
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort:</span>
              <Button variant="outline" className="border-[#e5e7eb] bg-white h-10">
                {sortBy}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <ClientTable />
      </main>
    </div>
  )
} 