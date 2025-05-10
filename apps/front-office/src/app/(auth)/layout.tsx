import type { Metadata } from "next";
import { Toaster } from "@mcw/ui";

export const metadata: Metadata = {
  title: "Front Office | Authentication",
  description: "Authentication pages for the front office application",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <main className="flex flex-col flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
