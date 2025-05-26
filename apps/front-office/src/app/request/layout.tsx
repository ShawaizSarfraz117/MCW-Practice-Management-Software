import Link from "next/link";
import { RequestProvider } from "./context";
import RequestContent from "./content";

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-serif text-gray-900">
            Alam Naqvi
          </Link>
        </div>
      </div>

      {/* Appointment Request Banner */}
      <div className="bg-[#f3efe6] py-[3rem]">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-3xl text-gray-900 font-serif">
            Request an appointment
          </h1>
        </div>
      </div>

      {/* Content */}
      <main className="container max-w-6xl mx-auto px-4 py-12">
        <RequestProvider>
          <RequestContent>{children}</RequestContent>
        </RequestProvider>
      </main>
    </div>
  );
}
