
"use client";

import TopBar from "@/components/layouts/Topbar";
import History from "@/(dashboard)/activity/components/History";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";


export default function ClientsPage() {

  return (
    <>
      <TopBar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">


          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Account Activity</h2>
          </div>
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="flex items-start justify-start w-full bg-transparent  p-0 h-auto">
              <TabsTrigger
                value="history"
                className="px-4 py-2 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-700 font-medium"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                value="signin"
                className="px-4 py-2 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-700 font-medium"
              >
                Sign In Events
              </TabsTrigger>
              <TabsTrigger
                value="hipaa"
                className="px-4 py-2 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none rounded-none bg-transparent text-gray-700 font-medium"
              >
                HIPAA Audit Log
              </TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
              <History />
            </TabsContent>
            <TabsContent value="signin" className="mt-4">
              <div className="p-4">
                <h2 className="text-lg font-medium">Sign In Events</h2>
                <p className="text-gray-600 mt-2">View your sign in events here.</p>
              </div>
            </TabsContent>
            <TabsContent value="hipaa" className="mt-4">
              <div className="p-4">
                <h2 className="text-lg font-medium">HIPAA Audit Log</h2>
                <p className="text-gray-600 mt-2">View your HIPAA audit logs here.</p>
              </div>
            </TabsContent>
          </Tabs>




        </main>
      </div>
    </>

  );
}