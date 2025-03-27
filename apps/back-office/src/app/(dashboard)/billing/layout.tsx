import TopBar from "@/components/layouts/Topbar";
import BillingTabs from "./components/BillingTabs";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#ffffff]">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TopBar />

        {/* Content */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold text-[#1f2937] mb-6">
            Billing
          </h1>
          <BillingTabs />

          {children}
        </main>
      </div>
    </div>
  );
}
