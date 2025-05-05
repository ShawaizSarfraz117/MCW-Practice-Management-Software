import type { Metadata } from "next";
import Sidebar from "@/components/layouts/Sidebar";
import { NextAuthProvider } from "@/contexts/NextAuthProvider";
import { SidebarProvider } from "../contexts/SidebarContext";
import { Toaster } from "@mcw/ui";
import TopBar from "@/components/layouts/Topbar";

export const metadata: Metadata = {
  title: "Back Office | Admin Portal",
  description: "Admin/therapist application",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthProvider>
      <SidebarProvider>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex flex-col flex-1 overflow-y-auto">
            <TopBar />
            {children}
          </main>
          <Toaster />
        </div>
      </SidebarProvider>
    </NextAuthProvider>
  );
}
