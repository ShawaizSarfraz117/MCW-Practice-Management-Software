"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
  Plus,
  ChevronDown,
  Info,
  Search,
  X,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react"
import AdministrativeNoteDrawer from "@/app/views/clients/AdministrativeNoteDrawer"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ClientProfileProps {
  clientId: string
}

export default function ClientProfile({ clientId }: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState("measures")
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <AdministrativeNoteDrawer open={adminNoteModalOpen} onOpenChange={setAdminNoteModalOpen} />

      <div className="px-4 sm:px-6 py-4 text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
        <Link href="/clients" className="hover:text-gray-700">
          Clients and contacts
        </Link>
        <span className="mx-1">/</span>
        <span>Jamie D. Appleseed&apos;s profile</span>
      </div>

      {/* Client Header */}
      <div className="px-4 sm:px-6 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold mb-1">Jamie D. Appleseed</h1>
          <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
            <span>Adult</span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span>07/23/2009 (15)</span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span>Next Appt: 02/07/2025 (1 left)</span>
            <button className="text-blue-500 hover:underline">Edit</button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white text-xs sm:text-sm">
            Share
          </Button>
          <Button variant="outline" className="bg-white text-xs sm:text-sm">
            Upload
          </Button>
          <Button className="bg-[#2d8467] hover:bg-[#236c53] text-xs sm:text-sm">Message</Button>
        </div>
      </div>

      {/* Add Administrative Note Button - Fixed at the top */}
      <div className="hidden lg:block sticky top-0 z-10">
        <div className="absolute right-[324px] top-1">
          <Button variant="ghost" className="text-blue-500 hover:bg-blue-50" onClick={() => setAdminNoteModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Administrative Note
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1">
        <div className="flex-1 border-t border-[#e5e7eb]">
          {/* Tabs */}
          <Tabs defaultValue="measures" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-[#e5e7eb] overflow-x-auto">
              <div className="px-4 sm:px-6">
                <TabsList className="h-[40px] bg-transparent p-0 w-auto">
                  <TabsTrigger
                    value="overview"
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "overview" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="billing"
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "billing" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                  >
                    Billing
                  </TabsTrigger>
                  <TabsTrigger
                    value="measures"
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "measures" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                  >
                    Measures
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className={`rounded-none h-[40px] px-3 sm:px-4 text-sm data-[state=active]:shadow-none data-[state=active]:bg-transparent ${activeTab === "files" ? "data-[state=active]:border-b-2 data-[state=active]:border-[#2d8467] text-[#2d8467]" : "text-gray-500"}`}
                  >
                    Files
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
              {/* Text Editor */}
              <div className="mb-6">
                <div className="flex gap-2 sm:gap-4 mb-2 overflow-x-auto">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Add Chart Note: include notes from a call with a client or copy & paste the contents of a document"
                  className="min-h-[100px] border-[#e5e7eb] resize-none"
                />
              </div>

              <div className="text-sm text-gray-500 mb-4">
                02/06/2025 5:07 pm
                <button className="text-blue-500 hover:underline ml-4">+ Add Note</button>
              </div>

              {/* Date Range and Filter */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value="01/08/2025 - 02/06/2025"
                    className="w-full sm:w-[200px] h-9 bg-white border-[#e5e7eb]"
                  />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
                      <SelectValue placeholder="All Items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="appointments">Appointments</SelectItem>
                      <SelectItem value="measures">Measures</SelectItem>
                      <SelectItem value="notes">Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#2d8467] hover:bg-[#236c53]">New</Button>
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                {/* Scored measure */}
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-gray-500">FEB 8</div>
                    <div className="font-medium">Scored measure</div>
                    <div className="text-sm text-gray-500">GAD-7</div>
                  </div>
                  <div className="text-sm text-gray-500">1:00 PM</div>
                </div>

                {/* Appointment #2 */}
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-gray-500">FEB 8</div>
                    <div className="font-medium">Appointment #2</div>
                    <div className="text-sm text-gray-500">GAD-7</div>
                    <button className="text-blue-500 hover:underline text-sm mt-1">+ Progress Note</button>
                  </div>
                  <div className="text-sm text-gray-500">1:00 PM</div>
                </div>

                {/* Appointment #1 */}
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-gray-500">FEB 8</div>
                    <div className="font-medium">Appointment #1</div>
                    <div className="text-sm text-gray-500">GAD-7</div>
                  </div>
                  <div className="text-sm text-gray-500">1:00 PM</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
              {/* Date Range and Filter */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value="01/08/2025 - 02/06/2025"
                    className="w-full sm:w-[200px] h-9 bg-white border-[#e5e7eb]"
                  />
                  <Select defaultValue="billable">
                    <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
                      <SelectValue placeholder="Billable Items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billable">Billable Items</SelectItem>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="invoices">Invoices</SelectItem>
                      <SelectItem value="payments">Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#2d8467] hover:bg-[#236c53]">New</Button>
              </div>

              {/* Billing Table */}
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[120px] font-medium">Date</TableHead>
                      <TableHead className="font-medium">Details</TableHead>
                      <TableHead className="font-medium">Fee</TableHead>
                      <TableHead className="font-medium">Client</TableHead>
                      <TableHead className="font-medium">Write-Off</TableHead>
                      <TableHead className="font-medium"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3].map((item) => (
                      <TableRow key={item}>
                        <TableCell className="font-medium">FEB 6</TableCell>
                        <TableCell>
                          <div>90834</div>
                          <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded">
                            INV #3
                          </div>
                        </TableCell>
                        <TableCell>$100</TableCell>
                        <TableCell>$100</TableCell>
                        <TableCell>--</TableCell>
                        <TableCell>
                          <div className="flex justify-between items-center">
                            <span className="text-red-500 text-sm">Unpaid</span>
                            <Button variant="link" className="text-blue-500">
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="measures" className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
              {/* New Measures Available Alert */}
              <Alert className="mb-6 bg-white border-[#e5e7eb]">
                <div className="flex justify-between items-start">
                  <div>
                    <AlertTitle className="text-black font-medium mb-1">New measures available</AlertTitle>
                    <AlertDescription className="text-gray-600">
                      Track new measurements such as therapeutic alliance, pain, functioning, or other symptoms.
                    </AlertDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-500">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="mt-3 bg-[#2d8467] hover:bg-[#236c53]">View measures</Button>
              </Alert>

              {/* Completed Measure */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-4">Completed by Jamie A.</div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">GAD-7</h3>
                  <div className="flex gap-4">
                    <span className="text-green-500 text-sm">+2 since baseline</span>
                    <span className="text-green-500 text-sm">+2 since last</span>
                  </div>
                </div>

                {/* Graph */}
                <div className="relative h-[200px] mb-2">
                  {/* Scale Labels */}
                  <div className="absolute right-0 top-0 text-sm text-gray-500">Severe</div>
                  <div className="absolute right-0 top-[33%] text-sm text-gray-500">Moderate</div>
                  <div className="absolute right-0 top-[66%] text-sm text-gray-500">Mild</div>
                  <div className="absolute right-0 bottom-0 text-sm text-gray-500">
                    None—
                    <br />
                    minimal
                  </div>

                  {/* Horizontal Lines */}
                  <div className="absolute left-0 right-16 top-0 border-t border-gray-200"></div>
                  <div className="absolute left-0 right-16 top-[33%] border-t border-gray-200"></div>
                  <div className="absolute left-0 right-16 top-[66%] border-t border-gray-200"></div>
                  <div className="absolute left-0 right-16 bottom-0 border-t border-gray-200"></div>

                  {/* Graph Line */}
                  <div className="absolute left-[20%] right-16 top-[33%] border-t border-gray-300"></div>

                  {/* Data Point */}
                  <div className="absolute left-[60%] top-[33%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-[#f59e0b] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      10
                    </div>
                  </div>
                </div>

                {/* Date Labels */}
                <div className="flex justify-between pr-16">
                  <div className="text-sm text-gray-500">Feb 7</div>
                  <div className="text-sm text-gray-500">Feb 12</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search files" className="pl-9 h-10 bg-white border-[#e5e7eb]" />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] h-10 bg-white border-[#e5e7eb]">
                      <SelectValue placeholder="All files" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All files</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="measures">Measures</SelectItem>
                      <SelectItem value="images">Images</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#2d8467] hover:bg-[#236c53]">
                    Actions <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Files Table */}
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium">Name</TableHead>
                      <TableHead className="font-medium">Type</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium">
                        <div className="flex items-center">
                          Updated <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <span className="text-blue-500">GAD-7</span>
                      </TableCell>
                      <TableCell>Measure</TableCell>
                      <TableCell>
                        <span className="text-green-600">Completed JA</span>
                      </TableCell>
                      <TableCell>2/6/25</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <span className="text-blue-500">GAD-7</span>
                      </TableCell>
                      <TableCell>Measure</TableCell>
                      <TableCell>
                        <span className="text-green-600">Completed JA</span>
                      </TableCell>
                      <TableCell>2/8/25</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Show as a bottom section on mobile/tablet */}
        <div className="w-full lg:w-[300px] lg:min-w-[300px] border-t lg:border-t-0 lg:border-l border-[#e5e7eb] p-4 sm:p-6">
          {/* Client Billing */}
          <div className="mb-8">
            <h3 className="font-medium mb-4">Client billing</h3>

            <div className="flex justify-between mb-2">
              <div className="text-sm">Client balance</div>
              <div className="text-sm font-medium text-red-500">$200</div>
            </div>

            <div className="flex justify-between mb-2">
              <div className="text-sm">Unallocated (1)</div>
              <div className="text-sm font-medium">$100</div>
            </div>

            <div className="flex justify-between mb-4">
              <div className="text-sm">Unpaid invoices (3)</div>
              <div className="text-sm font-medium">$300</div>
            </div>

            <Button className="w-full bg-[#2d8467] hover:bg-[#236c53]">Add Payment</Button>
          </div>

          {/* Client Info */}
          <div className="mb-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-medium">Client info</h3>
              <button className="text-blue-500 hover:underline text-sm">Edit</button>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Invoices</h3>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-500">INV #3</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white text-xs">Unpaid</Badge>
                  <div className="text-xs text-gray-500">02/06/2025</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-500">INV #2</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white text-xs">Unpaid</Badge>
                  <div className="text-xs text-gray-500">02/05/2025</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-500">INV #1</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white text-xs">Unpaid</Badge>
                  <div className="text-xs text-gray-500">02/04/2025</div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Documents Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <h3 className="font-medium">Billing documents</h3>
                <Info className="h-4 w-4 text-gray-400 ml-1" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-500">SB #0001</div>
                <div className="text-xs text-gray-500">02/01 - 02/05/2025</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-500">STMT #0001</div>
                <div className="text-xs text-gray-500">02/01 - 02/06/2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Add Administrative Note Button - Fixed at the bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-[#e5e7eb] bg-white">
        <div className="px-4 sm:px-6 py-2">
          <Button variant="ghost" className="text-blue-500 hover:bg-blue-50 w-full justify-center" onClick={() => setAdminNoteModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Administrative Note
          </Button>
        </div>
      </div>
    </div>
  )
}

