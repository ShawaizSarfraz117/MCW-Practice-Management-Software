import { AnalyticsHeader } from "./components/AnalyticsHeader";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <AnalyticsHeader />
        </div>
        {children}
      </div>
    </div>
  );
}
