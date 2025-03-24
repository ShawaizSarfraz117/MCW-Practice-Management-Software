import type { Metadata } from 'next';
import './globals.css';
import '@mcw/ui/styles.css';
import Sidebar from "@backOffice/components/layouts/Sidebar"

export const metadata: Metadata = {
  title: 'Back Office | Admin Portal',
  description: 'Admin/therapist application',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}