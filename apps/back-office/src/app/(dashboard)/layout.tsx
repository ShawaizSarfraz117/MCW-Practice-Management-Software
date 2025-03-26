import type { Metadata } from "next";
import Sidebar from "@/components/layouts/Sidebar";
import { NextAuthProvider } from '@/contexts/NextAuthProvider'

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
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </NextAuthProvider>
  );
}
