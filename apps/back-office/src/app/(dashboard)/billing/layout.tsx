import BillingTabs from "./components/BillingTabs";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Content */}
      <h1 className="text-2xl font-semibold text-[#1f2937] mb-6">Billing</h1>
      <BillingTabs />

      {children}
    </div>
  );
}
